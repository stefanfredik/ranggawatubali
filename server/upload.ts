import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { appConfig } from './config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', appConfig.upload.directory);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
console.log('Upload directory path:', uploadDir);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = appConfig.upload.allowedTypes;
  const mimeType = file.mimetype;
  
  if (allowedTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: appConfig.upload.maxSize // Default 5MB from config
  },
  fileFilter: fileFilter
});

console.log('Multer configuration:', {
  allowedTypes: appConfig.upload.allowedTypes,
  maxSize: `${appConfig.upload.maxSize / (1024 * 1024)}MB`
});

// Error handling middleware for multer
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${appConfig.upload.maxSize / (1024 * 1024)}MB` 
      });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Helper to delete old profile picture
export const deleteProfilePicture = (filename: string) => {
  if (!filename) return;
  
  const filePath = path.join(uploadDir, path.basename(filename));
  
  // Only delete if file exists and is within our uploads directory (security check)
  if (fs.existsSync(filePath) && filePath.startsWith(uploadDir)) {
    fs.unlinkSync(filePath);
  }
};

export default upload;