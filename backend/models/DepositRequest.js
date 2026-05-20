const mongoose = require('mongoose');

const depositRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chain: {
      type: String,
      enum: ['BEP-20', 'TRC-20'],
      required: true,
    },
    transferAddress: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
    certificate: {
      type: String, // base64 image
    },
    amount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    approvedAmount: {
      type: Number, // amount actually credited — set by admin on approval
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
depositRequestSchema.index({ userId: 1, createdAt: -1 }); // getMyDepositRequests
depositRequestSchema.index({ status: 1, createdAt: -1 }); // admin filtering by status
depositRequestSchema.index({ createdAt: -1 });            // getAllDeposits sort

module.exports = mongoose.model('DepositRequest', depositRequestSchema);
