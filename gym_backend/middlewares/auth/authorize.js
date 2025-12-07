function authorize(roles = []) {
    if (typeof roles === "string") roles = [roles];

    return (req, res, next) => {
      

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Convert both to lowercase for case-insensitive comparison
        const userRole = req.user.role?.toLowerCase();
        const requiredRoles = roles.map(role => role.toLowerCase());
        
  

        if (!requiredRoles.includes(userRole)) {
            console.log(`❌ Access denied: "${userRole}" not in ${JSON.stringify(requiredRoles)}`);
            return res.status(403).json({ 
                message: "Forbidden: Access denied",
                details: {
                    yourRole: req.user.role,
                    requiredRoles: roles
                }
            });
        }

        console.log("✅ Authorization passed");
        next();
    };
}

module.exports = authorize;