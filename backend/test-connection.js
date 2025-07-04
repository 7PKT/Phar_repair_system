// test-connection.js - ไฟล์ทดสอบการเชื่อมต่อ
const dns = require('dns');
const net = require('net');

async function testNetworkConnection() {
    console.log('🔍 Testing network connection to CMU Database...');
    
    const hostname = 'ma.pharmacy.cmu.ac.th';
    const port = 3306;
    
    // 1. ทดสอบ DNS Resolution
    try {
        const address = await new Promise((resolve, reject) => {
            dns.lookup(hostname, (err, address) => {
                if (err) reject(err);
                else resolve(address);
            });
        });
        console.log(`✅ DNS Resolution successful: ${hostname} -> ${address}`);
    } catch (error) {
        console.error(`❌ DNS Resolution failed: ${error.message}`);
        return false;
    }
    
    // 2. ทดสอบ TCP Connection
    try {
        const connected = await new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const timeout = setTimeout(() => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            }, 10000);
            
            socket.connect(port, hostname, () => {
                clearTimeout(timeout);
                socket.destroy();
                resolve(true);
            });
            
            socket.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
        
        console.log(`✅ TCP Connection successful: ${hostname}:${port}`);
        return true;
    } catch (error) {
        console.error(`❌ TCP Connection failed: ${error.message}`);
        
        // แสดงข้อแนะนำ
        console.log('\n💡 Possible solutions:');
        console.log('   1. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        console.log('   2. ใช้ VPN ของมหาวิทยาลัย (หาก CMU จำกัดการเข้าถึง)');
        console.log('   3. ตรวจสอบ Firewall ในเครื่อง');
        console.log('   4. ติดต่อแผนก IT ของ CMU เพื่อขอเปิดสิทธิ์ Remote Access');
        
        return false;
    }
}

// รันทดสอบ
testNetworkConnection().then(success => {
    if (success) {
        console.log('\n🎉 Network connection is working! You can proceed with database setup.');
    } else {
        console.log('\n❌ Network connection failed. Please fix network issues before continuing.');
    }
    process.exit(success ? 0 : 1);
});