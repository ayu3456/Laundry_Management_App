const LaundryRecord = require('../models/LaundryRecord');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Setup Nodemailer
let transporter;
async function createTransporter() {
    if (transporter) return transporter;
    try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('Ethereal Email Configured:');
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
        return transporter;
    } catch (err) {
        console.error('Failed to create Ethereal account', err);
    }
}
createTransporter();

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
        let query = {};

        if (status) query.status = status;
        
        // Fetch all matching status first to handle rollNumber filtering (which requires population)
        // In a production app with huge data, we would store rollNumber on LaundryRecord to index and query directly.
        // For this scale, in-memory filtering is acceptable but pagination must apply AFTER filtering.
        
        const records = await LaundryRecord.find(query)
            .populate('studentId', 'name rollNumber hostel room email')
            .sort({ depositDate: -1 });

        // Filter by rollNumber in memory
        let filteredRecords = records;
        if (rollNumber) {
            filteredRecords = records.filter(r => r.studentId && r.studentId.rollNumber && r.studentId.rollNumber.toUpperCase().includes(rollNumber.toUpperCase()));
        }

        // Apply Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

        res.json({
            records: paginatedRecords,
            pagination: {
                total: filteredRecords.length,
                page: Number(page),
                pages: Math.ceil(filteredRecords.length / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// @desc    Notify student about overdue laundry
// @route   POST /api/laundry/notify
// @access  Private (Admin)
exports.notifyStudent = async (req, res) => {
    try {
        const { studentId, message } = req.body;
        const user = await User.findById(studentId);

        if (!user) {
            return res.status(404).json({ error: 'Student not found' });
        }

        console.log(`Sending email to ${user.email}: ${message}`);
        
        const mailTransporter = await createTransporter();
        const info = await mailTransporter.sendMail({
            from: '"Laundry Admin" <admin@university.edu>',
            to: user.email,
            subject: 'Overdue Laundry Notification',
            text: message
        });

        console.log(`Email sent: ${info.messageId}`);
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);

        res.json({ message: 'Notification sent successfully' });
    } catch (error) {
        console.error('Notification error:', error);
        res.status(500).json({ error: 'Failed to send notification' });
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
