const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

const seedAdmin = async () => {
    try {
        await User.deleteOne({ email: 'admin@university.edu' }); // Clean old if exists
        
        const admin = new User({
            name: 'System Admin',
            rollNumber: 'ADMIN001',
            email: 'admin@university.edu',
            password: 'adminpassword123', // Will be hashed by pre-save
            role: 'admin',
            hostel: 'N/A',
            room: 'N/A'
        });

        await admin.save();
        console.log('Admin user created successfully');
        console.log('Email: admin@university.edu');
        console.log('Password: adminpassword123');
        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
