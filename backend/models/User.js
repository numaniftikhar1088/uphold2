const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  balance: {
    type: Number,
    default: 0,
  },
  kycStatus: {
    type: String,
    enum: ['not_submitted', 'pending', 'verified', 'rejected'],
    default: 'not_submitted',
  },
  kycData: {
    fullName:      String,
    idCardNumber:  String,
    contactNumber: String,
    idFront:       String,
    idBack:        String,
    note:          String,
    // legacy
    selfie:        String,
  },
  transactionPassword: { type: String },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy:   { type: String },
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
}, {
  timestamps: true,
});

// Indexes for fast admin queries
userSchema.index({ kycStatus: 1 });           // getAllKyc / getPendingKyc filter
userSchema.index({ role: 1 });                // any role-based lookups
userSchema.index({ referralCode: 1 });        // checkReferralCode (unique already, but explicit compound helps)
userSchema.index({ resetPasswordToken: 1 }); // resetPassword lookup

module.exports = mongoose.model('User', userSchema);
