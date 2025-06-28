const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', // XAMPP ไม่มีรหัสผ่าน
    database: process.env.DB_NAME || 'repair_system',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ทดสอบการเชื่อมต่อ
async function testConnection() {
    try {
        const connection = await db.getConnection();
        console.log('✅ Connected to XAMPP MySQL database');
        connection.release();
    } catch (error) {
        console.error('❌ XAMPP Database connection failed:', error.message);
    }
}

testConnection();

module.exports = db;