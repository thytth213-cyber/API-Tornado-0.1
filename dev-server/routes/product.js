/* eslint-env node */
const express = require('express');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/products - list all active products (public)
router.get('/', async (req, res) => {
  try {
    const items = await Product.find({ status: 'active' })
      .populate('category')
      .sort({ featured: -1, order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('product list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/featured - list featured products (public)
router.get('/featured/list', async (req, res) => {
  try {
    const items = await Product.find({ status: 'active', featured: true })
      .populate('category')
      .sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('featured products list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/category/:categorySlug - list products by category (public)
router.get('/category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const category = await ProductCategory.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const items = await Product.find({ 
      category: category._id, 
      status: 'active' 
    })
      .populate('category')
      .sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('product by category error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/products/:id - get single product detail (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    console.error('product detail error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== ADMIN ROUTES (Protected) ==========

// GET /api/products/admin/all - list all products (admin only)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const items = await Product.find()
      .populate('category')
      .sort({ featured: -1, order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('admin product list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/products - create or update product (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      id, 
      name, 
      slug, 
      description, 
      shortDescription, 
      category, 
      price, 
      image, 
      gallery, 
      features, 
      specifications, 
      status, 
      order, 
      featured 
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    // Verify category exists
    const categoryDoc = await ProductCategory.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (id) {
      // Update existing product
      const updated = await Product.findByIdAndUpdate(id, {
        name,
        slug,
        description,
        shortDescription,
        category,
        price,
        image,
        gallery,
        features,
        specifications,
        status,
        order,
        featured,
        updatedAt: new Date()
      }, { new: true }).populate('category');
      return res.json(updated);
    }

    // Create new product
    const created = await Product.create({
      name,
      slug,
      description,
      shortDescription,
      category,
      price,
      image,
      gallery,
      features,
      specifications,
      status,
      order,
      featured
    });
    const populated = await Product.findById(created._id).populate('category');
    res.status(201).json(populated);
  } catch (err) {
    console.error('product create/update error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/:id (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Product.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('product delete error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== CATEGORY ROUTES ==========

// GET /api/products/categories/all - list all categories (public)
router.get('/categories/all', async (req, res) => {
  try {
    const items = await ProductCategory.find()
      .sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('category list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/products/categories - create or update category (admin only)
router.post('/categories', authMiddleware, async (req, res) => {
  try {
    const { id, name, slug, description, icon, color, order } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }

    if (id) {
      const updated = await ProductCategory.findByIdAndUpdate(id, {
        name,
        slug,
        description,
        icon,
        color,
        order,
        updatedAt: new Date()
      }, { new: true });
      return res.json(updated);
    }

    const created = await ProductCategory.create({
      name,
      slug,
      description,
      icon,
      color,
      order
    });
    res.status(201).json(created);
  } catch (err) {
    console.error('category create/update error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/categories/:id (admin only)
router.delete('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Check if category has products
    const productsCount = await Product.countDocuments({ category: id });
    if (productsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing products' });
    }
    const removed = await ProductCategory.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('category delete error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
