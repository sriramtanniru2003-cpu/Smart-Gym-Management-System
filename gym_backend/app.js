require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Routes
const memberRoutes = require('./routes/member.routes');
const trainerRoutes = require('./routes/trainer.routes');
const classRoutes = require('./routes/class.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// ========================
// 🔍 DEBUG MIDDLEWARE
// ========================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ========================
// ✅ ROUTE DEBUGGING
// ========================

// Test attendance routes directly
app.get('/api/test-attendance', (req, res) => {
  console.log('Testing attendance routes...');
  
  // Import attendance controller to check if functions exist
  try {
    const attendanceController = require('./controllers/attendance.controller');
    const functions = Object.keys(attendanceController);
    
    res.json({
      success: true,
      message: 'Attendance controller loaded',
      availableFunctions: functions,
      hasGenerateQRCode: functions.includes('generateQRCode'),
      hasGenerateTrainerQRCode: functions.includes('generateTrainerQRCode'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Error loading attendance controller',
      error: error.message
    });
  }
});

// Test the specific generate-qr endpoint
app.post('/api/test-generate-qr', (req, res) => {
  console.log('Test generate QR endpoint hit');
  res.json({
    success: true,
    message: 'This is a test endpoint for generate-qr',
    data: { qrType: req.body.qrType },
    timestamp: new Date().toISOString()
  });
});

// Test all available routes
app.get('/api/all-routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Routes registered via router
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: middleware.regexp.toString().replace('/^', '').replace('\\/?(?=\\/|$)/i', '') + handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    totalRoutes: routes.length,
    routes: routes,
    timestamp: new Date().toISOString()
  });
});

// ========================
// ✅ API ROUTES
// ========================
console.log('Mounting routes...');

app.use('/api/member', memberRoutes);
console.log('✓ Member routes mounted at /api/member');

app.use('/api/trainer', trainerRoutes);
console.log('✓ Trainer routes mounted at /api/trainer');

app.use('/api/classes', classRoutes);
console.log('✓ Class routes mounted at /api/classes');

app.use('/api/attendance', attendanceRoutes);
console.log('✓ Attendance routes mounted at /api/attendance');

app.use('/api/auth', authRoutes);
console.log('✓ Auth routes mounted at /api/auth');

// ========================
// ✅ TEST ROUTES
// ========================

// Test all mounted routes
app.get('/api/check-routes', (req, res) => {
  res.json({
    success: true,
    routes: {
      attendance: {
        base: '/api/attendance',
        endpoints: [
          'POST /generate-qr',
          'POST /mark-qr', 
          'POST /trainer/gym-visit',
          'POST /trainer/personal-training',
          'GET /trainer/today-status',
          'GET /trainer/members',
          'GET /trainer/stats',
          'GET /debug-routes'  // Added this
        ]
      },
      classes: '/api/classes',
      member: '/api/member',
      trainer: '/api/trainer',
      auth: '/api/auth'
    },
    serverTime: new Date().toISOString()
  });
});

// Simple test
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Gym Management System API',
        version: '1.0.0',
        endpoints: {
            test: '/api/test',
            checkRoutes: '/api/check-routes',
            testAttendance: '/api/test-attendance',
            testGenerateQR: '/api/test-generate-qr (POST)',
            allRoutes: '/api/all-routes'
        }
    });
});

// ========================
// ✅ 404 HANDLER
// ========================
app.use('*', (req, res) => {
  console.log(`404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    suggestions: [
      'Check /api/check-routes for available endpoints',
      'Check /api/all-routes for complete route list',
      'Verify your axios baseURL configuration'
    ]
  });
});

// ========================
// ✅ ERROR HANDLER
// ========================
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================
// ✅ START SERVER
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Test URLs:`);
  console.log(`   • http://localhost:${PORT}/api/test`);
  console.log(`   • http://localhost:${PORT}/api/check-routes`);
  console.log(`   • http://localhost:${PORT}/api/test-attendance`);
});