const Trade = require('../models/Trade');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { getIo } = require('../utils/socket');

// ─── Create Trade (no Binance call — price comes from frontend) ───────────────
const createTradeOrder = async (req, res, next) => {
  try {
    const { symbol, side, amount, entryPrice, duration, type } = req.body;

    if (!symbol || !side || !amount || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Symbol, side, and a positive amount are required.' });
    }

    const investAmount = parseFloat(Number(amount).toFixed(2));

    // Atomic balance deduction — one DB round-trip instead of find + save
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, balance: { $gte: investAmount } },
      { $inc: { balance: -investAmount } },
      { new: true }
    );
    if (!user) return res.status(400).json({ message: 'Insufficient balance.' });

    const VALID_DURATIONS = [30, 60, 90, 120, 150, 180];
    const tradeDuration = VALID_DURATIONS.includes(Number(duration)) ? Number(duration) : 60;

    const VALID_TYPES = ['spot', 'derivatives'];
    const tradeType = VALID_TYPES.includes(type) ? type : 'derivatives';

    const trade = await Trade.create({
      userId: user._id,
      symbol: symbol.toUpperCase(),
      side,
      amount: investAmount,
      entryPrice: entryPrice ? parseFloat(entryPrice) : null,
      duration: tradeDuration,
      type: tradeType,
      status: 'pending',
      openedAt: new Date(),
    });

    res.status(201).json({ trade, balance: user.balance });
  } catch (error) {
    next(error);
  }
};

// ─── Get current user's trades ────────────────────────────────────────────────
const getMyTrades = async (req, res, next) => {
  try {
    const trades = await Trade.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(200)
      .lean();
    res.json({ trades });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: get all trades ────────────────────────────────────────────────────
const getAllTradesAdmin = async (req, res, next) => {
  try {
    const trades = await Trade.find()
      .sort('-createdAt')
      .limit(500)
      .populate('userId', 'name email')
      .lean();
    res.json({ trades });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: get only pending trades (fast endpoint for the 60-sec window) ─────
const getPendingTradesAdmin = async (req, res, next) => {
  try {
    const trades = await Trade.find({ status: 'pending' })
      .sort('-openedAt')
      .limit(200)
      .populate('userId', 'name email balance')
      .lean();
    res.json({ trades });
  } catch (error) {
    next(error);
  }
};

// ─── Admin: set profit OR loss to close a trade and update balance ─────────────
const adminSetTradeResult = async (req, res, next) => {
  try {
    const { profit, loss } = req.body;

    const hasProfit = profit !== undefined && profit !== null;
    const hasLoss   = loss   !== undefined && loss   !== null;

    if (!hasProfit && !hasLoss) {
      return res.status(400).json({ message: 'Provide either profit or loss.' });
    }
    if (hasProfit && hasLoss) {
      return res.status(400).json({ message: 'Provide profit or loss, not both.' });
    }
    if (hasProfit && Number(profit) < 0) {
      return res.status(400).json({ message: 'Profit must be a positive number.' });
    }
    if (hasLoss && Number(loss) < 0) {
      return res.status(400).json({ message: 'Loss must be a positive number.' });
    }

    const profitVal = hasProfit ? parseFloat(Number(profit).toFixed(2)) : 0;
    const lossVal   = hasLoss   ? parseFloat(Number(loss).toFixed(2))   : 0;

    // Single atomic op: claim the trade (returns old doc so we can read amount/symbol)
    const trade = await Trade.findOneAndUpdate(
      { _id: req.params.id, status: 'pending' },
      { $set: { status: 'closed', closedAt: new Date(), profit: profitVal, loss: lossVal } },
      { new: false }
    );
    if (!trade) return res.status(400).json({ message: 'Trade not found or already closed.' });

    const balanceDelta = hasProfit
      ? trade.amount + profitVal
      : Math.max(0, trade.amount - lossVal);

    // Single atomic op: update user balance
    const user = await User.findByIdAndUpdate(
      trade.userId,
      { $inc: { balance: balanceDelta } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const notifMsg = hasProfit
      ? `Trade ${trade.symbol} closed. Profit: +$${profitVal.toFixed(2)}`
      : `Trade ${trade.symbol} closed. Loss: -$${lossVal.toFixed(2)}`;

    const closedTrade = {
      _id: trade._id, symbol: trade.symbol, side: trade.side,
      amount: trade.amount, profit: profitVal, loss: lossVal,
      status: 'closed', closedAt: new Date(), openedAt: trade.openedAt,
    };

    const io = getIo();
    if (io) io.to(trade.userId.toString()).emit('balance_update', { balance: user.balance, trade: closedTrade });

    await createNotification(user._id, 'trade_closed', 'Trade Closed', notifMsg);

    res.json({ trade: closedTrade, balance: user.balance });
  } catch (error) {
    next(error);
  }
};

// ─── Cancel a pending trade (user action) — returns amount to balance ──────────
const cancelTrade = async (req, res, next) => {
  try {
    const trade = await Trade.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: 'pending' },
      { $set: { status: 'closed', closedAt: new Date() } },
      { new: true }
    );
    if (!trade) return res.status(404).json({ message: 'Pending trade not found.' });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { balance: trade.amount || 0 } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const io = getIo();
    if (io) {
      io.to(req.user.id.toString()).emit('balance_update', {
        balance: user.balance,
        trade: {
          _id: trade._id, symbol: trade.symbol, side: trade.side,
          amount: trade.amount, profit: trade.profit, loss: trade.loss,
          status: 'closed', closedAt: trade.closedAt, openedAt: trade.openedAt,
        },
      });
    }

    res.json({ trade, balance: user.balance });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTradeOrder,
  getMyTrades,
  getAllTradesAdmin,
  getPendingTradesAdmin,
  adminSetTradeResult,
  cancelTrade,
};
