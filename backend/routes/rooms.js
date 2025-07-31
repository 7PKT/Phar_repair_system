// routes/rooms.js (Fixed version)
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// ✅ แก้ไขการ import auth middleware
let auth = null;
let authenticateToken = null;
let requireRole = null;

try {
    // ลองใช้ newer auth middleware structure
    const authMiddleware = require('../middleware/auth');
    
    if (authMiddleware.authenticateToken && typeof authMiddleware.authenticateToken === 'function') {
        authenticateToken = authMiddleware.authenticateToken;
        auth = authenticateToken; // backward compatibility
        requireRole = authMiddleware.requireRole;
        console.log('✅ Auth middleware loaded successfully (new structure)');
    } else if (typeof authMiddleware === 'function') {
        // legacy single function export
        auth = authMiddleware;
        authenticateToken = authMiddleware;
        console.log('✅ Auth middleware loaded successfully (legacy structure)');
    } else {
        throw new Error('Auth middleware structure not recognized');
    }
} catch (error) {
    console.error('⚠️ Error loading auth middleware:', error.message);
    console.log('🔧 Using fallback auth middleware (admin access for development)');
    
    // Fallback auth middleware for development
    auth = (req, res, next) => {
        req.user = { 
            id: 1, 
            role: 'admin', 
            username: 'admin',
            email: 'admin@example.com'
        };
        next();
    };
    
    authenticateToken = auth;
    requireRole = (roles) => (req, res, next) => next();
}

// ✅ แก้ไข Database connection
const createConnection = async () => {
    try {
        return await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'repair_system',
            charset: 'utf8mb4'
        });
    } catch (error) {
        console.error('Database connection error:', error.message);
        throw error;
    }
};

// ✅ Get all active rooms
router.get('/', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();

        const [rooms] = await connection.execute(`
            SELECT id, name, building, floor, description, is_active, created_at, updated_at
            FROM rooms 
            WHERE is_active = 1
            ORDER BY building, floor, name
        `);

        await connection.end();

        res.json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ✅ Get rooms by building and floor (query parameters)
router.get('/by-building-floor', authenticateToken, async (req, res) => {
    try {
        const { building, floor } = req.query;

        if (!building || !floor) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุอาคารและชั้น'
            });
        }

        const buildingNum = parseInt(building);
        const floorNum = parseInt(floor);

        if (isNaN(buildingNum) || isNaN(floorNum)) {
            return res.status(400).json({
                success: false,
                message: 'อาคารและชั้นต้องเป็นตัวเลข'
            });
        }

        const connection = await createConnection();

        const [rooms] = await connection.execute(`
            SELECT id, name, building, floor, description
            FROM rooms 
            WHERE building = ? AND floor = ? AND is_active = 1
            ORDER BY name
        `, [buildingNum, floorNum]);

        await connection.end();

        res.json({
            success: true,
            data: rooms,
            building: buildingNum,
            floor: floorNum,
            count: rooms.length
        });
    } catch (error) {
        console.error('Error fetching rooms by building and floor:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง'
        });
    }
});

// ✅ Get all buildings
router.get('/buildings', authenticateToken, async (req, res) => {
    try {
        const connection = await createConnection();

        const [buildings] = await connection.execute(`
            SELECT DISTINCT building
            FROM rooms 
            WHERE is_active = 1
            ORDER BY building
        `);

        await connection.end();

        res.json({
            success: true,
            data: buildings
        });
    } catch (error) {
        console.error('Error fetching buildings:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอาคาร'
        });
    }
});

// ✅ Get floors by building (query parameter version)
router.get('/floors', authenticateToken, async (req, res) => {
    try {
        const { building } = req.query;

        if (!building) {
            return res.status(400).json({
                success: false,
                message: 'กรุณาระบุหมายเลขอาคาร'
            });
        }

        const buildingNum = parseInt(building);

        if (isNaN(buildingNum)) {
            return res.status(400).json({
                success: false,
                message: 'อาคารต้องเป็นตัวเลข'
            });
        }

        const connection = await createConnection();

        const [floors] = await connection.execute(`
            SELECT DISTINCT floor
            FROM rooms 
            WHERE building = ? AND is_active = 1
            ORDER BY floor
        `, [buildingNum]);

        await connection.end();

        res.json({
            success: true,
            data: floors,
            building: buildingNum
        });
    } catch (error) {
        console.error('Error fetching floors:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลชั้น'
        });
    }
});

// ✅ Get floors by building (URL parameter version - แก้ไขปัญหา path-to-regexp)
router.get('/floors/:building', authenticateToken, async (req, res) => {
    try {
        const building = parseInt(req.params.building);

        if (isNaN(building)) {
            return res.status(400).json({
                success: false,
                message: 'อาคารต้องเป็นตัวเลข'
            });
        }

        const connection = await createConnection();

        const [floors] = await connection.execute(`
            SELECT DISTINCT floor
            FROM rooms 
            WHERE building = ? AND is_active = 1
            ORDER BY floor
        `, [building]);

        await connection.end();

        res.json({
            success: true,
            data: floors.map(row => row.floor),
            building: building
        });
    } catch (error) {
        console.error('Error fetching floors:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการดึงข้อมูลชั้น'
        });
    }
});

// ✅ Create new room (Admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        // Check admin role if requireRole is available
        if (requireRole && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์เข้าถึง'
            });
        }

        const { name, building, floor, description } = req.body;

        if (!name || !building || floor === undefined) {
            return res.status(400).json({
                success: false,
                message: 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อห้อง, อาคาร, ชั้น)'
            });
        }

        const connection = await createConnection();

        // Check if room already exists
        const [existing] = await connection.execute(`
            SELECT id FROM rooms 
            WHERE name = ? AND building = ? AND floor = ? AND is_active = 1
        `, [name, building, floor]);

        if (existing.length > 0) {
            await connection.end();
            return res.status(409).json({
                success: false,
                message: 'ห้องนี้มีอยู่แล้วในอาคารและชั้นที่ระบุ'
            });
        }

        // Create new room
        const [result] = await connection.execute(`
            INSERT INTO rooms (name, building, floor, description, is_active)
            VALUES (?, ?, ?, ?, 1)
        `, [name, building, floor, description || null]);

        await connection.end();

        res.status(201).json({
            success: true,
            message: 'เพิ่มห้องสำเร็จ',
            data: {
                id: result.insertId,
                name,
                building,
                floor,
                description
            }
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเพิ่มห้อง'
        });
    }
});

// ✅ Update room (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        // Check admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์เข้าถึง'
            });
        }

        const roomId = parseInt(req.params.id);
        const { name, building, floor, description, is_active } = req.body;

        if (isNaN(roomId)) {
            return res.status(400).json({
                success: false,
                message: 'ID ห้องไม่ถูกต้อง'
            });
        }

        const connection = await createConnection();

        // Check if room exists
        const [room] = await connection.execute(`
            SELECT id FROM rooms WHERE id = ?
        `, [roomId]);

        if (room.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบห้องที่ระบุ'
            });
        }

        // Update room
        const [result] = await connection.execute(`
            UPDATE rooms 
            SET name = ?, building = ?, floor = ?, description = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        `, [name, building, floor, description || null, is_active !== undefined ? is_active : 1, roomId]);

        await connection.end();

        res.json({
            success: true,
            message: 'อัปเดตข้อมูลห้องสำเร็จ'
        });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลห้อง'
        });
    }
});

// ✅ Delete room (soft delete - Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Check admin role
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'ไม่มีสิทธิ์เข้าถึง'
            });
        }

        const roomId = parseInt(req.params.id);

        if (isNaN(roomId)) {
            return res.status(400).json({
                success: false,
                message: 'ID ห้องไม่ถูกต้อง'
            });
        }

        const connection = await createConnection();

        // Check if room exists and is active
        const [room] = await connection.execute(`
            SELECT id FROM rooms WHERE id = ? AND is_active = 1
        `, [roomId]);

        if (room.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'ไม่พบห้องที่ระบุ'
            });
        }

        // Soft delete room
        await connection.execute(`
            UPDATE rooms 
            SET is_active = 0, updated_at = NOW()
            WHERE id = ?
        `, [roomId]);

        await connection.end();

        res.json({
            success: true,
            message: 'ลบห้องสำเร็จ'
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการลบห้อง'
        });
    }
});

// ✅ Debug endpoint to check rooms structure
router.get('/debug/info', (req, res) => {
    res.json({
        message: 'Rooms route debug info',
        authMiddleware: {
            loaded: !!auth,
            type: typeof auth,
            authenticateToken: !!authenticateToken,
            requireRole: !!requireRole
        },
        routes: [
            'GET /',
            'GET /by-building-floor',
            'GET /buildings', 
            'GET /floors',
            'GET /floors/:building',
            'POST /',
            'PUT /:id',
            'DELETE /:id'
        ],
        environment: process.env.NODE_ENV || 'development'
    });
});

module.exports = router;