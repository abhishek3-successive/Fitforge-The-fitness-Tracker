import WorkoutPlan, { IWorkoutPlan } from "../../models/workOutplan";
import { Request, Response } from "express";

// Create a new workout plan
export const createWorkoutPlan = async (req: Request, res: Response) => {
  try {
    const workoutPlanData: Partial<IWorkoutPlan> = req.body;
    const newWorkoutPlan = new WorkoutPlan(workoutPlanData);
    await newWorkoutPlan.save();
    
    await newWorkoutPlan.populate([
      { path: 'createdBy', select: 'username email' },
      { path: 'workoutDays.exercises.exercise', select: 'name category muscleGroups' }
    ]);
    
    res.status(201).json({
      success: true,
      message: "Workout plan created successfully",
      data: newWorkoutPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating workout plan",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get all workout plans with filtering and pagination
export const getWorkoutPlans = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      goal,
      difficulty,
      equipment,
      daysPerWeek,
      duration,
      search,
      isPublic = 'true',
      sortBy = 'rating'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (isPublic !== 'all') {
      filter.isPublic = isPublic === 'true';
    }
    
    if (goal) filter.goal = goal;
    if (difficulty) filter.difficulty = difficulty;
    if (equipment) filter.equipment = { $in: (equipment as string).split(',') };
    if (daysPerWeek) filter.daysPerWeek = Number(daysPerWeek);
    if (duration) {
      const [min, max] = (duration as string).split('-').map(Number);
      filter.duration = { $gte: min, $lte: max || min };
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Sort options
    const sortOptions: any = {};
    if (sortBy === 'rating') sortOptions.rating = -1;
    else if (sortBy === 'newest') sortOptions.createdAt = -1;
    else if (sortBy === 'oldest') sortOptions.createdAt = 1;
    else sortOptions.createdAt = -1;

    const workoutPlans = await WorkoutPlan.find(filter)
      .populate('createdBy', 'username')
      .populate('workoutDays.exercises.exercise', 'name category')
      .skip(skip)
      .limit(Number(limit))
      .sort(sortOptions);

    const total = await WorkoutPlan.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: workoutPlans,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: workoutPlans.length,
        totalCount: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workout plans",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get workout plan by ID
export const getWorkoutPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workoutPlan = await WorkoutPlan.findById(id)
      .populate('createdBy', 'username email')
      .populate('workoutDays.exercises.exercise');

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: "Workout plan not found"
      });
    }

    res.status(200).json({
      success: true,
      data: workoutPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workout plan",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Update workout plan
export const updateWorkoutPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const workoutPlan = await WorkoutPlan.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'createdBy', select: 'username email' },
      { path: 'workoutDays.exercises.exercise', select: 'name category' }
    ]);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: "Workout plan not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout plan updated successfully",
      data: workoutPlan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating workout plan",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Delete workout plan
export const deleteWorkoutPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workoutPlan = await WorkoutPlan.findByIdAndDelete(id);

    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: "Workout plan not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout plan deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting workout plan",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Rate a workout plan
export const rateWorkoutPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    const workoutPlan = await WorkoutPlan.findById(id);
    if (!workoutPlan) {
      return res.status(404).json({
        success: false,
        message: "Workout plan not found"
      });
    }

    // Calculate new rating
    const totalRating = (workoutPlan.rating * workoutPlan.totalRatings) + rating;
    workoutPlan.totalRatings += 1;
    workoutPlan.rating = totalRating / workoutPlan.totalRatings;

    await workoutPlan.save();

    res.status(200).json({
      success: true,
      message: "Workout plan rated successfully",
      data: {
        rating: workoutPlan.rating,
        totalRatings: workoutPlan.totalRatings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rating workout plan",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get workout plans by user
export const getUserWorkoutPlans = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const workoutPlans = await WorkoutPlan.find({ createdBy: userId })
      .populate('workoutDays.exercises.exercise', 'name category')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await WorkoutPlan.countDocuments({ createdBy: userId });

    res.status(200).json({
      success: true,
      data: workoutPlans,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: workoutPlans.length,
        totalCount: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user workout plans",
      error: error instanceof Error ? error.message : error
    });
  }
};
