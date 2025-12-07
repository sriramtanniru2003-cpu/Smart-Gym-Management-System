


// const express = require('express');
// const router = express.Router();

// const authenticate = require('../middlewares/auth/authenticate');
// const authorize = require('../middlewares/auth/authorize');
// const MemberController = require('../controllers/member.controller');

// // ========================================
// // DEBUG ROUTES (for testing)
// // ========================================
// router.get('/debug-auth', authenticate, (req, res) => {
//     console.log("✅ Debug route hit - Only authenticate middleware");
//     res.json({
//         success: true,
//         message: "You have access with just authenticate!",
//         user: req.user
//     });
// });

// router.get('/debug-auth-admin', authenticate, authorize('admin'), (req, res) => {
//     console.log("✅ Debug route hit - authenticate + authorize('admin')");
//     res.json({
//         success: true,
//         message: "You have access with authorize('admin')!",
//         user: req.user
//     });
// });

// router.get('/debug-auth-member', authenticate, authorize('member'), (req, res) => {
//     console.log("✅ Debug route hit - authenticate + authorize('member')");
//     res.json({
//         success: true,
//         message: "You have access with authorize('member')!",
//         user: req.user
//     });
// });

// // ========================================
// // MEMBER PROFILE ROUTES (MOST SPECIFIC - MUST COME FIRST)
// // ========================================

// // Member: Get own profile
// router.get(
//     '/profile',
//     authenticate,
//     authorize('member'),
//     MemberController.getProfile
// );

// // Member: Update own profile
// router.put(
//     '/profile',
//     authenticate,
//     authorize('member'),
//     MemberController.updateProfile
// );

// // Member: Change password
// router.put(
//     '/change-password',
//     authenticate,
//     authorize('member'),
//     MemberController.changePassword
// );

// // ========================================
// // MEMBER TRAINER ROUTES
// // ========================================

// // Member: Get all available trainers
// router.get(
//     '/trainers',
//     authenticate,
//     authorize('member'),
//     MemberController.getAllTrainers
// );

// // Member: Get my assigned trainer
// router.get(
//     '/my-trainer',
//     authenticate,
//     authorize('member'),
//     MemberController.getMyTrainer
// );

// // Member: Select a trainer
// router.post(
//     '/select-trainer',
//     authenticate,
//     authorize('member'),
//     MemberController.selectTrainer
// );

// // ========================================
// // MEMBER ATTENDANCE ROUTES (If you have these)
// // ========================================

// // Member: Get my attendance history
// router.get(
//     '/attendance',
//     authenticate,
//     authorize('member'),
//     async (req, res) => {
//         try {
//             const member = await Member.findById(req.user.id)
//                 .select('attendanceHistory')
//                 .populate('attendanceHistory.trainerId', 'name email');
            
//             res.json({
//                 success: true,
//                 data: member.attendanceHistory || []
//             });
//         } catch (err) {
//             res.status(500).json({ success: false, message: err.message });
//         }
//     }
// );

// // ========================================
// // ADMIN MEMBER MANAGEMENT ROUTES
// // ========================================

// // Admin: GET all members
// router.get(
//     '/',
//     authenticate,
//     authorize('admin'),
//     MemberController.getMembers
// );

// // Admin: GET single member by ID or email
// router.get(
//     '/get-member',
//     authenticate,
//     authorize('admin'),
//     MemberController.getMember
// );

// // Admin: Create member
// router.post(
//     '/',
//     authenticate,
//     authorize('admin'),
//     MemberController.createMember
// );

// // Admin: Delete member by ID or email
// router.delete(
//     '/',
//     authenticate,
//     authorize('admin'),
//     MemberController.deleteMember
// );

// // ========================================
// // ADMIN PARAMETERIZED ROUTES (MUST COME LAST)
// // ========================================

// // Admin: Update member by ID (PARAMETERIZED - COMES LAST)
// router.put(
//     '/:id',
//     authenticate,
//     authorize('admin'),
//     MemberController.updateMember
// );

// // ========================================
// // ADMIN TRAINER MANAGEMENT ROUTES
// // ========================================

// // Admin: Get all trainers
// router.get(
//     '/admin/trainers',
//     authenticate,
//     authorize('admin'),
//     MemberController.getTrainers
// );

// // Admin: Get single trainer by ID or email
// router.get(
//     '/admin/get-trainer',
//     authenticate,
//     authorize('admin'),
//     MemberController.getTrainer
// );

// // Admin: Create trainer
// router.post(
//     '/admin/trainers',
//     authenticate,
//     authorize('admin'),
//     MemberController.createTrainer
// );

// // Admin: Update trainer by ID
// router.put(
//     '/admin/trainers/:id',
//     authenticate,
//     authorize('admin'),
//     MemberController.updateTrainer
// );

// // Admin: Delete trainer by ID or email
// router.delete(
//     '/admin/trainers',
//     authenticate,
//     authorize('admin'),
//     MemberController.deleteTrainer
// );

// // ========================================
// // MEMBERSHIP ROUTES (Optional)
// // ========================================

// // Check membership status
// router.get(
//     '/membership/status',
//     authenticate,
//     authorize('member'),
//     async (req, res) => {
//         try {
//             const member = await Member.findById(req.user.id)
//                 .select('membershipType startDate endDate');
            
//             const isActive = member.isMembershipActive ? member.isMembershipActive() : false;
//             const daysRemaining = member.getMembershipDaysRemaining ? member.getMembershipDaysRemaining() : 0;
            
//             res.json({
//                 success: true,
//                 data: {
//                     membershipType: member.membershipType,
//                     startDate: member.startDate,
//                     endDate: member.endDate,
//                     isActive: isActive,
//                     daysRemaining: daysRemaining
//                 }
//             });
//         } catch (err) {
//             res.status(500).json({ success: false, message: err.message });
//         }
//     }
// );


// // Add this to your members.routes.js, after admin routes

// // ========================================
// // ADMIN DASHBOARD STATISTICS ROUTES
// // ========================================

// // Get dashboard statistics
// router.get(
//   '/admin/stats',
//   authenticate,
//   authorize('admin'),
//   async (req, res) => {
//     try {
//       const Member = require('../models/Member');
//       const Attendance = require('../models/Attendance');
//       const Class = require('../models/Class');
      
//       // Get total members
//       const totalMembers = await Member.countDocuments({ role: 'member' });
      
//       // Get total trainers
//       const totalTrainers = await Member.countDocuments({ role: 'trainer' });
      
//       // Get today's attendance
//       const todayStart = new Date();
//       todayStart.setHours(0, 0, 0, 0);
//       const todayEnd = new Date(todayStart);
//       todayEnd.setDate(todayEnd.getDate() + 1);
      
//       const todayAttendance = await Attendance.countDocuments({
//         date: { $gte: todayStart, $lt: todayEnd },
//         status: 'present'
//       });
      
//       // Get active classes (classes today or future)
//       const activeClasses = await Class.countDocuments({
//         date: { $gte: new Date() }
//       });
      
//       res.json({
//         success: true,
//         stats: {
//           totalMembers,
//           totalTrainers,
//           todayAttendance,
//           activeClasses,
//           revenue: 12500, // Mock - add actual revenue logic
//           attendanceRate: 85 // Mock - add calculation
//         }
//       });
//     } catch (error) {
//       console.error('Error getting dashboard stats:', error);
//       res.status(500).json({ success: false, message: error.message });
//     }
//   }
// );
// module.exports = router;



const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

const authenticate = require('../middlewares/auth/authenticate');
const authorize = require('../middlewares/auth/authorize');
const MemberController = require('../controllers/member.controller');

// ========================================
// DEBUG ROUTES (for testing)
// ========================================
router.get('/debug-auth', authenticate, (req, res) => {
    console.log("✅ Debug route hit - Only authenticate middleware");
    res.json({
        success: true,
        message: "You have access with just authenticate!",
        user: req.user
    });
});

router.get('/debug-auth-admin', authenticate, authorize('admin'), (req, res) => {
    console.log("✅ Debug route hit - authenticate + authorize('admin')");
    res.json({
        success: true,
        message: "You have access with authorize('admin')!",
        user: req.user
    });
});

router.get('/debug-auth-member', authenticate, authorize('member'), (req, res) => {
    console.log("✅ Debug route hit - authenticate + authorize('member')");
    res.json({
        success: true,
        message: "You have access with authorize('member')!",
        user: req.user
    });
});

// ========================================
// MEMBER PROFILE ROUTES (MOST SPECIFIC - MUST COME FIRST)
// ========================================

// Member: Get own profile
router.get(
    '/profile',
    authenticate,
    authorize('member'),
    MemberController.getProfile
);

// Member: Update own profile
router.put(
    '/profile',
    authenticate,
    authorize('member'),
    MemberController.updateProfile
);

// Member: Change password
router.put(
    '/change-password',
    authenticate,
    authorize('member'),
    MemberController.changePassword
);

// ========================================
// MEMBER TRAINER ROUTES
// ========================================

// Member: Get all available trainers
router.get(
    '/trainers',
    authenticate,
    authorize('member'),
    MemberController.getAllTrainers
);

// Member: Get my assigned trainer
router.get(
    '/my-trainer',
    authenticate,
    authorize('member'),
    MemberController.getMyTrainer
);

// Member: Select a trainer
router.post(
    '/select-trainer',
    authenticate,
    authorize('member'),
    MemberController.selectTrainer
);

// ========================================
// MEMBER ATTENDANCE & STATS ROUTES
// ========================================

// Member: Get my attendance history
router.get(
    '/attendance',
    authenticate,
    authorize('member'),
    async (req, res) => {
        try {
            const member = await Member.findById(req.user.id)
                .select('attendanceHistory')
                .populate('attendanceHistory.trainerId', 'name email');
            
            res.json({
                success: true,
                data: member.attendanceHistory || []
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
);

// Member: Get my statistics
router.get(
    '/stats',
    authenticate,
    authorize('member'),
    MemberController.getMemberStats
);

// ========================================
// MEMBERSHIP ROUTES
// ========================================

// Check membership status
router.get(
    '/membership/status',
    authenticate,
    authorize('member'),
    async (req, res) => {
        try {
            const member = await Member.findById(req.user.id)
                .select('membershipType startDate endDate');
            
            const isActive = member.isMembershipActive ? member.isMembershipActive() : false;
            const daysRemaining = member.getMembershipDaysRemaining ? member.getMembershipDaysRemaining() : 0;
            
            res.json({
                success: true,
                data: {
                    membershipType: member.membershipType,
                    startDate: member.startDate,
                    endDate: member.endDate,
                    isActive: isActive,
                    daysRemaining: daysRemaining
                }
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
);

// ========================================
// ADMIN MEMBER MANAGEMENT ROUTES
// ========================================

// Admin: GET all members with pagination & search
router.get(
    '/admin/members',
    authenticate,
    authorize('admin'),
    MemberController.getMembers
);

// Admin: GET single member by ID
router.get(
    '/admin/member/:id',
    authenticate,
    authorize('admin'),
    MemberController.getMember
);

// Admin: Create new member
router.post(
    '/admin/member/create',
    authenticate,
    authorize('admin'),
    MemberController.createMember
);

// Admin: Update member information
router.put(
    '/admin/member/:id/update',
    authenticate,
    authorize('admin'),
    MemberController.updateMember
);

// Admin: Reset member password
router.put(
    '/admin/member/:id/reset-password',
    authenticate,
    authorize('admin'),
    MemberController.resetMemberPassword
);

// Admin: Delete member
router.delete(
    '/admin/member/:id/delete',
    authenticate,
    authorize('admin'),
    MemberController.deleteMember
);

// ========================================
// ADMIN TRAINER MANAGEMENT ROUTES
// ========================================

// Admin: Get all trainers
router.get(
    '/admin/trainers',
    authenticate,
    authorize('admin'),
    MemberController.getTrainers
);

// Admin: Get single trainer by ID or email
router.get(
    '/admin/get-trainer',
    authenticate,
    authorize('admin'),
    MemberController.getTrainer
);

// Admin: Create trainer
router.post(
    '/admin/trainers',
    authenticate,
    authorize('admin'),
    MemberController.createTrainer
);

// Admin: Update trainer by ID
router.put(
    '/admin/trainers/:id',
    authenticate,
    authorize('admin'),
    MemberController.updateTrainer
);

// Admin: Delete trainer by ID or email
router.delete(
    '/admin/trainers',
    authenticate,
    authorize('admin'),
    MemberController.deleteTrainer
);

// ========================================
// ADMIN DASHBOARD STATISTICS ROUTES
// ========================================

// Get dashboard statistics
router.get(
    '/admin/stats',
    authenticate,
    authorize('admin'),
    async (req, res) => {
        try {
            const Member = require('../models/Member');
            const Attendance = require('../models/Attendance');
            const Class = require('../models/Class');
            
            // Get total members
            const totalMembers = await Member.countDocuments({ role: 'member' });
            
            // Get total trainers
            const totalTrainers = await Member.countDocuments({ role: 'trainer' });
            
            // Get today's attendance
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const todayEnd = new Date(todayStart);
            todayEnd.setDate(todayEnd.getDate() + 1);
            
            const todayAttendance = await Attendance.countDocuments({
                date: { $gte: todayStart, $lt: todayEnd },
                status: 'present'
            });
            
            // Get active classes (classes today or future)
            const activeClasses = await Class.countDocuments({
                date: { $gte: new Date() }
            });
            
            // Get new members this month
            const monthStart = new Date();
            monthStart.setDate(1);
            monthStart.setHours(0, 0, 0, 0);
            
            const newMembersThisMonth = await Member.countDocuments({
                role: 'member',
                createdAt: { $gte: monthStart }
            });
            
            // Get trainers with most classes
            const trainersWithClasses = await Member.aggregate([
                { $match: { role: 'trainer' } },
                {
                    $lookup: {
                        from: 'classes',
                        localField: '_id',
                        foreignField: 'trainerId',
                        as: 'classes'
                    }
                },
                {
                    $project: {
                        name: 1,
                        email: 1,
                        specialization: 1,
                        totalClasses: { $size: '$classes' }
                    }
                },
                { $sort: { totalClasses: -1 } },
                { $limit: 5 }
            ]);
            
            res.json({
                success: true,
                stats: {
                    totalMembers,
                    totalTrainers,
                    todayAttendance,
                    activeClasses,
                    newMembersThisMonth,
                    topTrainers: trainersWithClasses,
                    // Mock data for now
                    revenue: 12500,
                    attendanceRate: 85,
                    memberGrowth: 15.5
                }
            });
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ========================================
// ADMIN BULK OPERATIONS
// ========================================

// Admin: Export members data
router.get(
    '/admin/export',
    authenticate,
    authorize('admin'),
    async (req, res) => {
        try {
            const members = await Member.find({ role: 'member' })
                .select('-password -__v -failedLoginAttempts -accountLockedUntil')
                .populate('trainer', 'name email')
                .sort({ createdAt: -1 });
            
            // Convert to CSV or JSON format
            const data = members.map(member => ({
                id: member._id,
                name: member.name,
                email: member.email,
                phone: member.phone,
                membershipType: member.membershipType,
                startDate: member.startDate,
                endDate: member.endDate,
                trainer: member.trainer ? member.trainer.name : 'None',
                status: member.status,
                createdAt: member.createdAt
            }));
            
            res.json({
                success: true,
                data: data,
                format: 'json',
                count: data.length
            });
        } catch (error) {
            console.error('Error exporting members:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
);

// ========================================
// PUBLIC ROUTES (Must come last)
// ========================================

// Get trainer by ID (public)
router.get('/trainer/:id', MemberController.getTrainerById);

module.exports = router;