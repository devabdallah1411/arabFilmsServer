const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate, requireRoles } = require('../middlewares/auth');
const advertisementController = require('../controllers/advertisementController');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept images and videos
const fileFilter = (req, file, cb) => {
    const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
    const allowedVideoTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
    const extname = path.extname(file.originalname).toLowerCase();

    const isImage = allowedImageTypes.test(extname.slice(1));
    const isVideo = allowedVideoTypes.test(extname.slice(1));

    if (isImage || isVideo) {
        return cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for videos
    },
    fileFilter: fileFilter,
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
        }
    }
    if (error.message === 'Only image and video files are allowed!') {
        return res.status(400).json({ message: error.message });
    }
    next(error);
};

// Public route - get active advertisements
router.get('/active', advertisementController.getActiveAdvertisements);

// Admin routes - authentication required
router.post(
    '/',
    authenticate,
    requireRoles('admin'),
    upload.single('media'),
    handleMulterError,
    advertisementController.createAdvertisement
);

router.get(
    '/',
    authenticate,
    requireRoles('admin'),
    advertisementController.getAllAdvertisements
);

router.get(
    '/:id',
    authenticate,
    requireRoles('admin'),
    advertisementController.getAdvertisementById
);

router.patch(
    '/:id',
    authenticate,
    requireRoles('admin'),
    advertisementController.updateAdvertisement
);

router.patch(
    '/:id/toggle',
    authenticate,
    requireRoles('admin'),
    advertisementController.toggleAdvertisementStatus
);

router.delete(
    '/:id',
    authenticate,
    requireRoles('admin'),
    advertisementController.deleteAdvertisement
);

module.exports = router;
