const Contact = require('../models/contact');

// Submit contact form (public)
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

        // Save to database
        const contact = await Contact.create({
            name,
            email,
            phone,
            message
        });

        res.status(201).json({
            message: 'Thank you for contacting us! We will get back to you soon.',
            contactId: contact._id
        });
    } catch (err) {
        console.error('Contact form error:', err);
        next(err);
    }
};

// Get all contact messages (admin only)
exports.getAllContactMessages = async (req, res, next) => {
    try {
        const contacts = await Contact.find({})
            .sort({ createdAt: -1 });

        res.json({
            count: contacts.length,
            contacts
        });
    } catch (err) {
        next(err);
    }
};

// Get unread contact messages (admin only)
exports.getUnreadContactMessages = async (req, res, next) => {
    try {
        const contacts = await Contact.find({ isRead: false })
            .sort({ createdAt: -1 });

        res.json({
            count: contacts.length,
            contacts
        });
    } catch (err) {
        next(err);
    }
};

// Get contact message by ID (admin only)
exports.getContactMessageById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findById(id);

        if (!contact) {
            return res.status(404).json({ message: 'Contact message not found' });
        }

        res.json(contact);
    } catch (err) {
        next(err);
    }
};

// Mark contact message as read (admin only)
exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({ message: 'Contact message not found' });
        }

        res.json({
            message: 'Contact message marked as read',
            contact
        });
    } catch (err) {
        next(err);
    }
};

// Delete contact message (admin only)
exports.deleteContactMessage = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({ message: 'Contact message not found' });
        }

        res.status(204).send();
    } catch (err) {
        next(err);
    }
};
