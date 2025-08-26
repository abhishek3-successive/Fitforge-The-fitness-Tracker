import WorkoutSession, { IWorkoutSession } from "../../models/workoutSession";
import { Request, Response } from "express";

// Create a new workout session
export const createWorkoutSession = async (req: Request, res: Response) => {
  try {
    const sessionData: Partial<IWorkoutSession> = req.body;
    const newSession = new WorkoutSession(sessionData);
    await newSession.save();
    
    await newSession.populate([
      { path: 'user', select: 'username email' },
      { path: 'workoutPlan', select: 'title goal difficulty' },
      { path: 'exercises.exercise', select: 'name category muscleGroups' }
    ]);
    
    res.status(201).json({
      success: true,
      message: "Workout session created successfully",
      data: newSession
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating workout session",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get all workout sessions with filtering and pagination
export const getWorkoutSessions = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      workoutPlan,
      status,
      startDate,
      endDate
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (userId) filter.user = userId;
    if (workoutPlan) filter.workoutPlan = workoutPlan;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate as string);
      if (endDate) filter.startTime.$lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const sessions = await WorkoutSession.find(filter)
      .populate('user', 'username')
      .populate('workoutPlan', 'title goal')
      .populate('exercises.exercise', 'name category')
      .skip(skip)
      .limit(Number(limit))
      .sort({ startTime: -1 });

    const total = await WorkoutSession.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: sessions,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: sessions.length,
        totalCount: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workout sessions",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get workout session by ID
export const getWorkoutSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await WorkoutSession.findById(id)
      .populate('user', 'username email')
      .populate('workoutPlan', 'title goal difficulty')
      .populate('exercises.exercise');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found"
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workout session",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Update workout session
export const updateWorkoutSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const session = await WorkoutSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'user', select: 'username email' },
      { path: 'workoutPlan', select: 'title goal' },
      { path: 'exercises.exercise', select: 'name category' }
    ]);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout session updated successfully",
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating workout session",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Delete workout session
export const deleteWorkoutSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await WorkoutSession.findByIdAndDelete(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout session deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting workout session",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Start a workout session
export const startWorkoutSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const session = await WorkoutSession.findByIdAndUpdate(
      id,
      { 
        status: 'in-progress',
        startTime: new Date()
      },
      { new: true }
    ).populate([
      { path: 'user', select: 'username' },
      { path: 'exercises.exercise', select: 'name category' }
    ]);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout session started successfully",
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error starting workout session",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Complete a workout session
export const completeWorkoutSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { caloriesBurned, rating, mood, energy, notes } = req.body;
    
    const session = await WorkoutSession.findByIdAndUpdate(
      id,
      { 
        status: 'completed',
        endTime: new Date(),
        caloriesBurned,
        rating,
        mood,
        energy,
        notes
      },
      { new: true }
    ).populate([
      { path: 'user', select: 'username' },
      { path: 'exercises.exercise', select: 'name category' }
    ]);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Workout session not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Workout session completed successfully",
      data: session
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error completing workout session",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get user's workout statistics
export const getUserWorkoutStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { timeframe = 'month' } = req.query; // week, month, year

    let dateFilter = new Date();
    if (timeframe === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeframe === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else if (timeframe === 'year') {
      dateFilter.setFullYear(dateFilter.getFullYear() - 1);
    }

    const stats = await WorkoutSession.aggregate([
      {
        $match: {
          user: userId,
          status: 'completed',
          startTime: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalCaloriesBurned: { $sum: '$caloriesBurned' },
          averageRating: { $avg: '$rating' },
          averageDuration: { $avg: '$duration' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalWorkouts: 0,
        totalDuration: 0,
        totalCaloriesBurned: 0,
        averageRating: 0,
        averageDuration: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching workout statistics",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get user's recent workout sessions
export const getRecentWorkouts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const sessions = await WorkoutSession.find({
      user: userId,
      status: { $in: ['completed', 'in-progress'] }
    })
      .populate('workoutPlan', 'title goal')
      .populate('exercises.exercise', 'name category')
      .limit(Number(limit))
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching recent workouts",
      error: error instanceof Error ? error.message : error
    });
  }
};
