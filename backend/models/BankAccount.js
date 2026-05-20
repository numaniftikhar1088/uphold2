const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true, trim: true },
  accountNumber: { type: String, required: true, trim: true },
  bankBranch:    { type: String, trim: true },
  ifscCode:      { type: String, trim: true },
  bankName:      { type: String, trim: true },
}, { timestamps: true });

// Fast lookup by owner
bankAccountSchema.index({ userId: 1 });

module.exports = mongoose.model('BankAccount', bankAccountSchema);
