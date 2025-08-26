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
  getRecentWorkouts
} from "./workOutSession.controller";

const router = Router();

// Health check route for workout sessions
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Workout session routes are working' });
});

// Workout session CRUD operations
router.post('/', createWorkoutSession);                 // Create workout session
router.get('/', getWorkoutSessions);                    // Get all workout sessions with filtering
router.get('/:id', getWorkoutSessionById);              // Get workout session by ID
router.put('/:id', updateWorkoutSession);               // Update workout session
router.delete('/:id', deleteWorkoutSession);            // Delete workout session

// Workout session actions
router.patch('/:id/start', startWorkoutSession);        // Start a workout session
router.patch('/:id/complete', completeWorkoutSession);  // Complete a workout session

// User specific routes
router.get('/user/:userId/stats', getUserWorkoutStats); // Get user workout statistics
router.get('/user/:userId/recent', getRecentWorkouts);  // Get user's recent workouts

export default router;
