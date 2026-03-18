/* eslint-env node */
/**
 * Seed script for Product and ProductCategory collections
 * Run: node seedProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const Product = require('./models/Product');
const ProductCategory = require('./models/ProductCategory');

const MONGO = (process.env.NODE_ENV === 'production' ? process.env.MONGO_URI_PRO : process.env.MONGO_URI)
  || 'mongodb://127.0.0.1:27017/tornado_dev';

const categories = [
  {
    name: 'Industrial Machinery',
    slug: 'industrial-machinery',
    description: 'Heavy-duty industrial equipment and machinery',
    color: '#3498db'
  },
  {
    name: 'Telecommunications Equipment',
    slug: 'telecommunications-equipment',
    description: 'Communication systems and network infrastructure',
    color: '#e74c3c'
  },
  {
    name: 'Lightning & Metrological Systems',
    slug: 'lightning-metrological-systems',
    description: 'Meteorological instruments and lightning protection',
    color: '#f39c12'
  },
  {
    name: 'Fire Fighting Equipment',
    slug: 'fire-fighting-equipment',
    description: 'Fire safety and suppression equipment',
    color: '#c0392b'
  },
  {
    name: 'IT Hardware & Software',
    slug: 'it-hardware-software',
    description: 'Computer systems and IT infrastructure',
    color: '#2ecc71'
  }
];

const products = [
  {
    name: 'CNC Machining Systems',
    slug: 'cnc-machining-systems',
    description: 'Advanced CNC machines for precision manufacturing',
    shortDescription: 'High-precision CNC systems',
    categorySlug: 'industrial-machinery',
    price: 50000,
    features: ['5-axis machining', 'Precision accuracy', 'High speed'],
    featured: true,
    order: 1
  },
  {
    name: 'Network Router Systems',
    slug: 'network-router-systems',
    description: 'Enterprise-grade networking equipment',
    shortDescription: 'Professional network solutions',
    categorySlug: 'telecommunications-equipment',
    price: 15000,
    features: ['10Gbps throughput', 'Enterprise management', 'Redundancy'],
    featured: true,
    order: 2
  },
  {
    name: 'Weather Monitoring Station',
    slug: 'weather-monitoring-station',
    description: 'Complete meteorological monitoring system',
    shortDescription: 'Professional weather equipment',
    categorySlug: 'lightning-metrological-systems',
    price: 8000,
    features: ['Real-time data', 'Cloud integration', 'Mobile app'],
    featured: true,
    order: 3
  },
  {
    name: 'Fire Suppression System',
    slug: 'fire-suppression-system',
    description: 'Automated fire detection and suppression',
    shortDescription: 'Complete fire safety solution',
    categorySlug: 'fire-fighting-equipment',
    price: 25000,
    features: ['Auto-detection', 'Multi-zone coverage', 'Monitoring'],
    featured: true,
    order: 4
  },
  {
    name: 'Enterprise Server Cluster',
    slug: 'enterprise-server-cluster',
    description: 'Scalable server infrastructure for enterprises',
    shortDescription: 'High-performance computing',
    categorySlug: 'it-hardware-software',
    price: 120000,
    features: ['High availability', 'Load balancing', 'Auto-scaling'],
    featured: true,
    order: 5
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO);
    console.log('MongoDB connected');

    // Clear existing data
    await ProductCategory.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const createdCategories = await ProductCategory.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    // Create products with category references
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.slug] = cat._id;
    });

    const productsWithCategoryId = products.map(prod => ({
      ...prod,
      category: categoryMap[prod.categorySlug],
      categorySlug: undefined
    }));

    const createdProducts = await Product.insertMany(productsWithCategoryId);
    console.log(`Created ${createdProducts.length} products`);

    console.log('✓ Seed completed successfully!');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
