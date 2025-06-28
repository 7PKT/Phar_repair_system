const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const lineMessaging = require('../utils/lineMessaging');

const router = express.Router();

// ตั้งค่า multer สำหรับอัพโหลดรูปภาพหลายไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/repair-images';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'repair-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 50 // Maximum 50 files at once (adjust as needed)
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WebP)'));
        }
    }
});

// ดึงหมวดหมู่ทั้งหมด (สำหรับผู้ใช้ทั่วไป)
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const [categories] = await db.execute(`
            SELECT id, name, description 
            FROM categories 
            ORDER BY id ASC
        `);

        console.log('📋 Categories fetched:', categories.length);
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ดึงรายชื่อช่างเทคนิค (สำหรับทุก role)
router.get('/technicians', authenticateToken, async (req, res) => {
    try {
        const [technicians] = await db.execute(`
            SELECT id, full_name, username, role 
            FROM users 
            WHERE role IN ('admin', 'technician')
            ORDER BY full_name ASC
        `);

        console.log('👷 Technicians fetched for all roles:', technicians.length);
        res.json(technicians);
    } catch (error) {
        console.error('Get technicians error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ดึงรายการแจ้งซ่อม - แสดงทั้งหมดให้ทุก role ดู
// ดึงรายการแจ้งซ่อม - แสดงทั้งหมดให้ทุก role ดู (แก้ไขเพื่อดึงข้อมูลทั้งหมด)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, category, priority, page, limit } = req.query;

        // ถ้าไม่ระบุ page และ limit ให้ดึงข้อมูลทั้งหมด
        const shouldPaginate = page || limit;
        const actualPage = parseInt(page) || 1;
        const actualLimit = parseInt(limit) || (shouldPaginate ? 10 : 999999); // ใช้เลขใหญ่มากเพื่อดึงทั้งหมด
        const offset = (actualPage - 1) * actualLimit;

        let query = `
            SELECT 
                r.*,
                c.name as category_name,
                u1.full_name as requester_name,
                u1.email as requester_email,
                u2.full_name as assigned_name
            FROM repair_requests r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN users u1 ON r.requester_id = u1.id
            LEFT JOIN users u2 ON r.assigned_to = u2.id
            WHERE 1=1
        `;

        const params = [];

        // กรองตามเงื่อนไขอื่นๆ
        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        if (category) {
            query += ' AND r.category_id = ?';
            params.push(category);
        }

        if (priority) {
            query += ' AND r.priority = ?';
            params.push(priority);
        }

        query += ' ORDER BY r.created_at DESC';

        // เพิ่ม LIMIT เฉพาะเมื่อต้องการ pagination
        if (shouldPaginate) {
            query += ' LIMIT ? OFFSET ?';
            params.push(actualLimit, offset);
        }

        const [repairs] = await db.execute(query, params);

        // ดึงรูปภาพสำหรับแต่ละ repair
        for (let repair of repairs) {
            const [images] = await db.execute(`
                SELECT id, file_path, file_name, file_size 
                FROM repair_images 
                WHERE repair_request_id = ? 
                ORDER BY id ASC
            `, [repair.id]);
            repair.images = images;
        }

        // นับจำนวนทั้งหมด (สำหรับ pagination)
        let countQuery = `
            SELECT COUNT(*) as total
            FROM repair_requests r
            WHERE 1=1
        `;
        const countParams = [];

        if (status) {
            countQuery += ' AND r.status = ?';
            countParams.push(status);
        }

        if (category) {
            countQuery += ' AND r.category_id = ?';
            countParams.push(category);
        }

        if (priority) {
            countQuery += ' AND r.priority = ?';
            countParams.push(priority);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        console.log(`📋 Repairs fetched for ${req.user.role}:`, repairs.length, 'total:', total);

        // ส่งข้อมูลกลับ
        const response = {
            repairs,
            total: total
        };

        // เพิ่ม pagination info เฉพาะเมื่อมีการใช้ pagination
        if (shouldPaginate) {
            response.pagination = {
                page: actualPage,
                limit: actualLimit,
                total,
                totalPages: Math.ceil(total / actualLimit)
            };
        }

        res.json(response);
    } catch (error) {
        console.error('Get repairs error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ดึงข้อมูลแจ้งซ่อมรายการเดียว
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [repairs] = await db.execute(`
            SELECT 
                r.*,
                c.name as category_name,
                u1.full_name as requester_name,
                u1.email as requester_email,
                u2.full_name as assigned_name
            FROM repair_requests r
            LEFT JOIN categories c ON r.category_id = c.id
            LEFT JOIN users u1 ON r.requester_id = u1.id
            LEFT JOIN users u2 ON r.assigned_to = u2.id
            WHERE r.id = ?
        `, [req.params.id]);

        if (repairs.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการแจ้งซ่อม' });
        }

        const repair = repairs[0];

        // ดึงรูปภาพทั้งหมด
        const [images] = await db.execute(`
            SELECT id, file_path, file_name, file_size, uploaded_at
            FROM repair_images 
            WHERE repair_request_id = ? 
            ORDER BY id ASC
        `, [req.params.id]);
        repair.images = images;

        // ดึงประวัติการอัพเดทสถานะ
        const [history] = await db.execute(`
            SELECT 
                sh.*,
                u.full_name as updated_by_name
            FROM status_history sh
            LEFT JOIN users u ON sh.updated_by = u.id
            WHERE sh.repair_request_id = ?
            ORDER BY sh.created_at DESC
        `, [req.params.id]);

        res.json({
            ...repair,
            status_history: history
        });
    } catch (error) {
        console.error('Get repair error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// สร้างแจ้งซ่อมใหม่ (รองรับหลายรูปภาพ)
router.post('/', authenticateToken, upload.array('images', 50), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { title, description, category_id, location, priority } = req.body;
        const images = req.files || [];

        console.log('🔧 Creating new repair request:', {
            title,
            category_id,
            location,
            priority,
            imageCount: images.length
        });

        // Validation
        if (!title || !description || !category_id || !location || !priority) {
            throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
        }

        // สร้าง repair request
        const [result] = await connection.execute(`
            INSERT INTO repair_requests 
            (title, description, category_id, location, priority, requester_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [title, description, category_id, location, priority, req.user.id]);

        const repairId = result.insertId;
        console.log('✅ Repair request created with ID:', repairId);

        // บันทึกรูปภาพทั้งหมด
        if (images.length > 0) {
            const imageInsertPromises = images.map(image => {
                return connection.execute(`
                    INSERT INTO repair_images 
                    (repair_request_id, file_path, file_name, file_size)
                    VALUES (?, ?, ?, ?)
                `, [repairId, image.path, image.originalname, image.size]);
            });

            await Promise.all(imageInsertPromises);
            console.log('✅ Images saved:', images.length);
        }

        await connection.commit();

        // ส่งการแจ้งเตือนไปยัง admin และ technician ผ่าน LINE Messaging API
        try {
            const [adminUsers] = await db.execute(`
                SELECT line_user_id 
                FROM users 
                WHERE role IN ('admin', 'technician') 
                AND line_user_id IS NOT NULL 
                AND line_user_id != ''
            `);

            if (adminUsers.length > 0) {
                const userIds = adminUsers.map(user => user.line_user_id);
                console.log('📱 Sending LINE messages to user IDs:', userIds);

                await lineMessaging.notifyNewRepairRequest(userIds, {
                    title,
                    location,
                    priority,
                    requester_name: req.user.full_name,
                    imageCount: images.length
                });
                console.log('📱 LINE notifications sent successfully');
            } else {
                console.log('📱 No LINE user IDs found for notifications');
            }
        } catch (notifyError) {
            console.error('LINE notify error:', notifyError);
            // ไม่ให้ notify error ทำให้การสร้าง repair request ล้มเหลว
        }

        res.status(201).json({
            message: 'แจ้งซ่อมสำเร็จ',
            repair: {
                id: repairId,
                title,
                description,
                category_id,
                location,
                priority,
                imageCount: images.length
            }
        });
    } catch (error) {
        await connection.rollback();

        // ลบไฟล์ที่อัพโหลดแล้วถ้าเกิดข้อผิดพลาด
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }

        console.error('Create repair error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
    } finally {
        connection.release();
    }
});

// อัพเดทข้อมูลการแจ้งซ่อม (รองรับหลายรูปภาพ)
router.put('/:id', authenticateToken, upload.array('images', 50), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const { title, description, category_id, location, priority, keep_images } = req.body;
        const repairId = req.params.id;
        const newImages = req.files || [];

        console.log('🔄 Updating repair:', {
            repairId,
            title,
            newImageCount: newImages.length,
            keepImagesData: keep_images
        });

        // ตรวจสอบข้อมูลเดิม
        const [oldRepairs] = await connection.execute(
            'SELECT * FROM repair_requests WHERE id = ?',
            [repairId]
        );

        if (oldRepairs.length === 0) {
            throw new Error('ไม่พบข้อมูลการแจ้งซ่อม');
        }

        const oldRepair = oldRepairs[0];

        // ตรวจสอบสิทธิ์การแก้ไข
        if (req.user.role === 'user' && oldRepair.requester_id !== req.user.id) {
            throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลนี้');
        }

        // ถ้าเป็น user ตรวจสอบว่าสถานะยังแก้ไขได้หรือไม่
        if (req.user.role === 'user' && oldRepair.status !== 'pending') {
            throw new Error('ไม่สามารถแก้ไขได้เนื่องจากสถานะไม่ใช่ "รอดำเนินการ"');
        }

        // อัพเดทข้อมูลพื้นฐาน
        await connection.execute(`
            UPDATE repair_requests 
            SET title = ?, description = ?, category_id = ?, location = ?, priority = ?
            WHERE id = ?
        `, [title, description, category_id, location, priority, repairId]);

        console.log('✅ Basic repair data updated');

        // จัดการรูปภาพ
        console.log('🖼️ Managing images...');

        // ดึงรูปภาพทั้งหมดที่มีอยู่ในระบบ
        const [existingNewImages] = await connection.execute(`
            SELECT id, file_path, file_name FROM repair_images WHERE repair_request_id = ?
        `, [repairId]);

        console.log('📋 Existing new images in DB:', existingNewImages.length);

        // ดึงข้อมูล legacy image (ถ้ามี)
        const legacyImagePath = oldRepair.image_path;
        console.log('📋 Legacy image path:', legacyImagePath);

        // Parse ข้อมูลรูปภาพที่ต้องการเก็บ
        let keepImageData = [];
        try {
            keepImageData = keep_images ? JSON.parse(keep_images) : [];
            console.log('📋 Keep images data:', keepImageData);
        } catch (parseError) {
            console.log('⚠️ Error parsing keep_images, treating as empty array');
            keepImageData = [];
        }

        // สร้าง Set ของรูปภาพที่ต้องการเก็บ
        const keepNewImageIds = new Set();
        let keepLegacyImage = false;

        keepImageData.forEach(item => {
            if (typeof item === 'object') {
                if (item.type === 'legacy') {
                    keepLegacyImage = true;
                    console.log('🔄 Will keep legacy image:', item.path);
                } else if (item.type === 'new' && item.id) {
                    keepNewImageIds.add(parseInt(item.id));
                    console.log('🔄 Will keep new image ID:', item.id);
                }
            } else {
                // backward compatibility - ถ้าเป็นแค่ ID หรือ path
                if (item === 'legacy' || item === legacyImagePath) {
                    keepLegacyImage = true;
                } else if (!isNaN(parseInt(item))) {
                    keepNewImageIds.add(parseInt(item));
                } else if (item === legacyImagePath) {
                    keepLegacyImage = true;
                }
            }
        });

        console.log('📊 Image management plan:', {
            keepLegacyImage,
            keepNewImageIds: Array.from(keepNewImageIds),
            newImagesCount: newImages.length
        });

        // ลบรูปภาพใหม่ที่ไม่ต้องการเก็บ
        for (const existingImage of existingNewImages) {
            if (!keepNewImageIds.has(existingImage.id)) {
                console.log('🗑️ Removing image:', existingImage.file_path);

                // ลบไฟล์
                if (fs.existsSync(existingImage.file_path)) {
                    fs.unlinkSync(existingImage.file_path);
                    console.log('✅ File deleted:', existingImage.file_path);
                }

                // ลบจากฐานข้อมูล
                await connection.execute(`
                    DELETE FROM repair_images WHERE id = ?
                `, [existingImage.id]);
                console.log('✅ DB record deleted for image ID:', existingImage.id);
            } else {
                console.log('✅ Keeping existing image:', existingImage.file_path);
            }
        }

        // จัดการ legacy image
        if (legacyImagePath) {
            if (keepLegacyImage) {
                console.log('✅ Keeping legacy image:', legacyImagePath);
                // ไม่ต้องทำอะไร - เก็บไว้ใน image_path เดิม
            } else {
                console.log('🗑️ Removing legacy image:', legacyImagePath);

                // ลบไฟล์ legacy
                if (fs.existsSync(legacyImagePath)) {
                    fs.unlinkSync(legacyImagePath);
                    console.log('✅ Legacy file deleted');
                }

                // ล้าง image_path ใน repair_requests
                await connection.execute(`
                    UPDATE repair_requests SET image_path = NULL WHERE id = ?
                `, [repairId]);
                console.log('✅ Legacy image_path cleared from DB');
            }
        }

        // เพิ่มรูปภาพใหม่ที่อัปโหลด
        if (newImages.length > 0) {
            console.log('📤 Adding new images:', newImages.length);

            const imageInsertPromises = newImages.map((image, index) => {
                console.log(`📤 Adding new image ${index + 1}:`, {
                    path: image.path,
                    name: image.originalname,
                    size: image.size
                });

                return connection.execute(`
                    INSERT INTO repair_images 
                    (repair_request_id, file_path, file_name, file_size)
                    VALUES (?, ?, ?, ?)
                `, [repairId, image.path, image.originalname, image.size]);
            });

            await Promise.all(imageInsertPromises);
            console.log('✅ All new images added to DB');
        }

        await connection.commit();
        console.log('✅ Transaction committed successfully');

        res.json({
            message: 'อัพเดทข้อมูลสำเร็จ',
            details: {
                newImagesAdded: newImages.length,
                imagesKept: keepNewImageIds.size + (keepLegacyImage ? 1 : 0),
                legacyImageKept: keepLegacyImage
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Update repair error:', error);

        // ลบไฟล์ใหม่ที่อัพโหลดแล้วถ้าเกิดข้อผิดพลาด
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                    console.log('🧹 Cleaned up uploaded file:', file.path);
                }
            });
        }

        res.status(500).json({
            message: 'เกิดข้อผิดพลาด: ' + error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        connection.release();
    }
});

// เพิ่ม endpoint สำหรับ debug ข้อมูลรูปภาพ (สำหรับ development)
router.get('/:id/images-debug', authenticateToken, async (req, res) => {
    try {
        const repairId = req.params.id;

        // ดึงข้อมูล repair
        const [repairs] = await db.execute(`
            SELECT id, title, image_path FROM repair_requests WHERE id = ?
        `, [repairId]);

        if (repairs.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการแจ้งซ่อม' });
        }

        // ดึงรูปภาพใหม่
        const [newImages] = await db.execute(`
            SELECT id, file_path, file_name, file_size, uploaded_at
            FROM repair_images 
            WHERE repair_request_id = ? 
            ORDER BY id ASC
        `, [repairId]);

        // ตรวจสอบไฟล์ที่มีจริง
        const imageStatus = {
            legacy: null,
            new_images: []
        };

        // ตรวจสอบ legacy image
        if (repairs[0].image_path) {
            imageStatus.legacy = {
                path: repairs[0].image_path,
                exists: fs.existsSync(repairs[0].image_path),
                url: `http://localhost:5000/${repairs[0].image_path}`
            };
        }

        // ตรวจสอบ new images
        for (const img of newImages) {
            imageStatus.new_images.push({
                id: img.id,
                path: img.file_path,
                name: img.file_name,
                size: img.file_size,
                exists: fs.existsSync(img.file_path),
                url: `http://localhost:5000/${img.file_path}`,
                uploaded_at: img.uploaded_at
            });
        }

        res.json({
            repair: repairs[0],
            image_status: imageStatus,
            summary: {
                has_legacy: !!repairs[0].image_path,
                new_images_count: newImages.length,
                total_images: (repairs[0].image_path ? 1 : 0) + newImages.length
            }
        });

    } catch (error) {
        console.error('Images debug error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});
// อัพเดทสถานะการซ่อม
router.put('/:id/status', authenticateToken, requireRole(['admin', 'technician']), async (req, res) => {
    try {
        const { status, completion_details, assigned_to } = req.body;
        const repairId = req.params.id;

        console.log('🔄 Updating repair status:', { repairId, status, assigned_to });

        // ตรวจสอบข้อมูลเดิม
        const [oldRepairs] = await db.execute(
            'SELECT * FROM repair_requests WHERE id = ?',
            [repairId]
        );

        if (oldRepairs.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการแจ้งซ่อม' });
        }

        const oldRepair = oldRepairs[0];

        // ตรวจสอบว่าต้องใส่รายละเอียดเมื่อเสร็จสิ้น
        if (status === 'completed' && !completion_details) {
            return res.status(400).json({
                message: 'กรุณาใส่รายละเอียดการซ่อมเมื่อเปลี่ยนสถานะเป็นเสร็จสิ้น'
            });
        }

        // อัพเดทข้อมูล
        const updateFields = ['status = ?'];
        const updateParams = [status];

        if (assigned_to) {
            updateFields.push('assigned_to = ?');
            updateParams.push(assigned_to);
        }

        if (completion_details) {
            updateFields.push('completion_details = ?');
            updateParams.push(completion_details);
        }

        if (status === 'completed') {
            updateFields.push('completed_at = NOW()');
        }

        updateParams.push(repairId);

        await db.execute(
            `UPDATE repair_requests SET ${updateFields.join(', ')} WHERE id = ?`,
            updateParams
        );

        // บันทึกประวัติการเปลี่ยนสถานะ
        await db.execute(`
            INSERT INTO status_history (repair_request_id, old_status, new_status, notes, updated_by)
            VALUES (?, ?, ?, ?, ?)
        `, [repairId, oldRepair.status, status, completion_details, req.user.id]);

        // ส่งการแจ้งเตือนการอัพเดทสถานะ
        try {
            const [notifyUsers] = await db.execute(`
                SELECT DISTINCT u.line_user_id
                FROM users u
                WHERE (u.id = ? OR u.role IN ('admin', 'technician'))
                AND u.line_user_id IS NOT NULL 
                AND u.line_user_id != ''
            `, [oldRepair.requester_id]);

            if (notifyUsers.length > 0) {
                const userIds = notifyUsers.map(user => user.line_user_id);
                console.log('📱 Sending LINE status update to user IDs:', userIds);

                await lineMessaging.notifyStatusUpdate(userIds, {
                    title: oldRepair.title,
                    completion_details
                }, oldRepair.status, status, req.user.full_name);
                console.log('📱 LINE status update notifications sent successfully');
            } else {
                console.log('📱 No LINE user IDs found for status update notifications');
            }
        } catch (notifyError) {
            console.error('LINE notify error:', notifyError);
        }

        console.log('✅ Repair status updated successfully');
        res.json({ message: 'อัพเดทสถานะสำเร็จ' });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
    }
});

// ลบการแจ้งซ่อม (เฉพาะ admin)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // ดึงข้อมูลรูปภาพทั้งหมด
        const [images] = await connection.execute(
            'SELECT file_path FROM repair_images WHERE repair_request_id = ?',
            [req.params.id]
        );

        // ดึงข้อมูล repair request
        const [repairs] = await connection.execute(
            'SELECT image_path FROM repair_requests WHERE id = ?',
            [req.params.id]
        );

        if (repairs.length === 0) {
            throw new Error('ไม่พบข้อมูลการแจ้งซ่อม');
        }

        // ลบไฟล์รูปภาพทั้งหมด
        images.forEach(image => {
            if (image.file_path && fs.existsSync(image.file_path)) {
                fs.unlinkSync(image.file_path);
            }
        });

        // ลบรูปเก่า (ถ้ามี)
        if (repairs[0].image_path && fs.existsSync(repairs[0].image_path)) {
            fs.unlinkSync(repairs[0].image_path);
        }

        // ลบข้อมูลในฐานข้อมูล
        await connection.execute('DELETE FROM repair_images WHERE repair_request_id = ?', [req.params.id]);
        await connection.execute('DELETE FROM status_history WHERE repair_request_id = ?', [req.params.id]);
        await connection.execute('DELETE FROM repair_requests WHERE id = ?', [req.params.id]);

        await connection.commit();

        res.json({ message: 'ลบข้อมูลสำเร็จ' });
    } catch (error) {
        await connection.rollback();
        console.error('Delete repair error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด: ' + error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;