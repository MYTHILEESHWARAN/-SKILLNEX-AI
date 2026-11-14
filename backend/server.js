/**
 * SKILLNEX AI — Backend Server
 * "Learn Smarter. Grow Faster. Achieve Further."
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const aiRoutes = require('./routes/aiRoutes');
const orchestrationRoutes = require('./routes/orchestrationRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const progressRoutes = require('./routes/progressRoutes');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ── Database Connection ──
connectDB();

// ── Security & Core Middlewares ──
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Root & Health Check Endpoints ──
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'SKILLNEX AI API',
    tagline: 'Learn Smarter. Grow Faster. Achieve Further.',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    environment: NODE_ENV,
    database: {
      status: dbState,
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host || null
    }
  });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/orchestration', orchestrationRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/progress', progressRoutes);

// ── 404 Route Not Found Handler ──
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      code: 'RESOURCE_NOT_FOUND'
    }
  });
});

// ── Global Error Handling Middleware ──
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${new Date().toISOString()} - ${err.message}`);
  if (NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_SERVER_ERROR',
      ...(NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// ── Server Activation ──
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 SKILLNEX AI Backend running in ${NODE_ENV} mode`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});

// Handle server startup errors (e.g., port conflicts)
server.on('error', (err) => {
  if (err.code === 'EACCES') {
    console.error(`❌ Port ${PORT} requires elevated privileges or is reserved by Windows Hyper-V/WinNAT.`);
    console.error(`💡 Try changing PORT in .env to 5050 or 8080.`);
  } else if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error(`💡 Free up port ${PORT} or specify a different PORT in .env.`);
  } else {
    console.error(`❌ Server error: ${err.message}`);
  }
  process.exit(1);
});

// ── Graceful Shutdown ──
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
