const bcrypt = require('bcryptjs');
const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const verifyTxPassword = async (userOrId, provided) => {
  const user = userOrId && typeof userOrId === 'object'
    ? userOrId
    : await User.findById(userOrId);
  if (!user) return false;
  if (!user.transactionPassword) return true; // legacy account — no tx pwd set
  if (!provided) return false;
  return bcrypt.compare(provided, user.transactionPassword);
};

// GET /api/banks/me
const getMyBankAccounts = async (req, res, next) => {
  try {
    const accounts = await BankAccount.find({ userId: req.user.id }).sort('-createdAt');
    res.json({ accounts });
  } catch (err) { next(err); }
};

// POST /api/banks
const addBankAccount = async (req, res, next) => {
  try {
    const { name, accountNumber, bankName, bankBranch, ifscCode, transactionPassword } = req.body;

    if (!name || !accountNumber) {
      return res.status(400).json({ message: 'Name and account number are required.' });
    }

    const valid = await verifyTxPassword(req.user.id, transactionPassword);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid transaction password.' });
    }

    const account = await BankAccount.create({
      userId: req.user.id,
      name,
      accountNumber,
      bankName,
      bankBranch,
      ifscCode,
    });

    await createNotification(
      req.user.id,
      'bank_added',
      'Payment Method Added',
      `Bank account "${name}" (${accountNumber}) has been added to your profile.`
    );

    res.status(201).json({ account });
  } catch (err) { next(err); }
};

// DELETE /api/banks/:id
const deleteBankAccount = async (req, res, next) => {
  try {
    const account = await BankAccount.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!account) return res.status(404).json({ message: 'Bank account not found.' });
    res.json({ message: 'Bank account removed.' });
  } catch (err) { next(err); }
};

// GET /api/banks/admin/all  (admin only)
const getAllBankAccounts = async (req, res, next) => {
  try {
    const accounts = await BankAccount.find()
      .populate('userId', 'name email balance')
      .sort({ userId: 1, createdAt: -1 });
    res.json({ accounts });
  } catch (err) { next(err); }
};

module.exports = { getMyBankAccounts, addBankAccount, deleteBankAccount, verifyTxPassword, getAllBankAccounts };
