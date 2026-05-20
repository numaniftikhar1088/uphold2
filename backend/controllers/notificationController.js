const Notification = require('../models/Notification');
const { getIo } = require('../utils/socket');

const createNotification = async (userId, type, title, message) => {
  try {
    const notification = await Notification.create({ userId, type, title, message });
    const io = getIo();
    if (io) io.to(userId.toString()).emit('new_notification', notification);
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort('-createdAt')
      .limit(50)
      .lean();
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.userId.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.json({ notification });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createNotification, getMyNotifications, markAsRead, markAllAsRead };
