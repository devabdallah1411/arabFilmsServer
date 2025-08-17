const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const initAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Replace with your admin email
        const adminEmail = 'mettuo@gmail.com';  // Change this to your admin email
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (existingAdmin) {
            // Update role if user exists
            existingAdmin.role = 'admin';
            await existingAdmin.save();
            console.log('Existing user updated to admin');
        } else {
            // Create new admin user
            const adminUser = new User({
                username: 'admin',
                email: adminEmail,
                password: 'mettuo1289',  // Change this to a secure password
                role: 'admin'
            });
            await adminUser.save();
            console.log('Admin user created successfully');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
};

initAdmin();
