const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const authenticate = require('../middlewares/auth/authenticate');
const bcrypt = require('bcryptjs'); // You'll need to install: npm install bcryptjs

// ============================
// AUTH ROUTES
// ============================

// Signup → members + trainers
router.post('/signup', AuthController.signup);

// Login → both collections (Member + Trainer)
router.post('/login', AuthController.login);

// ============================
// PASSWORD MANAGEMENT ROUTES
// ============================

// Change password (for authenticated users)
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role; // 'member' or 'trainer'

    console.log('🔑 Password change request for:', { userId, userRole });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Import models dynamically based on role
    let UserModel;
    if (userRole === 'member') {
      UserModel = require('../models/Member');
    } else if (userRole === 'trainer') {
      UserModel = require('../models/Trainer');
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user role' 
      });
    }

    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password is incorrect' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log('✅ Password updated successfully for:', user.email);

    res.json({ 
      success: true, 
      message: 'Password updated successfully' 
    });

  } catch (error) {
    console.error('💥 Password change error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while changing password' 
    });
  }
});

// ============================
// FORGOT PASSWORD ROUTES
// ============================

// Request password reset (send email with reset link)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check in both Member and Trainer collections
    const Member = require('../models/Member');
    const Trainer = require('../models/Trainer');
    
    let user = await Member.findOne({ email });
    let userType = 'member';
    
    if (!user) {
      user = await Trainer.findOne({ email });
      userType = 'trainer';
    }

    if (!user) {
      // For security, don't reveal if email exists or not
      return res.json({ 
        success: true, 
        message: 'If your email exists, you will receive a reset link' 
      });
    }

    // Generate reset token (simple version - in production use JWT with short expiry)
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
    
    // Store reset token in user document (with expiry - 1 hour)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a real app, send email with reset link
    // For now, just return the token (for development)
    console.log('📧 Password reset token for', email, ':', resetToken);

    res.json({ 
      success: true, 
      message: 'Password reset link sent (check console for token in development)',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('💥 Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Check in both collections
    const Member = require('../models/Member');
    const Trainer = require('../models/Trainer');
    
    let user = await Member.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      user = await Trainer.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });
    }

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('✅ Password reset successfully for:', user.email);

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });

  } catch (error) {
    console.error('💥 Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});


router.get('/me', authenticate, AuthController.getCurrentUser);

module.exports = router;