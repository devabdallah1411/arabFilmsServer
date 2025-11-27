const express = require('express');
const { authenticate, requireRoles } = require('../middlewares/auth');
const commentController = require('../controllers/commentController');

const router = express.Router();

// Users add and view comments
router.post('/', authenticate, requireRoles('user', 'admin', 'publisher'), commentController.addComment);
router.get('/work/:workId', commentController.getCommentsForWork);

// Admin view/delete any; publisher view for own works
router.get('/admin', authenticate, requireRoles('admin'), commentController.getAllComments);
router.get('/publisher', authenticate, requireRoles('publisher'), commentController.getCommentsForPublisherWorks);
router.delete('/:id', authenticate, requireRoles('admin'), commentController.deleteComment);

module.exports = router;


