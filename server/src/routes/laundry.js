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
router.get('/admin/stats', protect, authorize('admin'), getStats);
router.get('/admin/all', protect, authorize('admin'), getAllRecords);
router.post('/notify', protect, authorize('admin'), notifyStudent);

module.exports = router;
