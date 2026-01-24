const express = require('express');
const request = require('supertest');
const app = express();
app.use(express.json());

// Mock Middleware
const protect = (req, res, next) => { req.user = { role: 'admin' }; next(); };
const authorize = () => (req, res, next) => next();

// Mock Controller
const getStats = (req, res) => res.json({ success: true });

// Routes
const router = express.Router();
router.get('/admin/stats', protect, authorize('admin'), getStats);
app.use('/api/laundry', router);

console.log('--- Router Stack Logic Check ---');
console.log('Path registered:', router.stack[0].route.path);

const testUrl = '/api/laundry/admin/stats';
const matched = router.stack.find(s => s.route && s.route.path === '/admin/stats');
console.log('Matched Route in Router:', !!matched);

// Simulate Express matching logic
const expressPathMatch = (path, routePath) => {
    // Very simplified
    return path.includes(routePath);
}
console.log('Manual check:', expressPathMatch(testUrl, '/admin/stats'));
