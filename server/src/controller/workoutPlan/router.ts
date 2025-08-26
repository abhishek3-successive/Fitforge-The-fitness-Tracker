import { Router } from "express";
import {
  createWorkoutPlan,
  getWorkoutPlans,
  getWorkoutPlanById,
  updateWorkoutPlan,
  deleteWorkoutPlan,
  rateWorkoutPlan,
  getUserWorkoutPlans
} from "./workoutPlan.controller";

const router = Router();

// Health check route for workout plans
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Workout plan routes are working' });
});

// Workout plan CRUD operations
router.post('/', createWorkoutPlan);                    // Create workout plan
router.get('/', getWorkoutPlans);                       // Get all workout plans with filtering
router.get('/:id', getWorkoutPlanById);                 // Get workout plan by ID
router.put('/:id', updateWorkoutPlan);                  // Update workout plan
router.delete('/:id', deleteWorkoutPlan);               // Delete workout plan

// Special routes
router.post('/:id/rate', rateWorkoutPlan);              // Rate a workout plan
router.get('/user/:userId', getUserWorkoutPlans);       // Get workout plans by user

export default router;
