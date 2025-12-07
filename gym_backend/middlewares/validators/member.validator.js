module.exports = function validateMember(req, res, next) {
const { name, email, password } = req.body;
if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password are required' });
next();
};