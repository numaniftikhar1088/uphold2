const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawRequest');
const BankAccount = require('../models/BankAccount');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { verifyTxPassword } = require('./bankController');
const { getIo } = require('../utils/socket');

const createDepositRequest = async (req, res, next) => {
  try {
    const { amount, chain, transferAddress, transactionId, certificate, transactionPassword } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero.' });
    }
    if (!chain || !['BEP-20', 'TRC-20', 'Bank Transfer'].includes(chain)) {
      return res.status(400).json({ message: 'Select a valid deposit method.' });
    }
    if (chain !== 'Bank Transfer' && (!transferAddress || !transferAddress.trim())) {
      return res.status(400).json({ message: 'Transfer address is required.' });
    }
    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ message: 'Transaction ID (hash) is required.' });
    }

    const valid = await verifyTxPassword(req.user.id, transactionPassword);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid transaction password.' });
    }

    const deposit = await DepositRequest.create({
      userId: req.user.id,
      amount,
      chain,
      transferAddress: transferAddress.trim(),
      transactionId: transactionId.trim(),
      certificate,
    });

    await createNotification(
      req.user.id,
      'deposit_submitted',
      'Deposit Submitted',
      `Your deposit request of $${Number(amount).toFixed(2)} has been submitted and is pending review.`
    );

    res.status(201).json({ deposit });
  } catch (error) {
    next(error);
  }
};

const createWithdrawRequest = async (req, res, next) => {
  try {
    const { amount, withdrawMethod = 'crypto', chain, withdrawalAddress, bankAccountId, transactionPassword } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than zero.' });
    }

    // Fetch user to check balance and verify transaction password in one round-trip
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance.' });
    }

    const valid = await verifyTxPassword(user, transactionPassword);
    if (!valid) {
      return res.status(400).json({ message: 'Invalid transaction password.' });
    }

    const withdrawData = { userId: req.user.id, amount, withdrawMethod, transactionFee: 3.00 };

    if (withdrawMethod === 'bank') {
      const bankAccount = await BankAccount.findOne({ _id: bankAccountId, userId: req.user.id });
      if (!bankAccount) {
        return res.status(400).json({ message: 'Bank account not found.' });
      }
      withdrawData.bankAccountSnapshot = {
        name:          bankAccount.name,
        accountNumber: bankAccount.accountNumber,
        bankBranch:    bankAccount.bankBranch,
        ifscCode:      bankAccount.ifscCode,
        bankName:      bankAccount.bankName,
      };
    } else {
      if (!chain || !['TRC-20', 'BEP-20'].includes(chain)) {
        return res.status(400).json({ message: 'Select a valid chain (TRC-20 or BEP-20).' });
      }
      if (!withdrawalAddress || !withdrawalAddress.trim()) {
        return res.status(400).json({ message: 'Withdrawal address is required.' });
      }
      withdrawData.chain = chain;
      withdrawData.withdrawalAddress = withdrawalAddress.trim();
    }

    const withdraw = await WithdrawRequest.create(withdrawData);

    await createNotification(
      req.user.id,
      'withdraw_submitted',
      'Withdrawal Submitted',
      `Your withdrawal request of $${Number(amount).toFixed(2)} has been submitted and is pending review.`
    );

    res.status(201).json({ withdraw });
  } catch (error) {
    next(error);
  }
};

const getMyDepositRequests = async (req, res, next) => {
  try {
    const deposits = await DepositRequest.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(100)
      .lean();
    res.json({ deposits });
  } catch (error) {
    next(error);
  }
};

const getMyWithdrawRequests = async (req, res, next) => {
  try {
    const withdraws = await WithdrawRequest.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(100)
      .lean();
    res.json({ withdraws });
  } catch (error) {
    next(error);
  }
};

const getAllDeposits = async (req, res, next) => {
  try {
    const deposits = await DepositRequest.find()
      .select('-certificate')
      .populate('userId', 'name email balance')
      .sort('-createdAt')
      .limit(200)
      .lean();
    res.json({ deposits });
  } catch (error) {
    next(error);
  }
};

const getDepositById = async (req, res, next) => {
  try {
    const deposit = await DepositRequest.findById(req.params.id)
      .populate('userId', 'name email balance')
      .lean();
    if (!deposit) return res.status(404).json({ message: 'Deposit not found.' });
    res.json({ deposit });
  } catch (error) {
    next(error);
  }
};

const getAllWithdraws = async (req, res, next) => {
  try {
    const withdraws = await WithdrawRequest.find()
      .populate('userId', 'name email balance')
      .sort('-createdAt')
      .limit(500)
      .lean();
    res.json({ withdraws });
  } catch (error) {
    next(error);
  }
};

const approveDepositRequest = async (req, res, next) => {
  try {
    const deposit = await DepositRequest.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit request not found' });
    }
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: 'Deposit request already processed' });
    }

    const user = await User.findById(deposit.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const creditAmount = req.body.approvedAmount != null && Number(req.body.approvedAmount) > 0
      ? Number(req.body.approvedAmount)
      : deposit.amount;

    user.balance += creditAmount;
    await user.save();

    deposit.status = 'approved';
    deposit.approvedAmount = creditAmount;
    deposit.note = req.body.note || deposit.note;
    await deposit.save();

    const io = getIo();
    if (io) io.to(deposit.userId.toString()).emit('balance_update', { balance: user.balance });

    await createNotification(
      deposit.userId,
      'deposit_approved',
      'Deposit Approved',
      `Your deposit of $${creditAmount.toFixed(2)} has been approved and credited to your account.`
    );

    res.json({ deposit, user });
  } catch (error) {
    next(error);
  }
};

const rejectDepositRequest = async (req, res, next) => {
  try {
    const deposit = await DepositRequest.findById(req.params.id);
    if (!deposit) {
      return res.status(404).json({ message: 'Deposit request not found' });
    }
    if (deposit.status !== 'pending') {
      return res.status(400).json({ message: 'Deposit request already processed' });
    }

    deposit.status = 'rejected';
    deposit.note = req.body.note || deposit.note;
    await deposit.save();

    await createNotification(
      deposit.userId,
      'deposit_rejected',
      'Deposit Rejected',
      `Your deposit request for $${deposit.amount.toFixed(2)} has been rejected.`
    );

    res.json({ deposit });
  } catch (error) {
    next(error);
  }
};

const approveWithdrawRequest = async (req, res, next) => {
  try {
    const withdraw = await WithdrawRequest.findById(req.params.id);
    if (!withdraw) {
      return res.status(404).json({ message: 'Withdraw request not found' });
    }
    if (withdraw.status !== 'pending') {
      return res.status(400).json({ message: 'Withdraw request already processed' });
    }

    const user = await User.findById(withdraw.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const deductAmount = req.body.approvedAmount != null && Number(req.body.approvedAmount) > 0
      ? Number(req.body.approvedAmount)
      : withdraw.amount;

    if (user.balance < deductAmount) {
      return res.status(400).json({ message: 'Insufficient balance for withdrawal' });
    }

    user.balance -= deductAmount;
    await user.save();

    withdraw.status = 'approved';
    withdraw.approvedAmount = deductAmount;
    withdraw.note = req.body.note || withdraw.note;
    await withdraw.save();

    const io = getIo();
    if (io) io.to(withdraw.userId.toString()).emit('balance_update', { balance: user.balance });

    await createNotification(
      withdraw.userId,
      'withdraw_approved',
      'Withdrawal Approved',
      `Your withdrawal of $${deductAmount.toFixed(2)} has been approved.`
    );

    res.json({ withdraw, user });
  } catch (error) {
    next(error);
  }
};

const rejectWithdrawRequest = async (req, res, next) => {
  try {
    const withdraw = await WithdrawRequest.findById(req.params.id);
    if (!withdraw) {
      return res.status(404).json({ message: 'Withdraw request not found' });
    }
    if (withdraw.status !== 'pending') {
      return res.status(400).json({ message: 'Withdraw request already processed' });
    }

    withdraw.status = 'rejected';
    withdraw.note = req.body.note || withdraw.note;
    await withdraw.save();

    await createNotification(
      withdraw.userId,
      'withdraw_rejected',
      'Withdrawal Rejected',
      `Your withdrawal request for $${withdraw.amount.toFixed(2)} has been rejected.`
    );

    res.json({ withdraw });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepositRequest,
  createWithdrawRequest,
  getMyDepositRequests,
  getMyWithdrawRequests,
  getAllDeposits,
  getDepositById,
  getAllWithdraws,
  approveDepositRequest,
  rejectDepositRequest,
  approveWithdrawRequest,
  rejectWithdrawRequest,
};
