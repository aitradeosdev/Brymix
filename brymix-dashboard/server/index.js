const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const apiKeyRoutes = require('./routes/apiKeys');
const twoFactorRoutes = require('./routes/twoFactor');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FASTAPI_URL || "http://localhost:8000"]
    }
  }
}));

// Rate limiting - more lenient in development
const rateLimitMax = process.env.NODE_ENV === 'development' 
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
  : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: rateLimitMax,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authRateLimitMax = process.env.NODE_ENV === 'development'
  ? parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 50
  : parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5;

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: authRateLimitMax,
  message: 'Too many authentication attempts, please try again later.',
});

// Middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Dynamic CORS configuration
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : (process.env.NODE_ENV === 'production' 
      ? ['https://brymix.vercel.app'] 
      : ['http://localhost:3000', 'http://127.0.0.1:3000']);

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection with security options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: process.env.NODE_ENV === 'development' ? 5 : 10,
  serverSelectionTimeoutMS: process.env.NODE_ENV === 'development' ? 10000 : 5000,
  socketTimeoutMS: 45000,
};

mongoose.connect(process.env.MONGODB_URI, mongoOptions)
.then(() => {
  console.log('✅ MongoDB connected');
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Development mode: Enhanced logging enabled');
    mongoose.set('debug', true);
  }
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/2fa', twoFactorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  // Enhanced error logging in development
  if (process.env.NODE_ENV === 'development') {
    console.error('\n=== ERROR DETAILS ===');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('Request URL:', req.url);
    console.error('Request Method:', req.method);
    console.error('Request Headers:', req.headers);
    console.error('==================\n');
  } else {
    console.error('Error:', err.message);
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Brymix Dashboard Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔧 Development Mode Features:`);
      console.log(`   • Enhanced error logging`);
      console.log(`   • MongoDB debug mode`);
      console.log(`   • Relaxed rate limiting (${rateLimitMax} req/15min)`);
      console.log(`   • CORS origins: ${corsOrigins.join(', ')}`);
      console.log(`   • API accessible at: http://localhost:${PORT}/api`);
      console.log(`   • Health check: http://localhost:${PORT}/api/health\n`);
    }
  });
}

// Export the app for Vercel
module.exports = app;