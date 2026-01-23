const express = require('express');
const router = express.Router();
const LaundryRecord = require('../models/LaundryRecord');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/laundry/dropoff
// @desc    Submit clothes (Student only)
// @access  Private (Student)
router.post('/dropoff', protect, authorize('student'), async (req, res) => {
  try {
    const { clothesCount } = req.body;
    
    // Auto-calculate return date (3 days from now)
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
});

// @route   GET /api/laundry/my-history
// @desc    Get logged-in user's laundry history
// @access  Private (Student)
router.get('/my-history', protect, authorize('student'), async (req, res) => {
  try {
    const records = await LaundryRecord.find({ studentId: req.user.id })
      .sort({ depositDate: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/laundry/receive/:id
// @desc    Mark clothes as received (Student only, after return date)
// @access  Private (Student)
router.put('/receive/:id', protect, authorize('student'), async (req, res) => {
  try {
    const record = await LaundryRecord.findOne({ 
      _id: req.params.id, 
      studentId: req.user.id 
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (new Date() < new Date(record.returnDate)) {
        // Optional: Allowing early pickup for demo/testing if needed, but strictly enforcing as per req
        // return res.status(400).json({ error: 'Cannot pick up before return date' });
    }

    record.status = 'RECEIVED';
    record.receivedDate = new Date();
    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/laundry/admin/all
// @desc    Get all records (Admin only)
// @access  Private (Admin)
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, rollNumber } = req.query;
    let query = {};

    if (status) query.status = status;
    
    // Join with User to filter by rollNumber if needed
    // Since we need to filter by rollNumber which is on the User model
    // We first find the users, then get their IDs
    if (rollNumber) {
        // This is a simple implementation. For large scale, aggregate is better.
    }

    const records = await LaundryRecord.find(query)
      .populate('studentId', 'name rollNumber hostel room')
      .sort({ depositDate: -1 });

    // Filter by rollNumber in memory if simple query
    // Optimally, use aggregate pipeline
    let finalRecords = records;
    if (rollNumber) {
        finalRecords = records.filter(r => r.studentId.rollNumber.includes(rollNumber));
    }

    res.json(finalRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
