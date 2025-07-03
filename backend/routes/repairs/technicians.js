const express = require('express');
const db = require('../../config/database');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
    try {
        const [technicians] = await db.execute(`
            SELECT id, full_name, username, role 
            FROM users 
            WHERE role IN ('admin', 'technician')
            ORDER BY full_name ASC
        `);

        console.log('👷 ช่างเทคนิคที่ดึงมา:', technicians.length);
        res.json(technicians);
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงรายชื่อช่างเทคนิค:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;