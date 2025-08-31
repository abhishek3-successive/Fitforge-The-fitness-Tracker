import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type User {
    _id: ID!
    username: String!
    email: String!
  }

  type Challenge {
    _id: ID!
    title: String!
    description: String!
    type: String!
    category: String!
    difficulty: String!
    startDate: String!
    endDate: String!
    createdBy: User!
    totalParticipants: Int!
    status: String!
    isPublic: Boolean!
  }

  type Notification {
    _id: ID!
    type: String!
    title: String!
    message: String!
    userId: ID!
    relatedId: ID
    relatedModel: String
    isRead: Boolean!
    createdAt: String!
    readAt: String
    actionUrl: String
    priority: String!
    data: String
    challenge: Challenge
  }

  type Query {
    getNotifications(userId: ID!, limit: Int = 20, offset: Int = 0): [Notification!]!
    getUnreadNotificationCount(userId: ID!): Int!
    getNotificationById(id: ID!): Notification
  }

  type Mutation {
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead(userId: ID!): Boolean!
    deleteNotification(id: ID!): Boolean!
    createNotification(input: CreateNotificationInput!): Notification!
  }

  type Subscription {
    notificationCreated(userId: ID!): Notification!
    notificationUpdated(userId: ID!): Notification!
  }

  input CreateNotificationInput {
    type: String!
    title: String!
    message: String!
    userId: ID!
    relatedId: ID
    relatedModel: String
    actionUrl: String
    priority: String = "medium"
    data: String
  }
`;