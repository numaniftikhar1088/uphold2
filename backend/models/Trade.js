const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },

  // USD amount the user invests — deducted from balance on open
  amount: { type: Number, required: true },

  // Price at the time of trade (informational, from frontend)
  entryPrice: { type: Number },

  // Admin sets ONE of these to close the trade (0 = not set)
  profit: { type: Number, default: 0 },
  loss:   { type: Number, default: 0 },

  status: { type: String, enum: ['pending', 'closed'], default: 'pending' },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  note: { type: String },
  duration: { type: Number, default: 60 }, // trade duration in seconds (30-180)
  type: { type: String, enum: ['spot', 'derivatives'], default: 'derivatives' },

  // Legacy fields kept so old trade documents still render
  price:      { type: Number },
  quantity:   { type: Number },
  total:      { type: Number },
  startPrice: { type: Number },
  startTime:  { type: Date },
  endPrice:   { type: Number },
  endTime:    { type: Date },
}, { timestamps: true });

// Indexes for fast admin and user queries
tradeSchema.index({ userId: 1, createdAt: -1 });  // getMyTrades
tradeSchema.index({ status: 1, openedAt: -1 });   // getPendingTradesAdmin
tradeSchema.index({ createdAt: -1 });             // getAllTradesAdmin sort

module.exports = mongoose.model('Trade', tradeSchema);
