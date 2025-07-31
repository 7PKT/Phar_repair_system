const mysql = require('mysql2/promise');

// Hybrid Database Configuration with Auto-Fallback
class DatabaseManager {
    constructor() {
        this.activeConnection = null;
        this.isRemoteConnected = false;
        this.isLocalConnected = false;
        this.preferredMode = process.env.DATABASE_MODE || 'remote';
    }

    getRemoteConfig() {
        return {
            host: process.env.REMOTE_DB_HOST || 'ma.pharmacy.cmu.ac.th',
            user: process.env.REMOTE_DB_USER || 'pharmacyma',
            password: process.env.REMOTE_DB_PASSWORD || 'ma135!RX*jodn#7',
            database: process.env.REMOTE_DB_NAME || 'database_app_ma',
            port: process.env.REMOTE_DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000,
            ssl: false,
            charset: 'utf8mb4'
        };
    }

    getLocalConfig() {
        return {
            host: process.env.LOCAL_DB_HOST || 'localhost',
            user: process.env.LOCAL_DB_USER || 'root',
            password: process.env.LOCAL_DB_PASSWORD || '',
            database: process.env.LOCAL_DB_NAME || 'repair_system',
            port: process.env.LOCAL_DB_PORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 5000,
            ssl: false,
            charset: 'utf8mb4'
        };
    }

    async testConnection(config, type) {
        try {
            const testPool = mysql.createPool(config);
            const connection = await testPool.getConnection();
            await connection.execute('SELECT 1 as test');
            connection.release();
            await testPool.end();
            return true;
        } catch (error) {
            console.error(`❌ ${type} connection test failed:`, error.code || error.message);
            return false;
        }
    }

    async initialize() {
        console.log(`🔄 Database Manager - Preferred mode: ${this.preferredMode.toUpperCase()}`);

        // ลองเชื่อมต่อตามที่ต้องการก่อน
        if (this.preferredMode === 'remote') {
            // ลอง Remote ก่อน
            console.log('🌐 Testing REMOTE database connection...');
            const remoteConfig = this.getRemoteConfig();
            this.isRemoteConnected = await this.testConnection(remoteConfig, 'REMOTE');

            if (this.isRemoteConnected) {
                console.log('✅ REMOTE database connected successfully');
                this.activeConnection = mysql.createPool(remoteConfig);
                return { mode: 'remote', config: remoteConfig };
            } else {
                console.log('⚠️ REMOTE database failed, trying LOCAL fallback...');
            }
        }

        // ลอง Local (หรือ fallback)
        console.log('🏠 Testing LOCAL database connection...');
        const localConfig = this.getLocalConfig();
        this.isLocalConnected = await this.testConnection(localConfig, 'LOCAL');

        if (this.isLocalConnected) {
            console.log('✅ LOCAL database connected successfully');
            this.activeConnection = mysql.createPool(localConfig);
            return { mode: 'local', config: localConfig };
        }

        // ถ้าทั้งคู่ไม่ได้
        console.error('❌ Both REMOTE and LOCAL database connections failed');

        // สร้าง mock connection เพื่อป้องกัน error
        this.activeConnection = this.createMockConnection();
        return { mode: 'mock', config: null };
    }

    createMockConnection() {
        return {
            execute: async (sql, params) => {
                console.warn('🚫 Mock database - Query not executed:', sql);
                return [[], {}];
            },
            getConnection: async () => {
                return {
                    execute: async (sql, params) => {
                        console.warn('🚫 Mock database - Query not executed:', sql);
                        return [[], {}];
                    },
                    release: () => { },
                    destroy: () => { }
                };
            },
            end: async () => { }
        };
    }

    getConnection() {
        return this.activeConnection;
    }

    async execute(sql, params) {
        if (!this.activeConnection) {
            throw new Error('Database not initialized');
        }
        return await this.activeConnection.execute(sql, params);
    }

    async getConnectionFromPool() {
        if (!this.activeConnection) {
            throw new Error('Database not initialized');
        }
        return await this.activeConnection.getConnection();
    }
}

// สร้าง instance เดียว
const dbManager = new DatabaseManager();
let initPromise = null;

// Function สำหรับ initialize
async function initializeDatabase() {
    if (!initPromise) {
        initPromise = dbManager.initialize();
    }
    return await initPromise;
}

// Export functions ที่เข้ากันได้กับโค้ดเดิม
const db = {
    execute: async (sql, params) => {
        await initializeDatabase();
        return await dbManager.execute(sql, params);
    },

    getConnection: async () => {
        await initializeDatabase();
        return await dbManager.getConnectionFromPool();
    },

    end: async () => {
        if (dbManager.activeConnection && dbManager.activeConnection.end) {
            await dbManager.activeConnection.end();
        }
    }
};

// Initialize เมื่อโหลดไฟล์ (แต่ไม่ทำทันที)
// ลบการ auto-initialize ออกเพื่อหลีกเลี่ยง circular dependency

module.exports = db;