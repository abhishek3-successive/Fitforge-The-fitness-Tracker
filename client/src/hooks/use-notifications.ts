import { useState, useEffect, useCallback } from 'react';
import { NotificationService, Notification } from '@/external-api/notification.service';
import { useAuthStore } from '@/lib/auth-store';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuthStore();

  const fetchNotifications = useCallback(async (limit = 20, offset = 0) => {
    if (!user?._id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await NotificationService.getNotifications(user._id, limit, offset);
      if (offset === 0) {
        setNotifications(result);
      } else {
        setNotifications(prev => [...prev, ...result]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?._id) return;
    
    try {
      const count = await NotificationService.getUnreadNotificationCount(user._id);
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [user?._id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId
            ? { ...notification, isRead: true, readAt: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?._id) return false;
    
    try {
      await NotificationService.markAllAsRead(user._id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date().toISOString() 
        }))
      );
      
      setUnreadCount(0);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
      return false;
    }
  }, [user?._id]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      // Update local state
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
      return false;
    }
  }, [notifications]);

  // Create a test notification
  const createTestNotification = useCallback(async () => {
    if (!user?._id) return null;
    
    try {
      const notification = await NotificationService.createNotification({
        type: 'challenge_created',
        title: 'Test Notification',
        message: 'This is a test notification created from the UI',
        userId: user._id,
        priority: 'medium',
        actionUrl: '/challenges'
      });
      
      if (notification) {
        // Add to local state
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
      
      return notification;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create test notification');
      return null;
    }
  }, [user?._id]);

  // Initial fetch
  useEffect(() => {
    if (user?._id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user?._id, fetchNotifications, fetchUnreadCount]);

  // Refresh notifications periodically
  useEffect(() => {
    if (!user?._id) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Check for new notifications every 30 seconds

    return () => clearInterval(interval);
  }, [user?._id, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createTestNotification,
    refresh: () => {
      fetchNotifications();
      fetchUnreadCount();
    }
  };
};