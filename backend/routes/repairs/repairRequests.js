const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../config/database');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const imageService = require('../../services/imageService');
const repairService = require('../../services/repairService');

const router = express.Router();

const upload = multer({
    storage: imageService.createStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 50
    },
    fileFilter: imageService.fileFilter
});

router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await repairService.getRepairRequests(req.query, req.user);
        res.json(result);
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงรายการซ่อม:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const repair = await repairService.getRepairById(req.params.id);
        if (!repair) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการแจ้งซ่อม' });
        }
        res.json(repair);
    } catch (error) {
        console.error('ข้อผิดพลาดในการดึงข้อมูลการซ่อม:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

router.post('/', authenticateToken, upload.array('images', 50), async (req, res) => {
    try {
        const repairData = {
            ...req.body,
            requester_id: req.user.id,
            images: req.files || []
        };

        const result = await repairService.createRepair(repairData);

        res.status(201).json({
            message: 'แจ้งซ่อมสำเร็จ',
            repair: result
        });
    } catch (error) {
        if (req.files) {
            req.files.forEach(file => imageService.deleteFile(file.path));
        }
        
        console.error('ข้อผิดพลาดในการสร้างการซ่อม:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
    }
});

router.put('/:id', authenticateToken, upload.array('images', 50), async (req, res) => {
    try {
        const updateData = {
            ...req.body,
            new_images: req.files || []
        };

        await repairService.updateRepair(req.params.id, updateData, req.user);

        res.json({ message: 'อัพเดทข้อมูลสำเร็จ' });
    } catch (error) {
        if (req.files) {
            req.files.forEach(file => imageService.deleteFile(file.path));
        }
        
        console.error('ข้อผิดพลาดในการอัพเดทการซ่อม:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
    }
});

router.put('/:id/status', authenticateToken, requireRole(['admin', 'technician']), 
    upload.array('completion_images', 50), async (req, res) => {
    try {
        const statusData = {
            ...req.body,
            completion_images: req.files || [],
            updated_by: req.user.id
        };

        await repairService.updateRepairStatus(req.params.id, statusData);

        res.json({ message: 'อัพเดทสถานะสำเร็จ' });
    } catch (error) {
        if (req.files) {
            req.files.forEach(file => imageService.deleteFile(file.path));
        }
        
        console.error('ข้อผิดพลาดในการอัพเดทสถานะ:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
    }
});

router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        await repairService.deleteRepair(req.params.id);
        res.json({ message: 'ลบข้อมูลสำเร็จ' });
    } catch (error) {
        console.error('ข้อผิดพลาดในการลบการซ่อม:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
    }
});

module.exports = router;