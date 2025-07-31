
const express = require('express');
const db = require('../../config/database');
const { authenticateToken, requireRole } = require('../../middleware/auth');

const router = express.Router();


let lineMessaging = null;
try {
    lineMessaging = require('../../services/lineMessaging');
} catch (error) {
    console.warn('⚠️ LINE Messaging service not found');
}

const createSystemSettingsTable = async () => {
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

        const defaultSettings = [
            ['line_channel_access_token', '', 'string', 'LINE Channel Access Token สำหรับส่งข้อความ', true],
            ['line_channel_secret', '', 'string', 'LINE Channel Secret สำหรับยืนยันตัวตน', true],
            ['line_group_id', '', 'string', 'LINE Group ID ที่จะส่งการแจ้งเตือน', false],
            ['line_notifications_enabled', 'true', 'boolean', 'เปิด/ปิด การแจ้งเตือนผ่าน LINE', false],
            ['notification_new_repair', 'true', 'boolean', 'แจ้งเตือนเมื่อมีการแจ้งซ่อมใหม่', false],
            ['notification_status_update', 'true', 'boolean', 'แจ้งเตือนเมื่อมีการอัพเดทสถานะ', false],
            ['system_name', 'ระบบแจ้งซ่อม', 'string', 'ชื่อของระบบ', false],
            ['admin_email', 'admin@example.com', 'string', 'อีเมลของผู้ดูแลระบบ', false],
            ['max_image_size_mb', '10', 'number', 'ขนาดไฟล์รูปภาพสูงสุด (MB)', false],
            ['max_images_per_request', '5', 'number', 'จำนวนรูปภาพสูงสุดต่อการแจ้งซ่อม', false]
        ];

        for (const [key, value, type, desc, sensitive] of defaultSettings) {
            await db.execute(`
                INSERT IGNORE INTO system_settings 
                (setting_key, setting_value, setting_type, description, is_sensitive)
                VALUES (?, ?, ?, ?, ?)
            `, [key, value, type, desc, sensitive]);
        }

        console.log('✅ ตารางการตั้งค่าระบบเริ่มต้นเรียบร้อย');
    } catch (error) {
        console.error('⚠️ ข้อผิดพลาดในการสร้างตารางการตั้งค่าระบบ:', error);
    }
};

router.get('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const [settings] = await db.execute(`
            SELECT 
                setting_key,
                CASE 
                    WHEN is_sensitive = TRUE THEN '••••••••'
                    ELSE setting_value 
                END as setting_value,
                setting_type,
                description,
                is_sensitive,
                updated_at
            FROM system_settings 
            ORDER BY 
                CASE 
                    WHEN setting_key LIKE 'line_%' THEN 1
                    WHEN setting_key LIKE 'notification_%' THEN 2
                    ELSE 3
                END,
                setting_key ASC
        `);

        console.log('📋 การตั้งค่าระบบที่ดึงมา:', settings.length);
        res.json(settings);
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงการตั้งค่าระบบ:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า' });
    }
});

router.get('/:key', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { key } = req.params;
        const { reveal } = req.query;

        const [settings] = await db.execute(`
            SELECT setting_key, setting_value, setting_type, description, is_sensitive
            FROM system_settings 
            WHERE setting_key = ?
        `, [key]);

        if (settings.length === 0) {
            return res.status(404).json({ message: 'ไม่พบการตั้งค่านี้' });
        }

        const setting = settings[0];

        if (setting.is_sensitive && reveal !== 'true') {
            setting.setting_value = '••••••••';
        }

        res.json(setting);
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงการตั้งค่า:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า' });
    }
});

router.put('/', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { settings } = req.body;
        
        if (!Array.isArray(settings) || settings.length === 0) {
            throw new Error('ข้อมูลการตั้งค่าไม่ถูกต้อง');
        }

        console.log('🔄 กำลังอัพเดทการตั้งค่าระบบ:', settings.length, 'รายการ');
        
        let successCount = 0;
        let hasLineSettings = false;

        for (const setting of settings) {
            const { setting_key, setting_value } = setting;
            
            if (!setting_key) continue;

            
            if (setting_key.startsWith('line_') || setting_key.startsWith('notification_')) {
                hasLineSettings = true;
            }

            if (setting_value !== '••••••••') {
                await db.execute(`
                    UPDATE system_settings 
                    SET setting_value = ?, updated_at = NOW()
                    WHERE setting_key = ?
                `, [setting_value, setting_key]);
                
                console.log(`✅ Updated ${setting_key}: ${setting_key.includes('token') || setting_key.includes('secret') ? '••••••••' : setting_value}`);
            }
            successCount++;
        }

        
        if (hasLineSettings && lineMessaging) {
            try {
                console.log('🔄 Refreshing LINE config after settings update...');
                await lineMessaging.refreshConfig();
                console.log('✅ LINE config refreshed successfully');
            } catch (refreshError) {
                console.error('⚠️ Error refreshing LINE config:', refreshError);
            }
        }

        console.log('✅ การตั้งค่าระบบอัพเดทเรียบร้อย:', successCount, 'รายการ');

        res.json({
            message: 'บันทึกการตั้งค่าสำเร็จ',
            success_count: successCount,
            total_count: settings.length,
            line_config_refreshed: hasLineSettings && lineMessaging ? true : false
        });

    } catch (error) {
        console.error('ข้อผิดพลาดในการอัพเดทการตั้งค่าระบบ:', error);
        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาดในการอัพเดทการตั้งค่า: ' + error.message 
        });
    }
});

router.post('/test/line-notification', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { title, requester_name, location, priority, imageCount } = req.body;
        
        console.log('🧪 กำลังทดสอบการแจ้งเตือน LINE...');

        
        if (lineMessaging) {
            
            await lineMessaging.refreshConfig();

            if (!lineMessaging.isEnabled()) {
                let errorDetails = 'LINE Notifications ไม่ได้เปิดใช้งาน หรือตั้งค่าไม่ครบ';
                
                if (!lineMessaging.isConfigured()) {
                    errorDetails += ' - ขาด Channel Access Token หรือ Channel Secret';
                }
                if (!lineMessaging.groupId) {
                    errorDetails += ' - ขาด Group ID';
                }
                if (!lineMessaging.notificationsEnabled) {
                    errorDetails += ' - การแจ้งเตือนถูกปิด';
                }

                return res.status(400).json({
                    success: false,
                    error: errorDetails
                });
            }

            
            const testData = {
                id: 999999,
                title: title || 'ทดสอบการแจ้งซ่อม',
                requester_name: requester_name || 'ผู้ทดสอบระบบ',
                location: location || 'ห้องทดสอบ - System Settings',
                priority: priority || 'medium',
                category_name: 'ทดสอบ',
                imageCount: imageCount || 0
            };

            console.log('📤 Testing with data:', testData);

            
            const result = await lineMessaging.notifyNewRepairRequest(testData);

            if (result.success) {
                console.log('✅ ส่งข้อความทดสอบ LINE สำเร็จ');
                res.json({
                    success: true,
                    message: 'ส่งข้อความทดสอบสำเร็จ! ตรวจสอบในกลุ่ม LINE'
                });
            } else {
                console.error('❌ การทดสอบ LINE ล้มเหลว:', result.error);
                res.status(500).json({
                    success: false,
                    error: result.error
                });
            }
        } else {
            
            const [lineSettings] = await db.execute(`
                SELECT setting_key, setting_value 
                FROM system_settings 
                WHERE setting_key IN ('line_channel_access_token', 'line_group_id', 'line_notifications_enabled')
            `);

            const settings = {};
            lineSettings.forEach(s => settings[s.setting_key] = s.setting_value);

            if (settings.line_notifications_enabled !== 'true') {
                throw new Error('การแจ้งเตือน LINE ถูกปิดใช้งาน');
            }

            if (!settings.line_channel_access_token) {
                throw new Error('ไม่พบ LINE Channel Access Token');
            }

            if (!settings.line_group_id) {
                throw new Error('ไม่พบ LINE Group ID');
            }

            const testMessage = `🔧 ทดสอบการแจ้งเตือนระบบ\n\n` +
                               `📋 เรื่อง: ${title || 'ทดสอบการแจ้งซ่อม'}\n` +
                               `👤 ผู้แจ้ง: ${requester_name || 'ผู้ทดสอบระบบ'}\n` +
                               `📍 สถานที่: ${location || 'ห้องทดสอบ'}\n` +
                               `⚡ ระดับความสำคัญ: ${priority || 'medium'}\n` +
                               `📷 รูปภาพ: ${imageCount || 0} รูป\n\n` +
                               `⏰ เวลา: ${new Date().toLocaleString('th-TH')}\n` +
                               `✅ ระบบทำงานปกติ`;

            const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.line_channel_access_token}`
                },
                body: JSON.stringify({
                    to: settings.line_group_id,
                    messages: [{
                        type: 'text',
                        text: testMessage
                    }]
                })
            });

            if (!lineResponse.ok) {
                const errorText = await lineResponse.text();
                throw new Error(`LINE API Error: ${lineResponse.status} - ${errorText}`);
            }

            console.log('✅ ส่งข้อความทดสอบ LINE สำเร็จ');
            
            res.json({
                success: true,
                message: 'ส่งข้อความทดสอบสำเร็จ'
            });
        }

    } catch (error) {
        console.error('ข้อผิดพลาดในการทดสอบการแจ้งเตือน LINE:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

createSystemSettingsTable();

module.exports = router;