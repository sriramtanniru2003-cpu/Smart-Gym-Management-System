const bcrypt = require('bcrypt');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const { signToken } = require('../utils/jwt');

// ========================================
// SIGNUP with role-based & admin passkey
// ========================================
exports.signup = async (req, res) => {
    try {
        const { name, email, password, role, phone, adminPasskey } = req.body;

        // Validation
        if (!name || !email || !password || !role || !phone) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        // Check for existing user
        const existingUser = await Member.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already registered' 
            });
        }

        // Prepare user data WITH PLAIN TEXT PASSWORD (middleware will hash it)
        const userData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password, // PLAIN TEXT - middleware will hash it
            role: role.toLowerCase(),
            phone: phone.trim()
        };

        // Add role-specific fields
        if (role === 'trainer') {
            userData.specialization = '';
            userData.experience = 0;
            userData.bio = '';
            userData.address = '';
            userData.startDate = new Date();
            userData.availability = [];
        }

        if (role === 'member') {
            userData.startDate = new Date();
            userData.membershipType = '';
        }

        // Admin validation
        if (role === 'admin') {
            if (!adminPasskey || adminPasskey !== process.env.ADMIN_PASSKEY) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Invalid admin passkey' 
                });
            }
        }

        // Create user
        const user = await Member.create(userData);

        // Generate token
        const token = signToken({ 
            id: user._id, 
            role: user.role, 
            email: user.email,
            name: user.name 
        });

        // Response data
        const responseData = {
            id: user._id, 
            name: user.name, 
            email: user.email,
            role: user.role, 
            phone: user.phone
        };

        // Add role-specific data
        if (role === 'trainer') {
            responseData.specialization = user.specialization;
            responseData.experience = user.experience;
        }

        if (role === 'member') {
            responseData.membershipType = user.membershipType;
        }

        const messages = {
            'admin': 'Admin account created successfully',
            'trainer': 'Trainer account created successfully',
            'member': 'Member account created successfully'
        };
        
        return res.status(201).json({ 
            success: true,
            message: messages[role] || 'Account created successfully',
            token, 
            user: responseData
        });

    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration' 
        });
    }
};

// ========================================
// LOGIN with email and password
// ========================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        // Check ONLY Member collection (since all users are here)
        let user = await Member.findOne({ email: email.toLowerCase() });
        
        // If not found, check if it's an old trainer in Trainer collection
        if (!user) {
            const oldTrainer = await Trainer.findOne({ email: email.toLowerCase() });
            
            if (oldTrainer) {
                // Migrate to Member collection
                user = new Member({
                    _id: oldTrainer._id,
                    name: oldTrainer.name,
                    email: oldTrainer.email,
                    password: oldTrainer.password, // Already hashed
                    role: 'trainer',
                    phone: oldTrainer.phone || '',
                    specialization: oldTrainer.specialization || '',
                    experience: oldTrainer.experience || 0,
                    startDate: oldTrainer.startDate || new Date(),
                    bio: oldTrainer.bio || '',
                    address: oldTrainer.address || ''
                });
                
                await user.save();
            }
        }

        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        // Check if account is locked
        if (user.isAccountLocked && user.isAccountLocked()) {
            const minutesLeft = user.getLockTimeRemaining ? user.getLockTimeRemaining() : 30;
            return res.status(403).json({ 
                success: false,
                message: `Account is locked. Try again in ${minutesLeft} minutes.` 
            });
        }

        // Verify password
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
            if (user.recordFailedLogin) await user.recordFailedLogin();
            const attemptsLeft = 5 - (user.failedLoginAttempts || 0);
            const message = attemptsLeft > 0 
                ? `Invalid password. ${attemptsLeft} attempts remaining.`
                : 'Account locked for 30 minutes due to too many failed attempts.';
            
            return res.status(401).json({ success: false, message });
        }

        // Reset failed login attempts on successful login
        if (user.resetFailedLogins) await user.resetFailedLogins();

        // Generate token
        const token = signToken({ 
            id: user._id, 
            role: user.role, 
            email: user.email, 
            name: user.name 
        });

        // Prepare user data
        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone || ''
        };

        // Add role-specific data
        if (user.role === 'member' && user.membershipType) {
            userData.membershipType = user.membershipType;
        }

        if (user.role === 'trainer') {
            userData.specialization = user.specialization || '';
            userData.experience = user.experience || 0;
            userData.bio = user.bio || '';
            userData.address = user.address || '';
        }

        if (user.role === 'admin') {
            userData.isSuperAdmin = user.isSuperAdmin || false;
            userData.permissions = user.permissions || [];
        }
        
        return res.json({ 
            success: true,
            message: 'Login successful', 
            token, 
            user: userData 
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
};

// ========================================
// CHANGE PASSWORD (Universal for all roles)
// ========================================
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { currentPassword, newPassword } = req.body;

        // Validation
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

        // Find user based on role
        let user;
        if (userRole === 'trainer') {
            user = await Trainer.findById(userId);
        } else {
            user = await Member.findById(userId);
        }

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if account is locked
        if (user.isAccountLocked && user.isAccountLocked()) {
            const minutesLeft = user.getLockTimeRemaining ? user.getLockTimeRemaining() : 30;
            return res.status(403).json({ 
                success: false, 
                message: `Account is locked. Try again in ${minutesLeft} minutes.` 
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            // Record failed attempt
            if (user.recordFailedLogin) {
                await user.recordFailedLogin();
            }
            
            const attemptsLeft = 5 - (user.failedLoginAttempts || 0);
            return res.status(401).json({ 
                success: false, 
                message: `Current password is incorrect. ${attemptsLeft > 0 ? attemptsLeft + ' attempts left' : 'Account locked for 30 minutes'}` 
            });
        }

        // Check if new password is same as old password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password cannot be the same as current password' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        user.password = hashedPassword;
        user.lastPasswordChange = new Date();
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        
        await user.save();

        return res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
};

// ========================================
// GET CURRENT USER PROFILE
// ========================================
exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let user;
        if (userRole === 'trainer') {
            user = await Trainer.findById(userId)
                .select('-password -passwordResetToken -passwordResetExpires');
        } else {
            user = await Member.findById(userId)
                .select('-password -passwordResetToken -passwordResetExpires')
                .populate('trainer', 'name email specialization');
        }

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Add computed properties for members
        const userData = user.toObject();
        
        if (userRole === 'member') {
            userData.isMembershipActive = user.isMembershipActive ? user.isMembershipActive() : false;
            userData.membershipDaysRemaining = user.getMembershipDaysRemaining ? user.getMembershipDaysRemaining() : 0;
            userData.isPasswordExpired = user.isPasswordExpired ? user.isPasswordExpired() : false;
        }

        // Add account status
        userData.isAccountLocked = user.isAccountLocked ? user.isAccountLocked() : false;
        userData.failedLoginAttempts = user.failedLoginAttempts || 0;

        return res.json({
            success: true,
            user: userData
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error. Please try again later.' 
        });
    }
};

// ========================================
// LOGOUT (Client-side only - just return success)
// ========================================
exports.logout = async (req, res) => {
    try {
        return res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error during logout' 
        });
    }
};

// ========================================
// FORGOT PASSWORD REQUEST
// ========================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }

        // Find user in both collections
        const user = await Member.findOne({ email: email.toLowerCase() }) || 
                     await Trainer.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Don't reveal that user doesn't exist for security
            return res.json({
                success: true,
                message: 'If an account exists with this email, you will receive a password reset link'
            });
        }

        // Generate reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour

        // Save reset token to user
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(resetTokenExpiry);
        await user.save();

        return res.json({
            success: true,
            message: 'Password reset instructions sent to your email'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again later.' 
        });
    }
};

// ========================================
// RESET PASSWORD WITH TOKEN
// ========================================
exports.resetPassword = async (req, res) => {
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

        // Find user with valid reset token
        const user = await Member.findOne({ 
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        }) || await Trainer.findOne({ 
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid or expired reset token' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password and clear reset token
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.lastPasswordChange = new Date();
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
        
        await user.save();

        return res.json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Server error. Please try again later.' 
        });
    }
};