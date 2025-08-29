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

// *** เก็บเฉพาะ route เดียวพร้อม debug ***
router.put('/:id', authenticateToken, upload.fields([
    { name: 'images', maxCount: 50 },
    { name: 'completion_images', maxCount: 50 }
]), async (req, res) => {
    try {
        console.log('=== DEBUG UPDATE REPAIR ===');
        console.log('User role:', req.user.role);
        console.log('req.body.status:', req.body.status);
        console.log('req.body.assigned_to:', req.body.assigned_to);
        console.log('Type of status:', typeof req.body.status);
        console.log('Status empty check:', !req.body.status);
        console.log('Files:', req.files);

        const userRole = req.user.role;

        if (userRole === 'user') {
            // User แก้ไขแค่ข้อมูลพื้นฐาน
            const updateData = {
                ...req.body,
                new_images: req.files?.images || []
            };

            await repairService.updateRepair(req.params.id, updateData, req.user);

        } else if (userRole === 'admin' || userRole === 'technician') {
            // Admin/Technician แก้ไขได้ทั้งข้อมูลพื้นฐานและสถานะ

            // อัปเดตข้อมูลพื้นฐานถ้ามี
            if (req.body.title || req.body.description || req.body.category_id) {
                console.log('Updating basic data...');
                const updateData = {
                    title: req.body.title,
                    description: req.body.description,
                    category_id: req.body.category_id,
                    location: req.body.location,
                    priority: req.body.priority,
                    new_images: req.files?.images || [],
                    keep_images: req.body.keep_images
                };

                await repairService.updateRepair(req.params.id, updateData, req.user);
            }

            // อัปเดตสถานะถ้ามี
            console.log('Checking status condition:', !!req.body.status);
            console.log('Status value:', JSON.stringify(req.body.status));
            
            if (req.body.status !== undefined && req.body.status !== null && req.body.status !== '') {
                console.log('Status condition passed! Updating status...');
                const statusData = {
                    status: req.body.status,
                    completion_details: req.body.completion_details,
                    assigned_to: req.body.assigned_to,
                    completion_images: req.files?.completion_images || [],
                    updated_by: req.user.id,
                    keep_completion_images: req.body.keep_completion_images
                };

                console.log('Status data being sent:', statusData);
                await repairService.updateRepairStatus(req.params.id, statusData);
                console.log('Status update completed!');
            } else {
                console.log('Status condition failed! Status value:', req.body.status);
            }
        }

        res.json({
            message: 'อัพเดทข้อมูลสำเร็จ',
            repair: { id: req.params.id }
        });

    } catch (error) {
        // ลบไฟล์ที่อัปโหลดมาถ้าเกิดข้อผิดพลาด
        if (req.files) {
            if (req.files.images) {
                req.files.images.forEach(file => imageService.deleteFile(file.path));
            }
            if (req.files.completion_images) {
                req.files.completion_images.forEach(file => imageService.deleteFile(file.path));
            }
        }

        console.error('ข้อผิดพลาดในการอัพเดทการซ่อม:', error);
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