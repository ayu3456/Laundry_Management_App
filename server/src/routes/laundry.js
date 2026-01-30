const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
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
router.post(
    '/notify',
    protect,
    authorize('admin'),
    [
        body('studentId').isMongoId().withMessage('Invalid student ID'),
        body('message').notEmpty().withMessage('Message cannot be empty'),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    notifyStudent
);


// Student Routes
router.post(
    '/dropoff',
    protect,
    authorize('student'),
    [
        body('clothesCount').isInt({ min: 1, max: 10 }).withMessage('Clothes count must be between 1 and 10'),
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    dropOffClothes
);
router.get('/my-history', protect, authorize('student'), getMyHistory);
router.put('/receive/:id', protect, authorize('student'), markReceived);

// Catch-all for /api/laundry/* subpaths
router.use((req, res) => {
    console.log(`❌ Laundry Router Miss: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Endpoint not found in laundry router', path: req.url });
});

module.exports = router;
