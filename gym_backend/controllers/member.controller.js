const Member = require('../models/Member');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); 

// Helper function
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

// ---------------------------------------
// ADMIN: GET ALL MEMBERS
// ---------------------------------------
exports.getMembers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', status = '' } = req.query;
        const skip = (page - 1) * limit;
        
        // Build search query - Only get members (role: 'member')
        const query = { role: 'member' };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (status) {
            query.status = status;
        }
        
        // Get members with pagination
        const members = await Member.find(query)
            .select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires')
            .populate('trainer', 'name email specialization')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count
        const total = await Member.countDocuments(query);
        
        res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            data: members
        });
        
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching members' 
        });
    }
};

// ---------------------------------------
// ADMIN: GET SINGLE MEMBER
// ---------------------------------------
exports.getMember = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid member ID format' 
            });
        }
        
        const member = await Member.findOne({ _id: id, role: 'member' })
            .select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires')
            .populate('trainer', 'name email specialization experience bio');
        
        if (!member) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        res.json({
            success: true,
            data: member
        });
        
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching member details' 
        });
    }
};

// ---------------------------------------
// ADMIN: CREATE MEMBER
// ---------------------------------------
exports.createMember = async (req, res) => {
    try {
        const { email, name, password = 'member123', ...otherData } = req.body;
        
        // Validate required fields
        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email and name are required'
            });
        }
        
        // Check if member already exists
        const existingMember = await Member.findOne({ email, role: 'member' });
        if (existingMember) {
            return res.status(400).json({
                success: false,
                message: 'A member with this email already exists'
            });
        }
        
        // Create member data
        const memberData = {
            email,
            name,
            password, // Will be hashed by pre-save middleware
            role: 'member',
            ...otherData
        };
        
        // Set membership dates if membershipType is provided
        if (memberData.membershipType) {
            const startDate = new Date();
            let endDate;
            
            switch (memberData.membershipType.toLowerCase()) {
                case '1 month': 
                case 'monthly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 1);
                    break;
                case '3 months': 
                case 'quarterly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 3);
                    break;
                case '6 months': 
                case 'half-yearly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 6);
                    break;
                case 'annual': 
                case 'yearly':
                    endDate = new Date(startDate);
                    endDate.setFullYear(startDate.getFullYear() + 1);
                    break;
                default: 
                    endDate = null;
            }
            
            memberData.startDate = startDate;
            memberData.endDate = endDate;
        }
        
        // Create new member
        const newMember = new Member(memberData);
        await newMember.save();
        
        // Remove sensitive data from response
        const memberResponse = newMember.toObject();
        delete memberResponse.password;
        delete memberResponse.__v;
        delete memberResponse.failedLoginAttempts;
        delete memberResponse.accountLockedUntil;
        delete memberResponse.passwordResetToken;
        delete memberResponse.passwordResetExpires;
        
        res.status(201).json({
            success: true,
            message: 'Member created successfully',
            data: memberResponse
        });
        
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + err.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error creating member'
        });
    }
};

// ---------------------------------------
// ADMIN: UPDATE MEMBER
// ---------------------------------------
exports.updateMember = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid member ID format' 
            });
        }
        
        // Get updates from request body
        const updates = req.body;
        
        // Remove sensitive fields that shouldn't be updated by admin
        delete updates._id;
        delete updates.createdAt;
        delete updates.updatedAt;
        delete updates.__v;
        delete updates.failedLoginAttempts;
        delete updates.accountLockedUntil;
        delete updates.passwordResetToken;
        delete updates.passwordResetExpires;
        delete updates.role; // Prevent role changes
        
        // If admin wants to reset password
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 10);
            updates.lastPasswordChange = new Date();
            updates.failedLoginAttempts = 0;
            updates.accountLockedUntil = null;
        }
        
        // Handle membership duration if membershipType is updated
        if (updates.membershipType) {
            const startDate = new Date();
            let endDate;
            
            switch (updates.membershipType.toLowerCase()) {
                case '1 month': 
                case 'monthly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 1);
                    break;
                case '3 months': 
                case 'quarterly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 3);
                    break;
                case '6 months': 
                case 'half-yearly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 6);
                    break;
                case 'annual': 
                case 'yearly':
                    endDate = new Date(startDate);
                    endDate.setFullYear(startDate.getFullYear() + 1);
                    break;
                default: 
                    endDate = null;
            }
            
            updates.startDate = startDate;
            updates.endDate = endDate;
        }
        
        // Find and update member
        const member = await Member.findOneAndUpdate(
            { _id: id, role: 'member' },
            { $set: updates },
            { 
                new: true, 
                runValidators: true 
            }
        )
        .select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires')
        .populate('trainer', 'name email specialization');
        
        if (!member) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Member updated successfully',
            data: member
        });
        
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error: ' + err.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error updating member'
        });
    }
};

// ---------------------------------------
// MEMBER: GET PROFILE
// ---------------------------------------
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const member = await Member.findById(userId)
            .select('-password -__v')
            .populate('trainer', 'name email specialization experience bio');
        if (!member) return res.status(404).json({ message: 'Member not found' });
        res.json(member);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ---------------------------------------
// MEMBER: UPDATE PROFILE
// ---------------------------------------
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        if (!userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required. Please login again.' 
            });
        }

        const updates = req.body;
        delete updates.password;
        delete updates.email; // Prevent email changes
        delete updates.role; // Prevent role changes

        // Handle membership duration
        if (updates.membershipType) {
            const startDate = new Date();
            let endDate;
            
            switch (updates.membershipType.toLowerCase()) {
                case '1 month': 
                case 'monthly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 1);
                    break;
                case '3 months': 
                case 'quarterly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 3);
                    break;
                case '6 months': 
                case 'half-yearly':
                    endDate = new Date(startDate);
                    endDate.setMonth(startDate.getMonth() + 6);
                    break;
                case 'annual': 
                case 'yearly':
                    endDate = new Date(startDate);
                    endDate.setFullYear(startDate.getFullYear() + 1);
                    break;
                default: 
                    endDate = null;
            }
            
            updates.startDate = startDate;
            updates.endDate = endDate;
        }
        
        // Find and update member
        const member = await Member.findByIdAndUpdate(
            userId, 
            updates, 
            { 
                new: true,
                runValidators: true 
            }
        ).select('-password -__v')
         .populate('trainer', 'name email specialization experience bio');

        if (!member) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            member: member
        });
        
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error: ' + err.message 
            });
        }
        
        if (err.name === 'CastError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid ID format' 
            });
        }
        
        if (err.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Duplicate field value entered' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error updating profile' 
        });
    }
};

// ---------------------------------------
// ADMIN: DELETE MEMBER
// ---------------------------------------
exports.deleteMember = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid member ID format' 
            });
        }
        
        const member = await Member.findOneAndDelete({ 
            _id: id, 
            role: 'member' 
        });
        
        if (!member) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Member deleted successfully'
        });
        
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error deleting member' 
        });
    }
};

// ---------------------------------------
// ADMIN: RESET MEMBER PASSWORD
// ---------------------------------------
exports.resetMemberPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword = 'member123' } = req.body;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid member ID format' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update member password
        const member = await Member.findOneAndUpdate(
            { _id: id, role: 'member' },
            {
                password: hashedPassword,
                lastPasswordChange: new Date(),
                failedLoginAttempts: 0,
                accountLockedUntil: null
            },
            { new: true }
        ).select('name email');
        
        if (!member) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }
        
        res.json({
            success: true,
            message: `Password for ${member.name} has been reset successfully`
        });
        
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error resetting password' 
        });
    }
};

// ---------------------------------------
// MEMBER: CHANGE PASSWORD
// ---------------------------------------
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current and new password are required' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters long' 
            });
        }

        // Find member
        const member = await Member.findById(userId).select('+password');
        if (!member) {
            return res.status(404).json({ 
                success: false, 
                message: 'Member not found' 
            });
        }

        // Verify current password
        const isMatch = await member.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Update password (plain text - middleware will hash it)
        member.password = newPassword;
        await member.save();
        
        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// ---------------------------------------
// MEMBER: VIEW ALL TRAINERS
// ---------------------------------------
exports.getAllTrainers = async (req, res) => {
    try {
        const trainers = await Member.find({ role: 'trainer' })
            .select('-password -__v -failedLoginAttempts -accountLockedUntil')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            count: trainers.length,
            data: trainers
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Error loading trainers' 
        });
    }
};

// ---------------------------------------
// MEMBER: SELECT A TRAINER
// ---------------------------------------
exports.selectTrainer = async (req, res) => {
    try {
        const userId = req.user.id;
        const { trainerId } = req.body;

        if (!trainerId) {
            return res.status(400).json({ 
                success: false,
                message: 'Trainer ID is required' 
            });
        }

        // Check if trainer exists and is actually a trainer
        const trainer = await Member.findOne({ 
            _id: trainerId, 
            role: 'trainer' 
        }).select('-password -__v');
        
        if (!trainer) {
            return res.status(404).json({ 
                success: false,
                message: 'Trainer not found' 
            });
        }

        // Update member with trainer
        const member = await Member.findByIdAndUpdate(
            userId,
            { 
                trainer: trainerId,
                $push: {
                    attendanceHistory: {
                        date: new Date(),
                        type: 'class',
                        status: 'present',
                        method: 'manual',
                        time: new Date().toLocaleTimeString(),
                        trainerId: trainerId,
                        notes: `Assigned to trainer ${trainer.name}`
                    }
                }
            },
            { new: true }
        )
        .select('-password -__v')
        .populate('trainer', 'name email specialization experience bio');

        res.json({ 
            success: true,
            message: `Trainer ${trainer.name} selected successfully`, 
            data: {
                member: member,
                trainer: trainer
            }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

// ---------------------------------------
// MEMBER: GET MY CURRENT TRAINER
// ---------------------------------------
exports.getMyTrainer = async (req, res) => {
    try {
        const member = await Member.findById(req.user.id)
            .select('trainer')
            .populate('trainer', 'name email specialization experience bio phone');
        
        if (!member || !member.trainer) {
            return res.json({
                success: true,
                message: 'No trainer assigned',
                data: null
            });
        }

        res.json({
            success: true,
            data: member.trainer
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Error loading trainer information' 
        });
    }
};

// ---------------------------------------
// ADMIN: GET TRAINERS
// ---------------------------------------
exports.getTrainers = async (req, res) => {
    try {
        const trainers = await Member.find({ role: 'trainer' })
            .select('-password -__v -failedLoginAttempts -accountLockedUntil')
            .sort({ name: 1 });
        
        res.json({
            success: true,
            count: trainers.length,
            data: trainers
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

// ---------------------------------------
// ADMIN: GET SINGLE TRAINER
// ---------------------------------------
exports.getTrainer = async (req, res) => {
    try {
        const { id, email } = req.query;
        let trainer;
        
        if (id) {
            trainer = await Member.findOne({ 
                _id: id, 
                role: 'trainer' 
            }).select('-password -__v');
        } else if (email) {
            trainer = await Member.findOne({ 
                email: email, 
                role: 'trainer' 
            }).select('-password -__v');
        }
        
        if (!trainer) {
            return res.status(404).json({ 
                success: false,
                message: 'Trainer not found' 
            });
        }
        
        res.json({
            success: true,
            data: trainer
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

// ---------------------------------------
// ADMIN: CREATE TRAINER
// ---------------------------------------
exports.createTrainer = async (req, res) => {
    try {
        // Ensure role is set to trainer
        const trainerData = {
            ...req.body,
            role: 'trainer'
        };
        
        const trainer = new Member(trainerData);
        await trainer.save();
        
        res.status(201).json({
            success: true,
            message: 'Trainer created successfully',
            data: trainer
        });
    } catch (err) {
        res.status(400).json({ 
            success: false,
            message: err.message 
        });
    }
};

// ---------------------------------------
// ADMIN: UPDATE TRAINER
// ---------------------------------------
exports.updateTrainer = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Prevent role change
        delete updates.role;
        delete updates.password;
        
        const trainer = await Member.findOneAndUpdate(
            { _id: id, role: 'trainer' },
            updates,
            { new: true }
        ).select('-password -__v');
        
        if (!trainer) {
            return res.status(404).json({ 
                success: false,
                message: 'Trainer not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Trainer updated successfully',
            data: trainer
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

// ---------------------------------------
// PUBLIC: GET TRAINER BY ID
// ---------------------------------------
exports.getTrainerById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!isValidObjectId(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid trainer ID format' 
            });
        }
        
        const trainer = await Member.findOne({ 
            _id: id, 
            role: 'trainer' 
        })
        .select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires');
        
        if (!trainer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Trainer not found' 
            });
        }
        
        res.json({
            success: true,
            data: trainer
        });
        
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching trainer' 
        });
    }
};

// ---------------------------------------
// ADMIN: DELETE TRAINER
// ---------------------------------------
exports.deleteTrainer = async (req, res) => {
    try {
        const { id, email } = req.query;
        let trainer;
        
        if (id) {
            trainer = await Member.findOneAndDelete({ 
                _id: id, 
                role: 'trainer' 
            });
        } else if (email) {
            trainer = await Member.findOneAndDelete({ 
                email: email, 
                role: 'trainer' 
            });
        }
        
        if (!trainer) {
            return res.status(404).json({ 
                success: false,
                message: 'Trainer not found' 
            });
        }
        
        res.json({
            success: true,
            message: 'Trainer deleted successfully'
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: err.message 
        });
    }
};

// ---------------------------------------
// MEMBER: GET STATISTICS
// ---------------------------------------
exports.getMemberStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const member = await Member.findOne({ _id: userId, role: 'member' })
            .select('attendanceHistory membershipType startDate endDate');
        
        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }
        
        // Calculate attendance rate
        const totalAttendance = member.attendanceHistory ? member.attendanceHistory.length : 0;
        const presentAttendance = member.attendanceHistory 
            ? member.attendanceHistory.filter(a => a.status === 'present').length 
            : 0;
        const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
        
        // Check membership status
        const now = new Date();
        const isActive = member.endDate && member.endDate > now;
        const daysRemaining = member.endDate ? 
            Math.ceil((member.endDate - now) / (1000 * 60 * 60 * 24)) : 0;
        
        const stats = {
            totalClasses: totalAttendance,
            completedClasses: presentAttendance,
            attendanceRate: attendanceRate,
            membershipType: member.membershipType || 'None',
            membershipStart: member.startDate,
            membershipEnd: member.endDate,
            isActive: isActive,
            daysRemaining: daysRemaining > 0 ? daysRemaining : 0
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: 'Error loading statistics' 
        });
    }
};