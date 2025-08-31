import { PubSub, withFilter } from 'graphql-subscriptions';
import Notification, { INotification } from '../models/notification';
import Challenge from '../models/challenges';
import User from '../models/user';
import mongoose from 'mongoose';

// Create PubSub instance for subscriptions
export const pubsub = new PubSub();

// Subscription event names
export const NOTIFICATION_EVENTS = {
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  NOTIFICATION_UPDATED: 'NOTIFICATION_UPDATED',
};

export const resolvers = {
  Query: {
    getNotifications: async (_: any, { userId, limit, offset }: { userId: string; limit: number; offset: number }) => {
      try {
        const notifications = await Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(offset)
          .populate('relatedId')
          .lean();

        return notifications.map((notification: any) => ({
          ...notification,
          _id: notification._id.toString(),
          userId: notification.userId.toString(),
          relatedId: notification.relatedId?.toString(),
          createdAt: notification.createdAt.toISOString(),
          readAt: notification.readAt?.toISOString(),
          data: notification.data ? JSON.stringify(notification.data) : null,
          challenge: notification.relatedModel === 'Challenge' ? notification.relatedId : null
        }));
      } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Failed to fetch notifications');
      }
    },

    getUnreadNotificationCount: async (_: any, { userId }: { userId: string }) => {
      try {
        const count = await Notification.countDocuments({ 
          userId: new mongoose.Types.ObjectId(userId), 
          isRead: false 
        });
        return count;
      } catch (error) {
        console.error('Error fetching unread notification count:', error);
        throw new Error('Failed to fetch unread notification count');
      }
    },

    getNotificationById: async (_: any, { id }: { id: string }) => {
      try {
        const notification = await Notification.findById(id).populate('relatedId').lean();
        if (!notification) return null;

        return {
          ...notification,
          _id: notification._id.toString(),
          userId: notification.userId.toString(),
          relatedId: notification.relatedId?.toString(),
          createdAt: notification.createdAt.toISOString(),
          readAt: notification.readAt?.toISOString(),
          data: notification.data ? JSON.stringify(notification.data) : null,
          challenge: notification.relatedModel === 'Challenge' ? notification.relatedId : null
        };
      } catch (error) {
        console.error('Error fetching notification:', error);
        throw new Error('Failed to fetch notification');
      }
    },
  },

  Mutation: {
    markNotificationAsRead: async (_: any, { id }: { id: string }) => {
      try {
        const notification = await Notification.findByIdAndUpdate(
          id,
          { isRead: true, readAt: new Date() },
          { new: true }
        ).populate('relatedId').lean();

        if (!notification) {
          throw new Error('Notification not found');
        }

        const formattedNotification = {
          ...notification,
          _id: notification._id.toString(),
          userId: notification.userId.toString(),
          relatedId: notification.relatedId?.toString(),
          createdAt: notification.createdAt.toISOString(),
          readAt: notification.readAt?.toISOString(),
          data: notification.data ? JSON.stringify(notification.data) : null,
          challenge: notification.relatedModel === 'Challenge' ? notification.relatedId : null
        };

        // Publish update
        pubsub.publish(NOTIFICATION_EVENTS.NOTIFICATION_UPDATED, {
          notificationUpdated: formattedNotification,
          userId: notification.userId.toString(),
        });

        return formattedNotification;
      } catch (error) {
        console.error('Error marking notification as read:', error);
        throw new Error('Failed to mark notification as read');
      }
    },

    markAllNotificationsAsRead: async (_: any, { userId }: { userId: string }) => {
      try {
        await Notification.updateMany(
          { userId: new mongoose.Types.ObjectId(userId), isRead: false },
          { isRead: true, readAt: new Date() }
        );
        return true;
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw new Error('Failed to mark all notifications as read');
      }
    },

    deleteNotification: async (_: any, { id }: { id: string }) => {
      try {
        const result = await Notification.findByIdAndDelete(id);
        return !!result;
      } catch (error) {
        console.error('Error deleting notification:', error);
        throw new Error('Failed to delete notification');
      }
    },

    createNotification: async (_: any, { input }: { input: any }) => {
      try {
        const notification = new Notification({
          ...input,
          userId: new mongoose.Types.ObjectId(input.userId),
          relatedId: input.relatedId ? new mongoose.Types.ObjectId(input.relatedId) : undefined,
          data: input.data ? JSON.parse(input.data) : undefined,
        });

        await notification.save();
        await notification.populate('relatedId');

        const formattedNotification = {
          ...notification.toObject(),
          _id: notification._id.toString(),
          userId: notification.userId.toString(),
          relatedId: notification.relatedId?.toString(),
          createdAt: notification.createdAt.toISOString(),
          readAt: notification.readAt?.toISOString(),
          data: notification.data ? JSON.stringify(notification.data) : null,
          challenge: notification.relatedModel === 'Challenge' ? notification.relatedId : null
        };

        // Publish to subscribers
        pubsub.publish(NOTIFICATION_EVENTS.NOTIFICATION_CREATED, {
          notificationCreated: formattedNotification,
          userId: input.userId,
        });

        return formattedNotification;
      } catch (error) {
        console.error('Error creating notification:', error);
        throw new Error('Failed to create notification');
      }
    },
  },

  Subscription: {
    notificationCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator([NOTIFICATION_EVENTS.NOTIFICATION_CREATED]),
        (payload, variables) => {
          return payload.userId === variables.userId;
        }
      ),
    },

    notificationUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterableIterator([NOTIFICATION_EVENTS.NOTIFICATION_UPDATED]),
        (payload, variables) => {
          return payload.userId === variables.userId;
        }
      ),
    },
  },

  // Resolvers for nested fields
  Notification: {
    challenge: async (parent: any) => {
      if (parent.relatedModel === 'Challenge' && parent.relatedId) {
        try {
          const challenge = await Challenge.findById(parent.relatedId).populate('createdBy').lean();
          if (challenge) {
            return {
              ...challenge,
              _id: challenge._id.toString(),
              createdBy: {
                ...challenge.createdBy,
                _id: challenge.createdBy._id.toString(),
              },
              startDate: challenge.startDate.toISOString(),
              endDate: challenge.endDate.toISOString(),
            };
          }
        } catch (error) {
          console.error('Error fetching challenge for notification:', error);
        }
      }
      return null;
    },
  },
};

// Helper function to create challenge notifications
export const createChallengeNotifications = async (challenge: any, creatorId: string) => {
  try {
    // Get all users except the creator
    const users = await User.find({ 
      _id: { $ne: new mongoose.Types.ObjectId(creatorId) },
      isActive: true 
    }).select('_id').lean();

    const notifications = users.map(user => ({
      type: 'challenge_created',
      title: 'New Challenge Available!',
      message: `${challenge.createdBy?.username || 'Someone'} created a new challenge: "${challenge.title}"`,
      userId: user._id,
      relatedId: challenge._id,
      relatedModel: 'Challenge',
      actionUrl: `/challenges/${challenge._id}`,
      priority: 'medium',
      data: {
        challengeType: challenge.type,
        challengeCategory: challenge.category,
        challengeDifficulty: challenge.difficulty,
      }
    }));

    // Create notifications in batch
    const createdNotifications = await Notification.insertMany(notifications);

    // Publish to all users
    for (const notification of createdNotifications) {
      const formattedNotification = {
        ...notification.toObject(),
        _id: notification._id.toString(),
        userId: notification.userId.toString(),
        relatedId: notification.relatedId?.toString(),
        createdAt: notification.createdAt.toISOString(),
        data: notification.data ? JSON.stringify(notification.data) : null,
        challenge: challenge
      };

      pubsub.publish(NOTIFICATION_EVENTS.NOTIFICATION_CREATED, {
        notificationCreated: formattedNotification,
        userId: notification.userId.toString(),
      });
    }

    console.log(`Created ${createdNotifications.length} notifications for new challenge: ${challenge.title}`);
  } catch (error) {
    console.error('Error creating challenge notifications:', error);
  }
};