const sendEmail = require('../utils/sendEmail');

exports.submitContactForm = async (req, res, next) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                message: 'Name, email, and message are required'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Invalid email format'
            });
        }

        // Send email
        await sendEmail({ name, email, phone, message });

        res.status(200).json({
            message: 'Thank you for contacting us! We will get back to you soon.'
        });
    } catch (err) {
        console.error('Contact form error:', err);
        next(err);
    }
};
