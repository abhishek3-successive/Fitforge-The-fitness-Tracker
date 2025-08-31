import { apolloClient } from '@/lib/apollo-client';
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATION_COUNT,
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  DELETE_NOTIFICATION,
  CREATE_NOTIFICATION,
} from './notifications.graphql';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  challenge?: {
    _id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    difficulty: string;
    createdBy: {
      _id: string;
      username: string;
    };
  };
}

export interface CreateNotificationInput {
  type: string;
  title: string;
  message: string;
  userId: string;
  relatedId?: string;
  relatedModel?: string;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high';
  data?: string;
}

export class NotificationService {
  /**
   * Get notifications for a user
   */
  static async getNotifications(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<Notification[]> {
    try {
      const { data } = await apolloClient.query({
        query: GET_NOTIFICATIONS,
        variables: { userId, limit, offset },
        fetchPolicy: 'network-only',
      });
      
      return (data as any).getNotifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const { data } = await apolloClient.query({
        query: GET_UNREAD_NOTIFICATION_COUNT,
        variables: { userId },
        fetchPolicy: 'network-only',
      });
      
      return (data as any).getUnreadNotificationCount || 0;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await apolloClient.mutate({
        mutation: MARK_NOTIFICATION_AS_READ,
        variables: { id: notificationId },
      });
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await apolloClient.mutate({
        mutation: MARK_ALL_NOTIFICATIONS_AS_READ,
        variables: { userId },
      });
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await apolloClient.mutate({
        mutation: DELETE_NOTIFICATION,
        variables: { id: notificationId },
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Create a notification (for testing purposes)
   */
  static async createNotification(input: CreateNotificationInput): Promise<Notification | null> {
    try {
      const { data } = await apolloClient.mutate({
        mutation: CREATE_NOTIFICATION,
        variables: { input },
      });
      
      return (data as any).createNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
}