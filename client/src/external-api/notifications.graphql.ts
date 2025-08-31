import { gql } from '@apollo/client';

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($userId: ID!, $limit: Int = 20, $offset: Int = 0) {
    getNotifications(userId: $userId, limit: $limit, offset: $offset) {
      _id
      type
      title
      message
      isRead
      createdAt
      readAt
      actionUrl
      priority
      challenge {
        _id
        title
        description
        type
        category
        difficulty
        createdBy {
          _id
          username
        }
      }
    }
  }
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount($userId: ID!) {
    getUnreadNotificationCount(userId: $userId)
  }
`;

export const MARK_NOTIFICATION_AS_READ = gql`
  mutation MarkNotificationAsRead($id: ID!) {
    markNotificationAsRead(id: $id) {
      _id
      isRead
      readAt
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_AS_READ = gql`
  mutation MarkAllNotificationsAsRead($userId: ID!) {
    markAllNotificationsAsRead(userId: $userId)
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: ID!) {
    deleteNotification(id: $id)
  }
`;

export const CREATE_NOTIFICATION = gql`
  mutation CreateNotification($input: CreateNotificationInput!) {
    createNotification(input: $input) {
      _id
      type
      title
      message
      isRead
      createdAt
      actionUrl
      priority
      challenge {
        _id
        title
        createdBy {
          username
        }
      }
    }
  }
`;

// Subscriptions (we'll add these later)
export const NOTIFICATION_CREATED_SUBSCRIPTION = gql`
  subscription NotificationCreated($userId: ID!) {
    notificationCreated(userId: $userId) {
      _id
      type
      title
      message
      isRead
      createdAt
      actionUrl
      priority
      challenge {
        _id
        title
        createdBy {
          username
        }
      }
    }
  }
`;

export const NOTIFICATION_UPDATED_SUBSCRIPTION = gql`
  subscription NotificationUpdated($userId: ID!) {
    notificationUpdated(userId: $userId) {
      _id
      isRead
      readAt
    }
  }
`;