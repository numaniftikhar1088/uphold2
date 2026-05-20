const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  try {
    const dnsServers = process.env.DNS_SERVERS
      ? process.env.DNS_SERVERS.split(',').map((server) => server.trim())
      : ['1.1.1.1', '8.8.8.8'];

    dns.setServers(dnsServers);
    console.log('Using DNS servers:', dnsServers);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 20000,
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
