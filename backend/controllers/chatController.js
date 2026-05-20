const Message = require('../models/Message');
const User = require('../models/User');

const getConversation = async (req, res, next) => {
  try {
    let userId = req.params.userId || req.user.id;

    if (req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const messages = await Message.find({ userId }).sort('createdAt');
    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          lastMessage: { $first: '$$ROOT' },
          messageCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          lastMessage: 1,
          messageCount: 1,
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversation,
  getConversations,
};
