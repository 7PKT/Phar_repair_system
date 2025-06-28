const jwt = require('jsonwebtoken');

// Middleware สำหรับตรวจสอบ JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token ไม่ถูกต้อง' });
        }
        
        req.user = user;
        next();
    });
};

// Middleware สำหรับตรวจสอบบท     บาท
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};