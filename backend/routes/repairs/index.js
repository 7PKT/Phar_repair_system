
const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');

const categoriesRoutes = require('./categories');
const technicianRoutes = require('./technicians');
const repairRequestRoutes = require('./repairRequests');
const systemSettingsRoutes = require('./systemSettings');

const router = express.Router();


router.use((req, res, next) => {
    console.log(`[REPAIRS] ${req.method} ${req.path} - User: ${req.user?.role || 'none'}`);
    next();
});


router.use('/categories', categoriesRoutes);
router.use('/technicians', technicianRoutes);
router.use('/system-settings', systemSettingsRoutes);


router.get('/buildings', authenticateToken, async (req, res) => {
    try {
        const db = require('../../config/database');
        const [buildings] = await db.execute(`
            SELECT DISTINCT building
            FROM rooms 
            WHERE is_active = 1
            ORDER BY building
        `);

        console.log('[BUILDINGS] Buildings fetched:', buildings.length);
        res.json({
            success: true,
            data: buildings
        });
    } catch (error) {
        console.error('[BUILDINGS] Error:', error);
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
                message: 'Building parameter required'
            });
        }

        const db = require('../../config/database');
        const [floors] = await db.execute(`
            SELECT DISTINCT floor
            FROM rooms 
            WHERE building = ? AND is_active = 1
            ORDER BY floor
        `, [parseInt(building)]);

        console.log('[FLOORS] Floors fetched for building', building, ':', floors.length);
        res.json({
            success: true,
            data: floors,
            building: parseInt(building)
        });
    } catch (error) {
        console.error('[FLOORS] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching floors'
        });
    }
});


router.get('/rooms', authenticateToken, async (req, res) => {
    try {
        const { building, floor } = req.query;

        let query = `
            SELECT id, name, building, floor, description
            FROM rooms 
            WHERE is_active = 1
        `;
        let params = [];

        if (building && floor) {
            query += ` AND building = ? AND floor = ?`;
            params.push(parseInt(building), parseInt(floor));
        } else if (building) {
            query += ` AND building = ?`;
            params.push(parseInt(building));
        }

        query += ` ORDER BY building, floor, name`;

        const db = require('../../config/database');
        const [rooms] = await db.execute(query, params);

        console.log('[ROOMS] Rooms fetched:', rooms.length);
        res.json({
            success: true,
            data: rooms
        });
    } catch (error) {
        console.error('[ROOMS] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rooms'
        });
    }
});


router.use('/', repairRequestRoutes);


router.get('/debug/routes', (req, res) => {
    res.json({
        message: 'Repair routes debug info',
        available_routes: [
            'GET /api/repairs/buildings',
            'GET /api/repairs/floors?building=1',
            'GET /api/repairs/rooms',
            'GET /api/repairs/categories',
            'GET /api/repairs/technicians',
            'GET /api/repairs/system-settings',
            'GET /api/repairs/ (repair requests)',
            'POST /api/repairs/ (create repair)',
        ],
        user: req.user || 'not authenticated'
    });
});

module.exports = router;