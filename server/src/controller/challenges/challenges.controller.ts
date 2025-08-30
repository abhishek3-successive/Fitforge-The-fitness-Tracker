import Challenge, { IChallenge } from "../../models/challenges";
import { Request, Response } from "express";

// Create a new challenge
export const createChallenge = async (req: Request, res: Response) => {
  try {
    const challengeData: Partial<IChallenge> = req.body;
    const newChallenge = new Challenge(challengeData);
    await newChallenge.save();
    
    await newChallenge.populate('createdBy', 'username email');
    
    res.status(201).json({
      success: true,
      message: "Challenge created successfully",
      data: newChallenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating challenge",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get all challenges with filtering and pagination
export const getChallenges = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      difficulty,
      status,
      isPublic = 'true',
      search,
      sortBy = 'newest'
    } = req.query;

    // Build filter object
    const filter: any = {};
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    if (isPublic !== 'all') filter.isPublic = isPublic === 'true';
    
    // Text search
    if (search) {
      filter.$text = { $search: search as string };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Sort options
    const sortOptions: any = {};
    if (sortBy === 'newest') sortOptions.createdAt = -1;
    else if (sortBy === 'oldest') sortOptions.createdAt = 1;
    else if (sortBy === 'participants') sortOptions.totalParticipants = -1;
    else if (sortBy === 'ending-soon') sortOptions.endDate = 1;
    else sortOptions.createdAt = -1;

    const challenges = await Challenge.find(filter)
      .populate('createdBy', 'username')
      .skip(skip)
      .limit(Number(limit))
      .sort(sortOptions);

    const total = await Challenge.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: challenges,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: challenges.length,
        totalCount: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching challenges",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get challenge by ID
export const getChallengeById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findById(id)
      .populate('createdBy', 'username email')
      .populate('participants.user', 'username')
      .populate('leaderboard.user', 'username');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    res.status(200).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching challenge",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Update challenge
export const updateChallenge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const challenge = await Challenge.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Challenge updated successfully",
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating challenge",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Delete challenge
export const deleteChallenge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const challenge = await Challenge.findByIdAndDelete(id);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Challenge deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting challenge",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Join a challenge
export const joinChallenge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    // Check if challenge is full
    if (challenge.maxParticipants && challenge.totalParticipants >= challenge.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: "Challenge is full"
      });
    }

    // Check if user already joined
    const existingParticipant = challenge.participants.find(p => p.user.toString() === userId);
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: "User already joined this challenge"
      });
    }

    // Add participant
    challenge.participants.push({
      user: userId,
      joinedAt: new Date(),
      progress: 0,
      lastUpdate: new Date(),
      isCompleted: false
    } as any);

    await challenge.save();
    await challenge.populate('participants.user', 'username');

    res.status(200).json({
      success: true,
      message: "Successfully joined challenge",
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error joining challenge",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Leave a challenge
export const leaveChallenge = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    // Remove participant
    const participantIndex = challenge.participants.findIndex(p => p.user.toString() === userId);
    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "User is not a participant in this challenge"
      });
    }

    challenge.participants.splice(participantIndex, 1);
    
    // Remove from leaderboard if exists
    const leaderboardIndex = challenge.leaderboard.findIndex(l => l.user.toString() === userId);
    if (leaderboardIndex !== -1) {
      challenge.leaderboard.splice(leaderboardIndex, 1);
    }

    await challenge.save();

    res.status(200).json({
      success: true,
      message: "Successfully left challenge"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error leaving challenge",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Update participant progress
export const updateParticipantProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, progress } = req.body;

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    // Find participant
    const participant = challenge.participants.find(p => p.user.toString() === userId);
    if (!participant) {
      return res.status(400).json({
        success: false,
        message: "User is not a participant in this challenge"
      });
    }

    // Update progress
    participant.progress = progress;
    participant.lastUpdate = new Date();
    
    // Check if challenge is completed
    if (progress >= challenge.goal.target) {
      participant.isCompleted = true;
    }

    // Update leaderboard
    const leaderboardEntry = challenge.leaderboard.find(l => l.user.toString() === userId);
    if (leaderboardEntry) {
      leaderboardEntry.score = progress;
    } else {
      challenge.leaderboard.push({
        user: userId,
        score: progress,
        rank: 0
      } as any);
    }

    // Sort and update ranks
    challenge.leaderboard.sort((a, b) => b.score - a.score);
    challenge.leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    await challenge.save();
    await challenge.populate([
      { path: 'participants.user', select: 'username' },
      { path: 'leaderboard.user', select: 'username' }
    ]);

    res.status(200).json({
      success: true,
      message: "Progress updated successfully",
      data: challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating progress",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get challenge leaderboard
export const getChallengeLeaderboard = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const challenge = await Challenge.findById(id)
      .populate('leaderboard.user', 'username')
      .select('leaderboard title type goal');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: "Challenge not found"
      });
    }

    const leaderboard = challenge.leaderboard
      .slice(0, Number(limit))
      .sort((a, b) => a.rank - b.rank);

    res.status(200).json({
      success: true,
      data: {
        challenge: {
          title: challenge.title,
          type: challenge.type,
          goal: challenge.goal
        },
        leaderboard
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching leaderboard",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get user's challenges
export const getUserChallenges = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    let matchStage: any = { 'participants.user': userId };
    if (status) {
      matchStage.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const challenges = await Challenge.find(matchStage)
      .populate('createdBy', 'username')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Challenge.countDocuments(matchStage);

    res.status(200).json({
      success: true,
      data: challenges,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: challenges.length,
        totalCount: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user challenges",
      error: error instanceof Error ? error.message : error
    });
  }
};
