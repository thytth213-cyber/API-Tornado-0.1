/* eslint-env node */
// dev-server/middleware/authMiddleware.js
// Simple JWT auth middleware. Expects Authorization: Bearer <token>

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

function authMiddleware(req, res, next) {
  try {
    const auth = (req.headers.authorization || '').trim();
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const token = auth.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Missing token' });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // attach decoded payload to request for downstream handlers
    req.admin = payload;
    return next();
  } catch (err) {
    console.error('auth middleware error', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = authMiddleware;
