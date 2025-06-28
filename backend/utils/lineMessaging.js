// backend/utils/lineMessaging.js
const axios = require('axios');

class LineMessagingAPI {
    constructor() {
        this.channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        this.baseURL = 'https://api.line.me/v2/bot';
    }

    // ส่งข้อความไปหา User ID
    async sendMessage(userId, message) {
        if (!this.channelAccessToken) {
            console.log('ไม่พบ LINE Channel Access Token');
            return false;
        }

        if (!userId) {
            console.log('ไม่พบ User ID');
            return false;
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/message/push`,
                {
                    to: userId,
                    messages: [
                        {
                            type: 'text',
                            text: message
                        }
                    ]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.channelAccessToken}`
                    }
                }
            );

            return response.status === 200;
        } catch (error) {
            console.error('LINE Messaging API Error:', error.response?.data || error.message);
            return false;
        }
    }

    // ส่งข้อความหลายคนพร้อมกัน
    async notifyNewRepairRequest(userIds, repairData) {
        if (!userIds || userIds.length === 0) {
            console.log('ไม่พบ LINE User IDs');
            return;
        }

        const message = `
🔧 แจ้งซ่อมใหม่
📋 เรื่อง: ${repairData.title}
📍 สถานที่: ${repairData.location}
⚠️ ระดับความสำคัญ: ${this.getPriorityText(repairData.priority)}
👤 ผู้แจ้ง: ${repairData.requester_name}
📅 เวลา: ${new Date().toLocaleString('th-TH')}
        `.trim();

        console.log('📱 Sending LINE notifications to', userIds.length, 'users');

        const promises = userIds.map(userId => this.sendMessage(userId, message));
        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`✅ LINE notifications sent successfully to ${successCount}/${userIds.length} users`);
    }

    async notifyStatusUpdate(userIds, repairData, oldStatus, newStatus, updatedBy) {
        if (!userIds || userIds.length === 0) {
            console.log('ไม่พบ LINE User IDs');
            return;
        }

        const message = `
🔄 อัพเดทสถานะการซ่อม
📋 เรื่อง: ${repairData.title}
📊 สถานะเดิม: ${this.getStatusText(oldStatus)}
📊 สถานะใหม่: ${this.getStatusText(newStatus)}
👤 อัพเดทโดย: ${updatedBy}
📅 เวลา: ${new Date().toLocaleString('th-TH')}
${newStatus === 'completed' && repairData.completion_details ? `\n✅ รายละเอียด: ${repairData.completion_details}` : ''}
        `.trim();

        console.log('📱 Sending LINE status updates to', userIds.length, 'users');

        const promises = userIds.map(userId => this.sendMessage(userId, message));
        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`✅ LINE status updates sent successfully to ${successCount}/${userIds.length} users`);
    }

    // Helper functions
    getPriorityText(priority) {
        const priorityMap = {
            'low': 'ต่ำ',
            'medium': 'ปานกลาง',
            'high': 'สูง',
            'urgent': 'เร่งด่วน'
        };
        return priorityMap[priority] || priority;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'รอดำเนินการ',
            'assigned': 'มอบหมายแล้ว',
            'in_progress': 'กำลังดำเนินการ',
            'completed': 'เสร็จสิ้น',
            'cancelled': 'ยกเลิก'
        };
        return statusMap[status] || status;
    }

    // ทดสอบการเชื่อมต่อ
    async testConnection() {
        try {
            const response = await axios.get(`${this.baseURL}/info`, {
                headers: {
                    'Authorization': `Bearer ${this.channelAccessToken}`
                }
            });
            
            console.log('✅ LINE Messaging API connection successful');
            return true;
        } catch (error) {
            console.error('❌ LINE Messaging API connection failed:', error.response?.data || error.message);
            return false;
        }
    }
}

module.exports = new LineMessagingAPI();