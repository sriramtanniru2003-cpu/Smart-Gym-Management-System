const express = require('express');
const router = express.Router();

const authenticate = require('../middlewares/auth/authenticate');
const authorize = require('../middlewares/auth/authorize');

const AttendanceController = require('../controllers/attendance.controller');

// ============================
// ✅ TEST ROUTE
// ============================
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Attendance API is working!',
        timestamp: new Date().toISOString()
    });
});

// ============================
// ✅ MANUAL ATTENDANCE
// ============================

// Mark attendance manually (for members)
router.post(
    '/mark',
    authenticate,
    authorize(['member', 'admin', 'trainer']),
    AttendanceController.markAttendance
);

// Get attendance for a specific member
router.get(
    '/member/:memberId',
    authenticate,
    authorize(['member', 'admin', 'trainer']),
    AttendanceController.getMemberAttendance
);

// ============================
// ✅ MEMBER-SPECIFIC ROUTES
// ============================

// Get own attendance (for members)
router.get(
    '/my-attendance',
    authenticate,
    authorize(['member']),
    async (req, res) => {
        try {
            const userId = req.user.id;
            req.params.memberId = userId;
            return AttendanceController.getMemberAttendance(req, res);
        } catch (error) {
            console.error('Error getting my attendance:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
    }
);

// Check today's attendance status (for members)
router.get(
    '/today-status',
    authenticate,
    authorize(['member']),
    AttendanceController.getTodayStatus
);

// ============================
// ✅ QR CODE ATTENDANCE (UNIFIED - FOR MEMBERS & TRAINERS)
// ============================

// Generate QR code (for both members and trainers)
router.post(
    '/generate-qr',
    authenticate,
    authorize(['member', 'admin', 'trainer']),  // Changed to include trainer
    AttendanceController.generateQRCode  // Unified function for both
);

// Mark attendance via QR code
router.post(
    '/mark-qr',
    authenticate,
    authorize(['member', 'admin', 'trainer']),
    AttendanceController.markAttendanceByQRCode
);

// ============================
// ✅ TRAINER ATTENDANCE ROUTES
// ============================

// Mark trainer gym visit
router.post(
    '/trainer/gym-visit',
    authenticate,
    authorize(['trainer']),
    AttendanceController.markTrainerGymVisit
);

// Mark trainer personal training session
router.post(
    '/trainer/personal-training',
    authenticate,
    authorize(['trainer']),
    AttendanceController.markTrainerPersonalTraining
);

// Get trainer's members (for personal training selection)
router.get(
    '/trainer/members',
    authenticate,
    authorize(['trainer']),
    AttendanceController.getTrainerMembers
);

// Get trainer's attendance history
router.get(
    '/trainer/history',
    authenticate,
    authorize(['trainer']),
    AttendanceController.getTrainerAttendanceHistory
);

// Get today's trainer status
router.get(
    '/trainer/today-status',
    authenticate,
    authorize(['trainer']),
    AttendanceController.getTrainerTodayStatus
);

// ============================
// ✅ ATTENDANCE HISTORY & STATISTICS
// ============================

// Get attendance history with filters (for members)
router.get(
    '/history',
    authenticate,
    authorize(['member']),
    AttendanceController.getAttendanceHistory
);

// Get attendance statistics (admin/trainer can view any member)
router.get(
    '/stats/:memberId',
    authenticate,
    authorize(['admin', 'trainer']),
    AttendanceController.getAttendanceStatistics
);

// ============================
// ✅ ADMIN/TRAINER ONLY ROUTES
// ============================

// Admin/Trainer mark attendance for members
router.post(
    '/admin/mark',
    authenticate,
    authorize(['admin', 'trainer']),
    AttendanceController.markAttendance
);

// Get all attendance (admin/trainer only)
router.get(
    '/',
    authenticate,
    authorize(['admin', 'trainer']),
    AttendanceController.getAllAttendance
);

// ============================
// ✅ CHECK TODAY'S ATTENDANCE (UNIVERSAL)
// ============================

// Check today's attendance (works for both members and trainers)
router.get(
    '/check-today',
    authenticate,
    async (req, res) => {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            
            const Attendance = require('../models/Attendance');
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            let query = {};
            
            // Check for member attendance
            if (userRole === 'member') {
                query = {
                    member: userId,
                    date: { $gte: today, $lt: tomorrow }
                };
            }
            // Check for trainer attendance (gym visits only)
            else if (userRole === 'trainer') {
                query = {
                    trainer: userId,
                    attendanceType: 'trainer_gym_visit',
                    date: { $gte: today, $lt: tomorrow }
                };
            }
            // Admin can check any member
            else if (userRole === 'admin' && req.query.memberId) {
                query = {
                    member: req.query.memberId,
                    date: { $gte: today, $lt: tomorrow }
                };
            }
            
            const existingAttendance = await Attendance.findOne(query);
            
            if (existingAttendance) {
                return res.json({
                    success: true,
                    marked: true,
                    message: userRole === 'trainer' 
                        ? 'Gym visit already marked for today!' 
                        : 'Attendance already marked for today!',
                    attendance: {
                        id: existingAttendance._id,
                        date: existingAttendance.date,
                        method: existingAttendance.method,
                        status: existingAttendance.status,
                        attendanceType: existingAttendance.attendanceType
                    }
                });
            } else {
                return res.json({
                    success: true,
                    marked: false,
                    message: userRole === 'trainer'
                        ? 'Gym visit not marked yet for today.'
                        : 'Attendance not marked yet for today.'
                });
            }
            
        } catch (error) {
            console.error('Error checking today\'s attendance:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
    }
);

// ============================
// ✅ GET TRAINER STATISTICS
// ============================

// Get trainer-specific statistics
router.get(
    '/trainer/stats',
    authenticate,
    authorize(['trainer']),
    async (req, res) => {
        try {
            const trainerId = req.user.id;
            
            // Get current month's statistics
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date(startOfMonth);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            
            const Attendance = require('../models/Attendance');
            
            // Get all trainer attendance this month
            const attendance = await Attendance.find({
                trainer: trainerId,
                date: { $gte: startOfMonth, $lt: endOfMonth }
            });
            
            // Calculate statistics
            const gymVisits = attendance.filter(a => a.attendanceType === 'trainer_gym_visit').length;
            const trainingSessions = attendance.filter(a => a.attendanceType === 'trainer_personal_training').length;
            const totalSessions = gymVisits + trainingSessions;
            
            // Get today's sessions
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(todayStart);
            todayEnd.setDate(todayEnd.getDate() + 1);
            
            const todaySessions = attendance.filter(a => 
                a.date >= todayStart && a.date < todayEnd
            ).length;
            
            // Get unique members trained this month
            const uniqueMembers = [...new Set(
                attendance
                    .filter(a => a.member)
                    .map(a => a.member.toString())
            )].length;
            
            res.json({
                success: true,
                statistics: {
                    totalSessions: totalSessions,
                    gymVisits: gymVisits,
                    trainingSessions: trainingSessions,
                    todaySessions: todaySessions,
                    uniqueMembersTrained: uniqueMembers,
                    month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
                },
                data: attendance.slice(0, 10) // Recent 10 records
            });
            
        } catch (error) {
            console.error('Error getting trainer stats:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
    }
);

// ============================
// ✅ GET TRAINER'S RECENT SESSIONS
// ============================

// Get trainer's recent personal training sessions
router.get(
    '/trainer/recent-sessions',
    authenticate,
    authorize(['trainer']),
    async (req, res) => {
        try {
            const trainerId = req.user.id;
            const limit = parseInt(req.query.limit) || 10;
            
            const Attendance = require('../models/Attendance');
            
            const sessions = await Attendance.find({
                trainer: trainerId,
                attendanceType: 'trainer_personal_training'
            })
            .sort({ date: -1 })
            .limit(limit)
            .populate('member', 'name email')
            .lean();
            
            res.json({
                success: true,
                count: sessions.length,
                data: sessions
            });
            
        } catch (error) {
            console.error('Error getting recent sessions:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
    }
);

// ============================
// ✅ GET TRAINER'S MONTHLY ATTENDANCE
// ============================

// Get trainer's monthly attendance summary
router.get(
    '/trainer/monthly-summary',
    authenticate,
    authorize(['trainer']),
    async (req, res) => {
        try {
            const trainerId = req.user.id;
            const { year, month } = req.query;
            
            const targetDate = new Date();
            if (year && month) {
                targetDate.setFullYear(parseInt(year));
                targetDate.setMonth(parseInt(month) - 1);
            }
            
            const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
            endOfMonth.setHours(23, 59, 59, 999);
            
            const Attendance = require('../models/Attendance');
            
            // Get all attendance for the month
            const attendance = await Attendance.find({
                trainer: trainerId,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });
            
            // Group by day
            const dailyStats = {};
            attendance.forEach(record => {
                const day = record.date.toISOString().split('T')[0];
                if (!dailyStats[day]) {
                    dailyStats[day] = {
                        date: day,
                        gymVisit: false,
                        trainingSessions: 0,
                        totalDuration: 0
                    };
                }
                
                if (record.attendanceType === 'trainer_gym_visit') {
                    dailyStats[day].gymVisit = true;
                } else if (record.attendanceType === 'trainer_personal_training') {
                    dailyStats[day].trainingSessions++;
                    dailyStats[day].totalDuration += (record.duration || 0);
                }
            });
            
            // Convert to array and sort
            const dailyArray = Object.values(dailyStats).sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            );
            
            // Calculate totals
            const totalGymVisits = dailyArray.filter(day => day.gymVisit).length;
            const totalTrainingSessions = dailyArray.reduce((sum, day) => sum + day.trainingSessions, 0);
            const totalDuration = dailyArray.reduce((sum, day) => sum + day.totalDuration, 0);
            
            res.json({
                success: true,
                summary: {
                    month: startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    totalDays: dailyArray.length,
                    totalGymVisits: totalGymVisits,
                    totalTrainingSessions: totalTrainingSessions,
                    totalTrainingHours: Math.round(totalDuration / 60 * 10) / 10,
                    attendanceRate: Math.round((totalGymVisits / dailyArray.length) * 100) + '%'
                },
                dailyStats: dailyArray
            });
            
        } catch (error) {
            console.error('Error getting monthly summary:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
    }
);

module.exports = router;