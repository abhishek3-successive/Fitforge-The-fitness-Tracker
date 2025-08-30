import { Router } from "express";
import { upload, handleUploadError } from "../../middleware/upload";
import { authenticateToken, optionalAuth } from "../../middleware/auth";
import {
  createProgressPhoto,
  getProgressPhotos,
  getProgressPhotoById,
  updateProgressPhoto,
  deleteProgressPhoto,
  likeProgressPhoto,
  unlikeProgressPhoto,
  getUserProgressTimeline,
  getTrendingProgressPhotos,
  getProgressComparison
} from "./progressPhoto.controller";

const router = Router();

// Health check route for progress photos
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Progress photo routes are working' });
});

// Test upload endpoint for development
router.post('/test-upload', upload.single('image'), handleUploadError, (req, res) => {
  console.log('Test upload - File:', req.file);
  console.log('Test upload - Body:', req.body);
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded"
    });
  }
  
  res.json({
    success: true,
    message: "File uploaded successfully",
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: `/uploads/progress-photos/${req.file.filename}`
    }
  });
});

// Progress photo CRUD operations
router.post('/', authenticateToken, upload.single('image'), handleUploadError, createProgressPhoto);  // Create progress photo with auth and file upload
router.get('/', optionalAuth, getProgressPhotos);                                                       // Get all progress photos (public, but optional auth for private photos)
router.get('/:id', optionalAuth, getProgressPhotoById);                                                 // Get progress photo by ID
router.put('/:id', authenticateToken, updateProgressPhoto);                                             // Update progress photo (auth required)
router.delete('/:id', authenticateToken, deleteProgressPhoto);                                          // Delete progress photo (auth required)

// Progress photo actions
router.patch('/:id/like', authenticateToken, likeProgressPhoto);                                        // Like a progress photo (auth required)
router.patch('/:id/unlike', authenticateToken, unlikeProgressPhoto);                                    // Unlike a progress photo (auth required)

// Special routes
router.get('/trending', getTrendingProgressPhotos);                                                     // Get trending progress photos (public)
router.get('/user/:userId/timeline', optionalAuth, getUserProgressTimeline);                           // Get user's progress timeline (optional auth)
router.get('/user/:userId/comparison', optionalAuth, getProgressComparison);                           // Get progress comparison (optional auth)

export default router;
