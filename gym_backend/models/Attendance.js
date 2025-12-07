const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    // Member attendance - required for member attendance
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member', // Changed from 'Member' to 'Member' for consistency
    },
    
    // Trainer attendance - required for trainer attendance
    trainer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    
    // Optional if attendance belongs to a class
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },

    // The date the attendance is marked
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Attendance type - expanded for trainer support
    attendanceType: {
      type: String,
      enum: [
        'gym_visit',                     // Member gym visit
        'class',                         // Member class attendance
        'trainer_gym_visit',             // Trainer gym visit
        'trainer_personal_training'      // Trainer personal training session
      ],
      required: true
    },

    // Status: present or absent
    status: {
      type: String,
      enum: ['present', 'absent'],
      default: 'present',
    },

    // Who marked the attendance (only admin/trainer)
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member', // or 'Admin' based on your user schema
      default: null,
    },

    // Method used to mark attendance
    method: {
      type: String,
      enum: ['manual', 'qr', 'biometric'],
      default: 'manual',
    },
    
    // Duration in minutes (for personal training sessions)
    duration: {
      type: Number,
      default: 0
    },
    
    // Notes for the attendance record
    notes: {
      type: String,
      trim: true,
      default: ''
    },

    // For QR validation (optional)
    qrToken: {
      type: String,
      default: null,
    },

    // Prevents multiple markings in same day
    isMarked: {
      type: Boolean,
      default: true,
    },
    
    // Check-in timestamp
    checkedInAt: {
      type: Date,
      default: Date.now
    },
    
    // Check-out timestamp (optional)
    checkedOutAt: {
      type: Date
    }
  },
  
  { 
    timestamps: true 
  }
);

// Indexes for better performance
attendanceSchema.index({ member: 1, date: 1 });
attendanceSchema.index({ trainer: 1, date: 1 });
attendanceSchema.index({ attendanceType: 1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ markedBy: 1 });

// Validation: Ensure either member or trainer is present
attendanceSchema.pre('save', function(next) {
  if (!this.member && !this.trainer) {
    const error = new Error('Attendance must have either a member or trainer');
    return next(error);
  }
  
  // Set attendance type based on context
  if (!this.attendanceType) {
    if (this.trainer) {
      if (this.classId) {
        this.attendanceType = 'trainer_class'; // If you want to track trainer teaching classes
      } else if (this.member) {
        this.attendanceType = 'trainer_personal_training';
      } else {
        this.attendanceType = 'trainer_gym_visit';
      }
    } else if (this.member) {
      if (this.classId) {
        this.attendanceType = 'class';
      } else {
        this.attendanceType = 'gym_visit';
      }
    }
  }
  
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);