// server.js (Fixed - No circular dependency)
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// สร้าง Express app ก่อน
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static('uploads'));

// ✅ เพิ่มการ serve React build files
if (process.env.NODE_ENV === 'production') {
    // Production: serve built React files
    app.use(express.static(path.join(__dirname, '../frontend/build')));
} else {
    // Development: serve React files (ถ้ามี build folder)
    const frontendBuildPath = path.join(__dirname, '../frontend/build');
    const fs = require('fs');
    
    if (fs.existsSync(frontendBuildPath)) {
        console.log('📦 Serving React build from:', frontendBuildPath);
        app.use(express.static(frontendBuildPath));
    } else {
        console.log('⚠️ React build not found. Run "npm run build" in frontend folder');
        console.log('💡 Or use development mode with separate servers');
    }
}

// Health check (เพิ่มก่อน routes อื่นๆ)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Repair System API is running',
        timestamp: new Date().toISOString(),
        mode: process.env.NODE_ENV || 'development',
        features: {
            lineNotifications: true,
            systemSettings: true,
            imageUpload: true,
            frontend: process.env.NODE_ENV === 'production' ? 'integrated' : 'separate'
        }
    });
});

// Import routes หลังจากสร้าง app แล้ว
let authRoutes = null;
let repairRoutes = null;
let adminRoutes = null;
let systemSettingsRoutes = null;

try {
    authRoutes = require('./routes/auth');
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.warn('⚠️ Auth routes not found:', error.message);
}

try {
    repairRoutes = require('./routes/repairs');
    console.log('✅ Repair routes loaded');
} catch (error) {
    console.warn('⚠️ Repair routes not found:', error.message);
}

try {
    adminRoutes = require('./routes/admin');
    console.log('✅ Admin routes loaded');
} catch (error) {
    console.warn('⚠️ Admin routes not found:', error.message);
}

try {
    systemSettingsRoutes = require('./routes/repairs/systemSettings');
    console.log('✅ System settings route loaded');
} catch (error) {
    console.warn('⚠️ System settings route not found:', error.message);
}

// API Routes (เพิ่ม /api prefix เพื่อแยกจาก React routes)
if (authRoutes) {
    app.use('/api/auth', authRoutes);
}

if (repairRoutes) {
    app.use('/api/repairs', repairRoutes);
}

if (adminRoutes) {
    app.use('/api/admin', adminRoutes);
}

if (systemSettingsRoutes) {
    app.use('/api/repairs/system-settings', systemSettingsRoutes);
    console.log('✅ System settings route mounted at /api/repairs/system-settings');
}

// ✅ เพิ่ม endpoint สำหรับทดสอบการเชื่อมต่อ LINE
app.get('/api/line/test', async (req, res) => {
    try {
        let lineMessaging = null;
        try {
            lineMessaging = require('./services/lineMessaging');
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: 'LINE Messaging service ไม่พบ - ตรวจสอบไฟล์ services/lineMessaging.js'
            });
        }
        
        // Refresh config ก่อนทดสอบ
        await lineMessaging.refreshConfig();
        
        if (!lineMessaging.isConfigured()) {
            return res.status(400).json({
                success: false,
                error: 'LINE Bot ยังไม่ได้ตั้งค่า กรุณาเพิ่ม Channel Access Token และ Channel Secret'
            });
        }

        if (!lineMessaging.isEnabled()) {
            return res.status(400).json({
                success: false,
                error: 'LINE Notifications ถูกปิดใช้งาน หรือไม่ได้ตั้งค่า Group ID',
                debug: {
                    configured: lineMessaging.isConfigured(),
                    enabled: lineMessaging.isEnabled(),
                    hasToken: !!lineMessaging.channelAccessToken,
                    hasGroupId: !!lineMessaging.groupId,
                    notificationsEnabled: lineMessaging.notificationsEnabled
                }
            });
        }

        const result = await lineMessaging.testConnection();
        
        if (result.success) {
            res.json({
                success: true,
                message: 'LINE Bot เชื่อมต่อสำเร็จ',
                data: result.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('LINE test error:', error);
        res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการทดสอบ LINE Bot: ' + error.message
        });
    }
});

// ✅ เพิ่ม endpoint สำหรับ debug LINE settings
app.get('/api/line/debug', async (req, res) => {
    try {
        let lineMessaging = null;
        let lineServiceStatus = 'not_found';
        
        try {
            lineMessaging = require('./services/lineMessaging');
            lineServiceStatus = 'loaded';
        } catch (error) {
            lineServiceStatus = 'error: ' + error.message;
        }

        if (!lineMessaging) {
            return res.json({
                success: false,
                lineServiceStatus,
                error: 'LINE Messaging service ไม่พบ'
            });
        }

        let databaseSettings = [];
        try {
            const db = require('./config/database');
            
            // Refresh config
            await lineMessaging.refreshConfig();
            
            // ดึงการตั้งค่าจากฐานข้อมูล
            const [settings] = await db.execute(`
                SELECT setting_key, 
                       CASE WHEN is_sensitive = 1 THEN '••••••••' ELSE setting_value END as setting_value,
                       is_sensitive
                FROM system_settings 
                WHERE setting_key LIKE 'line_%' OR setting_key LIKE 'notification_%'
                ORDER BY setting_key
            `);
            databaseSettings = settings;
        } catch (dbError) {
            databaseSettings = `Database error: ${dbError.message}`;
        }

        res.json({
            success: true,
            lineServiceStatus,
            lineMessaging: {
                configured: lineMessaging.isConfigured(),
                enabled: lineMessaging.isEnabled(),
                hasToken: !!lineMessaging.channelAccessToken,
                hasSecret: !!lineMessaging.channelSecret,
                hasGroupId: !!lineMessaging.groupId,
                notificationsEnabled: lineMessaging.notificationsEnabled,
                initialized: lineMessaging.initialized
            },
            databaseSettings,
            systemSettingsRoute: !!systemSettingsRoutes
        });
    } catch (error) {
        console.error('LINE debug error:', error);
        res.status(500).json({
            success: false,
            error: 'เกิดข้อผิดพลาดในการ debug LINE: ' + error.message
        });
    }
});

// ✅ เพิ่ม webhook endpoint สำหรับ LINE (ช่วยหา Group ID)
app.post('/api/webhook', (req, res) => {
    try {
        const events = req.body.events || [];
        
        console.log('📨 Webhook received:', {
            eventsCount: events.length,
            body: req.body
        });
        
        events.forEach((event, index) => {
            console.log(`📋 Event ${index + 1}:`, {
                type: event.type,
                source: event.source
            });
            
            if (event.source.type === 'group') {
                console.log(`🆔 GROUP ID FOUND: ${event.source.groupId}`);
                console.log('   👆 ใช้ Group ID นี้ในการตั้งค่าระบบ');
            }
            
            if (event.source.type === 'user') {
                console.log(`👤 User ID: ${event.source.userId}`);
            }
        });
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});

app.get('/api/webhook', (req, res) => {
    res.json({
        message: 'LINE Webhook endpoint is ready',
        instructions: [
            '1. ตั้งค่า Webhook URL ใน LINE Console: https://yourdomain.com/api/webhook',
            '2. เพิ่มบอทเข้ากลุ่ม LINE',
            '3. ส่งข้อความในกลุ่ม',
            '4. ตรวจสอบ console logs เพื่อดู Group ID'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)'
        });
    }

    if (error.message.includes('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น')) {
        return res.status(400).json({
            message: error.message
        });
    }

    res.status(500).json({
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
    console.log(`❌ 404 - API Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        message: 'ไม่พบ API endpoint ที่ต้องการ'
    });
});

// ✅ React Router fallback - จัดการ client-side routing
// ต้องอยู่หลัง API routes เพื่อไม่ให้แย่งกับ API endpoints
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });
} else {
    // Development mode fallback
    const frontendBuildPath = path.join(__dirname, '../frontend/build');
    const fs = require('fs');
    
    if (fs.existsSync(frontendBuildPath)) {
        app.get('*', (req, res) => {
            res.sendFile(path.join(frontendBuildPath, 'index.html'));
        });
    }
}

// Initialize services
async function initializeServices() {
    try {
        console.log('🔧 Initializing services...');
        
        // Initialize Database first
        let db = null;
        try {
            db = require('./config/database');
            console.log('✅ Database module loaded');
        } catch (error) {
            console.error('❌ Database module not found:', error.message);
            return;
        }
        
        // Initialize LINE Messaging
        let lineMessaging = null;
        try {
            lineMessaging = require('./services/lineMessaging');
            await lineMessaging.refreshConfig();
            
            if (lineMessaging.isConfigured()) {
                console.log('✅ LINE Messaging Service initialized successfully');
                console.log(`   - Has Token: ${!!lineMessaging.channelAccessToken}`);
                console.log(`   - Has Secret: ${!!lineMessaging.channelSecret}`);
                console.log(`   - Has Group ID: ${!!lineMessaging.groupId}`);
                console.log(`   - Notifications Enabled: ${lineMessaging.notificationsEnabled}`);
                console.log(`   - Overall Status: ${lineMessaging.isEnabled() ? '✅ ENABLED' : '⚠️ DISABLED'}`);
            } else {
                console.log('⚠️ LINE Messaging Service not configured');
                console.log('💡 Go to System Settings to configure LINE Bot credentials');
            }
        } catch (error) {
            console.error('❌ LINE Messaging Service not found:', error.message);
            console.log('💡 Make sure you have services/lineMessaging.js file');
        }
        
        // Create system_settings table if not exists
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
            
            console.log('✅ System settings table ready');
        } catch (dbError) {
            console.error('❌ Database initialization error:', dbError.message);
        }
        
    } catch (error) {
        console.error('❌ Error initializing services:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    console.log('='.repeat(60));
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌐 Application URL: http://localhost:${PORT}`);
    console.log(`📱 API URL: http://localhost:${PORT}/api`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    if (systemSettingsRoutes) {
        console.log(`🔧 System Settings: http://localhost:${PORT}/api/repairs/system-settings`);
    }
    console.log(`🔗 LINE Test: http://localhost:${PORT}/api/line/test`);
    console.log(`🐛 LINE Debug: http://localhost:${PORT}/api/line/debug`);
    console.log(`🪝 Webhook: http://localhost:${PORT}/api/webhook`);
    
    // Check if React build exists
    const frontendBuildPath = path.join(__dirname, '../frontend/build');
    const fs = require('fs');
    
    console.log(`🔍 Checking React build at: ${frontendBuildPath}`);
    
    if (fs.existsSync(frontendBuildPath)) {
        const indexPath = path.join(frontendBuildPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            console.log(`📦 Frontend: http://localhost:${PORT} (integrated)`);
            console.log(`✅ React build ready with index.html`);
        } else {
            console.log(`⚠️ Frontend: Build folder exists but index.html missing`);
        }
    } else {
        console.log(`⚠️ Frontend: Build not found at ${frontendBuildPath}`);
        console.log(`💡 Run "cd frontend && npm run build" to create build`);
    }
    
    console.log('='.repeat(60));
    
    // Initialize services after server starts
    await initializeServices();
    
    console.log('='.repeat(60));
    console.log('🎯 SYSTEM READY!');
    console.log('1. เข้าใช้งาน: http://localhost:5000');
    console.log('2. ทดสอบ API: http://localhost:5000/api/health');
    console.log('3. ทดสอบ LINE: http://localhost:5000/api/line/test');
    console.log('='.repeat(60));
});

module.exports = app;