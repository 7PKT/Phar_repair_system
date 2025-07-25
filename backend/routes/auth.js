const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password, full_name, username, phone } = req.body;

        if (!email || !password || !full_name || !username) {
            return res.status(400).json({ 
                message: 'กรุณากรอกข้อมูลที่จำเป็น: อีเมล, รหัสผ่าน, ชื่อ-นามสกุล, ชื่อผู้ใช้' 
            });
        }

        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO users (email, password, full_name, username, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, full_name, username, phone || null, 'user']
        );

        res.status(201).json({ 
            message: 'สมัครสมาชิกสำเร็จ',
            userId: result.insertId 
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
    }
});


router.post('/login', async (req, res) => {
    try {
        const { email, username, password } = req.body;

        const loginIdentifier = email || username;

        console.log('🔐 Login attempt with:', { 
            loginIdentifier,
            type: email ? 'email' : 'username',
            password: password ? '***' : 'undefined' 
        });

        
        if (!loginIdentifier || !password) {
            return res.status(400).json({ 
                message: 'กรุณากรอกอีเมลหรือชื่อผู้ใช้ และรหัสผ่าน'
            });
        }

        
        console.log('🔍 Searching user in database...');
        const [users] = await db.execute(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [loginIdentifier, loginIdentifier]
        );

        if (users.length === 0) {
            console.log('❌ User not found with identifier:', loginIdentifier);
            return res.status(401).json({ message: 'อีเมลหรือชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = users[0];
        console.log('👤 User found:', { 
            id: user.id, 
            email: user.email, 
            username: user.username, 
            role: user.role 
        });

        
        console.log('🔐 Comparing passwords...');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('🔍 Password comparison result:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('❌ Invalid password for user:', user.username);
            return res.status(401).json({ message: 'อีเมลหรือชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง' });
        }

        
        await db.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        );

        
        const tokenPayload = { 
            id: user.id, 
            email: user.email, 
            username: user.username,
            role: user.role,
            full_name: user.full_name
        };

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        
        const { password: _, ...userWithoutPassword } = user;
        userWithoutPassword.last_login = new Date(); 

        console.log('✅ Login successful for:', user.username);

        res.json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาด: ' + error.message
        });
    }
});


router.get('/verify', authenticateToken, async (req, res) => {
    try {
        
        const [users] = await db.execute(
            'SELECT id, email, full_name, username, phone, role, last_login, created_at, updated_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ valid: false, message: 'ผู้ใช้ไม่พบในระบบ' });
        }

        res.json({ 
            valid: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).json({ valid: false, message: 'เกิดข้อผิดพลาด' });
    }
});


router.post('/logout', (req, res) => {
    res.json({ message: 'ออกจากระบบสำเร็จ' });
});


router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, email, full_name, username, phone, role, last_login, created_at, updated_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});


router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { full_name, username, phone } = req.body;

        
        if (!full_name || !full_name.trim()) {
            return res.status(400).json({ message: 'กรุณากรอกชื่อ-นามสกุล' });
        }

        
        if (username && username.trim()) {
            const [existingUsers] = await db.execute(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username.trim(), req.user.id]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
            }
        }

        await db.execute(
            'UPDATE users SET full_name = ?, username = ?, phone = ?, updated_at = NOW() WHERE id = ?',
            [full_name.trim(), username?.trim() || null, phone?.trim() || null, req.user.id]
        );

        res.json({ message: 'อัพเดทข้อมูลส่วนตัวสำเร็จ' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});


router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านเดิมและรหัสผ่านใหม่' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
        }

        
        const [users] = await db.execute(
            'SELECT password FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
        }

        
        const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
        if (!isValidPassword) {
            return res.status(400).json({ message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
        }

        
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        
        await db.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedNewPassword, req.user.id]
        );

        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});


router.post('/reset-password-debug', async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ message: 'Not available in production' });
        }

        const { userId, newPassword } = req.body;
        
        if (!userId || !newPassword) {
            return res.status(400).json({ message: 'กรุณาระบุ userId และ newPassword' });
        }

        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        
        await db.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        console.log(`🔐 Password updated for user ID: ${userId}`);
        console.log(`🔐 New hash: ${hashedPassword}`);

        res.json({ 
            message: 'รีเซ็ตรหัสผ่านสำเร็จ',
            hash: hashedPassword
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;