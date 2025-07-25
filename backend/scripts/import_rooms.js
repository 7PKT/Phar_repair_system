const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');


const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'repair_system',
  charset: 'utf8mb4'
};


const roomsData = [

  { name: 'ห้องการเงิน การคลังและพัสดุ', building: 1, floor: 1, description: null },
  { name: 'ห้องโถงบริการการศึกษา', building: 1, floor: 1, description: null },
  { name: 'ห้องงานบริการการศึกษา', building: 1, floor: 1, description: null },
  { name: 'ห้องพักอาจารย์ 1', building: 1, floor: 1, description: null },
  { name: 'ห้องพักอาจารย์ 14', building: 1, floor: 2, description: null },
  { name: 'ห้อง Counselling', building: 1, floor: 2, description: null },
  { name: 'ห้องพักอาจารย์ 15', building: 1, floor: 2, description: null },
  { name: 'ห้องพวงคราม', building: 1, floor: 2, description: null },
  { name: 'ห้องพักอาจารย์ 11', building: 1, floor: 2, description: null },
  { name: 'ห้องเฟื่องฟ้า 1', building: 1, floor: 3, description: 'ดาดฟ้า' },
  { name: 'ห้องเฟื่องฟ้า 2', building: 1, floor: 3, description: 'ดาดฟ้า' },
  { name: 'ห้องเฟื่องฟ้า 3', building: 1, floor: 3, description: 'ดาดฟ้า' },


  { name: 'ห้องเครื่องสำอางค์', building: 2, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการจุลวิทยา 1', building: 2, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการจุลวิทยา 2', building: 2, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการจุลวิทยา 3', building: 2, floor: 1, description: null },
  { name: 'ห้องเครื่องมือกลาง 2 - 1', building: 2, floor: 2, description: null },
  { name: 'ห้องเครื่องมือกลาง 2 - 2', building: 2, floor: 2, description: null },
  { name: 'ห้องเครื่องมือกลาง 2 - 3', building: 2, floor: 2, description: null },
  { name: 'ห้องเครื่องมือกลาง 2 - 4', building: 2, floor: 2, description: null },
  { name: 'ห้องเครื่องมือกลาง 2 - 5', building: 2, floor: 2, description: null },
  { name: 'ห้องเครื่องมือกลาง 2 - 6', building: 2, floor: 2, description: null },
  { name: 'ห้องเครื่องมือกลาง 2 - 7', building: 2, floor: 2, description: null },
  { name: 'ห้องเครื่องมือกลาง 2 - 8', building: 2, floor: 2, description: null },
  { name: 'ห้องบรรยายผักหวาน (308)', building: 2, floor: 3, description: null },
  { name: 'ห้องพักอาจารย์ 6', building: 2, floor: 4, description: null },


  { name: 'ห้องปฏิบัติการยาเม็ด 1', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 2', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 3', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 4', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 5', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 6', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 7', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 8', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 9', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการยาเม็ด 10', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการและวิจัย เภสัชเคมี 1', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการและวิจัย เภสัชเคมี 2', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการและวิจัย เภสัชเคมี 3', building: 3, floor: 1, description: null },
  { name: 'ห้องปฏิบัติการและวิจัย เภสัชเคมี 4', building: 3, floor: 1, description: null },
  { name: 'ห้องบรรยายผักเสี้ยว (212)', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี 1', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี 2', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี 3', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี 4', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี 5', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี 6', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี 7', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี 8', building: 3, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการกลางภาคบริบาล (ห้องไบโอ)', building: 3, floor: 3, description: null },
  { name: 'ห้องเก็บสารเคมี (อาจารย์ไชยวัฒน์)', building: 3, floor: 3, description: null },
  { name: 'ห้องเลี้ยงเซลล์', building: 3, floor: 3, description: null },
  { name: 'ห้องประชุม 6', building: 3, floor: 3, description: null },
  { name: 'ห้องพักอาจารย์ไชยวัฒน์', building: 3, floor: 3, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี ชั้น 3 - 1', building: 3, floor: 3, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี ชั้น 3 - 2', building: 3, floor: 3, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี ชั้น 3 - 3', building: 3, floor: 3, description: null },
  { name: 'ห้องปฏิบัติการเภสัชเคมี ชั้น 3 - 4', building: 3, floor: 3, description: null },
  { name: 'ห้องพักอาจารย์ 4', building: 3, floor: 3, description: null },
  { name: 'ห้องบรรยายผักแว่น (401)', building: 3, floor: 4, description: null },
  { name: 'ห้องพักอาจารย์ 5', building: 3, floor: 4, description: null },
  { name: 'ศูนย์นวัตกรรมสุขภาพองค์รวมโภชน์เภสัชภัณฑ์ 1', building: 3, floor: 4, description: null },
  { name: 'ศูนย์นวัตกรรมสุขภาพองค์รวมโภชน์เภสัชภัณฑ์ 2', building: 3, floor: 4, description: null },
  { name: 'ศูนย์นวัตกรรมสุขภาพองค์รวมโภชน์เภสัชภัณฑ์ 3', building: 3, floor: 4, description: null },
  { name: 'ศูนย์นวัตกรรมสุขภาพองค์รวมโภชน์เภสัชภัณฑ์ 4', building: 3, floor: 4, description: null },
  { name: 'ห้องปฏิบัติการ', building: 3, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 3 - 1', building: 3, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 3 - 2', building: 3, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 3 - 3', building: 3, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 3 - 4', building: 3, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 3 - 5', building: 3, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 3 - 6', building: 3, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 3 - 7', building: 3, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 3 - 8', building: 3, floor: 4, description: null },
  { name: 'ห้องดนตรี', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 1', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 2', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 3', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 4', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 5', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 6', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 7', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 8', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 9', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 10', building: 3, floor: 5, description: null },
  { name: 'ห้องปฏิบัติการชั้น 5 - 11', building: 3, floor: 5, description: null },


  { name: 'ห้องใต้ดินหน่วยอาคาร', building: 4, floor: 0, description: 'ใต้ดิน' },
  { name: 'งานบริหารงานทั่วไป', building: 4, floor: 1, description: null },
  { name: 'งานนโยบายและแผน', building: 4, floor: 1, description: null },
  { name: 'งานบริหารงานวิจัยและวิเทศน์สัมพันธ์', building: 4, floor: 1, description: null },
  { name: 'ห้องพักอาจารย์ 10', building: 4, floor: 1, description: null },
  { name: 'ห้องภาควิชาบริบาลเภสัชกรรม', building: 4, floor: 1, description: null },
  { name: 'ห้องเขียวมะกอก', building: 4, floor: 1, description: null },
  { name: 'ภาควิชาวิทยาศาสตร์เภสัชกรรม', building: 4, floor: 1, description: null },
  { name: 'พิพัธภัณฑ์สมุนไพร', building: 4, floor: 1, description: null },
  { name: 'ห้องร้านขายยาสมุนไพร (หอมไกล)', building: 4, floor: 1, description: null },
  { name: 'สำนักงานคณบดี', building: 4, floor: 2, description: null },
  { name: 'ห้องผู้ช่วยคณบดี', building: 4, floor: 2, description: null },
  { name: 'ห้องประชุม 1', building: 4, floor: 2, description: null },
  { name: 'ห้องประชุม 2', building: 4, floor: 2, description: null },
  { name: 'ห้องประชุม 3', building: 4, floor: 2, description: null },
  { name: 'ห้องประชุม 4', building: 4, floor: 2, description: null },
  { name: 'ห้องประชุม 5', building: 4, floor: 2, description: null },
  { name: 'ห้องออนไลน์ 1', building: 4, floor: 2, description: null },
  { name: 'ห้องออนไลน์ 2', building: 4, floor: 2, description: null },
  { name: 'ห้องออนไลน์ 3', building: 4, floor: 2, description: null },
  { name: 'ห้องออนไลน์ 4', building: 4, floor: 2, description: null },
  { name: 'หน่วย IT และ ห้องควบคุม Server', building: 4, floor: 2, description: null },
  { name: 'ห้องเพาะเลี้ยงเนื้อเยื่อ', building: 4, floor: 2, description: null },
  { name: 'หน่วยฝึกงานและพัฒนาวิชาชีพ', building: 4, floor: 2, description: null },
  { name: 'ห้องพุดซ้อน 1', building: 4, floor: 2, description: null },
  { name: 'ห้องพุดซ้อน 2', building: 4, floor: 2, description: null },
  { name: 'ห้องพุดซ้อน 3', building: 4, floor: 2, description: null },
  { name: 'ห้องพุทธชาด', building: 4, floor: 3, description: null },
  { name: 'ห้อง PCTC ศูนย์ฝึกอบรมบริบาลเภสัชกรรม', building: 4, floor: 3, description: null },
  { name: 'ห้องสมุด', building: 4, floor: 3, description: null },
  { name: 'ห้องศูนย์นวัตกรรมสมุนไพร', building: 4, floor: 3, description: null },
  { name: 'ห้องปฏิบัติการ เภสัชเวท', building: 4, floor: 4, description: null },
  { name: 'ห้องบัณฑิต 1', building: 4, floor: 4, description: null },
  { name: 'ห้องราชาวดี', building: 4, floor: 4, description: null },
  { name: 'ห้องสุนทรี (ห้องเก็บของข้างห้องสสี)', building: 4, floor: 4, description: null },
  { name: 'ห้องพักอาจารย์ 9', building: 4, floor: 4, description: null },
  { name: 'ห้องพุทธรักษา', building: 4, floor: 4, description: null },
  { name: 'ห้องเครื่องมือกลาง 1', building: 4, floor: 5, description: null },
  { name: 'ห้องพุดตาล', building: 4, floor: 5, description: null },
  { name: 'ห้องประชุมสสี', building: 4, floor: 5, description: null },
  { name: 'ห้องเครื่องลิฟท์หน้าภาคบริบาลฯ', building: 4, floor: 6, description: 'ดาดฟ้า' },
  { name: 'ห้องเครื่องลิฟท์หน้าภาควิทย์ฯ', building: 4, floor: 6, description: 'ดาดฟ้า' },


  { name: 'ห้อง Derm X', building: 5, floor: 1, description: null },
  { name: 'ห้องระบาด', building: 5, floor: 1, description: null },
  { name: 'ห้องพักบัณฑิต 2', building: 5, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการกลางเทคโนโลยีเภสัชกรรม', building: 5, floor: 2, description: null },
  { name: 'ห้องปฏิบัติ (Lab นักศึกษา)', building: 5, floor: 2, description: null },
  { name: 'ห้องพักอาจารย์ 8', building: 5, floor: 2, description: null },
  { name: 'ห้องปฏิบัติการกลางทางเทคโนโลยี ฯ', building: 5, floor: 3, description: null },
  { name: 'ห้องปฏิบัติการ (เครื่องสำอางค์)', building: 5, floor: 3, description: null },
  { name: 'ห้องปฏิบัติการ ชั้น 3 อาคาร 5', building: 5, floor: 3, description: null },
  { name: 'ห้องวิจัยเลี้ยงเซลล์ 2', building: 5, floor: 3, description: null },
  { name: 'ห้องเครื่องมือ (ห้องขัดผิว)', building: 5, floor: 3, description: null },
  { name: 'ห้องเครื่องมือ', building: 5, floor: 3, description: null },
  { name: 'ห้องพักอาจารย์ 2', building: 5, floor: 3, description: null },


  { name: 'ห้องพักอาจารย์ 7 - 1', building: 6, floor: 1, description: null },
  { name: 'ห้องพักอาจารย์ 7 - 2', building: 6, floor: 1, description: null },
  { name: 'ห้องพักอาจารย์ 7 - 3', building: 6, floor: 1, description: null },
  { name: 'ห้องพักอาจารย์ 7 - 4', building: 6, floor: 1, description: null },
  { name: 'ห้องพักอาจารย์ 7 - 5', building: 6, floor: 1, description: null },
  { name: 'ห้องพักอาจารย์ 7 - 6', building: 6, floor: 1, description: null },
  { name: 'Co-working space - 1', building: 6, floor: 2, description: null },
  { name: 'Co-working space - 2', building: 6, floor: 2, description: null },
  { name: 'Co-working space - 3', building: 6, floor: 2, description: null },
  { name: 'Co-working space - 4', building: 6, floor: 2, description: null },
  { name: 'Co-working space - 5', building: 6, floor: 2, description: null },
  { name: 'Co-working space - 6', building: 6, floor: 2, description: null },
  { name: 'Co-working space - 7', building: 6, floor: 2, description: null },
  { name: 'ห้องบรรยายกระถินณรงค์', building: 6, floor: 2, description: null },


  { name: 'ห้องฏิบัติการยาฉีด', building: 7, floor: 1, description: null },


  { name: 'โรงงานเครื่องสำอางค์ 1', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 2', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 3', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 4', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 5', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 6', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 7', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 8', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 9', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 10', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 11', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 12', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 13', building: 8, floor: 1, description: null },
  { name: 'โรงงานเครื่องสำอางค์ 14', building: 8, floor: 1, description: null },


  { name: 'หอพระด้านหน้า', building: 9, floor: 1, description: 'หน้าคณะ' },
  { name: 'หอพักนักศึกษา', building: 9, floor: 1, description: 'หอพัก' }
];

async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');
    return connection;
  } catch (error) {
    console.error('ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', error);
    throw error;
  }
}

async function createRoomsTable(connection) {
  try {

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`rooms\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`name\` varchar(200) NOT NULL,
        \`building\` int(11) NOT NULL,
        \`floor\` int(11) NOT NULL,
        \`description\` text DEFAULT NULL,
        \`is_active\` tinyint(1) DEFAULT 1,
        \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
        \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
        PRIMARY KEY (\`id\`),
        KEY \`idx_building_floor\` (\`building\`, \`floor\`),
        KEY \`idx_name\` (\`name\`),
        KEY \`idx_building_floor_name\` (\`building\`, \`floor\`, \`name\`),
        KEY \`idx_active\` (\`is_active\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ สร้างตาราง rooms สำเร็จ');
  } catch (error) {
    console.error('❌ ไม่สามารถสร้างตาราง rooms ได้:', error);
    throw error;
  }
}

async function clearExistingRooms(connection) {
  try {

    await connection.execute('DELETE FROM rooms');
    console.log('✅ ลบข้อมูลห้องเก่าทั้งหมดสำเร็จ');


    await connection.execute('ALTER TABLE rooms AUTO_INCREMENT = 1');
    console.log('✅ รีเซ็ต AUTO_INCREMENT สำเร็จ');
  } catch (error) {
    console.error('❌ ไม่สามารถลบข้อมูลเก่าได้:', error);
    throw error;
  }
}

async function insertRoomsData(connection) {
  try {
    console.log(`\n📝 เริ่มนำเข้าข้อมูลห้อง ${roomsData.length} รายการ...`);


    const insertQuery = `
      INSERT INTO rooms (name, building, floor, description, is_active)
      VALUES (?, ?, ?, ?, 1)
    `;

    let insertedCount = 0;
    let skippedCount = 0;
    const duplicates = [];

    for (const room of roomsData) {
      try {

        const [existing] = await connection.execute(`
          SELECT id, name FROM rooms 
          WHERE name = ? AND building = ? AND floor = ?
        `, [room.name, room.building, room.floor]);

        if (existing.length > 0) {
          duplicates.push({
            name: room.name,
            building: room.building,
            floor: room.floor,
            existing_id: existing[0].id
          });
          skippedCount++;
          continue;
        }


        await connection.execute(insertQuery, [
          room.name,
          room.building,
          room.floor,
          room.description
        ]);

        insertedCount++;


        if (insertedCount % 10 === 0) {
          console.log(`📋 นำเข้าแล้ว ${insertedCount} รายการ...`);
        }

      } catch (error) {
        console.error(`❌ เกิดข้อผิดพลาดในการเพิ่มห้อง "${room.name}":`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n✅ การนำเข้าข้อมูลเสร็จสิ้น!`);
    console.log(`📊 สรุปผลการนำเข้า:`);
    console.log(`   - เพิ่มสำเร็จ: ${insertedCount} รายการ`);
    console.log(`   - ข้ามไป (ซ้ำ): ${skippedCount} รายการ`);
    console.log(`   - รวม: ${insertedCount + skippedCount} รายการ`);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  รายการที่ซ้ำ (${duplicates.length} รายการ):`);
      duplicates.slice(0, 5).forEach(dup => {
        console.log(`   - ${dup.name} (อาคาร ${dup.building} ชั้น ${dup.floor}) - ID: ${dup.existing_id}`);
      });
      if (duplicates.length > 5) {
        console.log(`   ... และอีก ${duplicates.length - 5} รายการ`);
      }
    }

    return { insertedCount, skippedCount, duplicates };

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการนำเข้าข้อมูล:', error);
    throw error;
  }
}

async function verifyImportedData(connection) {
  try {
    console.log(`\n🔍 ตรวจสอบข้อมูลที่นำเข้า...`);


    const [totalRooms] = await connection.execute(`
      SELECT COUNT(*) as total FROM rooms WHERE is_active = 1
    `);


    const [roomsByBuilding] = await connection.execute(`
      SELECT building, COUNT(*) as count
      FROM rooms 
      WHERE is_active = 1
      GROUP BY building
      ORDER BY building
    `);


    const [roomsByFloor] = await connection.execute(`
      SELECT building, floor, COUNT(*) as count
      FROM rooms 
      WHERE is_active = 1
      GROUP BY building, floor
      ORDER BY building, floor
    `);

    console.log(`📊 จำนวนห้องทั้งหมด: ${totalRooms[0].total} ห้อง`);

    console.log(`\n🏢 จำนวนห้องแยกตามอาคาร:`);
    roomsByBuilding.forEach(row => {
      console.log(`   - อาคาร ${row.building}: ${row.count} ห้อง`);
    });

    console.log(`\n🏗️  จำนวนห้องแยกตามชั้น:`);
    let currentBuilding = null;
    roomsByFloor.forEach(row => {
      if (currentBuilding !== row.building) {
        console.log(`   อาคาร ${row.building}:`);
        currentBuilding = row.building;
      }
      const floorLabel = row.floor === 0 ? 'ใต้ดิน' :
        (row.building === 4 && row.floor === 6) ? 'ดาดฟ้า' :
          `ชั้น ${row.floor}`;
      console.log(`     - ${floorLabel}: ${row.count} ห้อง`);
    });


    const [sampleRooms] = await connection.execute(`
      SELECT id, name, building, floor, description
      FROM rooms 
      WHERE is_active = 1
      ORDER BY building, floor, name
      LIMIT 5
    `);

    console.log(`\n📋 ตัวอย่างห้องแรก 5 รายการ:`);
    sampleRooms.forEach(room => {
      const floorText = room.floor === 0 ? 'ใต้ดิน' :
        (room.building === 4 && room.floor === 6) ? 'ดาดฟ้า' :
          `ชั้น ${room.floor}`;
      console.log(`   ${room.id}. ${room.name} (อาคาร ${room.building} ${floorText})`);
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการตรวจสอบข้อมูล:', error);
    throw error;
  }
}

async function saveImportLog(results) {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      total_processed: roomsData.length,
      inserted: results.insertedCount,
      skipped: results.skippedCount,
      duplicates: results.duplicates.length,
      success: true
    };

    const logPath = path.join(__dirname, '../logs/rooms_import.json');


    const logsDir = path.dirname(logPath);
    await fs.mkdir(logsDir, { recursive: true });

    await fs.writeFile(logPath, JSON.stringify(logData, null, 2), 'utf8');
    console.log(`📁 บันทึก log ไฟล์ที่: ${logPath}`);

  } catch (error) {
    console.warn('⚠️  ไม่สามารถบันทึก log ไฟล์ได้:', error.message);
  }
}

async function main() {
  let connection;

  try {
    console.log('🚀 เริ่มต้นการนำเข้าข้อมูลห้อง...\n');


    connection = await createConnection();


    await createRoomsTable(connection);


    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const clearData = await new Promise((resolve) => {
      rl.question('🗑️  ต้องการลบข้อมูลห้องเก่าทั้งหมดหรือไม่? (y/N): ', (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (clearData) {
      await clearExistingRooms(connection);
    }


    const results = await insertRoomsData(connection);


    await verifyImportedData(connection);


    await saveImportLog(results);

    console.log(`\n🎉 การนำเข้าข้อมูลเสร็จสิ้นเรียบร้อย!`);

  } catch (error) {
    console.error('\n💥 เกิดข้อผิดพลาดในการนำเข้าข้อมูล:', error);
    process.exit(1);

  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 ปิดการเชื่อมต่อฐานข้อมูลแล้ว');
    }
  }
}


if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  roomsData,
  createConnection,
  insertRoomsData,
  main
};