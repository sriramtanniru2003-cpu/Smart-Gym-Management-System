const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const trainerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['member', 'trainer', 'admin'], default: 'trainer' },

  // Trainer-specific fields
  specialization: { type: String, default: '' },
  experience: { type: Number, default: 0, min: 0 },
  bio: { type: String, default: '' },
  address: { type: String, default: '' },
  
  availability: [{
    day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    startTime: String,
    endTime: String
  }],
  
  startDate: { type: Date, default: Date.now },

  // Security fields
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastPasswordChange: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  accountLockedUntil: Date
}, { timestamps: true });

// Hash password before saving
trainerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.lastPasswordChange = new Date();
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password
trainerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update password
trainerSchema.methods.updatePassword = async function(newPassword) {
  this.password = newPassword;
  this.lastPasswordChange = new Date();
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  await this.save();
  return true;
};

// Failed login tracking
trainerSchema.methods.recordFailedLogin = async function() {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    const lockTime = new Date();
    lockTime.setMinutes(lockTime.getMinutes() + 30);
    this.accountLockedUntil = lockTime;
  }
  await this.save();
};

trainerSchema.methods.resetFailedLogins = async function() {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = null;
  await this.save();
};

trainerSchema.methods.isAccountLocked = function() {
  if (!this.accountLockedUntil) return false;
  return new Date() < new Date(this.accountLockedUntil);
};

trainerSchema.methods.getLockTimeRemaining = function() {
  if (!this.accountLockedUntil) return 0;
  const diffMinutes = Math.ceil((new Date(this.accountLockedUntil) - new Date()) / 60000);
  return diffMinutes > 0 ? diffMinutes : 0;
};

// Find by email case-insensitive
trainerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: new RegExp('^' + email + '$', 'i') });
};

// Return profile without sensitive info
trainerSchema.methods.toProfileJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  delete obj.failedLoginAttempts;
  delete obj.accountLockedUntil;
  delete obj.__v;
  return obj;
};

// JSON serialization
trainerSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.failedLoginAttempts;
    delete ret.accountLockedUntil;
    return ret;
  }
});

// Indexes
trainerSchema.index({ email: 1 }, { unique: true });
trainerSchema.index({ role: 1 });

const Trainer = mongoose.model('Trainer', trainerSchema);
module.exports = Trainer;