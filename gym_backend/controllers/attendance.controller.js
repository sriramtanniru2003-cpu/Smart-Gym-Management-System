const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const mongoose = require('mongoose');
const QRCode = require('qrcode');

// ===============================
// MARK MEMBER ATTENDANCE (Manual/QR)
// ===============================
exports.markAttendance = async (req, res) => {
    try {
        const { memberId, classId, date, method } = req.body;

        // Use logged-in user if memberId not provided
        const finalMemberId = memberId || req.user.id;

        // Validate memberId format
        if (!mongoose.Types.ObjectId.isValid(finalMemberId)) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid member ID format" 
            });
        }

        // Check if member exists
        const memberExists = await Member.findById(finalMemberId);
        if (!memberExists) {
            return res.status(404).json({ 
                success: false, 
                message: "Member not found" 
            });
        }

        // Prevent duplicate attendance for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const existing = await Attendance.findOne({
            member: finalMemberId,
            date: { $gte: todayStart, $lt: todayEnd }
        });

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: "Attendance already marked for today!",
                existingAttendance: existing
            });
        }

        // Determine attendance type
        let attendanceType = 'gym_visit';
        if (classId && mongoose.Types.ObjectId.isValid(classId)) {
            attendanceType = 'class';
        }

        // Create attendance data
        const attendanceData = {
            member: finalMemberId,
            date: date || new Date(),
            status: 'present',
            attendanceType: attendanceType,
            method: method || 'manual',
            isMarked: true,
            checkedInAt: new Date()
        };

        // Add classId if provided
        if (classId && mongoose.Types.ObjectId.isValid(classId)) {
            attendanceData.classId = classId;
        }

        // Add markedBy if admin/trainer is marking for someone else
        if (req.user.role === 'admin' || req.user.role === 'trainer') {
            attendanceData.markedBy = req.user.id;
        }

        // Save attendance
        const attendance = await Attendance.create(attendanceData);

        res.status(201).json({
            success: true,
            message: "Attendance marked successfully!",
            data: attendance
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error",
            error: err.message
        });
    }
};

// ===============================
// MARK TRAINER GYM VISIT ATTENDANCE
// ===============================
exports.markTrainerGymVisit = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const { date, method } = req.body;

        // Check if trainer has already marked gym visit for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const existing = await Attendance.findOne({
            trainer: trainerId,
            attendanceType: 'trainer_gym_visit',
            date: { $gte: todayStart, $lt: todayEnd }
        });

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: "Gym visit already marked for today!",
                existingAttendance: existing
            });
        }

        // Create trainer gym visit attendance record
        const attendanceData = {
            trainer: trainerId,
            date: date || new Date(),
            status: 'present',
            attendanceType: 'trainer_gym_visit',
            method: method || 'manual',
            isMarked: true,
            notes: 'Trainer gym visit',
            checkedInAt: new Date()
        };

        const attendance = await Attendance.create(attendanceData);

        res.status(201).json({
            success: true,
            message: "Gym visit attendance marked successfully!",
            data: attendance
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error",
            error: err.message
        });
    }
};

// ===============================
// MARK TRAINER PERSONAL TRAINING SESSION
// ===============================
exports.markTrainerPersonalTraining = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const { memberId, date, duration, notes, method } = req.body;

        // Validate required fields
        if (!memberId) {
            return res.status(400).json({ 
                success: false, 
                message: "Member ID is required for personal training session" 
            });
        }

        // Check if member exists
        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ 
                success: false, 
                message: "Member not found" 
            });
        }

        // Create personal training session record
        const attendanceData = {
            trainer: trainerId,
            member: memberId,
            date: date || new Date(),
            status: 'present',
            attendanceType: 'trainer_personal_training',
            method: method || 'manual',
            duration: duration || 60,
            notes: notes || 'Personal training session',
            isMarked: true,
            checkedInAt: new Date()
        };

        const attendance = await Attendance.create(attendanceData);

        res.status(201).json({
            success: true,
            message: "Personal training session recorded successfully!",
            data: attendance,
            member: {
                name: member.name,
                email: member.email
            }
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error",
            error: err.message
        });
    }
};

// ===============================
// GENERATE QR CODE (UNIFIED - FOR MEMBER & TRAINER)
// ===============================
exports.generateQRCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        // Create secure random token
        const qrToken = Math.random().toString(36).substring(2) + Date.now();

        // Save QR token mapping
        const qrPayload = {
            qrToken,
            user: userId,
            role: role,
            timestamp: Date.now(),
        };

        const qrString = JSON.stringify(qrPayload);

        // Generate QR Image
        const qrImage = await QRCode.toDataURL(qrString);

        return res.json({
            success: true,
            role,
            qrToken,
            qrCode: qrImage,
            message: "QR generated successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to generate QR",
        });
    }
};

// ===============================
// MARK ATTENDANCE BY QR CODE
// ===============================
exports.markAttendanceByQRCode = async (req, res) => {
    try {
        const { qrToken } = req.body;

        if (!qrToken) {
            return res.status(400).json({ success: false, message: "QR token missing" });
        }

        // Decode QR
        const qrData = JSON.parse(Buffer.from(qrToken, "base64").toString("utf8"));

        const { user, role } = qrData;

        // Determine attendance type
        let newAttendance = {
            date: new Date(),
            method: "qr",
            status: "present",
            qrToken,
        };

        if (role === "member") {
            newAttendance.member = user;
            newAttendance.attendanceType = "gym_visit";
        } else if (role === "trainer") {
            newAttendance.trainer = user;
            newAttendance.attendanceType = "trainer_gym_visit";
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid role inside QR",
            });
        }

        // Prevent duplicate same-day attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({
            ...(role === "member" ? { member: user } : { trainer: user }),
            date: { $gte: today },
        });

        if (existing) {
            return res.json({
                success: true,
                alreadyMarked: true,
                message: "Attendance already marked for today",
                attendance: existing,
            });
        }

        // Save new attendance
        const saved = await Attendance.create(newAttendance);

        return res.json({
            success: true,
            marked: true,
            role,
            attendance: saved,
            message: "Attendance marked successfully",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "QR processing failed" });
    }
};

// ===============================
// GET MEMBER ATTENDANCE
// ===============================
exports.getMemberAttendance = async (req, res) => {
    try {
        const memberId = req.params.memberId || req.user.id;

        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ success: false, message: "Invalid member ID" });
        }

        const records = await Attendance.find({ member: memberId })
            .populate('member', 'name email')
            .populate('classId', 'name date time')
            .populate('markedBy', 'name email')
            .sort({ date: -1 });

        res.json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
};

// ===============================
// GET TRAINER'S MEMBERS (FOR PERSONAL TRAINING)
// ===============================
exports.getTrainerMembers = async (req, res) => {
    try {
        // Get all members (for personal training selection)
        const members = await Member.find({})
            .select('name email phone membershipType')
            .sort({ name: 1 })
            .limit(100);

        res.json({
            success: true,
            count: members.length,
            data: members
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: err.message 
        });
    }
};

// ===============================
// GET TRAINER'S ATTENDANCE HISTORY
// ===============================
exports.getTrainerAttendanceHistory = async (req, res) => {
    try {
        const trainerId = req.user.id;
        const { 
            startDate, 
            endDate, 
            attendanceType,
            limit = 50, 
            page = 1 
        } = req.query;

        // Build query
        let query = { trainer: trainerId };

        // Filter by attendance type
        if (attendanceType) {
            query.attendanceType = attendanceType;
        } else {
            // Default to trainer attendance types only
            query.attendanceType = { $in: ['trainer_gym_visit', 'trainer_personal_training'] };
        }

        // Add date filters if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const total = await Attendance.countDocuments(query);

        // Get attendance records
        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('member', 'name email')
            .populate('trainer', 'name email')
            .lean();

        // Calculate statistics
        const gymVisits = attendance.filter(a => a.attendanceType === 'trainer_gym_visit').length;
        const trainingSessions = attendance.filter(a => a.attendanceType === 'trainer_personal_training').length;

        res.json({
            success: true,
            data: attendance,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            statistics: {
                total: total,
                gymVisits: gymVisits,
                personalTrainingSessions: trainingSessions
            }
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: err.message 
        });
    }
};

// ===============================
// GET TODAY'S MEMBER STATUS
// ===============================
exports.getTodayStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { memberId } = req.query;

        let targetMemberId = userId;

        if (userRole === 'admin' && memberId) {
            targetMemberId = memberId;
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const existingAttendance = await Attendance.findOne({
            member: targetMemberId,
            date: { $gte: todayStart, $lt: todayEnd }
        });

        res.json({
            success: true,
            marked: !!existingAttendance,
            message: existingAttendance 
                ? "Attendance already marked for today" 
                : "Attendance not marked yet for today",
            data: existingAttendance
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: err.message 
        });
    }
};

// ===============================
// GET TODAY'S TRAINER STATUS
// ===============================
exports.getTrainerTodayStatus = async (req, res) => {
    try {
        const trainerId = req.user.id;
        
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        // Check gym visit for today
        const gymVisit = await Attendance.findOne({
            trainer: trainerId,
            attendanceType: 'trainer_gym_visit',
            date: { $gte: todayStart, $lt: todayEnd }
        });

        // Get personal training sessions for today
        const personalSessions = await Attendance.find({
            trainer: trainerId,
            attendanceType: 'trainer_personal_training',
            date: { $gte: todayStart, $lt: todayEnd }
        }).populate('member', 'name');

        res.json({
            success: true,
            today: {
                date: todayStart,
                gymVisitMarked: !!gymVisit,
                gymVisit: gymVisit,
                personalSessions: personalSessions.length,
                personalSessionsList: personalSessions
            },
            message: gymVisit 
                ? "Gym visit already marked for today" 
                : "Gym visit not marked yet for today"
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: err.message 
        });
    }
};

// ===============================
// GET ATTENDANCE HISTORY WITH FILTERS
// ===============================
exports.getAttendanceHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { 
            startDate, 
            endDate, 
            limit = 30, 
            page = 1,
            memberId: queryMemberId 
        } = req.query;

        let targetMemberId = userId;

        // Admins can view any member's history
        if (userRole === 'admin' && queryMemberId) {
            targetMemberId = queryMemberId;
        }

        // Build query
        let query = { member: targetMemberId };

        // Add date filters if provided
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                query.date.$gte = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const total = await Attendance.countDocuments(query);

        // Get attendance records
        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('member', 'name email')
            .populate('classId', 'name date time')
            .populate('markedBy', 'name email')
            .lean();

        // Calculate statistics
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;
        const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;

        res.json({
            success: true,
            data: attendance,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            statistics: {
                total: total,
                present: presentCount,
                absent: absentCount,
                attendanceRate: `${attendanceRate}%`
            }
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: err.message 
        });
    }
};

// ===============================
// GET ATTENDANCE STATISTICS
// ===============================
exports.getAttendanceStatistics = async (req, res) => {
    try {
        const { memberId } = req.params;
        const { period = 'month' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ success: false, message: "Invalid member ID" });
        }

        // Check if member exists
        const member = await Member.findById(memberId);
        if (!member) {
            return res.status(404).json({ success: false, message: "Member not found" });
        }

        let startDate = new Date();
        
        switch (period) {
            case 'day':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(startDate.getMonth() - 1);
        }

        const attendance = await Attendance.find({
            member: memberId,
            date: { $gte: startDate }
        }).sort({ date: -1 });

        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'present').length;
        const absent = attendance.filter(a => a.status === 'absent').length;
        const rate = total > 0 ? (present / total * 100).toFixed(1) : 0;

        // Check today's attendance
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const todayAttendance = await Attendance.findOne({
            member: memberId,
            date: { $gte: todayStart, $lt: todayEnd }
        });

        res.json({
            success: true,
            member: {
                id: member._id,
                name: member.name,
                email: member.email
            },
            period: period,
            dateRange: {
                from: startDate,
                to: new Date()
            },
            todayStatus: {
                marked: !!todayAttendance,
                attendance: todayAttendance
            },
            statistics: {
                total: total,
                present: present,
                absent: absent,
                attendanceRate: `${rate}%`
            },
            recentAttendance: attendance.slice(0, 10)
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: err.message 
        });
    }
};

// ===============================
// GET ALL ATTENDANCE (ADMIN)
// ===============================
exports.getAllAttendance = async (req, res) => {
    try {
        const { 
            date, 
            status, 
            memberId,
            trainerId,
            attendanceType,
            page = 1, 
            limit = 50 
        } = req.query;

        let query = {};

        // Date filter
        if (date) {
            const searchDate = new Date(date);
            searchDate.setHours(0, 0, 0, 0);
            const nextDate = new Date(searchDate);
            nextDate.setDate(nextDate.getDate() + 1);
            query.date = { $gte: searchDate, $lt: nextDate };
        }

        // Status filter
        if (status === 'present' || status === 'absent') {
            query.status = status;
        }

        // Member filter
        if (memberId) {
            if (!mongoose.Types.ObjectId.isValid(memberId)) {
                return res.status(400).json({ success: false, message: "Invalid member ID" });
            }
            query.member = memberId;
        }

        // Trainer filter
        if (trainerId) {
            if (!mongoose.Types.ObjectId.isValid(trainerId)) {
                return res.status(400).json({ success: false, message: "Invalid trainer ID" });
            }
            query.trainer = trainerId;
        }

        // Attendance type filter
        if (attendanceType) {
            query.attendanceType = attendanceType;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const total = await Attendance.countDocuments(query);

        // Get attendance records
        const attendance = await Attendance.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('member', 'name email membershipType')
            .populate('trainer', 'name email specialization')
            .populate('classId', 'name date time')
            .populate('markedBy', 'name email role')
            .lean();

        // Calculate statistics
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const absentCount = attendance.filter(a => a.status === 'absent').length;

        // Calculate by type
        const gymVisits = attendance.filter(a => a.attendanceType === 'gym_visit').length;
        const classAttendance = attendance.filter(a => a.attendanceType === 'class').length;
        const trainerGymVisits = attendance.filter(a => a.attendanceType === 'trainer_gym_visit').length;
        const trainerTraining = attendance.filter(a => a.attendanceType === 'trainer_personal_training').length;

        res.json({
            success: true,
            count: attendance.length,
            total: total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            statistics: {
                present: presentCount,
                absent: absentCount,
                total: attendance.length,
                byType: {
                    gymVisits: gymVisits,
                    classAttendance: classAttendance,
                    trainerGymVisits: trainerGymVisits,
                    trainerPersonalTraining: trainerTraining
                }
            },
            data: attendance
        });

    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Server error", 
            error: err.message 
        });
    }
};