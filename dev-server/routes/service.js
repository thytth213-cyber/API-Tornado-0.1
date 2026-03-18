/* eslint-env node */
const express = require('express');
const Service = require('../models/Service');
const ServiceCategory = require('../models/ServiceCategory');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/services - list all active services (public)
router.get('/', async (req, res) => {
  try {
    const items = await Service.find({ status: 'active' })
      .populate('category')
      .sort({ featured: -1, order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('service list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/services/featured/list - list featured services (public)
router.get('/featured/list', async (req, res) => {
  try {
    const items = await Service.find({ status: 'active', featured: true })
      .populate('category')
      .sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('featured services list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/services/category/:categorySlug - list services by category (public)
router.get('/category/:categorySlug', async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const category = await ServiceCategory.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    const items = await Service.find({ 
      category: category._id, 
      status: 'active' 
    })
      .populate('category')
      .sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('service by category error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/services/:id - get single service detail (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).populate('category');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (err) {
    console.error('service detail error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== ADMIN ROUTES (Protected) ==========

// GET /api/services/admin/all - list all services (admin only)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    const items = await Service.find()
      .populate('category')
      .sort({ featured: -1, order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('admin service list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/services - create or update service (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      id, 
      name, 
      slug, 
      title,
      description, 
      shortDescription, 
      category, 
      image, 
      gallery, 
      features, 
      specifications, 
      deliverables,
      timeline,
      pricing,
      status, 
      order, 
      featured,
      icon
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    // Verify category exists
    const categoryDoc = await ServiceCategory.findById(category);
    if (!categoryDoc) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (id) {
      // Update existing service
      const updated = await Service.findByIdAndUpdate(id, {
        name,
        slug,
        title,
        description,
        shortDescription,
        category,
        image,
        gallery,
        features,
        specifications,
        deliverables,
        timeline,
        pricing,
        status,
        order,
        featured,
        icon,
        updatedAt: new Date()
      }, { new: true }).populate('category');
      return res.json(updated);
    }

    // Create new service
    const created = await Service.create({
      name,
      slug,
      title,
      description,
      shortDescription,
      category,
      image,
      gallery,
      features,
      specifications,
      deliverables,
      timeline,
      pricing,
      status,
      order,
      featured,
      icon
    });
    const populated = await Service.findById(created._id).populate('category');
    res.status(201).json(populated);
  } catch (err) {
    console.error('service create/update error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/services/:id (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await Service.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('service delete error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== CATEGORY ROUTES ==========

// GET /api/services/categories/all - list all categories (public)
router.get('/categories/all', async (req, res) => {
  try {
    const items = await ServiceCategory.find()
      .sort({ order: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('category list error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/services/categories - create or update category (admin only)
router.post('/categories', authMiddleware, async (req, res) => {
  try {
    const { id, name, slug, description, icon, color, order } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Name and slug are required' });
    }

    if (id) {
      const updated = await ServiceCategory.findByIdAndUpdate(id, {
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

    const created = await ServiceCategory.create({
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

// DELETE /api/services/categories/:id (admin only)
router.delete('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    // Check if category has services
    const servicesCount = await Service.countDocuments({ category: id });
    if (servicesCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing services' });
    }
    const removed = await ServiceCategory.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ message: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('category delete error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
