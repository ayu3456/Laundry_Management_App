const mongoose = require('mongoose');
const LaundryRecord = require('./src/models/LaundryRecord');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-app')
    .then(async () => {
        console.log('Connected to DB');
        
        // Find a student
        let student = await User.findOne({ role: 'student' });
        if (!student) {
             console.log('No student found. Creating one...');
             student = await User.create({
                 name: 'Test Overdue Student',
                 rollNumber: 'OVERDUE001',
                 email: 'test@overdue.com',
                 password: 'password123',
                 hostel: 'H1',
                 room: '101'
             });
        }

        // Create Overdue Record (Return date was 7 days ago)
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() - 7);
        
        const depositDate = new Date();
        depositDate.setDate(depositDate.getDate() - 10);

        await LaundryRecord.create({
            studentId: student._id,
            clothesCount: 7,
            depositDate,
            returnDate, // 7 days ago -> Overdue
            status: 'PENDING'
        });

        console.log('Overdue record created successfully.');
        console.log('Student:', student.name);
        console.log('Roll No:', student.rollNumber);
        console.log('Return Date:', returnDate.toDateString());
        
        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
