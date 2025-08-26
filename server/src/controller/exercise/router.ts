import { Router } from "express";
import {
  createExercise,
  getExercises,
  getExerciseById,
  updateExercise,
  deleteExercise,
  getExercisesByMuscleGroup,
  getExercisesByEquipment
} from "./exercise.controller";
import { 
  validatePaginationParams, 
  validateRequiredFields,
  validateObjectId,
  validateEnum,
  validateArray,
  sanitizeStrings
} from "../../middleware/validation";
import { authenticateToken, optionalAuth } from "../../middleware/auth";

const router = Router();

// Health check route for exercises
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Exercise routes are working' });
});

// Exercise CRUD operations
router.post('/', 
  authenticateToken,
  validateRequiredFields(['name', 'description', 'category', 'muscleGroups', 'equipment', 'difficulty', 'instructions']),
  validateEnum('category', ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'powerlifting', 'olympic', 'rehabilitation']),
  validateEnum('difficulty', ['beginner', 'intermediate', 'advanced']),
  validateArray('muscleGroups', 1, 10),
  validateArray('equipment', 1, 5),
  validateArray('instructions', 1, 20),
  sanitizeStrings(['name', 'description', 'tips', 'variations']),
  createExercise
);

router.get('/', 
  validatePaginationParams, 
  optionalAuth,
  getExercises
);

router.get('/:id', 
  validateObjectId('id'),
  optionalAuth,
  getExerciseById
);

router.put('/:id', 
  validateObjectId('id'),
  authenticateToken,
  validateEnum('category', ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'powerlifting', 'olympic', 'rehabilitation']),
  validateEnum('difficulty', ['beginner', 'intermediate', 'advanced']),
  sanitizeStrings(['name', 'description', 'tips', 'variations']),
  updateExercise
);

router.delete('/:id', 
  validateObjectId('id'),
  authenticateToken,
  deleteExercise
);

// Special routes
router.get('/muscle-group/:muscleGroup', getExercisesByMuscleGroup);
router.get('/equipment/:equipment', getExercisesByEquipment);

export default router;
