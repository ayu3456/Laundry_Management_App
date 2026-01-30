const LaundryRecord = require('../models/LaundryRecord');
const User = require('../models/User');
const nodemailer = require('nodemailer');

let transporter = null; // Initialize to null

async function createTransporter() {
    if (transporter) return transporter; // Reuse existing transporter

    try {
        // Use environment variables for production/development
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ EMAIL_USER or EMAIL_PASS environment variables are not set.');
            // Fallback to test account if env vars are missing
            const testAccount = await nodemailer.createTestAccount();
            console.log('Ethereal Email Configured (fallback to test account):');
            console.log('User:', testAccount.user);
            console.log('Pass:', testAccount.pass);
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
        } else {
            // Use provided environment variables
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email', // Assuming Ethereal for testing, can be configured via env var
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
        }
        return transporter;
    } catch (err) {
        console.error('Failed to create email transporter:', err);
        throw new Error('Email service unavailable'); // Re-throw for higher-level error handling
    }
}
createTransporter(); // Initialize transporter on startup

// @desc    Submit clothes
// @route   POST /api/laundry/dropoff
// @access  Private (Student)
exports.dropOffClothes = async (req, res) => {
    try {
        const { clothesCount } = req.body;

        if (clothesCount > 10) {
            return res.status(400).json({ error: 'Maximum 10 clothes allowed per submission.' });
        }

        const existingRecord = await LaundryRecord.findOne({
            studentId: req.user.id,
            status: 'PENDING'
        });

        if (existingRecord) {
            return res.status(400).json({ error: 'You already have a pending laundry request. Please collect it first.' });
        }
        
        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 3);

        const record = new LaundryRecord({
            studentId: req.user.id,
            clothesCount,
            returnDate
        });

        await record.save();
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get logged-in user's laundry history
// @route   GET /api/laundry/my-history
// @access  Private (Student)
exports.getMyHistory = async (req, res) => {
    try {
        const records = await LaundryRecord.find({ studentId: req.user.id })
            .sort({ depositDate: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Mark clothes as received
// @route   PUT /api/laundry/receive/:id
// @access  Private (Student)
exports.markReceived = async (req, res) => {
    try {
        const record = await LaundryRecord.findOne({ 
            _id: req.params.id, 
            studentId: req.user.id 
        });

        if (!record) {
            return res.status(404).json({ error: 'Record not found' });
        }

        record.status = 'RECEIVED';
        record.receivedDate = new Date();
        await record.save();

        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Get all records with pagination
// @route   GET /api/laundry/admin/all
// @access  Private (Admin)
exports.getAllRecords = async (req, res) => {
    try {
        const { status, rollNumber, page = 1, limit = 10 } = req.query;
        const parsedPage = parseInt(page);
        const parsedLimit = parseInt(limit);

        let pipeline = [];

        // Stage 1: Initial match for status if provided
        if (status) {
            pipeline.push({ $match: { status } });
        }

        // Stage 2: Populate student data
        pipeline.push({
            $lookup: {
                from: 'users', // The collection name in MongoDB
                localField: 'studentId',
                foreignField: '_id',
                as: 'studentInfo'
            }
        });

        // Stage 3: Deconstruct the studentInfo array
        pipeline.push({ $unwind: '$studentInfo' });

        // Stage 4: Match for rollNumber if provided, after population
        if (rollNumber) {
            pipeline.push({
                $match: {
                    'studentInfo.rollNumber': { $regex: new RegExp(rollNumber, 'i') }
                }
            });
        }

        // Stage 5: Sort records
        pipeline.push({ $sort: { depositDate: -1 } });

        // Stage 6: Calculate total count for pagination
        const totalRecords = await LaundryRecord.aggregate([
            ...pipeline, // Apply all filters before counting
            { $count: 'total' }
        ]);
        const total = totalRecords.length > 0 ? totalRecords[0].total : 0;
        const pages = Math.ceil(total / parsedLimit);

        // Stage 7: Apply skip and limit for pagination
        pipeline.push({ $skip: (parsedPage - 1) * parsedLimit });
        pipeline.push({ $limit: parsedLimit });

        // Stage 8: Project desired fields (optional, but good practice)
        pipeline.push({
            $project: {
                _id: 1,
                studentId: '$studentInfo',
                clothesCount: 1,
                depositDate: 1,
                returnDate: 1,
                receivedDate: 1,
                status: 1
            }
        });

        const records = await LaundryRecord.aggregate(pipeline);

        res.json({
            records: records,
            pagination: {
                total,
                page: parsedPage,
                pages
            }
        });
    } catch (error) {
        console.error('SERVER ERROR (getAllRecords):', error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Notify student about overdue laundry
// @route   POST /api/laundry/notify
// @access  Private (Admin)
exports.notifyStudent = async (req, res) => {
    try {
        const { studentId, message } = req.body;
        
        // Find the student and their latest pending laundry record
        const user = await User.findById(studentId);
        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const laundryRecord = await LaundryRecord.findOne({ studentId: studentId, status: 'PENDING' });
        if (!laundryRecord) {
            return res.status(404).json({ error: 'No pending laundry record found for this student.' });
        }

        // Check if the record is actually overdue
        const now = new Date();
        const returnDate = new Date(laundryRecord.returnDate);
        if (now <= returnDate) {
            return res.status(400).json({ error: 'Laundry is not yet overdue.' });
        }

        console.log(`Sending overdue email reminder to ${user.email}`);
        
        const mailTransporter = await createTransporter();
        if (!mailTransporter) {
            return res.status(500).json({ error: 'Email service not configured.' });
        }

        const info = await mailTransporter.sendMail({
            from: '"Laundry Admin" <admin@university.edu>',
            to: user.email,
            subject: 'Overdue Laundry Notification',
            text: message
        });

        console.log(`Email sent: ${info.messageId}`);
        if (nodemailer.getTestMessageUrl(info)) {
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }

        res.json({ message: 'Overdue notification sent successfully' });
    } catch (error) {
        console.error('Notification error:', error);
        res.status(500).json({ error: error.message || 'Failed to send notification' });
    }
};
// @desc    Get dashboard statistics
// @route   GET /api/laundry/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
    try {
        console.log('--- Generating Dashboard Stats ---');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch counts with explicit status strings
        const totalPending = await LaundryRecord.countDocuments({ status: 'PENDING' });
        
        const overdueCount = await LaundryRecord.countDocuments({
            status: 'PENDING',
            returnDate: { $lt: new Date() }
        });

        const collectedToday = await LaundryRecord.countDocuments({
            status: 'RECEIVED',
            receivedDate: { $gte: today }
        });

        const dropoffsToday = await LaundryRecord.countDocuments({
            depositDate: { $gte: today }
        });

        // Debug: Total records in DB
        const debugTotal = await LaundryRecord.countDocuments({});

        const statsData = {
            totalPending,
            overdueCount,
            collectedToday,
            dropoffsToday
        };

        console.log(`Stats DB Debug: Pending=${totalPending}, Total=${debugTotal}, DroppedToday=${dropoffsToday}`);
        console.log('Stats calculated successfully:', statsData);
        res.json(statsData);
    } catch (error) {
        console.error('SERVER ERROR (getStats):', error);
        res.status(500).json({ error: error.message });
    }
};
