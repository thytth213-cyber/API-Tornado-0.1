/* eslint-env node */
const express = require('express');
const Content = require('../models/Content');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/content - list all content
router.get('/', async (req, res) => {
  try {
    const items = await Content.find().sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('content list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/content - create or update (if id present)
// Protected: requires valid JWT
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { id, section, title, body, mediaUrl, order } = req.body;
    if (id) {
      const updated = await Content.findByIdAndUpdate(id, { section, title, body, mediaUrl, order, updatedAt: new Date() }, { new: true });
      return res.json(updated);
    }
    const created = await Content.create({ section, title, body, mediaUrl, order });
    res.status(201).json(created);
  } catch (err) {
    console.error('content create error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/content/:id
// Protected: requires valid JWT
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Content.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('content delete error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
