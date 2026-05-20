const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS  = '0123456789';
const REFERRAL_CHARS = LETTERS + DIGITS;
const CODE_LENGTH = 5;

const generateReferralCode = async () => {
  let code, exists;
  do {
    // Guarantee at least one letter and one digit
    const chars = [
      LETTERS[crypto.randomBytes(1)[0] % LETTERS.length],
      DIGITS[crypto.randomBytes(1)[0]  % DIGITS.length],
    ];
    const rest = crypto.randomBytes(CODE_LENGTH - 2);
    for (const b of rest) chars.push(REFERRAL_CHARS[b % REFERRAL_CHARS.length]);
    // Fisher-Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.randomBytes(1)[0] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    code = chars.join('');
    exists = await User.exists({ referralCode: code });
  } while (exists);
  return code;
};

const generateToken = (userId, role = 'user') => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, transactionPassword, referralCode: usedCode } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!usedCode || !usedCode.trim()) {
      return res.status(400).json({ message: 'Referral code is required.' });
    }
    if (!transactionPassword || transactionPassword.length < 4) {
      return res.status(400).json({ message: 'Transaction password must be at least 4 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Validate the referral code if provided
    let referredBy;
    if (usedCode) {
      const normalized = usedCode.toUpperCase().trim();
      const referrer = await User.findOne({ referralCode: normalized });
      if (!referrer) return res.status(400).json({ message: 'Invalid referral code.' });
      referredBy = normalized;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const hashedTxPassword = await bcrypt.hash(transactionPassword, salt);
    const referralCode = await generateReferralCode();

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      transactionPassword: hashedTxPassword,
      referralCode,
      referredBy,
    });

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        kycStatus: user.kycStatus,
        referralCode: user.referralCode,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Select only the fields needed for login — avoids loading large kycData base64 images from Atlas
    const user = await User.findOne({ email: normalizedEmail })
      .select('name email password role balance kycStatus referralCode')
      .lean();

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Backfill referral code for legacy accounts — done after response to avoid blocking login
    if (!user.referralCode) {
      setImmediate(async () => {
        try {
          const code = await generateReferralCode();
          await User.updateOne({ _id: user._id }, { referralCode: code });
        } catch (_) {}
      });
    }

    const token = generateToken(user._id, user.role);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        kycStatus: user.kycStatus,
        referralCode: user.referralCode,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Backfill referral code for existing accounts that don't have one yet
    if (!user.referralCode) {
      const code = await generateReferralCode();
      user = await User.findByIdAndUpdate(
        req.user.id,
        { referralCode: code },
        { new: true }
      ).select('-password');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const submitKyc = async (req, res, next) => {
  try {
    const { fullName, idCardNumber, contactNumber, idFront, idBack, note } = req.body;

    if (!fullName || !idCardNumber || !contactNumber) {
      return res.status(400).json({ message: 'Full name, ID card number, and contact number are required.' });
    }
    if (!idFront || !idBack) {
      return res.status(400).json({ message: 'ID front and back images are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.kycStatus = 'pending';
    user.kycData = { fullName, idCardNumber, contactNumber, idFront, idBack, note };
    await user.save();

    await createNotification(
      req.user.id,
      'kyc_submitted',
      'KYC Submitted',
      'Your KYC verification request has been submitted and is under review.'
    );

    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

const getPendingKyc = async (req, res, next) => {
  try {
    const users = await User.find({ kycStatus: 'pending' })
      .select('name email kycStatus kycData.fullName kycData.idCardNumber kycData.contactNumber kycData.note createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const getAllKyc = async (req, res, next) => {
  try {
    const users = await User.find({ kycStatus: { $ne: 'not_submitted' } })
      .select('name email kycStatus kycData.fullName kycData.idCardNumber kycData.contactNumber kycData.note createdAt')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

const getKycDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email kycStatus kycData createdAt')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const verifyKyc = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.kycStatus = 'verified';
    user.kycData = {
      ...user.kycData,
      note: req.body.note || user.kycData?.note,
    };
    await user.save();

    await createNotification(
      user._id,
      'kyc_verified',
      'KYC Verified',
      'Your identity has been successfully verified. You now have full access to all features.'
    );

    const updatedUser = await User.findById(req.params.userId).select('-password');
    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

const rejectKyc = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.kycStatus = 'rejected';
    user.kycData = {
      ...user.kycData,
      note: req.body.note || user.kycData?.note,
    };
    await user.save();

    await createNotification(
      user._id,
      'kyc_rejected',
      'KYC Rejected',
      'Your KYC verification was not approved. Please resubmit with valid documents.'
    );

    const updatedUser = await User.findById(req.params.userId).select('-password');
    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
};

const checkReferralCode = async (req, res, next) => {
  try {
    const code = (req.query.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ message: 'Code is required.' });
    const exists = await User.exists({ referralCode: code });
    res.json({ valid: !!exists });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    // Always return success to avoid user enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (smtpConfigured) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Number(process.env.SMTP_PORT) === 465,
          requireTLS: Number(process.env.SMTP_PORT) !== 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS.replace(/\s/g, ''),
          },
        });
        await transporter.sendMail({
          from: `"Uphold" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'Uphold — Reset your password',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
              <h2 style="color:#0e7490">Reset your Uphold password</h2>
              <p>Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
              <a href="${resetUrl}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#06b6d4;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">
                Reset password
              </a>
              <p style="color:#64748b;font-size:12px">If you didn't request this, ignore this email. Your password won't change.</p>
            </div>`,
        });
        console.log(`[mail] Reset email sent to ${user.email}`);
      } catch (mailErr) {
        console.error('[mail] Failed to send reset email:', mailErr.message);
        console.log('\n\x1b[33m%s\x1b[0m', '══════════════════════════════════════════════════');
        console.log('\x1b[33m%s\x1b[0m', '  [FALLBACK] Password reset link:');
        console.log('\x1b[36m%s\x1b[0m', `  ${resetUrl}`);
        console.log('\x1b[33m%s\x1b[0m', '══════════════════════════════════════════════════\n');
      }
    } else {
      console.log('\n\x1b[33m%s\x1b[0m', '══════════════════════════════════════════════════');
      console.log('\x1b[33m%s\x1b[0m', '  [SMTP not configured] Password reset link:');
      console.log('\x1b[36m%s\x1b[0m', `  ${resetUrl}`);
      console.log('\x1b[33m%s\x1b[0m', '══════════════════════════════════════════════════\n');
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

const changeUserPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await createNotification(
      req.user.id,
      'password_changed',
      'Password Changed',
      'Your account login password was successfully updated.'
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

const changeTransactionPassword = async (req, res, next) => {
  try {
    const { currentPassword, newTransactionPassword } = req.body;
    if (!currentPassword || !newTransactionPassword) {
      return res.status(400).json({ message: 'Current password and new transaction password are required.' });
    }
    if (newTransactionPassword.length < 4) {
      return res.status(400).json({ message: 'New transaction password must be at least 4 characters.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });

    const salt = await bcrypt.genSalt(10);
    user.transactionPassword = await bcrypt.hash(newTransactionPassword, salt);
    await user.save();

    await createNotification(
      req.user.id,
      'transaction_password_changed',
      'Transaction Password Changed',
      'Your transaction password was successfully updated.'
    );

    res.json({ message: 'Transaction password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  checkReferralCode,
  submitKyc,
  getPendingKyc,
  getAllKyc,
  getKycDetail,
  verifyKyc,
  rejectKyc,
  forgotPassword,
  resetPassword,
  changeUserPassword,
  changeTransactionPassword,
};
