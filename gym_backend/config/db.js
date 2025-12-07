require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');   // <-- use your db.js

// Routes
const memberRoutes = require('./routes/member.routes');
const trainerRoutes = require('./routes/trainer.routes');
const classRoutes = require('./routes/class.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();   // <-- the MOST important fix

// API Routes
app.use('/api/auth', authRoutes);          // signup, login
app.use('/api/members', memberRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);

// Default Route
app.get('/', (req, res) => {
    res.send('Gym Application API is Running');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
