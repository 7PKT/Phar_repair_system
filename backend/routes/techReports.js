const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { request_id, report_comment, created_by } = req.body;
    
    if (!request_id || !report_comment || !created_by) {
      return res.status(400).json({ 
        error: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }

    const query = `
      INSERT INTO tech_report_request 
      (request_id, report_comment, created_by, created_at) 
      VALUES (?, ?, ?, NOW())
    `;
    
    const [result] = await db.execute(query, [request_id, report_comment, created_by]);
    
    res.json({
      success: true,
      message: 'บันทึกรายงานปัญหาเรียบร้อย',
      report_id: result.insertId
    });
  } catch (error) {
    console.error('Error creating tech report:', error);
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการบันทึกรายงาน' 
    });
  }
});

router.get('/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const query = `
      SELECT * FROM tech_report_request 
      WHERE request_id = ? 
      ORDER BY created_at DESC
    `;
    
    const [rows] = await db.execute(query, [requestId]);
    
    res.json({
      success: true,
      reports: rows
    });
  } catch (error) {
    console.error('Error fetching tech reports:', error);
    res.status(500).json({ 
      error: 'เกิดข้อผิดพลาดในการโหลดรายงาน' 
    });
  }
});

module.exports = router;