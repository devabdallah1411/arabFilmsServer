const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRoles } = require('../middlewares/auth');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images
// More flexible: check extension first, then mimetype (if available)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // If extension is valid, accept the file (even if mimetype is wrong)
    // This handles cases where Content-Type is incorrectly set in Postman
    if (extname) {
        return cb(null, true);
    }

    // Also check mimetype as a fallback
    const mimetype = file.mimetype && allowedTypes.test(file.mimetype);
    if (mimetype) {
        return cb(null, true);
    }

    cb(new Error('Only image files are allowed!'), false);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter,
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ message: 'Unexpected file field. Only profileImage is allowed.' });
        }
    }
    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: error.message });
    }
    next(error);
};

// Signup with optional profile image
// Using upload.any() to accept both text fields and file
router.post('/signup', upload.any(), handleMulterError, userController.signup);
router.post('/signin', userController.signin);

// Forgot Password
router.post('/forgot-password', userController.forgotPassword);

// Reset Password
router.post('/reset-password/:token', userController.resetPassword);

// Admin create users with roles
router.post('/', authenticate, requireRoles('admin'), userController.createUserByAdmin);

// User profile management with optional profile image
router.patch('/profile', authenticate, upload.single('profileImage'), handleMulterError, userController.updateProfile);

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
