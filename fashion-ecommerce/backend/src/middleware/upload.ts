import multer from 'multer';
import { Request } from 'express';

// Configure multer to store files in memory (as Buffer)
// Files will be uploaded to Cloudinary, not saved locally
const storage = multer.memoryStorage();

// File filter to accept only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    fieldSize: 10 * 1024 * 1024, // 10MB for fields (to handle base64 images)
  },
});

// Middleware for single main image upload
export const uploadSingle = upload.single('image');

// Middleware for multiple additional images upload
export const uploadMultiple = upload.array('images', 5); // Max 5 additional images

// Middleware to handle both main image and additional images
// This allows 'image' (single) and 'images' (array) fields
export const uploadProductImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);
