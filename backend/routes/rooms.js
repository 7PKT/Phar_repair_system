// routes/rooms.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

let auth = null;
let authenticateToken = null;
let requireRole = null;

try {
    const authMiddleware = require('../middleware/auth');
    
    if (authMiddleware.authenticateToken && typeof authMiddleware.authenticateToken === 'function') {
        authenticateToken = authMiddleware.authenticateToken;
        auth = authenticateToken;
        requireRole = authMiddleware.requireRole;
        console.log('[AUTH] Auth middleware loaded successfully (new structure)');
    } else if (typeof authMiddleware === 'function') {
        auth = authMiddleware;
        authenticateToken = authMiddleware;
        console.log('[AUTH] Auth middleware loaded successfully (legacy structure)');
    } else {
        throw new Error('Auth middleware structure not recognized');
    }
} catch (error) {
    console.error('[AUTH] Error loading auth middleware:', error.message);
    console.log('[AUTH] Using fallback auth middleware (admin access for development)');
    
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
        console.error('[ROOMS] Database connection error:', error.message);
        throw error;
    }
};

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

        console.log('[ROOMS] Fetched rooms:', rooms.length);
        res.json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('[ROOMS] Error fetching rooms:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rooms',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

router.get('/by-building-floor', authenticateToken, async (req, res) => {
    try {
        const { building, floor } = req.query;

        if (!building || !floor) {
            return res.status(400).json({
                success: false,
                message: 'Building and floor required'
            });
        }

        const buildingNum = parseInt(building);
        const floorNum = parseInt(floor);

        if (isNaN(buildingNum) || isNaN(floorNum)) {
            return res.status(400).json({
                success: false,
                message: 'Building and floor must be numbers'
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

        console.log('[ROOMS] Fetched rooms for building', buildingNum, 'floor', floorNum, ':', rooms.length);
        res.json({
            success: true,
            data: rooms,
            building: buildingNum,
            floor: floorNum,
            count: rooms.length
        });
    } catch (error) {
        console.error('[ROOMS] Error fetching rooms by building and floor:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rooms'
        });
    }
});

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

        console.log('[ROOMS] Fetched buildings:', buildings.length);
        res.json({
            success: true,
            data: buildings
        });
    } catch (error) {
        console.error('[ROOMS] Error fetching buildings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching buildings'
        });
    }
});

router.get('/floors', authenticateToken, async (req, res) => {
    try {
        const { building } = req.query;

        if (!building) {
            return res.status(400).json({
                success: false,
                message: 'Building number required'
            });
        }

        const buildingNum = parseInt(building);

        if (isNaN(buildingNum)) {
            return res.status(400).json({
                success: false,
                message: 'Building must be a number'
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

        console.log('[ROOMS] Fetched floors for building', buildingNum, ':', floors.length);
        res.json({
            success: true,
            data: floors,
            building: buildingNum
        });
    } catch (error) {
        console.error('[ROOMS] Error fetching floors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching floors'
        });
    }
});

router.get('/floors/:building', authenticateToken, async (req, res) => {
    try {
        const building = parseInt(req.params.building);

        if (isNaN(building)) {
            return res.status(400).json({
                success: false,
                message: 'Building must be a number'
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

        console.log('[ROOMS] Fetched floors for building', building, ':', floors.length);
        res.json({
            success: true,
            data: floors.map(row => row.floor),
            building: building
        });
    } catch (error) {
        console.error('[ROOMS] Error fetching floors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching floors'
        });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        if (requireRole && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { name, building, floor, description } = req.body;

        if (!name || !building || floor === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Name, building, and floor required'
            });
        }

        const connection = await createConnection();

        const [existing] = await connection.execute(`
            SELECT id FROM rooms 
            WHERE name = ? AND building = ? AND floor = ? AND is_active = 1
        `, [name, building, floor]);

        if (existing.length > 0) {
            await connection.end();
            return res.status(409).json({
                success: false,
                message: 'Room already exists in this building and floor'
            });
        }

        const [result] = await connection.execute(`
            INSERT INTO rooms (name, building, floor, description, is_active)
            VALUES (?, ?, ?, ?, 1)
        `, [name, building, floor, description || null]);

        await connection.end();

        console.log('[ROOMS] Created room:', result.insertId);
        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: {
                id: result.insertId,
                name,
                building,
                floor,
                description
            }
        });
    } catch (error) {
        console.error('[ROOMS] Error creating room:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating room'
        });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const roomId = parseInt(req.params.id);
        const { name, building, floor, description, is_active } = req.body;

        if (isNaN(roomId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID'
            });
        }

        const connection = await createConnection();

        const [room] = await connection.execute(`
            SELECT id FROM rooms WHERE id = ?
        `, [roomId]);

        if (room.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const [result] = await connection.execute(`
            UPDATE rooms 
            SET name = ?, building = ?, floor = ?, description = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
        `, [name, building, floor, description || null, is_active !== undefined ? is_active : 1, roomId]);

        await connection.end();

        console.log('[ROOMS] Updated room:', roomId);
        res.json({
            success: true,
            message: 'Room updated successfully'
        });
    } catch (error) {
        console.error('[ROOMS] Error updating room:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating room'
        });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const roomId = parseInt(req.params.id);

        if (isNaN(roomId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID'
            });
        }

        const connection = await createConnection();

        const [room] = await connection.execute(`
            SELECT id FROM rooms WHERE id = ? AND is_active = 1
        `, [roomId]);

        if (room.length === 0) {
            await connection.end();
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        await connection.execute(`
            UPDATE rooms 
            SET is_active = 0, updated_at = NOW()
            WHERE id = ?
        `, [roomId]);

        await connection.end();

        console.log('[ROOMS] Deleted room:', roomId);
        res.json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        console.error('[ROOMS] Error deleting room:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting room'
        });
    }
});

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