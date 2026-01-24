const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PRE-FLIGHT DIAGNOSTICS (Guaranteed Responses)
app.get('/test-help', (req, res) => res.send('SERVER_IS_REACHABLE_ON_PORT_3000'));
app.get('/api/test-direct', (req, res) => res.json({ status: 'ok', source: 'root-express' }));

// 1. Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/ping', (req, res) => res.json({ status: 'server-is-alive', time: new Date() }));

// 3. Mount Routes
console.log('--- Registering API Routes ---');
app.use('/api/laundry', require('./routes/laundry'));
app.use('/api/auth', require('./routes/auth'));

// 5. Catch-all for API (If it starts with /api but reached here, it's a 404)
app.use('/api', (req, res) => {
    console.log(`❌ API Route Missing: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'Endpoint not found', path: req.url });
});

// 6. Production Static Assets
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const distPath = path.join(__dirname, '../../client/dist');
  console.log(`Serving static assets from: ${distPath}`);
  app.use(express.static(distPath));

  // Express 5 - Pathless middleware handles all fallthroughs
  app.use((req, res) => {
    // If it is an API call that leaked through, send JSON
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found', path: req.url });
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

// 7. Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 SERVER ERROR:', err);
    res.status(err.status || 500).json({ 
        error: 'Backend Error', 
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
