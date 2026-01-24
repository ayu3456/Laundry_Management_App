const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PRE-FLIGHT DIAGNOSTIC: Guaranteed JSON for /api/test
app.get('/api/test-direct', (req, res) => {
    res.json({ message: 'Success! Root Express instance is handling /api requests.', route: '/api/test-direct' });
});

// 1. Request Logger (MUST be first)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// 2. Immediate Diagnostic Routes
app.get('/api/ping', (req, res) => res.json({ status: 'server-is-alive', time: new Date() }));

// 3. Mount Laundry Routes Early
const laundryRoutes = require('./routes/laundry');
console.log('Mounting Laundry Routes at /api/laundry');
app.use('/api/laundry', laundryRoutes);

// 4. Auth Routes
app.use('/api/auth', require('./routes/auth'));

// 5. Catch-all for undefined API routes (MUST return JSON, not HTML)
app.use('/api', (req, res) => {
    console.log(`❌ 404 - Global API Catch-all: ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: 'API Endpoint Not Found',
        method: req.method,
        url: req.url,
        instruction: 'If this is a valid route, ensure it is registered ABOVE this handler in src/index.js'
    });
});

// 6. Production Static Assets
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const distPath = path.join(__dirname, '../../client/dist');
  console.log(`Serving static assets from: ${distPath}`);
  app.use(express.static(distPath));

  // Express 5 syntax for catch-all: (.*)
  app.get('(.*)', (req, res, next) => {
    // If it is an API call that leaked through, skip to 404 handler
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// 7. Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 UNHANDLED ERROR:', err);
    // Explicitly return JSON for ALL errors
    res.status(err.status || 500).json({ 
        error: 'Server Error', 
        message: err.message,
        path: req.url 
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // Database connection is async, move inside listen or handle properly
  console.log('Connecting to MongoDB...');
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/laundry-app')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ Could not connect to MongoDB:', err));

  console.log(`-----------------------------------------`);
  console.log(`🚀 Laundry Server Ready on Port ${PORT}`);
  console.log(`📡 Ping: http://localhost:${PORT}/api/ping`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/laundry/admin/stats`);
  console.log(`-----------------------------------------`);
});
