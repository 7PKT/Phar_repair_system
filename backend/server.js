
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static('uploads'));


if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
} else {
    const frontendBuildPath = path.join(__dirname, '../frontend/build');
    const fs = require('fs');

    if (fs.existsSync(frontendBuildPath)) {
        console.log('[FRONTEND] Serving React build from:', frontendBuildPath);
        app.use(express.static(frontendBuildPath));
    } else {
        console.log('[FRONTEND] React build not found. Run "npm run build" in frontend folder');
    }
}


app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Repair System API is running',
        timestamp: new Date().toISOString(),
        mode: process.env.NODE_ENV || 'development'
    });
});


let authRoutes = null;
let repairRoutes = null;
let adminRoutes = null;
let roomsRoutes = null;

try {
    authRoutes = require('./routes/auth');
    console.log('[ROUTES] Auth routes loaded');
} catch (error) {
    console.warn('[ROUTES] Auth routes not found:', error.message);
}

try {
    repairRoutes = require('./routes/repairs');
    console.log('[ROUTES] Repair routes loaded');
} catch (error) {
    console.warn('[ROUTES] Repair routes not found:', error.message);
}

try {
    adminRoutes = require('./routes/admin');
    console.log('[ROUTES] Admin routes loaded');
} catch (error) {
    console.warn('[ROUTES] Admin routes not found:', error.message);
}

try {
    roomsRoutes = require('./routes/rooms');
    console.log('[ROUTES] Rooms routes loaded');
} catch (error) {
    console.warn('[ROUTES] Rooms routes not found:', error.message);
}


if (authRoutes) {
    app.use('/api/auth', authRoutes);
    console.log('[ROUTES] Auth routes mounted at /api/auth');
}

if (repairRoutes) {
    app.use('/api/repairs', repairRoutes);
    console.log('[ROUTES] Repair routes mounted at /api/repairs');
}

if (adminRoutes) {
    app.use('/api/admin', adminRoutes);
    console.log('[ROUTES] Admin routes mounted at /api/admin');
}

if (roomsRoutes) {
    app.use('/api/rooms', roomsRoutes);
    console.log('[ROUTES] Rooms routes mounted at /api/rooms');
}


app.use((error, req, res, next) => {
    console.error('[ERROR]', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            message: 'File size too large (max 5MB)'
        });
    }

    res.status(500).json({
        message: 'Internal server error'
    });
});


app.use('/api/*', (req, res) => {
    console.log(`[404] API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        message: 'API endpoint not found'
    });
});


if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });
} else {
    const frontendBuildPath = path.join(__dirname, '../frontend/build');
    const fs = require('fs');

    if (fs.existsSync(frontendBuildPath)) {
        app.get('*', (req, res) => {
            res.sendFile(path.join(frontendBuildPath, 'index.html'));
        });
    }
}


async function initializeServices() {
    try {
        console.log('[INIT] Initializing services...');


        let db = null;
        try {
            db = require('./config/database');
            console.log('[INIT] Database module loaded');
        } catch (error) {
            console.error('[INIT] Database module not found:', error.message);
            return;
        }


        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS rooms (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    building INT NOT NULL,
                    floor INT NOT NULL,
                    description TEXT,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_building (building),
                    INDEX idx_floor (floor),
                    INDEX idx_active (is_active),
                    UNIQUE KEY unique_room (name, building, floor, is_active)
                )
            `);

            console.log('[INIT] Rooms table ready');
        } catch (dbError) {
            console.error('[INIT] Database rooms table error:', dbError.message);
        }


        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT,
                    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
                    description TEXT,
                    is_sensitive BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_setting_key (setting_key)
                )
            `);

            console.log('[INIT] System settings table ready');
        } catch (dbError) {
            console.error('[INIT] Database system settings table error:', dbError.message);
        }

    } catch (error) {
        console.error('[INIT] Error initializing services:', error);
    }
}


app.listen(PORT, async () => {
    console.log('='.repeat(50));
    console.log(`[SERVER] Running on port ${PORT}`);
    console.log(`[SERVER] Frontend: http://localhost:${PORT}`);
    console.log(`[SERVER] API: http://localhost:${PORT}/api`);
    console.log(`[SERVER] Health: http://localhost:${PORT}/api/health`);
    if (roomsRoutes) {
        console.log(`[SERVER] Rooms API: http://localhost:${PORT}/api/rooms`);
    }
    console.log('='.repeat(50));

    await initializeServices();

    console.log('[SERVER] SYSTEM READY!');
    console.log('='.repeat(50));
});

module.exports = app;