const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
        console.error("❌ Auth Error: No token provided in header");
        return res.status(401).json({ message: "Không có quyền truy cập" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("❌ Auth Error: Token invalid or expired:", err.message);
        res.status(401).json({ message: "Token không hợp lệ" });
    }
};