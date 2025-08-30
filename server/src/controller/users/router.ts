import { Router } from "express";
import { 
  loginUser, 
  registerUser, 
  getUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  refreshToken,
  getCurrentUser,
  getUserStats
} from "./user.controller";
import { 
  validateRequiredFields, 
  validatePaginationParams, 
  validateEmail, 
  validatePassword,
  validateObjectId,
  sanitizeStrings
} from "../../middleware/validation";
import { authenticateToken, optionalAuth, checkResourceOwnership } from "../../middleware/auth";
import { get } from "http";

const router = Router();

// Health check route for users
router.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'User routes are working' });
});

// User authentication routes
router.post('/register', 
  validateRequiredFields(['username', 'email', 'password']), 
  validateEmail,
  validatePassword,
  sanitizeStrings(['username', 'email']),
  registerUser
);

router.post('/login', 
  validateRequiredFields(['email', 'password']), 
  validateEmail,
  sanitizeStrings(['email']),
  loginUser
);

router.post('/refresh-token',
  validateRequiredFields(['refreshToken']),
  refreshToken
);

// Protected routes (require authentication)
router.get('/me', authenticateToken, getCurrentUser);
router.get('/stats', authenticateToken, getUserStats);


// User CRUD operations
router.get('/', 
  validatePaginationParams, 
  optionalAuth, // Optional auth to allow filtering based on user
  getUsers
);

router.get('/:id', 
  validateObjectId('id'),
  optionalAuth,
  getUserById
);

router.put('/:id', 
  validateObjectId('id'),
  authenticateToken,
  checkResourceOwnership('id', 'userId'),
  validateEmail,
  validatePassword,
  sanitizeStrings(['username', 'email']),
  updateUser
);

router.delete('/:id', 
  validateObjectId('id'),
  authenticateToken,
  checkResourceOwnership('id', 'userId'),
  deleteUser
);

export default router;