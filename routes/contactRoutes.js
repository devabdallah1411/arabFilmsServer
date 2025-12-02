const express = require('express');
const contactController = require('../controllers/contactController');
const { authenticate, requireRoles } = require('../middlewares/auth');

const router = express.Router();

// Public route - no authentication required
router.post('/', contactController.submitContactForm);

// Admin routes - authentication required
router.get('/', authenticate, requireRoles('admin'), contactController.getAllContactMessages);
router.get('/unread', authenticate, requireRoles('admin'), contactController.getUnreadContactMessages);
router.get('/:id', authenticate, requireRoles('admin'), contactController.getContactMessageById);
router.patch('/:id/read', authenticate, requireRoles('admin'), contactController.markAsRead);
router.delete('/:id', authenticate, requireRoles('admin'), contactController.deleteContactMessage);

module.exports = router;
