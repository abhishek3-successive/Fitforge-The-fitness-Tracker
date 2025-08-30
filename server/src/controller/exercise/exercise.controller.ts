import Exercise, { IExercise } from "../../models/Exercise";
import { Request, Response } from "express";
import {
  sendSuccess,
  sendNotFound,
  getPaginationFromQuery,
  createPaginationMeta,
  buildFilter,
  buildSort
} from "../../utils";
import { asyncHandler } from "../../middleware";

// Create a new exercise
export const createExercise = asyncHandler(async (req: Request, res: Response) => {
  const exerciseData: Partial<IExercise> = {
    ...req.body,
    createdBy: req.user._id // Set from authenticated user
  };
  
  const newExercise = new Exercise(exerciseData);
  await newExercise.save();
  
  await newExercise.populate('createdBy', 'username email');
  
  return sendSuccess(res, newExercise, "Exercise created successfully", 201);
});

// Get all exercises with filtering and pagination
export const getExercises = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = getPaginationFromQuery(req.query, { maxLimit: 50 });

  // Build filter object using utility
  const filter = buildFilter(req.query, {
    enumFields: {
      category: ['strength', 'cardio', 'flexibility', 'balance', 'plyometric', 'powerlifting', 'olympic', 'rehabilitation'],
      difficulty: ['beginner', 'intermediate', 'advanced']
    },
    arrayFields: ['muscleGroups', 'equipment'],
    booleanFields: ['isPublic'],
    searchFields: ['name', 'description']
  });

  // Text search
  if (req.query.search && !filter.$text) {
    filter.$or = [
      { name: { $regex: req.query.search as string, $options: 'i' } },
      { description: { $regex: req.query.search as string, $options: 'i' } }
    ];
  }

  const sort = buildSort(req.query, { createdAt: -1 });

  const exercises = await Exercise.find(filter)
    .populate('createdBy', 'username')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Exercise.countDocuments(filter);
  const pagination = createPaginationMeta(page, limit, total, exercises.length);

  return sendSuccess(res, exercises, undefined, 200, pagination);
});

// Get exercise by ID
export const getExerciseById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const exercise = await Exercise.findById(id).populate('createdBy', 'username email');

  if (!exercise) {
    return sendNotFound(res, "Exercise");
  }

  return sendSuccess(res, exercise);
});

// Update exercise
export const updateExercise = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const exercise = await Exercise.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate('createdBy', 'username email');

  if (!exercise) {
    return sendNotFound(res, "Exercise");
  }

  return sendSuccess(res, exercise, "Exercise updated successfully");
});

// Delete exercise
export const deleteExercise = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const exercise = await Exercise.findByIdAndDelete(id);

  if (!exercise) {
    return sendNotFound(res, "Exercise");
  }

  return sendSuccess(res, null, "Exercise deleted successfully");
});

// Get exercises by muscle group
export const getExercisesByMuscleGroup = asyncHandler(async (req: Request, res: Response) => {
  const { muscleGroup } = req.params;
  const exercises = await Exercise.find({
    muscleGroups: muscleGroup,
    isPublic: true
  }).populate('createdBy', 'username');

  return sendSuccess(res, exercises);
});

// Get exercises by equipment
export const getExercisesByEquipment = asyncHandler(async (req: Request, res: Response) => {
  const { equipment } = req.params;
  const exercises = await Exercise.find({
    equipment: equipment,
    isPublic: true
  }).populate('createdBy', 'username');

  return sendSuccess(res, exercises);
});
