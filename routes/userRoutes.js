const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRoles } = require('../middlewares/auth');

router.post('/signup', userController.signup);
router.post('/signin', userController.signin);

// Forgot Password
router.post('/forgot-password', userController.forgotPassword);

// Reset Password
router.post('/reset-password/:token', userController.resetPassword);

// Admin create users with roles
router.post('/', authenticate, requireRoles('admin'), userController.createUserByAdmin);

// Admin user management
router.get('/', authenticate, requireRoles('admin'), userController.listUsers);
router.delete('/:id', authenticate, requireRoles('admin'), userController.deleteUser);
router.patch('/:id', authenticate, requireRoles('admin'), userController.updateUser);

// Favorites management routes
router.post('/favorites', authenticate, userController.addToFavorites);
router.delete('/favorites/:workId', authenticate, userController.removeFromFavorites);
router.get('/favorites', authenticate, userController.getFavorites);
router.get('/favorites/check/:workId', authenticate, userController.checkFavoriteStatus);

module.exports = router;
