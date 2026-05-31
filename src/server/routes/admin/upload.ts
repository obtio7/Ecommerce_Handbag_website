import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import adminAuth from '../../middleware/adminAuth.js';
import { uploadToCloudinary, isCloudinaryConfigured } from '../../services/cloudinary.js';

const router = Router();

// Apply adminAuth middleware
router.use(adminAuth);

// Multer configuration
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,
  },
});

/**
 * POST /api/admin/upload-images
 * Upload images to Cloudinary and return URLs.
 * Does not associate with any product - just returns the URLs.
 */
router.post('/', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    if (!isCloudinaryConfigured()) {
      res.status(500).json({ error: 'Image hosting not configured. Set Cloudinary credentials.' });
      return;
    }

    // Upload each file to Cloudinary
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadToCloudinary(file.buffer, {
        folder: 'zarevielle/products',
      });
      urls.push(url);
    }

    res.json({ urls });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

export default router;
