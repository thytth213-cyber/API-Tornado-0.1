/* eslint-env node */
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  title: { type: String }, // Alternative title for display
  description: { type: String },
  shortDescription: { type: String }, // For listing pages
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServiceCategory', 
    required: true 
  },
  image: { type: String }, // Main service image
  gallery: [{ type: String }], // Additional images
  features: [{ type: String }], // List of key features/benefits
  specifications: { type: Map, of: String }, // Key-value pairs for detailed specs
  deliverables: [{ type: String }], // What clients receive
  timeline: { type: String }, // Typical project timeline
  pricing: { type: String }, // Pricing model or range
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  order: { type: Number, default: 0 },
  featured: { type: Boolean, default: false }, // For homepage featuring
  icon: { type: String }, // Icon for service item on homepage
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
