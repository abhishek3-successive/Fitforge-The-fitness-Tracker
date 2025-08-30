import { Router } from "express";
import {
  createWorkoutSession,
  getWorkoutSessions,
  getWorkoutSessionById,
  updateWorkoutSession,
  deleteWorkoutSession,
  startWorkoutSession,
  completeWorkoutSession,
  getUserWorkoutStats,
  getRecentWorkouts,
  getActiveWorkoutSession
} from "./workOutSession.controller";
import { authenticateToken, optionalAuth } from "../../middleware/auth";

const router = Router();

// Health check route for workout sessions
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Workout session routes are working' });
});

// Workout session CRUD operations
router.post('/', authenticateToken, createWorkoutSession);                 // Create workout session
router.get('/', optionalAuth, getWorkoutSessions);                         // Get all workout sessions with filtering
router.get('/active', optionalAuth, getActiveWorkoutSession);              // Get active workout session for user
router.get('/:id', optionalAuth, getWorkoutSessionById);                   // Get workout session by ID
router.put('/:id', authenticateToken, updateWorkoutSession);               // Update workout session
router.delete('/:id', authenticateToken, deleteWorkoutSession);            // Delete workout session

// Workout session actions
router.patch('/:id/start', authenticateToken, startWorkoutSession);        // Start a workout session
router.patch('/:id/complete', authenticateToken, completeWorkoutSession);  // Complete a workout session

// User specific routes
router.get('/user/:userId/stats', getUserWorkoutStats); // Get user workout statistics
router.get('/user/:userId/recent', getRecentWorkouts);  // Get user's recent workouts

export default router;
