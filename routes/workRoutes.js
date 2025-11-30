const express = require('express');
const { body, param } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const workController = require('../controllers/workController');

const router = express.Router();
const { authenticate, requireRoles, requireWorkOwnerOrAdmin } = require('../middlewares/auth');

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

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Validation rules
const createAndUpdateValidation = [
  body('type')
    .exists({ checkNull: true })
    .withMessage('type is required')
    .isIn(['film', 'series'])
    .withMessage('type must be either film or series'),
  body('nameArabic').trim().notEmpty().withMessage('nameArabic is required'),
  body('nameEnglish').trim().notEmpty().withMessage('nameEnglish is required'),
  body('year').isInt({ min: 1800, max: 3000 }).withMessage('year must be a valid number'),
  body('director').trim().notEmpty().withMessage('director is required'),
  body('assistantDirector').trim().notEmpty().withMessage('assistantDirector is required'),
  body('genre').trim().notEmpty().withMessage('genre is required'),
  body('cast')
    .custom((value) => {
      // Handle both string and array formats
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch (e) {
          return false;
        }
      }
      return Array.isArray(value) && value.length > 0;
    })
    .withMessage('cast must be a non-empty array'),
  body('country').trim().notEmpty().withMessage('country is required'),
  body('filmingLocation').trim().notEmpty().withMessage('filmingLocation is required'),
  body('summary').trim().notEmpty().withMessage('summary is required'),
  body('posterUrl')
    .optional()
    .trim()
    .isURL()
    .withMessage('posterUrl must be a valid URL if provided'),
  body('seasonsCount')
    .if(body('type').equals('series'))
    .exists({ checkNull: true })
    .withMessage('seasonsCount is required for series')
    .isInt({ min: 1 })
    .withMessage('seasonsCount must be a positive integer'),
  body('episodesCount')
    .if(body('type').equals('series'))
    .exists({ checkNull: true })
    .withMessage('episodesCount is required for series')
    .isInt({ min: 1 })
    .withMessage('episodesCount must be a positive integer'),
];

const idParamValidation = [param('id').isMongoId().withMessage('Invalid work id')];

// Validation error handler
const { validationResult } = require('express-validator');
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
  }
  if (error.message === 'Only image files are allowed!') {
    return res.status(400).json({ message: error.message });
  }
  next(error);
};

// Unified work creation endpoint - supports file upload, base64, or URL
router.post('/',
  authenticate,
  requireRoles('admin', 'publisher'),
  upload.single('image'), // Optional - only processes if file is present
  handleMulterError,
  createAndUpdateValidation,
  handleValidation,
  workController.createWork
);
router.get('/', authenticate, requireRoles('admin', 'publisher'), workController.getAllWorks);
// Public route for fetching all works (no authentication required)
router.get('/public', workController.getAllWorksPublic);
// Public route for fetching work by ID (no authentication required)
router.get('/public/:id', idParamValidation, handleValidation, workController.getWorkById);

// Movies endpoints
router.get('/movies/latest', workController.getLatestMovies);
router.get('/movies', workController.getAllMovies);

// Series endpoints
router.get('/series/latest', workController.getLatestSeries);
router.get('/series', workController.getAllSeries);

router.get('/:id', authenticate, requireRoles('admin', 'publisher'), idParamValidation, handleValidation, workController.getWorkById);
router.patch('/:id', authenticate, requireRoles('admin', 'publisher'), requireWorkOwnerOrAdmin, [...idParamValidation, ...createAndUpdateValidation], handleValidation, workController.updateWork);
router.delete('/:id', authenticate, requireRoles('admin', 'publisher'), requireWorkOwnerOrAdmin, idParamValidation, handleValidation, workController.deleteWork);

module.exports = router;


