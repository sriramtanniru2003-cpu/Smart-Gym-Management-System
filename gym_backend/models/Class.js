// models/Class.js
const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  schedule: String, // e.g., "Mon, Wed, Fri - 7:00 AM"
  duration: Number, // in minutes
  capacity: { type: Number, default: 20 },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Changed from 'Trainer' to 'User'
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Changed from 'Member' to 'User'
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);