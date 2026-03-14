/* eslint-env node */
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/jpeg|image\/png|image\/webp|image\/svg\+xml)$/i;
    if (!allowed.test(file.mimetype)) return cb(new Error('Unsupported file type'), false);
    cb(null, true);
  }
});

const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const CLOUDINARY_PRESETS = {
  'home-hero': { width: 1920, height: 1080, crop: 'fill' },
  'home-projects': { width: 600, height: 400, crop: 'fill' },
  'home-about': { width: 800, height: 600, crop: 'fill' },
  'logo': { width: 200, height: 100, crop: 'fit' }
};

router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const section = (req.body.section || '').toLowerCase();
    const preset = CLOUDINARY_PRESETS[section];
    const folder = process.env.CLOUDINARY_FOLDER || 'tornado';

    const uploadOptions = {
      folder: `${folder}/${section || 'general'}`,
      resource_type: 'auto',
      unique_filename: true,
    };

    if (preset) {
      uploadOptions.transformation = [preset];
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    return res.json({
      url: result.secure_url,
      filename: result.public_id
    });
  } catch (err) {
    console.error('Cloudinary upload error', err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

router.get('/list', authMiddleware, async (req, res) => {
  try {
    const folder = process.env.CLOUDINARY_FOLDER || 'tornado';

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500,
      resource_type: 'image',
    });

    const files = result.resources.map(resource => ({
      filename: resource.public_id,
      url: resource.secure_url,
      ext: `.${resource.format}`,
      size: resource.bytes,
      createdAt: resource.created_at,
      modifiedAt: resource.created_at,
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json(files);
  } catch (err) {
    console.error('Cloudinary list error', err);
    return res.status(500).json({ message: 'Could not list uploads' });
  }
});

module.exports = router;
