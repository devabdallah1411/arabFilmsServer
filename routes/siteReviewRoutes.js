const express = require('express');
const { authenticate, requireRoles } = require('../middlewares/auth');
const siteReviewController = require('../controllers/siteReviewController');

const router = express.Router();

router.post('/', authenticate, requireRoles('user', 'admin', 'publisher'), siteReviewController.createOrUpdateSiteReview);
router.get('/', siteReviewController.getSiteReviews);

module.exports = router;


