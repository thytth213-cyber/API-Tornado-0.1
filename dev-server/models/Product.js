/* eslint-env node */
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  shortDescription: { type: String }, // For listing pages
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ProductCategory', 
    required: true 
  },
  price: { type: Number }, // Optional: for e-commerce features
  image: { type: String }, // Main product image
  gallery: [{ type: String }], // Additional product images
  features: [{ type: String }], // List of key features
  specifications: { type: Map, of: String }, // Key-value pairs for specs
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  order: { type: Number, default: 0 },
  featured: { type: Boolean, default: false }, // For homepage featured products
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
