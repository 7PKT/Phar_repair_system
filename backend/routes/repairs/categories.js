const express = require('express');
const db = require('../../config/database');
const { authenticateToken, requireRole } = require('../../middleware/auth'); // เพิ่ม requireRole

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const [categories] = await db.execute(`
            SELECT id, name, description, created_at,
                   (SELECT COUNT(*) FROM repair_requests WHERE category_id = categories.id) as request_count
            FROM categories 
            ORDER BY name ASC
        `);

        console.log('📋 หมวดหมู่ที่ดึงมา:', categories.length);
        res.json(categories);
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงหมวดหมู่:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'กรุณาระบุชื่อหมวดหมู่' });
        }

        const [result] = await db.execute(`
            INSERT INTO categories (name, description) VALUES (?, ?)
        `, [name.trim(), description?.trim() || null]);

        res.status(201).json({
            message: 'เพิ่มหมวดหมู่สำเร็จ',
            category: {
                id: result.insertId,
                name: name.trim(),
                description: description?.trim() || null
            }
        });
    } catch (error) {
        console.error('ข้อผิดพลาดในการสร้างหมวดหมู่:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;