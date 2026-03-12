const express = require('express');
const SiteSettings = require('../models/SiteSettings');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/settings/logo
// Public: returns current logo URL (or empty string)
router.get('/logo', async (req, res) => {
  try {
    const doc = await SiteSettings.findOne({}).lean().exec();
    return res.json({ logoUrl: (doc && doc.logoUrl) ? doc.logoUrl : '' });
  } catch (err) {
    console.error('Error fetching site logo', err);
    return res.status(500).json({ message: 'Failed to fetch site settings' });
  }
});

// POST /api/settings/logo
// Protected: only admins can update the global logo
router.post('/logo', authMiddleware, async (req, res) => {
  try {
    const { logoUrl } = req.body || {};
    if (typeof logoUrl !== 'string') return res.status(400).json({ message: 'logoUrl is required' });

    const doc = await SiteSettings.findOneAndUpdate({}, { logoUrl }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json({ logoUrl: doc.logoUrl });
  } catch (err) {
    console.error('Error saving site logo', err);
    return res.status(500).json({ message: 'Failed to save site settings' });
  }
});

module.exports = router;
