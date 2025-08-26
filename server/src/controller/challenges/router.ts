import { Router } from "express";
import {
  createChallenge,
  getChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  leaveChallenge,
  updateParticipantProgress,
  getChallengeLeaderboard,
  getUserChallenges
} from "./challenges.controller";

const router = Router();

// Health check route for challenges
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Challenge routes are working' });
});

// Challenge CRUD operations
router.post('/', createChallenge);                      // Create challenge
router.get('/', getChallenges);                         // Get all challenges with filtering
router.get('/:id', getChallengeById);                   // Get challenge by ID
router.put('/:id', updateChallenge);                    // Update challenge
router.delete('/:id', deleteChallenge);                 // Delete challenge

// Challenge participation
router.post('/:id/join', joinChallenge);                // Join a challenge
router.post('/:id/leave', leaveChallenge);              // Leave a challenge
router.patch('/:id/progress', updateParticipantProgress); // Update participant progress

// Challenge data
router.get('/:id/leaderboard', getChallengeLeaderboard); // Get challenge leaderboard
router.get('/user/:userId', getUserChallenges);         // Get user's challenges

export default router;
