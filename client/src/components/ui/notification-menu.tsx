"use client";

import React, { useState } from 'react';
import {
  Menu,
  MenuItem,
  Badge,
  IconButton,
  Typography,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  EmojiEvents as ChallengeIcon,
  FitnessCenter as WorkoutIcon,
  CheckCircle as CheckIcon,
  MarkEmailRead as ReadAllIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNotifications } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationMenuProps {
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'challenge_created':
      return <ChallengeIcon color="primary" />;
    case 'challenge_joined':
      return <ChallengeIcon color="secondary" />;
    case 'challenge_completed':
      return <CheckIcon color="success" />;
    case 'challenge_reminder':
      return <WorkoutIcon color="warning" />;
    default:
      return <NotificationsIcon />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#f44336';
    case 'medium':
      return '#ff9800';
    case 'low':
      return '#4caf50';
    default:
      return '#2196f3';
  }
};

export const NotificationMenu = ({ anchorEl, open, onClose }: NotificationMenuProps) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createTestNotification,
  } = useNotifications();

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    
    onClose();
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleCreateTest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await createTestNotification();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          width: 400,
          maxHeight: 500,
        }
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }} />
            )}
          </Typography>
          
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<ReadAllIcon />}
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ m: 1 }}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      {!loading && !error && (
        <List sx={{ p: 0, maxHeight: 350, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No notifications"
                secondary="You're all caught up!"
                sx={{ textAlign: 'center' }}
              />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItemButton
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  borderLeft: 3,
                  borderLeftColor: notification.isRead ? 'transparent' : getPriorityColor(notification.priority),
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.selected',
                  }
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.isRead ? 'normal' : 'bold',
                          flex: 1,
                          mr: 1
                        }}
                      >
                        {notification.title}
                      </Typography>
                      
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteNotification(e, notification._id)}
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 0.5 }}
                      >
                        {notification.message}
                      </Typography>
                      
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                      
                      {notification.challenge && (
                        <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                          • {notification.challenge.title}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            ))
          )}
        </List>
      )}

      {/* Footer */}
      <Divider />
      <Box sx={{ p: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={handleCreateTest}
        >
          Create Test Notification
        </Button>
      </Box>
    </Menu>
  );
};

export default NotificationMenu;