const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: './config/.env' });

const app = express();

// Middleware parsing rules
app.use(express.json());

// MongoDB Cloud Atlas Connection Architecture
const dbURI = process.env.MONGO_URI;
mongoose.connect(dbURI)
  .then(() => console.log('🛡️ MongoDB Atlas cloud database connected successfully.'))
  .catch(err => console.error('❌ Database connection failure:', err));

// ========================================================
//  PRODUCTION STATIC ROUTING (SERVES REACT FRONTEND)
// ========================================================

// Instruct Express to serve the static files from the React build directory
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Example API Endpoint Route
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: "Online", platform: "Microsoft Azure" });
});

// Wildcard Route: Any request that doesn't match an API endpoint falls back to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Azure App Service dynamically injects the runtime port via process.env.PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Production server running on engine port ${PORT}`);
});
