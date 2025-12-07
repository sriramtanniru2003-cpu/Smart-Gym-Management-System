// const express = require('express');
// const router = express.Router();
// const trainerController = require('../controllers/trainer.controller');

// console.log('✅ Loading trainer routes (SIMPLE VERSION)...');

// // ============================
// // ✅ SIMPLE TEMP AUTH
// // ============================
// const simpleAuth = (req, res, next) => {
//   console.log('🔧 Simple auth middleware');
  
//   // Get token from header
//   const token = req.headers.authorization?.replace('Bearer ', '');
  
//   if (!token) {
//     console.log('❌ No token provided');
//     return res.status(401).json({ 
//       success: false, 
//       message: 'No token provided' 
//     });
//   }
  
//   try {
//     // Decode token (no verification for testing)
//     const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
//     console.log('✅ Token payload:', payload);
    
//     // Set user from token
//     req.user = {
//       id: payload.id || payload.userId,
//       role: payload.role || 'trainer',
//       email: payload.email,
//       name: payload.name,
//       phone: payload.phone
//     };
    
//     console.log('✅ User set:', req.user);
//     next();
//   } catch (error) {
//     console.error('❌ Token decode error:', error);
    
//     // For testing, use hardcoded trainer
//     req.user = {
//       id: '692ac0a3e9ee37b569fe96ea',
//       role: 'trainer',
//       email: 'trainer@email.com',
//       name: 'John Trainer'
//     };
    
//     console.log('⚠️ Using test user:', req.user);
//     next();
//   }
// };

// // ============================
// // ✅ TEST ROUTES
// // ============================

// router.get('/test', (req, res) => {
//   console.log('✅ /api/trainer/test called');
//   res.json({ 
//     success: true, 
//     message: 'Trainer API is working!',
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       getProfile: 'GET /me',
//       updateProfile: 'PUT /me',
//       changePassword: 'PUT /me/password',
//       getClasses: 'GET /me/classes'
//     }
//   });
// });

// // Debug endpoint to check token
// router.get('/debug-token', (req, res) => {
//   const token = req.headers.authorization?.replace('Bearer ', '');
  
//   if (!token) {
//     return res.json({
//       success: false,
//       message: 'No token provided'
//     });
//   }
  
//   try {
//     const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
//     return res.json({
//       success: true,
//       hasToken: true,
//       payload: payload,
//       isTrainer: payload.role === 'trainer'
//     });
//   } catch (error) {
//     return res.json({
//       success: false,
//       message: 'Error decoding token',
//       error: error.message
//     });
//   }
// });

// // ============================
// // ✅ TRAINER PROFILE ROUTES
// // ============================

// // Get my profile
// router.get('/me', simpleAuth, trainerController.getMyProfile);

// // Update my profile
// router.put('/me', simpleAuth, trainerController.updateMyProfile);

// // Update password
// router.put('/me/password', simpleAuth, trainerController.updateTrainerPassword);

// // Get my classes
// router.get('/me/classes', simpleAuth, (req, res) => {
//   req.params.id = req.user.id;
//   return trainerController.getTrainerClasses(req, res);
// });

// // ============================
// // ✅ PUBLIC ROUTES
// // ============================

// // Get trainer by ID (public)
// router.get('/:id', trainerController.getTrainerById);

// // Get trainer classes (public)
// router.get('/:id/classes', trainerController.getTrainerClasses);

// // ============================
// // ✅ ADMIN ROUTES (optional - for future)
// // ============================

// // Get all trainers (admin only - commented out for now)
// // router.get('/', simpleAuth, (req, res, next) => {
// //   if (req.user.role !== 'admin') {
// //     return res.status(403).json({ 
// //       success: false, 
// //       message: 'Admin access required' 
// //     });
// //   }
// //   next();
// // }, trainerController.getAllTrainers);

// module.exports = router;


const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainer.controller');

console.log('✅ Loading trainer routes (UPDATED VERSION)...');

// ============================
// ✅ SIMPLE TEMP AUTH
// ============================
const simpleAuth = (req, res, next) => {
  console.log('🔧 Simple auth middleware');
  
  // Get token from header
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }
  
  try {
    // Decode token (no verification for testing)
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    console.log('✅ Token payload:', payload);
    
    // Set user from token
    req.user = {
      id: payload.id || payload.userId,
      role: payload.role || 'trainer',
      email: payload.email,
      name: payload.name,
      phone: payload.phone
    };
    
    console.log('✅ User set:', req.user);
    next();
  } catch (error) {
    console.error('❌ Token decode error:', error);
    
    // For testing, use hardcoded trainer
    req.user = {
      id: '692ac0a3e9ee37b569fe96ea',
      role: 'trainer',
      email: 'trainer@email.com',
      name: 'John Trainer'
    };
    
    console.log('⚠️ Using test user:', req.user);
    next();
  }
};

// ============================
// ✅ ADMIN AUTHORIZATION MIDDLEWARE
// ============================
const adminOnly = (req, res, next) => {
  console.log('🔐 Admin authorization check');
  
  if (req.user.role !== 'admin') {
    console.log('❌ Access denied: Admin role required');
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin role required'
    });
  }
  
  console.log('✅ Admin access granted');
  next();
};

// ============================
// ✅ TEST ROUTES
// ============================

router.get('/test', (req, res) => {
  console.log('✅ /api/trainer/test called');
  res.json({ 
    success: true, 
    message: 'Trainer API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      getProfile: 'GET /me',
      updateProfile: 'PUT /me',
      changePassword: 'PUT /me/password',
      getClasses: 'GET /me/classes',
      adminGetAll: 'GET /admin/all',
      adminUpdate: 'PUT /admin/:id/update'
    }
  });
});

// Debug endpoint to check token
router.get('/debug-token', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.json({
      success: false,
      message: 'No token provided'
    });
  }
  
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return res.json({
      success: true,
      hasToken: true,
      payload: payload,
      isTrainer: payload.role === 'trainer',
      isAdmin: payload.role === 'admin'
    });
  } catch (error) {
    return res.json({
      success: false,
      message: 'Error decoding token',
      error: error.message
    });
  }
});

// ============================
// ✅ TRAINER PROFILE ROUTES
// ============================

// Get my profile (trainer)
router.get('/me', simpleAuth, trainerController.getMyProfile);

// Update my profile (trainer)
router.put('/me', simpleAuth, trainerController.updateMyProfile);

// Update password (trainer)
router.put('/me/password', simpleAuth, trainerController.updateTrainerPassword);

// Get my classes (trainer)
router.get('/me/classes', simpleAuth, (req, res) => {
  req.params.id = req.user.id;
  return trainerController.getTrainerClasses(req, res);
});

// ============================
// ✅ ADMIN TRAINER MANAGEMENT ROUTES
// ============================

// Admin: Get all trainers
router.get('/admin/all', simpleAuth, adminOnly, trainerController.getAllTrainers);

// Admin: Get trainer by ID
router.get('/admin/:id', simpleAuth, adminOnly, trainerController.getTrainerById);

// Admin: Update trainer personal information
router.put('/admin/:id/update', simpleAuth, adminOnly, async (req, res) => {
  try {
    console.log('🎯 Admin updating trainer:', req.params.id);
    console.log('📦 Update data:', req.body);
    
    const trainerId = req.params.id;
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated
    delete updates.password;
    delete updates.role;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    console.log('✅ Filtered updates:', updates);
    
    // Update the trainer
    const updatedTrainer = await trainerController.updateTrainerAdmin(req, res);
    
  } catch (error) {
    console.error('❌ Error in admin trainer update:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating trainer information',
      error: error.message
    });
  }
});

// Admin: Reset trainer password to default
router.put('/admin/:id/reset-password', simpleAuth, adminOnly, async (req, res) => {
  try {
    console.log('🔐 Admin resetting trainer password:', req.params.id);
    
    const trainerId = req.params.id;
    const defaultPassword = 'trainer123'; // Your default password
    
    // Update password to default
    req.body = { newPassword: defaultPassword };
    req.params.id = trainerId;
    
    return trainerController.updateTrainerPassword(req, res);
    
  } catch (error) {
    console.error('❌ Error resetting trainer password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting trainer password',
      error: error.message
    });
  }
});

// Admin: Deactivate/Reactivate trainer
router.put('/admin/:id/toggle-status', simpleAuth, adminOnly, async (req, res) => {
  try {
    console.log('🔘 Admin toggling trainer status:', req.params.id);
    
    // This would update an isActive field in your Member model
    // Since you removed isActive, you can skip this or implement differently
    
    res.json({
      success: true,
      message: 'Trainer status toggle functionality will be implemented soon',
      trainerId: req.params.id
    });
    
  } catch (error) {
    console.error('❌ Error toggling trainer status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling trainer status',
      error: error.message
    });
  }
});

// ============================
// ✅ PUBLIC ROUTES
// ============================

// Get trainer by ID (public)
router.get('/:id', trainerController.getTrainerById);

// Get trainer classes (public)
router.get('/:id/classes', trainerController.getTrainerClasses);

// ============================
// ✅ ADMIN BULK OPERATIONS
// ============================

// Admin: Create new trainer
router.post('/admin/create', simpleAuth, adminOnly, async (req, res) => {
  try {
    console.log('➕ Admin creating new trainer');
    console.log('📦 Trainer data:', req.body);
    
    // Add default password if not provided
    if (!req.body.password) {
      req.body.password = 'trainer123';
    }
    
    // Ensure role is set to trainer
    req.body.role = 'trainer';
    
    // You'll need to create a createTrainer method in your controller
    // For now, redirect to members controller since trainers are in Member collection
    const Member = require('../models/Member');
    const bcrypt = require('bcryptjs');
    
    const trainerData = {
      ...req.body,
      role: 'trainer'
    };
    
    // Hash password
    if (trainerData.password) {
      const salt = await bcrypt.genSalt(10);
      trainerData.password = await bcrypt.hash(trainerData.password, salt);
    }
    
    const newTrainer = new Member(trainerData);
    await newTrainer.save();
    
    // Remove password from response
    const trainerResponse = newTrainer.toObject();
    delete trainerResponse.password;
    
    res.status(201).json({
      success: true,
      message: 'Trainer created successfully',
      data: trainerResponse
    });
    
  } catch (error) {
    console.error('❌ Error creating trainer:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating trainer',
      error: error.message
    });
  }
});

// Admin: Delete trainer
router.delete('/admin/:id/delete', simpleAuth, adminOnly, async (req, res) => {
  try {
    console.log('🗑️ Admin deleting trainer:', req.params.id);
    
    // You'll need to implement this in your controller
    // For now, show a message
    res.json({
      success: true,
      message: 'Trainer delete functionality will be implemented soon',
      trainerId: req.params.id
    });
    
  } catch (error) {
    console.error('❌ Error deleting trainer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting trainer',
      error: error.message
    });
  }
});

module.exports = router;