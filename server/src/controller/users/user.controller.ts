import User from "../../models/user";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  sendSuccess,
  sendError,
  sendNotFound,
  sendValidationError,
  getPaginationFromQuery,
  createPaginationMeta,
  buildFilter,
  buildSort,
  isValidEmail,
  isValidPassword,
  excludePassword
} from "../../utils";
import { asyncHandler } from "../../middleware";
import { generateToken, generateRefreshToken, JWTPayload, verifyRefreshToken } from "../../middleware/auth";

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // Validate required fields
  if (!username || !email || !password) {
    return sendValidationError(res, "Username, email, and password are required");
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return sendValidationError(res, "Please provide a valid email address");
  }

  // Validate password strength
  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    return sendValidationError(res, passwordValidation.message!);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { username }] 
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'username';
    return sendError(res, `User with this ${field} already exists`, 409);
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, email, password: hashedPassword });
  await newUser.save();
  
  // Generate JWT tokens
  const tokenPayload: JWTPayload = {
    id: newUser._id.toString(),
    email: newUser.email,
    username: newUser.username
  };

  const accessToken = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  
  // Remove password from response
  const userResponse = excludePassword(newUser);
  
  return sendSuccess(res, {
    user: userResponse,
    accessToken,
    refreshToken,
    tokenType: 'Bearer'
  }, "User registered successfully", 201);
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return sendValidationError(res, "Email and password are required");
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return sendValidationError(res, "Please provide a valid email address");
  }

  const user = await User.findOne({ email });
  if (!user) {
    return sendError(res, "Invalid credentials", 401);
  }

  // Compare the hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return sendError(res, "Invalid credentials", 401);
  }

  // Generate JWT tokens
  const tokenPayload: JWTPayload = {
    id: user._id.toString(),
    email: user.email,
    username: user.username
  };

  const accessToken = generateToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Remove password from response
  const userResponse = excludePassword(user);

  return sendSuccess(res, {
    user: userResponse,
    accessToken,
    refreshToken,
    tokenType: 'Bearer'
  }, "Login successful");
});

// Get all users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { skip, limit, page } = getPaginationFromQuery(req.query, { maxLimit: 50 });

  // Build search filter
  const filter = buildFilter(req.query, {
    searchFields: ['username', 'email']
  });

  // If search query exists but no text search, use regex for username/email
  if (req.query.search && !filter.$text) {
    filter.$or = [
      { username: { $regex: req.query.search as string, $options: 'i' } },
      { email: { $regex: req.query.search as string, $options: 'i' } }
    ];
  }

  const sort = buildSort(req.query, { createdAt: -1 });

  const users = await User.find(filter)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await User.countDocuments(filter);
  const pagination = createPaginationMeta(page, limit, total, users.length);

  return sendSuccess(res, users, undefined, 200, pagination);
});

// Get user by ID
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password');

  if (!user) {
    return sendNotFound(res, "User");
  }

  return sendSuccess(res, user);
});

// Update user
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  // If password is being updated, validate and hash it
  if (updateData.password) {
    const passwordValidation = isValidPassword(updateData.password);
    if (!passwordValidation.valid) {
      return sendValidationError(res, passwordValidation.message!);
    }
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  // If email is being updated, validate it
  if (updateData.email && !isValidEmail(updateData.email)) {
    return sendValidationError(res, "Please provide a valid email address");
  }

  const user = await User.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return sendNotFound(res, "User");
  }

  return sendSuccess(res, user, "User updated successfully");
});

// Delete user
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return sendNotFound(res, "User");
  }

  return sendSuccess(res, null, "User deleted successfully");
});

// Refresh access token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendValidationError(res, "Refresh token is required");
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return sendError(res, "Invalid or expired refresh token", 401);
  }

  // Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  // Generate new tokens
  const tokenPayload: JWTPayload = {
    id: user._id.toString(),
    email: user.email,
    username: user.username
  };

  const newAccessToken = generateToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  return sendSuccess(res, {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    tokenType: 'Bearer'
  }, "Tokens refreshed successfully");
});

// Get current user profile
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  // req.user is set by the authenticateToken middleware
  if (!req.user) {
    return sendError(res, "User not authenticated", 401);
  }

  return sendSuccess(res, req.user, "User profile retrieved successfully");
});
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.query;
  const targetUserId = userId || req.user?.id;

  if (!targetUserId) {
    return sendError(res, "User ID is required", 400);
  }

  try {
    // Import models
    const WorkoutSession = (await import("../../models/workoutSession")).default;
    const Challenge = (await import("../../models/challenges")).default;

    // Get user data
    const user = await User.findById(targetUserId).select('-password');
    if (!user) {
      return sendNotFound(res, "User");
    }

    // Calculate account age
    const accountAge = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    // Get workout statistics
    const workoutStats = await WorkoutSession.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: null,
          totalWorkouts: { $sum: 1 },
          totalDuration: { $sum: "$duration" },
          completedWorkouts: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          }
        }
      }
    ]);

    // Get unique exercises count
    const exercisesStats = await WorkoutSession.aggregate([
      { $match: { userId: user._id } },
      { $unwind: "$exercises" },
      { $group: { _id: "$exercises.exerciseId" } },
      { $count: "totalExercises" }
    ]);

    // Calculate current streak (simplified - consecutive days with workouts)
    const recentWorkouts = await WorkoutSession.find({ 
      userId: user._id, 
      status: "completed" 
    })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('createdAt');

    let currentStreak = 0;
    if (recentWorkouts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let streakDate = new Date(today);
      
      for (const workout of recentWorkouts) {
        const workoutDate = new Date(workout.createdAt);
        workoutDate.setHours(0, 0, 0, 0);
        
        if (workoutDate.getTime() === streakDate.getTime()) {
          currentStreak++;
          streakDate.setDate(streakDate.getDate() - 1);
        } else if (workoutDate.getTime() < streakDate.getTime()) {
          break;
        }
      }
    }

    // Get challenge statistics (if challenge model exists)
    let challengeStats = { totalChallenges: 0, challengesWon: 0 };
    try {
      const challenges = await Challenge.find({ participants: user._id });
      challengeStats.totalChallenges = challenges.length;
      // This is simplified - you'd need proper challenge completion logic
      challengeStats.challengesWon = Math.floor(challenges.length * 0.3); // Placeholder
    } catch (error) {
      // Challenge model might not exist yet
    }

    const stats = {
      totalWorkouts: workoutStats[0]?.totalWorkouts || 0,
      currentStreak,
      totalExercises: exercisesStats[0]?.totalExercises || 0,
      averageWorkoutDuration: workoutStats[0]?.totalWorkouts > 0 
        ? Math.round((workoutStats[0]?.totalDuration || 0) / workoutStats[0].totalWorkouts) 
        : 0,
      totalChallenges: challengeStats.totalChallenges,
      challengesWon: challengeStats.challengesWon,
      progressPhotos: 0, // Placeholder - would need progress photos model
      accountAge
    };

    return sendSuccess(res, stats, "User statistics retrieved successfully");
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return sendError(res, "Error fetching user statistics", 500);
  }
});
