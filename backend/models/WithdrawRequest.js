const mongoose = require('mongoose');

const withdrawRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Withdraw amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    withdrawMethod: {
      type: String,
      enum: ['crypto', 'bank'],
      default: 'crypto',
    },
    chain: {
      type: String,
      enum: ['TRC-20', 'BEP-20'],
    },
    withdrawalAddress: {
      type: String,
      trim: true,
    },
    bankAccountSnapshot: {
      name:          { type: String },
      accountNumber: { type: String },
      bankBranch:    { type: String },
      ifscCode:      { type: String },
      bankName:      { type: String },
    },
    transactionFee: {
      type: Number,
      default: 3.00,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast admin and user queries
withdrawRequestSchema.index({ userId: 1, createdAt: -1 }); // getMyWithdrawRequests
withdrawRequestSchema.index({ status: 1, createdAt: -1 }); // admin filtering by status
withdrawRequestSchema.index({ createdAt: -1 });            // getAllWithdraws sort

module.exports = mongoose.model('WithdrawRequest', withdrawRequestSchema);
