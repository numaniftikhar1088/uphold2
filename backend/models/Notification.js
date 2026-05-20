const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

// Auto-delete documents older than 7 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });
// Fast per-user notification lookup
notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
