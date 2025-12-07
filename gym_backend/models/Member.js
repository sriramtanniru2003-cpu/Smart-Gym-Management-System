const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const memberSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: { 
    type: String, 
    trim: true 
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: { 
    type: String, 
    enum: ['member', 'trainer', 'admin'], 
    default: 'member' 
  },

  // Membership
  membershipType: { 
    type: String, 
    default: '' 
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: Date,
  billingPreferences: {
    paymentMethod: { type: String, default: '' },
    billingAddress: { type: String, default: '' }
  },
  trainer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Member',
    default: null 
  },

  // Profile
  dateOfBirth: Date,
  gender: { 
    type: String, 
    enum: ['male', 'female', 'other', 'prefer-not-to-say', ''],
    default: ''
  },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' }
  },
  medicalConditions: { 
    type: [String], 
    default: [] 
  },
  fitnessGoals: { 
    type: [String], 
    default: [] 
  },

  // Trainer-specific fields (only used when role='trainer')
  specialization: { 
    type: String, 
    default: '' 
  },
  experience: { 
    type: Number, 
    default: 0,
    min: 0 
  },
  bio: { 
    type: String, 
    default: '' 
  },
  address: { 
    type: String, 
    default: '' 
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String
  }],

  // Attendance
  attendanceHistory: [{
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['gym-visit', 'class'], default: 'gym-visit' },
    status: { type: String, enum: ['present', 'absent'], default: 'absent' },
    method: { type: String, enum: ['manual', 'qr', 'auto'], default: 'manual' },
    time: String,
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    notes: { type: String, default: '' }
  }],

  // Account settings
  accountSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    privacyLevel: { type: String, enum: ['public', 'private', 'trainers-only'], default: 'trainers-only' }
  },

  // Security
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastPasswordChange: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: Date

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
memberSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check if password is already hashed
    if (this.password.startsWith('$2b$')) {
      return next();
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.lastPasswordChange = new Date();
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password for authentication
memberSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Update password
memberSchema.methods.updatePassword = async function(newPassword) {
  try {
    this.password = newPassword;
    this.lastPasswordChange = new Date();
    this.failedLoginAttempts = 0;
    this.accountLockedUntil = null;
    await this.save();
    return true;
  } catch (error) {
    throw new Error('Failed to update password');
  }
};

// Check if password needs to be changed
memberSchema.methods.isPasswordExpired = function() {
  if (!this.lastPasswordChange) return true;
  
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const lastChange = new Date(this.lastPasswordChange);
  
  return (now - lastChange) > ninetyDays;
};

// Check if membership is active
memberSchema.methods.isMembershipActive = function() {
  if (!this.endDate) return false;
  const today = new Date();
  const endDate = new Date(this.endDate);
  return today <= endDate;
};

// Get membership days remaining
memberSchema.methods.getMembershipDaysRemaining = function() {
  if (!this.endDate || !this.isMembershipActive()) return 0;
  const today = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Failed login tracking
memberSchema.methods.recordFailedLogin = async function() {
  this.failedLoginAttempts += 1;
  
  if (this.failedLoginAttempts >= 5) {
    const lockTime = new Date();
    lockTime.setMinutes(lockTime.getMinutes() + 30);
    this.accountLockedUntil = lockTime;
  }
  
  await this.save();
};

memberSchema.methods.resetFailedLogins = async function() {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  await this.save();
};

memberSchema.methods.isAccountLocked = function() {
  if (!this.accountLockedUntil) return false;
  const now = new Date();
  const lockUntil = new Date(this.accountLockedUntil);
  return now < lockUntil;
};

memberSchema.methods.getLockTimeRemaining = function() {
  if (!this.accountLockedUntil) return 0;
  const now = new Date();
  const lockUntil = new Date(this.accountLockedUntil);
  if (now >= lockUntil) return 0;
  const diffMinutes = Math.ceil((lockUntil - now) / (1000 * 60));
  return diffMinutes;
};

// Static: Find by email (case insensitive)
memberSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: new RegExp('^' + email + '$', 'i') });
};

// Virtuals
memberSchema.virtual('fullName').get(function() {
  return this.name;
});

memberSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

memberSchema.virtual('isTrainer').get(function() {
  return this.role === 'trainer';
});

memberSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// JSON serialization (remove sensitive fields)
memberSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.failedLoginAttempts;
    delete ret.accountLockedUntil;
    delete ret.__v;
    return ret;
  }
});

memberSchema.set('toObject', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.failedLoginAttempts;
    delete ret.accountLockedUntil;
    delete ret.__v;
    return ret;
  }
});

// Create indexes for better performance
memberSchema.index({ email: 1 }, { unique: true });
memberSchema.index({ role: 1 });
memberSchema.index({ membershipType: 1 });
memberSchema.index({ endDate: 1 });
memberSchema.index({ trainer: 1 });
memberSchema.index({ 'attendanceHistory.date': -1 });
memberSchema.index({ name: 1 });
memberSchema.index({ createdAt: -1 });

// Custom query helpers
memberSchema.query.byRole = function(role) {
  return this.where({ role });
};

memberSchema.query.activeMembers = function() {
  return this.where({ 
    endDate: { $gte: new Date() },
    role: 'member' 
  });
};

memberSchema.query.trainers = function() {
  return this.where({ role: 'trainer' });
};

module.exports = mongoose.model('Member', memberSchema);