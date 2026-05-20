/**
 * One-time migration: regenerate every user's referral code to the new format:
 *   - Exactly 5 characters
 *   - Uppercase A-Z and 0-9 only
 *   - Always a combination (at least one letter AND one digit)
 *
 * Run from the backend folder:
 *   node scripts/migrateReferralCodes.js
 */

const crypto   = require('crypto');
const dotenv   = require('dotenv');
const mongoose = require('mongoose');
const dns      = require('dns');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS  = '0123456789';
const ALL     = LETTERS + DIGITS;

function generateCode() {
  const chars = [
    LETTERS[crypto.randomBytes(1)[0] % LETTERS.length],
    DIGITS[crypto.randomBytes(1)[0]  % DIGITS.length],
  ];
  const rest = crypto.randomBytes(3);
  for (const b of rest) chars.push(ALL[b % ALL.length]);
  // Fisher-Yates shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomBytes(1)[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

async function uniqueCode(usedCodes) {
  let code;
  do { code = generateCode(); } while (usedCodes.has(code));
  usedCodes.add(code);
  return code;
}

async function run() {
  dns.setServers(['1.1.1.1', '8.8.8.8']);

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
  });
  console.log('Connected to MongoDB');

  const User = require('../models/User');
  const users = await User.find({}).select('_id name referralCode');
  console.log(`Found ${users.length} user(s) to migrate`);

  // Pre-seed used codes so new ones don't collide with each other
  const usedCodes = new Set();

  let updated = 0;
  for (const user of users) {
    const newCode = await uniqueCode(usedCodes);
    await User.updateOne({ _id: user._id }, { referralCode: newCode });
    console.log(`  ${user.name.padEnd(24)} ${(user.referralCode || '(none)').padEnd(10)} → ${newCode}`);
    updated++;
  }

  console.log(`\nDone — ${updated} referral code(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
