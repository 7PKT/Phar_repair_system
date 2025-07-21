// api/rooms.js - API Endpoint สำหรับจัดการข้อมูลห้อง
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Import auth middleware - ตรวจสอบให้แน่ใจว่าไฟล์ auth.js มีอยู่และ export function
let auth;
try {
  auth = require('../middleware/auth');
  // ตรวจสอบว่า auth เป็น function หรือไม่
  if (typeof auth !== 'function') {
    console.error('Auth middleware is not a function');
    // สร้าง placeholder function หากไม่มี auth
    auth = (req, res, next) => {
      // ใส่ user dummy สำหรับทดสอบ
      req.user = { role: 'admin' };
      next();
    };
  }
} catch (error) {
  console.error('Error loading auth middleware:', error);
  // สร้าง placeholder function หากไม่มี auth
  auth = (req, res, next) => {
    // ใส่ user dummy สำหรับทดสอบ
    req.user = { role: 'admin' };
    next();
  };
}

// ฟังก์ชันสำหรับสร้าง connection pool
const createConnection = async () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'repair_system',
    charset: 'utf8mb4'
  });
};

// GET /api/rooms - ดึงรายการห้องทั้งหมด (สำหรับ admin)
router.get('/', auth, async (req, res) => {
  try {
    const connection = await createConnection();
    
    const [rooms] = await connection.execute(`
      SELECT id, name, building, floor, description, is_active, created_at, updated_at
      FROM rooms 
      WHERE is_active = 1
      ORDER BY building, floor, name
    `);
    
    await connection.end();
    
    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง'
    });
  }
});

// GET /api/rooms/by-building-floor?building=X&floor=Y - ดึงห้องตามอาคารและชั้น
router.get('/by-building-floor', auth, async (req, res) => {
  try {
    const { building, floor } = req.query;
    
    // ตรวจสอบ parameters
    if (!building || !floor) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุอาคารและชั้น'
      });
    }
    
    const buildingNum = parseInt(building);
    const floorNum = parseInt(floor);
    
    if (isNaN(buildingNum) || isNaN(floorNum)) {
      return res.status(400).json({
        success: false,
        message: 'อาคารและชั้นต้องเป็นตัวเลข'
      });
    }
    
    const connection = await createConnection();
    
    // ดึงห้องตามอาคารและชั้น
    const [rooms] = await connection.execute(`
      SELECT id, name, building, floor, description
      FROM rooms 
      WHERE building = ? AND floor = ? AND is_active = 1
      ORDER BY name
    `, [buildingNum, floorNum]);
    
    await connection.end();
    
    res.json({
      success: true,
      data: rooms,
      building: buildingNum,
      floor: floorNum,
      count: rooms.length
    });
  } catch (error) {
    console.error('Error fetching rooms by building and floor:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้อง'
    });
  }
});

// GET /api/rooms/buildings - ดึงรายการอาคารที่มีห้อง
router.get('/buildings', auth, async (req, res) => {
  try {
    const connection = await createConnection();
    
    const [buildings] = await connection.execute(`
      SELECT DISTINCT building
      FROM rooms 
      WHERE is_active = 1
      ORDER BY building
    `);
    
    await connection.end();
    
    res.json({
      success: true,
      data: buildings.map(row => row.building)
    });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลอาคาร'
    });
  }
});

// GET /api/rooms/floors/:building - ดึงรายการชั้นในอาคาร
router.get('/floors/:building', auth, async (req, res) => {
  try {
    const building = parseInt(req.params.building);
    
    if (isNaN(building)) {
      return res.status(400).json({
        success: false,
        message: 'อาคารต้องเป็นตัวเลข'
      });
    }
    
    const connection = await createConnection();
    
    const [floors] = await connection.execute(`
      SELECT DISTINCT floor
      FROM rooms 
      WHERE building = ? AND is_active = 1
      ORDER BY floor
    `, [building]);
    
    await connection.end();
    
    res.json({
      success: true,
      data: floors.map(row => row.floor),
      building: building
    });
  } catch (error) {
    console.error('Error fetching floors:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลชั้น'
    });
  }
});

// POST /api/rooms - เพิ่มห้องใหม่ (สำหรับ admin)
router.post('/', auth, async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง'
      });
    }
    
    const { name, building, floor, description } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !building || floor === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อห้อง, อาคาร, ชั้น)'
      });
    }
    
    const connection = await createConnection();
    
    // ตรวจสอบว่าห้องซ้ำหรือไม่
    const [existing] = await connection.execute(`
      SELECT id FROM rooms 
      WHERE name = ? AND building = ? AND floor = ? AND is_active = 1
    `, [name, building, floor]);
    
    if (existing.length > 0) {
      await connection.end();
      return res.status(409).json({
        success: false,
        message: 'ห้องนี้มีอยู่แล้วในอาคารและชั้นที่ระบุ'
      });
    }
    
    // เพิ่มห้องใหม่
    const [result] = await connection.execute(`
      INSERT INTO rooms (name, building, floor, description, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, [name, building, floor, description || null]);
    
    await connection.end();
    
    res.status(201).json({
      success: true,
      message: 'เพิ่มห้องสำเร็จ',
      data: {
        id: result.insertId,
        name,
        building,
        floor,
        description
      }
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มห้อง'
    });
  }
});

// PUT /api/rooms/:id - แก้ไขข้อมูลห้อง (สำหรับ admin)
router.put('/:id', auth, async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง'
      });
    }
    
    const roomId = parseInt(req.params.id);
    const { name, building, floor, description, is_active } = req.body;
    
    if (isNaN(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'ID ห้องไม่ถูกต้อง'
      });
    }
    
    const connection = await createConnection();
    
    // ตรวจสอบว่าห้องมีอยู่หรือไม่
    const [room] = await connection.execute(`
      SELECT id FROM rooms WHERE id = ?
    `, [roomId]);
    
    if (room.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบห้องที่ระบุ'
      });
    }
    
    // อัปเดตข้อมูล
    const [result] = await connection.execute(`
      UPDATE rooms 
      SET name = ?, building = ?, floor = ?, description = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, building, floor, description || null, is_active !== undefined ? is_active : 1, roomId]);
    
    await connection.end();
    
    res.json({
      success: true,
      message: 'อัปเดตข้อมูลห้องสำเร็จ'
    });
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลห้อง'
    });
  }
});

// DELETE /api/rooms/:id - ลบห้อง (soft delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ไม่มีสิทธิ์เข้าถึง'
      });
    }
    
    const roomId = parseInt(req.params.id);
    
    if (isNaN(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'ID ห้องไม่ถูกต้อง'
      });
    }
    
    const connection = await createConnection();
    
    // ตรวจสอบว่าห้องมีอยู่หรือไม่
    const [room] = await connection.execute(`
      SELECT id FROM rooms WHERE id = ? AND is_active = 1
    `, [roomId]);
    
    if (room.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'ไม่พบห้องที่ระบุ'
      });
    }
    
    // Soft delete (เปลี่ยน is_active เป็น 0)
    await connection.execute(`
      UPDATE rooms 
      SET is_active = 0, updated_at = NOW()
      WHERE id = ?
    `, [roomId]);
    
    await connection.end();
    
    res.json({
      success: true,
      message: 'ลบห้องสำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบห้อง'
    });
  }
});

module.exports = router;