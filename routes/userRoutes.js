const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', userController.signup);
router.post('/signin', userController.signin);

// Forgot Password
router.post('/forgot-password', userController.forgotPassword);

// Reset Password
router.post('/reset-password/:token', userController.resetPassword);

module.exports = router;
