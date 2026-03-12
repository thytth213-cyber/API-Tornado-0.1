/* eslint-env node */
// dev-server/seedAdmins.js
// Seed initial admin users (safe, idempotent).
// Usage: set MONGO_URI in .env (optional) then run: node seedAdmins.js

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');

const MONGO = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tornado_dev';
const SALT_ROUNDS = 10;

const seedAccounts = [
  { username: 'admin1', password: 'admin1' },
  { username: 'admin2', password: 'admin 2' }
];

async function connect() {
  await mongoose.connect(MONGO);
}

async function seed() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO} ...`);
    await connect();
    console.log('Connected.');

    for (const acct of seedAccounts) {
      const { username, password } = acct;
      const existing = await Admin.findOne({ username }).exec();
      if (existing) {
        console.log(`SKIP: admin '${username}' already exists (id=${existing._id}).`);
        continue;
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const created = await Admin.create({ username, passwordHash });
      console.log(`CREATED: admin '${username}' (id=${created._id}).`);
    }

    console.log('Seeding complete.');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      console.log('MongoDB connection closed.');
    } catch (e) {
      console.error('Error closing MongoDB connection:', e);
    }
  }
}

seed();
