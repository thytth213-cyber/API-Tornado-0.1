/* eslint-env node */
/*
  dev-server/server.js
  Minimal Express server: connects to MongoDB, exposes content CRUD and file upload.
  - Run: cd dev-server && npm install && npm run dev
  - Create a .env file (copy .env.example) and set MONGO_URI, PORT, FRONTEND_ORIGIN
*/

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const contentRoutes = require('./routes/content');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');

const app = express();
app.use(express.json());

const isProduction = process.env.NODE_ENV === 'production';

// Allow all origins
app.use(cors({
  origin: true,
  credentials: true
}));

// Serve uploaded files - DISABLED: Using Cloudinary instead
// const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;
// const uploadsPath = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');
// app.use('/uploads', express.static(uploadsPath));

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 5000;
// Prefer an explicit IPv4 address for local development to avoid
// resolving `localhost` to an IPv6 ::1 address on some systems.
const MONGO = (isProduction ? process.env.MONGO_URI_PRO : process.env.MONGO_URI)
  || 'mongodb://127.0.0.1:27017/tornado_dev';

async function start() {
  try {
    await mongoose.connect(MONGO);
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();
