const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
    dropOffClothes, 
    getMyHistory, 
    markReceived, 
    getAllRecords, 
    notifyStudent,
    getStats
} = require('../controllers/laundryController');

router.post('/dropoff', protect, authorize('student'), dropOffClothes);
router.get('/my-history', protect, authorize('student'), getMyHistory);
router.put('/receive/:id', protect, authorize('student'), markReceived);

// Admin Routes (Direct paths to avoid req.url stripping issues)
router.get('/admin/stats', protect, authorize('admin'), getStats);
router.get('/admin/all', protect, authorize('admin'), getAllRecords);
router.post('/notify', protect, authorize('admin'), notifyStudent);

// Fallthrough logger for laundry router
router.all('(.*)', (req, res) => {
    console.log(`❌ Laundry Router 404 Fallthrough: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        error: 'Endpoint not found in Laundry Router',
        requestedPath: req.originalUrl
    });
});

module.exports = router;
