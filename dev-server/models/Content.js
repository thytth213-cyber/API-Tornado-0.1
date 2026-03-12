/* eslint-env node */
const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: { type: String, required: true }, // e.g. 'hero', 'about', 'projects'
  title: { type: String },
  body: { type: String },
  mediaUrl: { type: String },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Content', contentSchema);
