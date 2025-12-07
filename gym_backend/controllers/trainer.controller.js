const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Member = require('../models/Member');
const Class = require('../models/Class');

const SALT_ROUNDS = 10;

// -----------------------------
// Helper utilities
// -----------------------------
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const sendServerError = (res, err, context = '') => {
  return res.status(500).json({
    success: false,
    message: 'Server error',
    error: err?.message
  });
};

const sanitizeUpdates = (updates = {}) => {
  const forbidden = ['role', '_id', 'createdAt', 'updatedAt', '__v', 'password'];
  const out = { ...updates };
  forbidden.forEach((k) => delete out[k]);
  return out;
};

// -----------------------------
// CONTROLLER ACTIONS
// -----------------------------

// GET ALL TRAINERS (admin)
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Member.find({ role: 'trainer' })
      .select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires')
      .sort({ name: 1 });

    return res.json({
      success: true,
      count: trainers.length,
      data: trainers
    });
  } catch (err) {
    return sendServerError(res, err, 'getAllTrainers');
  }
};

// GET TRAINER BY ID (public/admin)
exports.getTrainerById = async (req, res) => {
  try {
    const trainerId = req.params.id;
    if (!isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    const trainer = await Member.findOne({ _id: trainerId, role: 'trainer' })
      .select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires');

    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    return res.json({ success: true, data: trainer });
  } catch (err) {
    return sendServerError(res, err, 'getTrainerById');
  }
};

// GET MY PROFILE (trainer)
exports.getMyProfile = async (req, res) => {
  try {
    const trainerId = req.user?.id;
    
    if (!trainerId || !isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid user context' });
    }

    const trainer = await Member.findOne({ _id: trainerId, role: 'trainer' })
      .select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires');

    if (!trainer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trainer profile not found' 
      });
    }

    const trainerData = trainer.toObject();
    trainerData.isAccountLocked = trainer.isAccountLocked ? trainer.isAccountLocked() : false;
    trainerData.isPasswordExpired = trainer.isPasswordExpired ? trainer.isPasswordExpired() : false;

    return res.json({ 
      success: true, 
      message: 'Profile retrieved successfully',
      data: trainerData 
    });
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// UPDATE TRAINER (admin updating any trainer)
exports.updateTrainerAdmin = async (req, res) => {
  try {
    const trainerId = req.params.id;
    
    if (!isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    const updates = req.body;
    
    delete updates.password;
    delete updates.role;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;
    delete updates.failedLoginAttempts;
    delete updates.accountLockedUntil;
    delete updates.passwordResetToken;
    delete updates.passwordResetExpires;

    const trainer = await Member.findOneAndUpdate(
      { _id: trainerId, role: 'trainer' },
      { $set: updates },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires');

    if (!trainer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trainer not found' 
      });
    }

    return res.json({
      success: true,
      message: 'Trainer updated successfully',
      data: trainer
    });

  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: err.message 
    });
  }
};

// UPDATE TRAINER (admin updating any trainer) - Legacy method
exports.updateTrainer = async (req, res) => {
  try {
    const trainerId = req.params.id;
    if (!isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    const existingTrainer = await Member.findOne({ _id: trainerId, role: 'trainer' });
    if (!existingTrainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    const updates = sanitizeUpdates(req.body);

    if (req.body.password) {
      updates.password = await bcrypt.hash(req.body.password, SALT_ROUNDS);
    }

    const trainer = await Member.findOneAndUpdate(
      { _id: trainerId, role: 'trainer' },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires');

    return res.json({
      success: true,
      message: 'Trainer updated successfully',
      data: trainer
    });
  } catch (err) {
    return sendServerError(res, err, 'updateTrainer');
  }
};

// UPDATE MY PROFILE (trainer updating own profile)
exports.updateMyProfile = async (req, res) => {
  try {
    const trainerId = req.user?.id;
    if (!trainerId || !isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid user context' });
    }

    const updates = sanitizeUpdates(req.body);

    const trainer = await Member.findOneAndUpdate(
      { _id: trainerId, role: 'trainer' },
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v -failedLoginAttempts -accountLockedUntil -passwordResetToken -passwordResetExpires');

    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: trainer
    });
  } catch (err) {
    return sendServerError(res, err, 'updateMyProfile');
  }
};

// UPDATE TRAINER PASSWORD
exports.updateTrainerPassword = async (req, res) => {
  try {
    const actor = req.user;
    let targetTrainerId = req.params?.id || req.user?.id;

    if (!targetTrainerId || !isValidObjectId(targetTrainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    const trainer = await Member.findOne({ _id: targetTrainerId, role: 'trainer' }).select('+password');
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const isSelf = String(actor.id) === String(targetTrainerId);
    
    if (isSelf) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required'
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, trainer.password);
      if (!isMatch) {
        if (trainer.recordFailedLogin) await trainer.recordFailedLogin();
        
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    } else if (actor.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update another trainer\'s password'
      });
    }

    trainer.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    trainer.lastPasswordChange = new Date();
    trainer.failedLoginAttempts = 0;
    trainer.accountLockedUntil = null;
    
    await trainer.save();

    const message = isSelf 
      ? 'Password updated successfully' 
      : 'Trainer password reset successfully by admin';

    return res.json({ success: true, message });
  } catch (err) {
    return sendServerError(res, err, 'updateTrainerPassword');
  }
};

// DELETE TRAINER (admin)
exports.deleteTrainer = async (req, res) => {
  try {
    const trainerId = req.params.id;
    if (!isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    const trainer = await Member.findOneAndDelete({ _id: trainerId, role: 'trainer' });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    return res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (err) {
    return sendServerError(res, err, 'deleteTrainer');
  }
};

// ASSIGN TRAINER TO CLASS (admin)
exports.assignTrainerToClass = async (req, res) => {
  try {
    const { classId, trainerId } = req.body;
    if (!isValidObjectId(trainerId) || !isValidObjectId(classId)) {
      return res.status(400).json({ success: false, message: 'Invalid trainerId or classId' });
    }

    const trainer = await Member.findOne({ _id: trainerId, role: 'trainer' });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    const gymClass = await Class.findByIdAndUpdate(
      classId,
      { trainerId },
      { new: true, runValidators: true }
    );

    if (!gymClass) {
      return res.status(404).json({ success: false, message: 'Class not found' });
    }

    return res.json({
      success: true,
      message: 'Trainer assigned to class successfully',
      data: gymClass
    });
  } catch (err) {
    return sendServerError(res, err, 'assignTrainerToClass');
  }
};

// GET TRAINER CLASSES (public or trainer)
exports.getTrainerClasses = async (req, res) => {
  try {
    const trainerId = req.params.id;
    if (!isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid trainer ID' });
    }

    const trainer = await Member.findOne({ _id: trainerId, role: 'trainer' });
    if (!trainer) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    const classes = await Class.find({ trainerId })
      .populate('members', 'name email phone')
      .populate('trainerId', 'name email specialization')
      .sort({ date: 1 });

    return res.json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (err) {
    return sendServerError(res, err, 'getTrainerClasses');
  }
};

// GET TRAINER'S OWN CLASSES (for current trainer)
exports.getMyClasses = async (req, res) => {
  try {
    const trainerId = req.user?.id;
    if (!trainerId || !isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid user context' });
    }

    const classes = await Class.find({ trainerId })
      .populate('members', 'name email phone')
      .sort({ date: 1 });

    return res.json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (err) {
    return sendServerError(res, err, 'getMyClasses');
  }
};

// GET TRAINER STATISTICS
exports.getTrainerStats = async (req, res) => {
  try {
    const trainerId = req.user?.id;
    if (!trainerId || !isValidObjectId(trainerId)) {
      return res.status(400).json({ success: false, message: 'Invalid user context' });
    }

    const classCount = await Class.countDocuments({ trainerId });
    
    const classes = await Class.find({ trainerId }).populate('members');
    let totalMembers = 0;
    let upcomingClasses = 0;
    const now = new Date();
    
    classes.forEach(cls => {
      totalMembers += cls.members.length;
      if (cls.date && new Date(cls.date) > now) {
        upcomingClasses++;
      }
    });

    return res.json({
      success: true,
      data: {
        totalClasses: classCount,
        upcomingClasses,
        totalMembers,
        completedClasses: classCount - upcomingClasses
      }
    });
  } catch (err) {
    return sendServerError(res, err, 'getTrainerStats');
  }
};

// CREATE TRAINER (admin)
exports.createTrainer = async (req, res) => {
  try {
    const trainerData = req.body;
    
    if (!trainerData.email || !trainerData.name) {
      return res.status(400).json({
        success: false,
        message: 'Email and name are required'
      });
    }
    
    const existingTrainer = await Member.findOne({ 
      email: trainerData.email,
      role: 'trainer'
    });
    
    if (existingTrainer) {
      return res.status(400).json({
        success: false,
        message: 'A trainer with this email already exists'
      });
    }
    
    trainerData.role = 'trainer';
    
    if (!trainerData.password) {
      trainerData.password = 'trainer123';
    }
    
    trainerData.password = await bcrypt.hash(trainerData.password, SALT_ROUNDS);
    trainerData.lastPasswordChange = new Date();
    
    const newTrainer = new Member(trainerData);
    await newTrainer.save();
    
    const trainerResponse = newTrainer.toObject();
    delete trainerResponse.password;
    delete trainerResponse.__v;
    delete trainerResponse.failedLoginAttempts;
    delete trainerResponse.accountLockedUntil;
    delete trainerResponse.passwordResetToken;
    delete trainerResponse.passwordResetExpires;
    
    res.status(201).json({
      success: true,
      message: 'Trainer created successfully',
      data: trainerResponse
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating trainer',
      error: error.message
    });
  }
};