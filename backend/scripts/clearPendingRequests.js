require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
const mongoose = require('mongoose');

const DepositRequest = require('../models/DepositRequest');
const WithdrawRequest = require('../models/WithdrawRequest');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('Connected to MongoDB');

  const deposits = await DepositRequest.deleteMany({ status: 'pending' });
  console.log(`Deleted ${deposits.deletedCount} pending deposit request(s)`);

  const withdraws = await WithdrawRequest.deleteMany({ status: 'pending' });
  console.log(`Deleted ${withdraws.deletedCount} pending withdraw request(s)`);

  await mongoose.disconnect();
  console.log('Done.');
})();
