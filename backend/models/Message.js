const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: '',
    },
    fileData: { type: String },   // base64 encoded file
    fileType: { type: String },   // MIME type e.g. image/jpeg
    fileName: { type: String },   // original file name
    isAdmin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Fast chat-history lookup per user conversation
messageSchema.index({ userId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
