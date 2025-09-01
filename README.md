# 🏋️ Fitforge

⚠️ **This project is currently in active development. Features and APIs are subject to change.**

A comprehensive fitness tracking application built with modern web technologies, designed to help users achieve their fitness goals through structured workout plans, progress monitoring, and social challenges.

---

## 📋 Project Overview

**Fitness Tracker** is a full-stack web application that provides users with tools to:

- 📚 **Exercise Library**: Browse comprehensive exercise database with detailed instructions and video demonstrations
- 💪 **Custom Workout Plans**: Create, customize, and follow personalized workout routines
- 📊 **Progress Tracking**: Monitor fitness journey with progress photos, measurements, and performance analytics
- 🏆 **Social Challenges**: Participate in community challenges and compete with friends
- 📈 **Analytics Dashboard**: Visualize workout data and track improvement over time

---

## 🛠️ Tech Stack

### Frontend

- [Next.js 15+](https://nextjs.org/) – React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) – Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework
- [Apollo Client](https://www.apollographql.com/docs/react/) – GraphQL client

### Backend

- [Node.js](https://nodejs.org/) – Runtime environment
- [Express.js](https://expressjs.com/) – Web framework
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) – GraphQL server
- [MongoDB](https://www.mongodb.com/) – NoSQL database
- [Mongoose](https://mongoosejs.com/) – MongoDB object modeling
- [JWT](https://jwt.io/) – Token-based authentication

### DevOps & Tools

- TypeScript – Static type checking
- GraphQL – API query language
- Docker – Containerization
- GitHub Actions – CI/CD pipeline

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/abhishek3-successive/Fitforge-The-fitness-Tracker.git
   cd fitness-tracker
   ```

2. **Install dependencies**

   ```bash
   # Backend dependencies
   cd server
   npm install

   # Frontend dependencies (when ready)
   cd ../client
   npm install
   ```

3. **Setup environment variables**
   Create `.env` file inside the `server` directory:

   ```env
   MONGODB_URI=<your mongodb uri>
   PORT=3002
   JWT_SECRET=<your screate key>
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_SECRET=<your referese key>
   JWT_REFRESH_EXPIRES_IN=30d
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```
4. **Setup for client also**
```env
NEXT_PUBLIC_API_URL=<your api url>
NEXT_PUBLIC_GRAPHQL_URL=<your graphql api url>


# App Configuration
NEXT_PUBLIC_APP_NAME=FitForge
NEXT_PUBLIC_APP_URL=<Next app url>

```
5. **Run the backend server**

   ```bash
   cd server
   npm run dev
   ```

---

---

## 🔄 Development Status

### ✅ Completed Features

- Project setup and repository initialization
- Backend server configuration with Express and Apollo Server
- MongoDB connection with Mongoose
- User authentication system (register/login)
- GraphQL schema and resolvers setup
- JWT token-based authentication
- TypeScript configuration
- Development environment setup
- Exercise database and management system
- Workout plan creation and management
- User profile and settings management
- Frontend with Next.js
- Progress tracking with photo uploads
- Social challenges & leaderboards
- Real-time notifications
- Mobile responsive design

### 📋 Planned Features

- Third-party integrations (fitness devices)
- Advanced workout templates
- Nutrition tracking (future scope)

---

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. Commit your changes

   ```bash
   git commit -m "Add some AmazingFeature"
   ```

4. Push to the branch

   ```bash
   git push origin feature/AmazingFeature
   ```

5. Open a Pull Request

---
