const express = require('express');
const contactController = require('../controllers/contactController');

const router = express.Router();

// Public route - no authentication required
router.post('/', contactController.submitContactForm);

module.exports = router;
