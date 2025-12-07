// routes/class.routes.js
const express = require('express');
const router = express.Router();

const ClassController = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateClass } = require('../middlewares/validators/validateClass');

// -------------------
//  GET CLASSES FOR LOGGED-IN member
// -------------------

// In class.routes.js, add these test routes:

// Test 1: Route without controller (should work)
router.get('/test-no-controller', (req, res) => {
  console.log('✅ Test route without controller called');
  res.json({ message: 'Route without controller works!' });
});

// Test 2: Route with controller but no auth (test controller)
router.get('/test-controller-no-auth', ClassController.getAllClasses);

// Test 3: Route with auth but simple response (test auth)
router.get('/test-auth-only', authenticate, (req, res) => {
  console.log('✅ Auth test route called, user:', req.user?.id);
  res.json({ 
    message: 'Auth works!',
    user: req.user 
  });
});

// Test 4: Route with auth and authorize
router.get('/test-auth-authorize', 
  authenticate, 
  authorize('member'), 
  (req, res) => {
    console.log('✅ Auth + Authorize test route called');
    res.json({ 
      message: 'Auth + Authorize works!',
      user: req.user 
    });
  }
);
router.get(
    '/member/my-classes',
    authenticate,
    authorize('member'),
    ClassController.getMyClasses
);

// -------------------
//  ENROLL IN CLASS (member)
// -------------------
router.post(
    '/:id/enroll',
    authenticate,
    authorize('member'),
    ClassController.enrollInClass
);

// -------------------
//  UNENROLL FROM CLASS (member)
// -------------------
router.delete(
    '/:id/unenroll',
    authenticate,
    authorize('member'),
    ClassController.unenrollFromClass
);

// -------------------
//  CREATE CLASS (Admin)
// -------------------
router.post(
    '/',
    authenticate,
    authorize('ADMIN'),
    validateClass,
    ClassController.createClass
);

// -------------------
//  GET ALL CLASSES (Admin, Trainer, member)
// -------------------
router.get(
    '/',
    authenticate,
    ClassController.getAllClasses
);

// -------------------
//  GET A CLASS BY ID
// -------------------
router.get(
    '/:id',
    authenticate,
    ClassController.getClassById
);

// -------------------
//  UPDATE CLASS (Admin)
// -------------------
router.put(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    validateClass,
    ClassController.updateClass
);

// -------------------
//  DELETE CLASS (Admin)
// -------------------
router.delete(
    '/:id',
    authenticate,
    authorize('ADMIN'),
    ClassController.deleteClass
);

module.exports = router;