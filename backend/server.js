const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const coinRoutes = require('./routes/coinRoutes');
const chartRoutes = require('./routes/chartRoutes');
const chatRoutes = require('./routes/chatRoutes');
const requestRoutes = require('./routes/requestRoutes');
const tradeRoutes = require('./routes/tradeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bankRoutes = require('./routes/bankRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const initChatSocket = require('./sockets/chatSocket');
const { startTradeWatcher } = require('./utils/tradeWatcher');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  // Give upload/image-heavy routes more time; default everything else to 30 s
  const isUpload   = req.path.includes('/requests/deposits');
  const isKycAdmin = req.path.includes('/kyc/');
  const timeoutMs  = (isUpload || isKycAdmin) ? 60000 : 30000;
  res.setTimeout(timeoutMs, () => {
    if (!res.headersSent) {
      res.status(408).json({ message: 'Request timed out. Please try again.' });
    }
  });
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Uphold backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/banks', bankRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initChatSocket(server);

const warmupDB = async () => {
  try {
    const User = require('./models/User');
    await User.findOne({}).select('_id').lean();
    console.log('MongoDB connection warmed up');
  } catch (_) {}
};

const start = async () => {
  await connectDB();
  await warmupDB();
  startTradeWatcher();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop any other server using that port and restart this app.`);
    process.exit(1);
  }
  throw err;
});

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});