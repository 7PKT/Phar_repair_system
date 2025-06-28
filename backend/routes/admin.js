const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// ========================
// USER MANAGEMENT
// ========================

// Get all users
router.get('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT id, email, full_name, username, phone, role, last_login, created_at, updated_at
            FROM users 
            ORDER BY created_at DESC
        `);
        
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create new user
router.post('/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { username, email, full_name, phone, role, password } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!username || !email || !full_name || !role || !password) {
            return res.status(400).json({ 
                message: 'กรุณากรอกข้อมูลที่จำเป็น: ชื่อผู้ใช้, อีเมล, ชื่อ-นามสกุล, บทบาท, รหัสผ่าน' 
            });
        }

        // ตรวจสอบ role ที่ถูกต้อง
        const validRoles = ['user', 'technician', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                message: 'บทบาทไม่ถูกต้อง ต้องเป็น user, technician หรือ admin' 
            });
        }

        // ตรวจสอบรหัสผ่าน
        if (password.length < 6) {
            return res.status(400).json({ 
                message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' 
            });
        }

        // ตรวจสอบว่า email และ username ซ้ำหรือไม่
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        }

        // เข้ารหัสรหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 10);

        // บันทึกผู้ใช้ใหม่
        const [result] = await db.execute(
            'INSERT INTO users (username, email, full_name, phone, role, password) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, full_name, phone || null, role, hashedPassword]
        );

        res.status(201).json({
            message: 'สร้างผู้ใช้สำเร็จ',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Create user error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        } else {
            res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
        }
    }
});

// Update user
router.put('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, full_name, phone, role, password } = req.body;

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!username || !email || !full_name || !role) {
            return res.status(400).json({ 
                message: 'กรุณากรอกข้อมูลที่จำเป็น: ชื่อผู้ใช้, อีเมล, ชื่อ-นามสกุล, บทบาท' 
            });
        }

        // ตรวจสอบ role ที่ถูกต้อง
        const validRoles = ['user', 'technician', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                message: 'บทบาทไม่ถูกต้อง ต้องเป็น user, technician หรือ admin' 
            });
        }

        // ตรวจสอบว่า user มีอยู่หรือไม่
        const [users] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
        }

        // ป้องกันการแก้ไข admin หลัก (ID = 1)
        if (id == 1 && role !== 'admin') {
            return res.status(400).json({ message: 'ไม่สามารถเปลี่ยนบทบาทของผู้ดูแลหลักได้' });
        }

        // ตรวจสอบว่า email และ username ซ้ำกับคนอื่นหรือไม่
        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
            [email, username, id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        }

        // อัพเดทข้อมูลผู้ใช้
        let updateQuery = 'UPDATE users SET username = ?, email = ?, full_name = ?, phone = ?, role = ?, updated_at = NOW()';
        let updateParams = [username, email, full_name, phone || null, role];

        // ถ้ามีการเปลี่ยนรหัสผ่าน
        if (password && password.trim()) {
            if (password.length < 6) {
                return res.status(400).json({ 
                    message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' 
                });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            updateQuery += ', password = ?';
            updateParams.push(hashedPassword);
        }

        updateQuery += ' WHERE id = ?';
        updateParams.push(id);

        await db.execute(updateQuery, updateParams);

        res.json({ message: 'อัพเดทผู้ใช้สำเร็จ' });
    } catch (error) {
        console.error('Update user error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'อีเมลหรือชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
        } else {
            res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
        }
    }
});

// Delete user
router.delete('/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // ป้องกันการลบ admin หลัก (ID = 1)
        if (id == 1) {
            return res.status(400).json({ message: 'ไม่สามารถลบผู้ดูแลหลักได้' });
        }

        // ป้องกันการลบตัวเอง
        if (id == req.user.id) {
            return res.status(400).json({ message: 'ไม่สามารถลบบัญชีของตัวเองได้' });
        }

        // ตรวจสอบว่า user มีอยู่หรือไม่
        const [users] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
        }

        // ตรวจสอบว่ามี repair requests ที่เกี่ยวข้องหรือไม่
        const [repairs] = await db.execute(
            'SELECT id FROM repair_requests WHERE requester_id = ? OR assigned_to = ?',
            [id, id]
        );

        if (repairs.length > 0) {
            return res.status(400).json({ 
                message: 'ไม่สามารถลบผู้ใช้นี้ได้ เนื่องจากมีการแจ้งซ่อมที่เกี่ยวข้อง' 
            });
        }

        // ลบผู้ใช้
        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ========================
// SYSTEM STATS
// ========================

// Get system stats
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        // นับจำนวน users
        const [userCount] = await db.execute('SELECT COUNT(*) as count FROM users');
        
        // นับจำนวน repair requests
        const [repairCount] = await db.execute('SELECT COUNT(*) as count FROM repair_requests');
        
        // นับจำนวน repair requests ตาม status
        const [statusStats] = await db.execute(`
            SELECT status, COUNT(*) as count 
            FROM repair_requests 
            GROUP BY status
        `);
        
        // นับจำนวน repair requests วันนี้
        const [todayRepairs] = await db.execute(`
            SELECT COUNT(*) as count 
            FROM repair_requests 
            WHERE DATE(created_at) = CURDATE()
        `);

        // นับจำนวน users ตาม role
        const [roleStats] = await db.execute(`
            SELECT role, COUNT(*) as count 
            FROM users 
            GROUP BY role
        `);

        res.json({
            totalUsers: userCount[0].count,
            totalRepairs: repairCount[0].count,
            todayRepairs: todayRepairs[0].count,
            statusBreakdown: statusStats,
            roleBreakdown: roleStats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ========================
// CATEGORY MANAGEMENT
// ========================

// Get categories - อนุญาตให้ user ทั่วไปเข้าถึงได้
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const [categories] = await db.execute(`
            SELECT id, name, description 
            FROM categories 
            ORDER BY name
        `);
        
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Create category - เฉพาะ admin
router.post('/categories', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'กรุณากรอกชื่อหมวดหมู่' });
        }

        // ตรวจสอบว่าชื่อซ้ำหรือไม่
        const [existing] = await db.execute(
            'SELECT id FROM categories WHERE name = ?',
            [name.trim()]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' });
        }

        const [result] = await db.execute(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name.trim(), description?.trim() || null]
        );

        res.status(201).json({
            message: 'สร้างหมวดหมู่สำเร็จ',
            categoryId: result.insertId
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Update category - เฉพาะ admin
router.put('/categories/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'กรุณากรอกชื่อหมวดหมู่' });
        }

        // ตรวจสอบว่าหมวดหมู่มีอยู่หรือไม่
        const [categories] = await db.execute('SELECT id FROM categories WHERE id = ?', [id]);
        if (categories.length === 0) {
            return res.status(404).json({ message: 'ไม่พบหมวดหมู่นี้' });
        }

        // ตรวจสอบว่าชื่อซ้ำกับหมวดหมู่อื่นหรือไม่
        const [existing] = await db.execute(
            'SELECT id FROM categories WHERE name = ? AND id != ?',
            [name.trim(), id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'ชื่อหมวดหมู่นี้มีอยู่แล้ว' });
        }

        await db.execute(
            'UPDATE categories SET name = ?, description = ? WHERE id = ?',
            [name.trim(), description?.trim() || null, id]
        );

        res.json({ message: 'อัพเดทหมวดหมู่สำเร็จ' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// Delete category - เฉพาะ admin
router.delete('/categories/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;

        // ตรวจสอบว่ามี repair requests ที่ใช้ category นี้หรือไม่
        const [repairs] = await db.execute(
            'SELECT id FROM repair_requests WHERE category_id = ?',
            [id]
        );

        if (repairs.length > 0) {
            return res.status(400).json({ 
                message: 'ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากมีการแจ้งซ่อมที่ใช้หมวดหมู่นี้อยู่' 
            });
        }

        const [result] = await db.execute('DELETE FROM categories WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'ไม่พบหมวดหมู่นี้' });
        }

        res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ========================
// LEGACY ROUTES (เก่า - เพื่อให้ compatible)
// ========================

// Update user role - เฉพาะ admin (เก่า - ใช้ PUT /users/:id แทน)
router.put('/users/:id/role', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // ตรวจสอบ role ที่ได้รับ
        const validRoles = ['user', 'technician', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                message: 'Role ไม่ถูกต้อง ต้องเป็น user, technician หรือ admin' 
            });
        }

        // ตรวจสอบว่า user มีอยู่หรือไม่
        const [users] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });
        }

        // ป้องกันการแก้ไข admin หลัก (ID = 1)
        if (id == 1 && role !== 'admin') {
            return res.status(400).json({ message: 'ไม่สามารถเปลี่ยนบทบาทของผู้ดูแลหลักได้' });
        }

        // อัพเดท role
        await db.execute(
            'UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?',
            [role, id]
        );

        res.json({ message: 'อัพเดท role สำเร็จ' });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;