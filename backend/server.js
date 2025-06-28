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

// Import routes หลังจากสร้าง app แล้ว
const authRoutes = require('./routes/auth');
const repairRoutes = require('./routes/repair');
const adminRoutes = require('./routes/admin');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Repair System API is running',
        timestamp: new Date().toISOString()
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: 'ไม่พบ API endpoint ที่ต้องการ'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📱 API URL: http://localhost:${PORT}/api`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔗 Webhook URL: http://localhost:${PORT}/api/webhook`);
});

module.exports = app;