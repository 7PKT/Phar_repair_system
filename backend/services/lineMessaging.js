// utils/lineMessaging.js (Fixed with HTTPS Support + Time Display)
const axios = require('axios');
const db = require('../config/database');

class LineMessaging {
    constructor() {
        this.channelAccessToken = null;
        this.channelSecret = null;
        this.baseURL = 'https://api.line.me/v2/bot';
        this.initialized = false;
        this.initializeConfig();
    }

    async initializeConfig() {
        try {
            // ดึงการตั้งค่า LINE จากฐานข้อมูล
            const [settings] = await db.execute(`
                SELECT setting_key, setting_value 
                FROM system_settings 
                WHERE setting_key IN ('line_channel_access_token', 'line_channel_secret', 'line_notifications_enabled', 'line_group_id')
            `);

            settings.forEach(setting => {
                if (setting.setting_key === 'line_channel_access_token') {
                    this.channelAccessToken = setting.setting_value;
                } else if (setting.setting_key === 'line_channel_secret') {
                    this.channelSecret = setting.setting_value;
                } else if (setting.setting_key === 'line_notifications_enabled') {
                    this.notificationsEnabled = setting.setting_value === 'true';
                } else if (setting.setting_key === 'line_group_id') {
                    this.groupId = setting.setting_value;
                }
            });

            this.initialized = this.channelAccessToken && this.channelSecret;
            
            if (this.initialized) {
                console.log('✅ LINE Messaging initialized successfully');
            } else {
                console.log('⚠️ LINE Messaging not configured');
            }
        } catch (error) {
            console.error('❌ LINE Messaging initialization error:', error);
            this.initialized = false;
        }
    }

    isConfigured() {
        return this.initialized && this.channelAccessToken && this.channelSecret;
    }

    isEnabled() {
        return this.notificationsEnabled && this.isConfigured() && this.groupId;
    }

    // ✅ ฟังก์ชันสำหรับจัดรูปแบบเวลา (ภาษาไทย)
    formatThaiDateTime(date = new Date()) {
        const options = {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        const formatter = new Intl.DateTimeFormat('th-TH', options);
        const parts = formatter.formatToParts(date);
        
        const day = parts.find(part => part.type === 'day').value;
        const month = parts.find(part => part.type === 'month').value;
        const year = parts.find(part => part.type === 'year').value;
        const hour = parts.find(part => part.type === 'hour').value;
        const minute = parts.find(part => part.type === 'minute').value;
        
        return `${day}/${month}/${year} ${hour}:${minute} น.`;
    }

    // ✅ ฟังก์ชันสำหรับจัดรูปแบบเวลาแบบสั้น
    formatThaiTime(date = new Date()) {
        const options = {
            timeZone: 'Asia/Bangkok',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        const formatter = new Intl.DateTimeFormat('th-TH', options);
        return formatter.format(date) + ' น.';
    }

    async sendMessageToGroup(message) {
        if (!this.isEnabled()) {
            console.log('LINE messaging disabled or not configured');
            return { success: false, error: 'LINE messaging not configured or no group ID' };
        }

        try {
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.channelAccessToken}`
            };

            const payload = {
                to: this.groupId,
                messages: Array.isArray(message) ? message : [message]
            };

            const response = await axios.post(
                `${this.baseURL}/message/push`,
                payload,
                { headers, timeout: 10000 }
            );

            console.log(`✅ LINE message sent to group ${this.groupId}`);
            
            return {
                success: true,
                response: response.data,
                groupId: this.groupId
            };

        } catch (error) {
            console.error('❌ LINE group messaging error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    async sendMessage(userIds, message) {
        // Deprecated: ใช้สำหรับ backward compatibility เท่านั้น
        console.log('⚠️ sendMessage to individual users is deprecated, use sendMessageToGroup instead');
        return await this.sendMessageToGroup(message);
    }

    createFlexMessage(title, content, color = '#0066CC') {
        return {
            type: 'flex',
            altText: title,
            contents: {
                type: 'bubble',
                size: 'kilo',
                header: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'text',
                            text: title,
                            weight: 'bold',
                            color: '#ffffff',
                            size: 'md'
                        }
                    ],
                    backgroundColor: color,
                    paddingAll: 'md'
                },
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: content,
                    paddingAll: 'md'
                }
            }
        };
    }

    // ✅ ฟังก์ชันตรวจสอบและสร้าง HTTPS URL
    getImageUrl(imagePath) {
        if (!imagePath) return null;
        
        // ตรวจสอบ environment variables สำหรับ HTTPS URL
        const baseUrl = process.env.NGROK_URL || process.env.BASE_URL || process.env.PUBLIC_URL;
        
        // ถ้าไม่มี HTTPS URL ให้ return null (ไม่ส่งรูปภาพ)
        if (!baseUrl || !baseUrl.startsWith('https://')) {
            console.log('⚠️ No HTTPS URL found in environment variables. Images will not be sent.');
            console.log('💡 Set NGROK_URL or BASE_URL to HTTPS URL to enable image notifications');
            return null;
        }
        
        // ลบ slash ซ้ำออก
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        const fullUrl = `${baseUrl}${cleanPath}`;
        
        console.log('🖼️ Generated HTTPS image URL:', fullUrl);
        return fullUrl;
    }

    // ✅ ฟังก์ชันตรวจสอบว่า URL เป็น HTTPS หรือไม่
    isValidHttpsUrl(url) {
        if (!url) return false;
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'https:';
        } catch (error) {
            return false;
        }
    }

    // ✅ ฟังก์ชันสำหรับดึงรูปภาพจากฐานข้อมูล
    async getRepairImages(repairId) {
        try {
            const [images] = await db.execute(`
                SELECT id, file_path, file_name 
                FROM repair_images 
                WHERE repair_request_id = ? 
                ORDER BY id ASC 
                LIMIT 10
            `, [repairId]);

            return images
                .map(img => ({
                    id: img.id,
                    url: this.getImageUrl(img.file_path),
                    name: img.file_name || `รูปภาพ ${img.id}`
                }))
                .filter(img => this.isValidHttpsUrl(img.url)); // กรองเฉพาะ HTTPS URL
        } catch (error) {
            console.error('❌ Error fetching repair images:', error);
            return [];
        }
    }

    // ✅ ฟังก์ชันสำหรับดึงรูปภาพเสร็จสิ้น
    async getCompletionImages(repairId) {
        try {
            const [images] = await db.execute(`
                SELECT id, file_path, file_name 
                FROM completion_images 
                WHERE repair_request_id = ? 
                ORDER BY id ASC 
                LIMIT 10
            `, [repairId]);

            return images
                .map(img => ({
                    id: img.id,
                    url: this.getImageUrl(img.file_path),
                    name: img.file_name || `รูปเสร็จสิ้น ${img.id}`
                }))
                .filter(img => this.isValidHttpsUrl(img.url)); // กรองเฉพาะ HTTPS URL
        } catch (error) {
            console.error('❌ Error fetching completion images:', error);
            return [];
        }
    }

    // ✅ ฟังก์ชันสำหรับสร้าง Image Message
    createImageMessage(imageUrl, previewUrl = null) {
        if (!this.isValidHttpsUrl(imageUrl)) {
            console.log('⚠️ Invalid HTTPS URL for image:', imageUrl);
            return null;
        }

        return {
            type: 'image',
            originalContentUrl: imageUrl,
            previewImageUrl: previewUrl || imageUrl
        };
    }

    // ✅ ฟังก์ชันสำหรับสร้าง Image Carousel
    createImageCarousel(images, title = 'รูปภาพประกอบ') {
        if (!images || images.length === 0) return null;

        // กรองเฉพาะรูปภาพที่มี HTTPS URL
        const validImages = images.filter(image => this.isValidHttpsUrl(image.url));
        
        if (validImages.length === 0) {
            console.log('⚠️ No valid HTTPS images found for carousel');
            return null;
        }

        const columns = validImages.slice(0, 10).map((image, index) => ({
            thumbnailImageUrl: image.url,
            imageUrl: image.url,
            action: {
                type: 'uri',
                uri: image.url
            }
        }));

        return {
            type: 'template',
            altText: `${title} (${validImages.length} รูป)`,
            template: {
                type: 'image_carousel',
                columns: columns
            }
        };
    }

    async notifyNewRepairRequest(repairData) {
        const priorityColors = {
            low: '#28a745',
            medium: '#ffc107', 
            high: '#fd7e14',
            urgent: '#dc3545'
        };

        const priorityTexts = {
            low: 'ต่ำ',
            medium: 'ปานกลาง',
            high: 'สูง', 
            urgent: 'เร่งด่วน'
        };

        const color = priorityColors[repairData.priority] || '#0066CC';
        const currentTime = this.formatThaiDateTime();
        
        const content = [
            {
                type: 'text',
                text: `🔧 ${repairData.title}`,
                weight: 'bold',
                size: 'sm',
                wrap: true
            },
            {
                type: 'separator',
                margin: 'md'
            },
            {
                type: 'box',
                layout: 'vertical',
                margin: 'md',
                spacing: 'sm',
                contents: [
                    {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'text',
                                text: 'ผู้แจ้ง:',
                                color: '#666666',
                                size: 'xs',
                                flex: 2
                            },
                            {
                                type: 'text',
                                text: repairData.requester_name || 'ไม่ระบุ',
                                size: 'xs',
                                flex: 4,
                                wrap: true
                            }
                        ]
                    },
                    {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'text',
                                text: 'สถานที่:',
                                color: '#666666',
                                size: 'xs',
                                flex: 2
                            },
                            {
                                type: 'text',
                                text: repairData.location || 'ไม่ระบุ',
                                size: 'xs',
                                flex: 4,
                                wrap: true
                            }
                        ]
                    },
                    {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'text',
                                text: 'ความสำคัญ:',
                                color: '#666666',
                                size: 'xs',
                                flex: 2
                            },
                            {
                                type: 'text',
                                text: priorityTexts[repairData.priority] || repairData.priority,
                                size: 'xs',
                                flex: 4,
                                weight: 'bold',
                                color: color
                            }
                        ]
                    },
                    {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'text',
                                text: 'เวลาแจ้ง:',
                                color: '#666666',
                                size: 'xs',
                                flex: 2
                            },
                            {
                                type: 'text',
                                text: currentTime,
                                size: 'xs',
                                flex: 4,
                                weight: 'bold',
                                color: '#0066CC'
                            }
                        ]
                    }
                ]
            }
        ];

        // ✅ เพิ่มข้อมูลผู้ได้รับมอบหมาย (ถ้ามี)
        if (repairData.assigned_to_name) {
            content[2].contents.push({
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                    {
                        type: 'text',
                        text: 'มอบหมายให้:',
                        color: '#666666',
                        size: 'xs',
                        flex: 2
                    },
                    {
                        type: 'text',
                        text: repairData.assigned_to_name,
                        size: 'xs',
                        flex: 4,
                        weight: 'bold',
                        color: '#17a2b8'
                    }
                ]
            });
        }

        // ✅ เพิ่มข้อความแสดงจำนวนรูปภาพ
        if (repairData.imageCount > 0) {
            content.push({
                type: 'text',
                text: `📷 มีรูปภาพประกอบ ${repairData.imageCount} รูป`,
                size: 'xs',
                color: '#0066CC',
                margin: 'md',
                weight: 'bold'
            });
        }

        const flexMessage = this.createFlexMessage('🔔 แจ้งซ่อมใหม่', content, color);
        const messages = [flexMessage];

        // ✅ ดึงและแสดงรูปภาพ (เฉพาะเมื่อมี HTTPS URL)
        if (repairData.id) {
            try {
                const images = await this.getRepairImages(repairData.id);
                console.log(`🖼️ Found ${images.length} valid HTTPS images for repair ${repairData.id}`);

                if (images.length > 0) {
                    // สร้าง Image Carousel
                    const imageCarousel = this.createImageCarousel(images, 'รูปภาพการแจ้งซ่อม');
                    if (imageCarousel) {
                        messages.push(imageCarousel);
                        console.log('✅ Added image carousel to notification');
                    }

                    // หรือส่งรูปภาพแยกรายการ (สำหรับรูปภาพ 1-3 รูป)
                    if (images.length <= 3) {
                        images.forEach((image, index) => {
                            const imageMessage = this.createImageMessage(image.url);
                            if (imageMessage) {
                                messages.push(imageMessage);
                                console.log(`✅ Added individual image ${index + 1} to notification`);
                            }
                        });
                    }
                } else {
                    console.log('⚠️ No valid HTTPS images found - sending text notification only');
                    // เพิ่มข้อความแจ้งว่าไม่สามารถแสดงรูปภาพได้
                    const noImageMessage = {
                        type: 'text',
                        text: '📷 มีรูปภาพประกอบแต่ไม่สามารถแสดงได้ (ต้องการ HTTPS URL)\n💡 ตั้งค่า ngrok หรือ domain HTTPS เพื่อดูรูปภาพ'
                    };
                    if (repairData.imageCount > 0) {
                        messages.push(noImageMessage);
                    }
                }
            } catch (error) {
                console.error('❌ Error loading images for notification:', error);
            }
        }

        // ✅ ดึงและแสดงรูปภาพเสร็จสิ้น (ถ้ามี)
        if (repairData.id && repairData.status === 'completed') {
            try {
                const completionImages = await this.getCompletionImages(repairData.id);
                console.log(`🖼️ Found ${completionImages.length} valid HTTPS completion images for repair ${repairData.id}`);

                if (completionImages.length > 0) {
                    // เพิ่มข้อความแจ้ง
                    const completionTextMessage = {
                        type: 'text',
                        text: `✅ งานเสร็จสิ้นแล้ว! มีรูปภาพผลงาน ${completionImages.length} รูป 📸`
                    };
                    messages.push(completionTextMessage);

                    // สร้าง Image Carousel สำหรับรูปภาพเสร็จสิ้น
                    const imageCarousel = this.createImageCarousel(completionImages, 'รูปภาพงานเสร็จสิ้น');
                    if (imageCarousel) {
                        messages.push(imageCarousel);
                        console.log('✅ Added completion image carousel to notification');
                    }

                    // หรือส่งรูปภาพแยกรายการ (สำหรับรูปภาพ 1-3 รูป)
                    if (completionImages.length <= 3) {
                        completionImages.forEach((image, index) => {
                            const imageMessage = this.createImageMessage(image.url);
                            if (imageMessage) {
                                messages.push(imageMessage);
                                console.log(`✅ Added completion image ${index + 1} to notification`);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('❌ Error loading completion images for notification:', error);
            }
        }

        return await this.sendMessageToGroup(messages);
    }

    async notifyStatusUpdate(repairData, oldStatus, newStatus, updatedBy) {
        const statusTexts = {
            pending: 'รอดำเนินการ',
            assigned: 'มอบหมายแล้ว',
            in_progress: 'กำลังดำเนินการ',
            completed: 'เสร็จสิ้น',
            cancelled: 'ยกเลิก'
        };

        const statusColors = {
            pending: '#ffc107',
            assigned: '#17a2b8',
            in_progress: '#fd7e14',
            completed: '#28a745',
            cancelled: '#6c757d'
        };

        const color = statusColors[newStatus] || '#0066CC';
        const currentTime = this.formatThaiDateTime();
        
        const content = [
            {
                type: 'text',
                text: `📝 ${repairData.title}`,
                weight: 'bold',
                size: 'sm',
                wrap: true
            },
            {
                type: 'separator',
                margin: 'md'
            },
            {
                type: 'box',
                layout: 'vertical',
                margin: 'md',
                spacing: 'sm',
                contents: [
                    {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'text',
                                text: 'สถานะ:',
                                color: '#666666',
                                size: 'xs',
                                flex: 3
                            },
                            {
                                type: 'text',
                                text: statusTexts[newStatus] || newStatus,
                                size: 'xs',
                                flex: 4,
                                weight: 'bold',
                                color: color
                            }
                        ]
                    },
                    {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'text',
                                text: 'อัพเดทโดย:',
                                color: '#666666',
                                size: 'xs',
                                flex: 3
                            },
                            {
                                type: 'text',
                                text: updatedBy || 'ไม่ระบุ',
                                size: 'xs',
                                flex: 4
                            }
                        ]
                    },
                    {
                        type: 'box',
                        layout: 'baseline',
                        spacing: 'sm',
                        contents: [
                            {
                                type: 'text',
                                text: 'เวลาอัพเดท:',
                                color: '#666666',
                                size: 'xs',
                                flex: 3
                            },
                            {
                                type: 'text',
                                text: currentTime,
                                size: 'xs',
                                flex: 4,
                                weight: 'bold',
                                color: '#0066CC'
                            }
                        ]
                    }
                ]
            }
        ];

        if (newStatus === 'completed' && repairData.completion_details) {
            content.push({
                type: 'separator',
                margin: 'md'
            });
            content.push({
                type: 'text',
                text: '📋 รายละเอียดการซ่อม:',
                weight: 'bold',
                size: 'xs',
                margin: 'md'
            });
            content.push({
                type: 'text',
                text: repairData.completion_details,
                size: 'xs',
                wrap: true,
                margin: 'sm'
            });
        }

        const flexMessage = this.createFlexMessage('📊 เสร็จสิ้น', content, color);
        const messages = [flexMessage];

        // ✅ แสดงรูปภาพเสร็จสิ้นถ้าเปลี่ยนเป็นเสร็จสิ้น
        if (newStatus === 'completed' && repairData.id) {
            try {
                const completionImages = await this.getCompletionImages(repairData.id);
                console.log(`🖼️ Found ${completionImages.length} valid HTTPS completion images for repair ${repairData.id}`);

                if (completionImages.length > 0) {
                    // เพิ่มข้อความแจ้ง
                    const completionTextMessage = {
                        type: 'text',
                        text: `✅ งานเสร็จสิ้น! มีรูปภาพผลงาน ${completionImages.length} รูป 📸`
                    };
                    messages.push(completionTextMessage);

                    // สร้าง Image Carousel สำหรับรูปภาพเสร็จสิ้น
                    const imageCarousel = this.createImageCarousel(completionImages, 'รูปภาพงานเสร็จสิ้น');
                    if (imageCarousel) {
                        messages.push(imageCarousel);
                        console.log('✅ Added completion image carousel to notification');
                    }

                    // หรือส่งรูปภาพแยกรายการ (สำหรับรูปภาพ 1-3 รูป)
                    if (completionImages.length <= 3) {
                        completionImages.forEach((image, index) => {
                            const imageMessage = this.createImageMessage(image.url);
                            if (imageMessage) {
                                messages.push(imageMessage);
                                console.log(`✅ Added completion image ${index + 1} to notification`);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error('❌ Error loading completion images for notification:', error);
            }
        }

        return await this.sendMessageToGroup(messages);
    }

    async testConnection() {
        if (!this.isConfigured()) {
            return { success: false, error: 'LINE not configured' };
        }

        try {
            const headers = {
                'Authorization': `Bearer ${this.channelAccessToken}`
            };

            const response = await axios.get(
                `${this.baseURL}/info`,
                { headers, timeout: 10000 }
            );

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data || error.message
            };
        }
    }

    async refreshConfig() {
        await this.initializeConfig();
        return this.isConfigured();
    }
}

const lineMessaging = new LineMessaging();

module.exports = lineMessaging;