import { Router } from "express";
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

// Progress photo CRUD operations
router.post('/', createProgressPhoto);                  // Create progress photo
router.get('/', getProgressPhotos);                     // Get all progress photos with filtering
router.get('/:id', getProgressPhotoById);               // Get progress photo by ID
router.put('/:id', updateProgressPhoto);                // Update progress photo
router.delete('/:id', deleteProgressPhoto);             // Delete progress photo

// Progress photo actions
router.patch('/:id/like', likeProgressPhoto);           // Like a progress photo
router.patch('/:id/unlike', unlikeProgressPhoto);       // Unlike a progress photo

// Special routes
router.get('/trending', getTrendingProgressPhotos);     // Get trending progress photos
router.get('/user/:userId/timeline', getUserProgressTimeline);  // Get user's progress timeline
router.get('/user/:userId/comparison', getProgressComparison);  // Get progress comparison

export default router;
