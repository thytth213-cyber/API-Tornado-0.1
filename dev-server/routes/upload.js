/* eslint-env node */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
let sharp = null;
try {
  // Attempt to load sharp; if it's not installed or the binary doesn't match the
  // platform, we fall back to a safe non-sharp path so the server can still run.
  sharp = require('sharp');
} catch (e) {
  console.warn('Optional dependency "sharp" not available, upload will fall back to a non-resizing path.');
}

// Use /tmp for Vercel serverless environment (read-only filesystem)
// Use ./uploads for local development
const isVercel = process.env.VERCEL === '1' || process.env.NOW_REGION;
const uploadDir = isVercel
  ? '/tmp/uploads'
  : path.join(__dirname, '..', 'uploads');

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage so we can process the buffer with sharp before writing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB
  fileFilter: (req, file, cb) => {
    const allowed = /^(image\/jpeg|image\/png|image\/webp|image\/svg\+xml)$/i;
    if (!allowed.test(file.mimetype)) return cb(new Error('Unsupported file type'), false);
    cb(null, true);
  }
});

const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// resizing presets per 'section' (admin should provide 'section' in form-data)
const PRESETS = {
  'home-hero': { w: 1920, h: 1080, fit: 'cover' },
  'home-projects': { w: 600, h: 400, fit: 'cover' },
  'home-about': { w: 800, h: 600, fit: 'cover' },
  'logo': { w: 200, h: 100, fit: 'inside' }
};

function makeFilename(origName, extHint) {
  const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extHint || path.extname(origName) || '.jpg';
  return `${unique}${ext}`;
}

// POST /api/upload
// Protected: requires valid JWT
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ message: 'No file uploaded' });

    const section = (req.body.section || '').toLowerCase();
    const preset = PRESETS[section] || null;

    // If sharp is available, use it to probe/resize/optimize images.
    let filename;
    if (sharp) {
      // Use sharp to probe the image and decide output format
      const img = sharp(req.file.buffer, { failOnError: false });
      const meta = await img.metadata().catch(() => ({}));
      let outExt = '.jpg';
      if (meta.format === 'png') outExt = '.png';
      if (meta.format === 'webp') outExt = '.webp';

      // If we have a preset, resize; otherwise write original buffer to disk (optimized)
      if (preset) {
        filename = makeFilename(req.file.originalname, outExt);
        const outPath = path.join(uploadDir, filename);

        // choose resize options
        const resizeOpts = { width: preset.w, height: preset.h, fit: preset.fit || 'cover' };

        // For logos we prefer transparent backgrounds when possible (keep png/webp)
        const pipeline = img.resize(resizeOpts);

        if (outExt === '.jpg') {
          await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(outPath);
        } else if (outExt === '.png') {
          await pipeline.png({ compressionLevel: 8 }).toFile(outPath);
        } else if (outExt === '.webp') {
          await pipeline.webp({ quality: 80 }).toFile(outPath);
        } else {
          // fallback to jpeg
          await pipeline.jpeg({ quality: 80, mozjpeg: true }).toFile(outPath);
        }
      } else {
        // No preset — store original but still sanitize and optionally compress
        filename = makeFilename(req.file.originalname, outExt);
        const outPath = path.join(uploadDir, filename);
        // If it's already a reasonable image type, write optimized version
        if (outExt === '.jpg') {
          await img.jpeg({ quality: 85, mozjpeg: true }).toFile(outPath);
        } else if (outExt === '.png') {
          await img.png({ compressionLevel: 8 }).toFile(outPath);
        } else if (outExt === '.webp') {
          await img.webp({ quality: 80 }).toFile(outPath);
        } else {
          // unknown — write raw buffer
          fs.writeFileSync(outPath, req.file.buffer);
        }
      }
    } else {
      // sharp not available: fall back to writing the uploaded buffer directly so
      // the server can still accept uploads without image processing.
      const origExt = path.extname(req.file.originalname) || '.jpg';
      filename = makeFilename(req.file.originalname, origExt);
      const outPath = path.join(uploadDir, filename);
      fs.writeFileSync(outPath, req.file.buffer);
    }

    const url = `/uploads/${filename}`;
    return res.json({ url, filename });
  } catch (err) {
    console.error('Upload/process error', err);
    // multer errors are already handled earlier; treat others as 500
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// GET /api/upload/list
// Return metadata for files in the uploads directory
router.get('/list', authMiddleware, (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir).map((filename) => {
      const full = path.join(uploadDir, filename);
      let stat = null;
  try { stat = fs.statSync(full); } catch { /* ignore */ }
      const ext = path.extname(filename).toLowerCase();
      const url = `/uploads/${filename}`;
      return {
        filename,
        url,
        ext,
        size: stat ? stat.size : null,
        createdAt: stat ? stat.birthtime : null,
        modifiedAt: stat ? stat.mtime : null,
      };
    }).sort((a, b) => {
      // sort newest first by modified time
      const ta = a.modifiedAt ? new Date(a.modifiedAt).getTime() : 0;
      const tb = b.modifiedAt ? new Date(b.modifiedAt).getTime() : 0;
      return tb - ta;
    });

    return res.json(files);
  } catch (err) {
    console.error('Error listing uploads', err);
    return res.status(500).json({ message: 'Could not list uploads' });
  }
});

module.exports = router;
