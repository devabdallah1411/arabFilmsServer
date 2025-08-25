const express = require('express');
const { authenticate, requireRoles } = require('../middlewares/auth');
const ratingController = require('../controllers/ratingController');

const router = express.Router();

router.post('/', authenticate, requireRoles('user', 'admin', 'publisher'), ratingController.rateWork);
router.get('/average/:workId', ratingController.getAverageRating);

router.get('/admin', authenticate, requireRoles('admin'), ratingController.getAllRatings);
router.get('/publisher', authenticate, requireRoles('publisher'), ratingController.getRatingsForPublisherWorks);

module.exports = router;


