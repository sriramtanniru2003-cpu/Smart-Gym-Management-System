// controllers/class.controller.js
const Class = require('../models/Class');

// CREATE CLASS
exports.createClass = async (req, res) => {
    try {
        const newClass = new Class(req.body);
        await newClass.save();
        res.status(201).json(newClass);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// GET ALL CLASSES
exports.getAllClasses = async (req, res) => {
    try {
        const classes = await Class.find()
            .populate('trainerId', 'name email')
            .populate('members', 'name email');
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET CLASS BY ID
exports.getClassById = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id)
            .populate('trainerId', 'name email')
            .populate('members', 'name email');
        if (!classItem) return res.status(404).json({ message: "Class not found" });
        res.json(classItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET MY CLASSES (for members)
exports.getMyClasses = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const classes = await Class.find({
            members: userId
        })
        .populate('trainerId', 'name email')
        .sort({ createdAt: -1 });
        
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ENROLL IN CLASS
exports.enrollInClass = async (req, res) => {
    try {
        const classId = req.params.id;
        const userId = req.user.id;
        
        const classItem = await Class.findById(classId);
        if (!classItem) {
            return res.status(404).json({ message: "Class not found" });
        }
        
        if (classItem.members.includes(userId)) {
            return res.status(400).json({ message: "Already enrolled in this class" });
        }
        
        if (classItem.members.length >= classItem.capacity) {
            return res.status(400).json({ message: "Class is full" });
        }
        
        classItem.members.push(userId);
        await classItem.save();
        
        res.json({ 
            message: "Successfully enrolled in class", 
            class: classItem 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UNENROLL FROM CLASS
exports.unenrollFromClass = async (req, res) => {
    try {
        const classId = req.params.id;
        const userId = req.user.id;
        
        const classItem = await Class.findById(classId);
        if (!classItem) {
            return res.status(404).json({ message: "Class not found" });
        }
        
        if (!classItem.members.includes(userId)) {
            return res.status(400).json({ message: "Not enrolled in this class" });
        }
        
        classItem.members = classItem.members.filter(
            memberId => memberId.toString() !== userId.toString()
        );
        
        await classItem.save();
        
        res.json({ 
            message: "Successfully unenrolled from class", 
            class: classItem 
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE CLASS
exports.updateClass = async (req, res) => {
    try {
        const classItem = await Class.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(classItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE CLASS
exports.deleteClass = async (req, res) => {
    try {
        await Class.findByIdAndDelete(req.params.id);
        res.json({ message: "Class deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};