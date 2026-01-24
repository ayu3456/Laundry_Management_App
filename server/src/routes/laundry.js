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

// IMPORTANT: Stats must be HIGHER than generic /:id routes
router.get('/admin/stats', protect, authorize('admin'), getStats);
router.get('/admin/all', protect, authorize('admin'), getAllRecords);
router.post('/notify', protect, authorize('admin'), notifyStudent);

// Student Routes
router.post('/dropoff', protect, authorize('student'), dropOffClothes);
router.get('/my-history', protect, authorize('student'), getMyHistory);
router.put('/receive/:id', protect, authorize('student'), markReceived);

// Catch-all for /api/laundry/* subpaths
router.use((req, res) => {
    console.log(`❌ Laundry Router Miss: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Endpoint not found in laundry router', path: req.url });
});

module.exports = router;
