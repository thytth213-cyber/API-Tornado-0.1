/* eslint-env node */
const express = require('express');
// ready-to-use packages for auth workflows
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Use environment secret when available; fall back to a dev placeholder so
// the file remains compatible with existing env layouts until you set JWT_SECRET.
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

// POST /api/auth/login
// Implemented: accepts { username, password } and returns a JWT on success.
const Admin = require('../models/Admin');

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const admin = await Admin.findOne({ username }).exec();
    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const payload = { id: admin._id.toString(), username: admin.username, role: admin.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    return res.json({ token, username: admin.username, role: admin.role });
  } catch (err) {
    console.error('Auth login error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/auth/me
// Placeholder: return current user (requires auth middleware later)
// Example (commented):
/*
router.get('/me', async (req, res) => {
  // const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  // try {
  //   const payload = jwt.verify(auth, JWT_SECRET);
  //   return res.json({ id: payload.id, email: payload.email });
  // } catch (err) {
  //   return res.status(401).json({ message: 'Invalid token' });
  // }
});
*/
router.get('/me', async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

module.exports = router;
