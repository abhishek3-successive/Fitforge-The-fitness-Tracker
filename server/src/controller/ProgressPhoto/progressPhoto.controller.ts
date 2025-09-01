import ProgressPhoto, { IProgressPhoto } from "../../models/progressPhoto";
import { Request, Response } from "express";
import { getFileUrl, deleteFile } from "../../middleware/upload";
import path from "path";

// Create a new progress photo
export const createProgressPhoto = async (req: Request, res: Response) => {
  try {
    console.log('Creating progress photo...');
    console.log('File:', req.file);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Parse the additional data from the request body
    let additionalData = {};
    try {
      additionalData = req.body.data ? JSON.parse(req.body.data) : {};
    } catch (parseError) {
      console.error('Error parsing data:', parseError);
      // If JSON parsing fails, try to extract data directly from body
      additionalData = req.body;
    }
    
    // Get the file URL
    const imageUrl = getFileUrl(req.file.filename);
    console.log('Generated imageUrl:', imageUrl);
    
    // Create progress photo data
    const photoData: Partial<IProgressPhoto> = {
      ...additionalData,
      imageUrl,
      user: req.user._id, // Get user ID from authenticated user
      dateTaken: new Date(),
    };

    console.log('Photo data to save:', photoData);

    const newPhoto = new ProgressPhoto(photoData);
    await newPhoto.save();
    
    await newPhoto.populate('user', 'username email');
    
    res.status(201).json({
      success: true,
      message: "Progress photo created successfully",
      data: newPhoto
    });
  } catch (error) {
    console.error('Error creating progress photo:', error);
    
    // If there's an error, clean up the uploaded file
    if (req.file) {
      deleteFile(req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating progress photo",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get all progress photos with filtering and pagination
export const getProgressPhotos = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      category,
      bodyPart,
      isPublic,
      tags,
      sortBy = 'newest'
    } = req.query;

    const filter: any = {};
    
    if (userId) filter.user = userId;
    if (category) filter.category = category;
    if (bodyPart) filter.bodyPart = bodyPart;

    // Only apply filter if client passes isPublic
    if (typeof isPublic !== 'undefined' && isPublic !== 'all') {
      filter.isPublic = isPublic === 'true';
    }

    if (tags) filter.tags = { $in: (tags as string).split(',') };

    const skip = (Number(page) - 1) * Number(limit);

    // Sorting
    const sortOptions: any = {};
    if (sortBy === 'newest') sortOptions.dateTaken = -1;
    else if (sortBy === 'oldest') sortOptions.dateTaken = 1;
    else if (sortBy === 'likes') sortOptions.likes = -1;
    else sortOptions.dateTaken = -1;

    const photos = await ProgressPhoto.find(filter)
      .populate('user', 'username')
      .skip(skip)
      .limit(Number(limit))
      .sort(sortOptions);

    const total = await ProgressPhoto.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: photos,
      pagination: {
        current: Number(page),
        total: Math.ceil(total / Number(limit)),
        count: photos.length,
        totalCount: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching progress photos",
      error: error instanceof Error ? error.message : error
    });
  }
};
// Get progress photo by ID
export const getProgressPhotoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const photo = await ProgressPhoto.findById(id).populate('user', 'username email');

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Progress photo not found"
      });
    }

    res.status(200).json({
      success: true,
      data: photo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching progress photo",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Update progress photo
export const updateProgressPhoto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const photo = await ProgressPhoto.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'username email');

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Progress photo not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Progress photo updated successfully",
      data: photo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating progress photo",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Delete progress photo
export const deleteProgressPhoto = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { id } = req.params;
    const photo = await ProgressPhoto.findById(id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Progress photo not found"
      });
    }

    // Add ownership check
    if (photo.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this photo",
      });
    }

    await photo.deleteOne();

    // Delete the associated file
    if (photo.imageUrl) {
      const filename = path.basename(photo.imageUrl);
      deleteFile(filename);
    }

    res.status(200).json({
      success: true,
      message: "Progress photo deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting progress photo",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Like a progress photo
export const likeProgressPhoto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const photo = await ProgressPhoto.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { new: true }
    );

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Progress photo not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Progress photo liked successfully",
      data: { likes: photo.likes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error liking progress photo",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Unlike a progress photo
export const unlikeProgressPhoto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const photo = await ProgressPhoto.findByIdAndUpdate(
      id,
      { $inc: { likes: -1 } },
      { new: true }
    );

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: "Progress photo not found"
      });
    }

    // Ensure likes don't go below 0
    if (photo.likes < 0) {
      photo.likes = 0;
      await photo.save();
    }

    res.status(200).json({
      success: true,
      message: "Progress photo unliked successfully",
      data: { likes: photo.likes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error unliking progress photo",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get user's progress timeline
export const getUserProgressTimeline = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category, bodyPart } = req.query;

    const filter: any = { user: userId };
    if (category) filter.category = category;
    if (bodyPart) filter.bodyPart = bodyPart;

    const photos = await ProgressPhoto.find(filter)
      .sort({ dateTaken: 1 })
      .select('imageUrl thumbnailUrl category bodyPart dateTaken weight bodyFatPercentage measurements milestone');

    res.status(200).json({
      success: true,
      data: photos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user progress timeline",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get trending progress photos
export const getTrendingProgressPhotos = async (req: Request, res: Response) => {
  try {
    const { limit = 20, timeframe = 'week' } = req.query;

    let dateFilter = new Date();
    if (timeframe === 'day') {
      dateFilter.setDate(dateFilter.getDate() - 1);
    } else if (timeframe === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeframe === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    const photos = await ProgressPhoto.find({
      isPublic: true,
      createdAt: { $gte: dateFilter }
    })
      .populate('user', 'username')
      .sort({ likes: -1, comments: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: photos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching trending progress photos",
      error: error instanceof Error ? error.message : error
    });
  }
};

// Get progress comparison between two dates
export const getProgressComparison = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, category } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }

    const filter: any = {
      user: userId,
      dateTaken: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      }
    };

    if (category) filter.category = category;

    const photos = await ProgressPhoto.find(filter)
      .sort({ dateTaken: 1 })
      .select('imageUrl dateTaken weight bodyFatPercentage measurements category bodyPart');

    const firstPhoto = photos[0];
    const lastPhoto = photos[photos.length - 1];

    const comparison = {
      startPhoto: firstPhoto,
      endPhoto: lastPhoto,
      timelinePhoots: photos,
      changes: {
        weight: lastPhoto?.weight && firstPhoto?.weight ? 
          lastPhoto.weight - firstPhoto.weight : null,
        bodyFat: lastPhoto?.bodyFatPercentage && firstPhoto?.bodyFatPercentage ? 
          lastPhoto.bodyFatPercentage - firstPhoto.bodyFatPercentage : null,
        measurements: {}
      }
    };

    // Calculate measurement changes
    if (lastPhoto?.measurements && firstPhoto?.measurements) {
      const measurementKeys = ['chest', 'waist', 'hips', 'biceps', 'thighs', 'neck'];
      measurementKeys.forEach(key => {
        if (lastPhoto.measurements[key] && firstPhoto.measurements[key]) {
          comparison.changes.measurements[key] = 
            lastPhoto.measurements[key] - firstPhoto.measurements[key];
        }
      });
    }

    res.status(200).json({
      success: true,
      data: comparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching progress comparison",
      error: error instanceof Error ? error.message : error
    });
  }
};
