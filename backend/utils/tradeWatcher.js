const Trade = require('../models/Trade');
const User  = require('../models/User');
const { getIo } = require('./socket');

const startTradeWatcher = async () => {
  try {
    // Watch only update operations on the trades collection
    const stream = Trade.watch(
      [{ $match: { operationType: 'update' } }],
      { fullDocument: 'updateLookup' }
    );

    stream.on('change', async (change) => {
      const updatedFields = change.updateDescription?.updatedFields || {};

      // Only react when profit or loss was just written and status was NOT
      // part of this same update (prevents reacting to our own closure write)
      const profitSet = 'profit' in updatedFields && updatedFields.profit > 0;
      const lossSet   = 'loss'   in updatedFields && updatedFields.loss   > 0;
      const statusSet = 'status' in updatedFields;

      if ((!profitSet && !lossSet) || statusSet) return;

      // Atomically claim the trade (only if still pending) to prevent double-processing
      const trade = await Trade.findOneAndUpdate(
        { _id: change.documentKey._id, status: 'pending' },
        { status: 'closed', closedAt: new Date() },
        { new: true }
      );
      if (!trade) return; // already closed or not found

      const user = await User.findById(trade.userId);
      if (!user) return;

      const investAmount = trade.amount || 0;
      let balanceReturn  = investAmount;

      if (trade.profit > 0) {
        balanceReturn += trade.profit;
      } else if (trade.loss > 0) {
        balanceReturn = Math.max(0, balanceReturn - trade.loss);
      }

      user.balance = parseFloat((user.balance + balanceReturn).toFixed(2));
      await user.save();

      const io = getIo();
      if (io) {
        io.to(trade.userId.toString()).emit('balance_update', {
          balance: user.balance,
          trade: {
            _id:      trade._id,
            symbol:   trade.symbol,
            side:     trade.side,
            amount:   trade.amount,
            profit:   trade.profit,
            loss:     trade.loss,
            status:   'closed',
            closedAt: trade.closedAt,
            openedAt: trade.openedAt,
          },
        });
      }

      console.log(`[tradeWatcher] closed trade ${trade._id} — balance updated to $${user.balance}`);
    });

    stream.on('error', (err) => {
      console.warn('[tradeWatcher] stream error:', err.message);
    });

    console.log('[tradeWatcher] watching for profit/loss updates...');
  } catch (err) {
    // Change streams require a replica set; warn but don't crash
    console.warn('[tradeWatcher] could not start (replica set required):', err.message);
  }
};

module.exports = { startTradeWatcher };
