const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');
const { setIo } = require('../utils/socket');
const { createNotification } = require('../controllers/notificationController');

const initChatSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: true, methods: ['GET', 'POST'] },
    maxHttpBufferSize: 10 * 1024 * 1024, // 10 MB — needed for file attachments
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId   = decoded.id;
      socket.isAdmin  = socket.handshake.auth?.role === 'admin';
      socket.userName = socket.handshake.auth?.name || 'Unknown';
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId);
    if (socket.isAdmin) socket.join('admins');

    socket.on('join_room', (userRoom) => {
      if (!userRoom) return;
      if (socket.isAdmin || userRoom === socket.userId) socket.join(userRoom);
    });

    socket.on('send_message', async ({ room: userRoom, content, fileData, fileType, fileName }) => {
      if (!userRoom) return;
      if (!content?.trim() && !fileData) return;

      try {
        const message = await Message.create({
          userId: userRoom,
          senderId: socket.userId,
          senderName: socket.isAdmin ? 'Customer Support' : socket.userName,
          content: content?.trim() || '',
          isAdmin: socket.isAdmin,
          fileData:  fileData  || undefined,
          fileType:  fileType  || undefined,
          fileName:  fileName  || undefined,
        });

        io.to(userRoom).emit('receive_message', message);

        const preview = message.content
          ? message.content.slice(0, 80)
          : (message.fileName || 'Attachment');

        if (socket.isAdmin) {
          // Persist notification for the user (reply from support)
          await createNotification(
            userRoom,
            'chat_reply',
            'Support Reply',
            `Support team: ${preview}`
          );
        } else {
          // User sent a message — notify all admins
          const admins = await User.find({ role: 'admin' }).select('_id').lean();
          for (const admin of admins) {
            await createNotification(
              admin._id,
              'new_chat_message',
              'New Support Message',
              `${socket.userName}: ${preview}`
            );
          }
        }
      } catch (error) {
        console.error('Socket error saving message:', error.message);
      }
    });
  });

  setIo(io);
  return io;
};

module.exports = initChatSocket;
