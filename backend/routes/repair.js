const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const lineMessaging = require('../utils/lineMessaging');

const router = express.Router();

// ✅ แก้ไข multer storage เพื่อแยกโฟลเดอร์ตามประเภทรูปภาพ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // แยกโฟลเดอร์ตามประเภทของรูปภาพ
        const uploadDir = file.fieldname === 'completion_images' 
            ? 'uploads/completion-images' 
            : 'uploads/repair-images';
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = file.fieldname === 'completion_images' ? 'completion-' : 'repair-';
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 50 // Maximum 50 files at once
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

// ✅ ฟังก์ชันแปลง path ให้ใช้ forward slash
const normalizePath = (filePath) => {
    if (!filePath) return filePath;
    return filePath.replace(/\\/g, '/');
};

// ✅ ฟังก์ชันตรวจสอบและสร้างไฟล์ placeholder
const ensurePlaceholderExists = () => {
    const placeholderPath = 'uploads/placeholder-image.png';
    if (!fs.existsSync(placeholderPath)) {
        // สร้างไฟล์ placeholder แบบ base64
        const placeholderBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
        try {
            const uploadDir = 'uploads';
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            fs.writeFileSync(placeholderPath, Buffer.from(placeholderBase64, 'base64'));
        } catch (error) {
            console.error('Cannot create placeholder image:', error);
        }
    }
};

// สร้างตาราง completion_images ถ้าไม่มี
const createCompletionImagesTable = async () => {
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS completion_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                repair_request_id INT NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_size INT DEFAULT 0,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (repair_request_id) REFERENCES repair_requests(id) ON DELETE CASCADE,
                INDEX idx_repair_request (repair_request_id)
            )
        `);
        console.log('✅ Completion images table checked/created');
        
        // สร้าง placeholder image
        ensurePlaceholderExists();
        
    } catch (error) {
        console.error('⚠️ Error creating completion_images table:', error);
    }
};

// เรียกใช้เมื่อ start server
createCompletionImagesTable();

// ดึงหมวดหมู่ทั้งหมด
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

// ดึงรายชื่อช่างเทคนิค
router.get('/technicians', authenticateToken, async (req, res) => {
    try {
        const [technicians] = await db.execute(`
            SELECT id, full_name, username, role 
            FROM users 
            WHERE role IN ('admin', 'technician')
            ORDER BY full_name ASC
        `);

        console.log('👷 Technicians fetched:', technicians.length);
        res.json(technicians);
    } catch (error) {
        console.error('Get technicians error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

// ดึงรายการแจ้งซ่อม
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, category, priority, page, limit } = req.query;

        const shouldPaginate = page || limit;
        const actualPage = parseInt(page) || 1;
        const actualLimit = parseInt(limit) || (shouldPaginate ? 10 : 999999);
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
            
            // ✅ แปลง path ให้ใช้ forward slash
            repair.images = images.map(img => ({
                ...img,
                file_path: normalizePath(img.file_path)
            }));

            // ✅ ดึงรูปภาพเสร็จสิ้น
            const [completionImages] = await db.execute(`
                SELECT id, file_path, file_name, file_size 
                FROM completion_images 
                WHERE repair_request_id = ? 
                ORDER BY id ASC
            `, [repair.id]);
            
            // ✅ แปลง path ให้ใช้ forward slash
            repair.completion_images = completionImages.map(img => ({
                ...img,
                file_path: normalizePath(img.file_path)
            }));

            // ✅ แปลง legacy image path
            if (repair.image_path) {
                repair.image_path = normalizePath(repair.image_path);
            }
        }

        // นับจำนวนทั้งหมด
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

        const response = {
            repairs,
            total: total
        };

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

        // ✅ แปลง legacy image path
        if (repair.image_path) {
            repair.image_path = normalizePath(repair.image_path);
        }

        // ดึงรูปภาพทั่วไป
        const [images] = await db.execute(`
            SELECT id, file_path, file_name, file_size, uploaded_at
            FROM repair_images 
            WHERE repair_request_id = ? 
            ORDER BY id ASC
        `, [req.params.id]);
        
        // ✅ แปลง path ให้ใช้ forward slash
        repair.images = images.map(img => ({
            ...img,
            file_path: normalizePath(img.file_path)
        }));

        // ✅ ดึงรูปภาพเสร็จสิ้น
        const [completionImages] = await db.execute(`
            SELECT id, file_path, file_name, file_size, uploaded_at
            FROM completion_images 
            WHERE repair_request_id = ? 
            ORDER BY id ASC
        `, [req.params.id]);
        
        // ✅ แปลง path ให้ใช้ forward slash
        repair.completion_images = completionImages.map(img => ({
            ...img,
            file_path: normalizePath(img.file_path)
        }));

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

// สร้างแจ้งซ่อมใหม่
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

        if (!title || !description || !category_id || !location || !priority) {
            throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
        }

        const [result] = await connection.execute(`
            INSERT INTO repair_requests 
            (title, description, category_id, location, priority, requester_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [title, description, category_id, location, priority, req.user.id]);

        const repairId = result.insertId;
        console.log('✅ Repair request created with ID:', repairId);

        if (images.length > 0) {
            const imageInsertPromises = images.map(image => {
                // ✅ แปลง path ก่อนบันทึกลงฐานข้อมูล
                const normalizedPath = normalizePath(image.path);
                return connection.execute(`
                    INSERT INTO repair_images 
                    (repair_request_id, file_path, file_name, file_size)
                    VALUES (?, ?, ?, ?)
                `, [repairId, normalizedPath, image.originalname, image.size]);
            });

            await Promise.all(imageInsertPromises);
            console.log('✅ Images saved:', images.length);
        }

        await connection.commit();

        // ส่งการแจ้งเตือน LINE
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
            }
        } catch (notifyError) {
            console.error('LINE notify error:', notifyError);
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

// อัพเดทข้อมูลการแจ้งซ่อม
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

        const [oldRepairs] = await connection.execute(
            'SELECT * FROM repair_requests WHERE id = ?',
            [repairId]
        );

        if (oldRepairs.length === 0) {
            throw new Error('ไม่พบข้อมูลการแจ้งซ่อม');
        }

        const oldRepair = oldRepairs[0];

        if (req.user.role === 'user' && oldRepair.requester_id !== req.user.id) {
            throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลนี้');
        }

        if (req.user.role === 'user' && oldRepair.status !== 'pending') {
            throw new Error('ไม่สามารถแก้ไขได้เนื่องจากสถานะไม่ใช่ "รอดำเนินการ"');
        }

        await connection.execute(`
            UPDATE repair_requests 
            SET title = ?, description = ?, category_id = ?, location = ?, priority = ?
            WHERE id = ?
        `, [title, description, category_id, location, priority, repairId]);

        console.log('✅ Basic repair data updated');

        // จัดการรูปภาพ
        const [existingNewImages] = await connection.execute(`
            SELECT id, file_path, file_name FROM repair_images WHERE repair_request_id = ?
        `, [repairId]);

        const legacyImagePath = oldRepair.image_path;

        let keepImageData = [];
        try {
            keepImageData = keep_images ? JSON.parse(keep_images) : [];
        } catch (parseError) {
            console.log('⚠️ Error parsing keep_images, treating as empty array');
            keepImageData = [];
        }

        const keepNewImageIds = new Set();
        let keepLegacyImage = false;

        keepImageData.forEach(item => {
            if (typeof item === 'object') {
                if (item.type === 'legacy') {
                    keepLegacyImage = true;
                } else if (item.type === 'new' && item.id) {
                    keepNewImageIds.add(parseInt(item.id));
                }
            } else {
                if (item === 'legacy' || item === legacyImagePath) {
                    keepLegacyImage = true;
                } else if (!isNaN(parseInt(item))) {
                    keepNewImageIds.add(parseInt(item));
                }
            }
        });

        // ลบรูปภาพที่ไม่ต้องการเก็บ
        for (const existingImage of existingNewImages) {
            if (!keepNewImageIds.has(existingImage.id)) {
                // ✅ แปลง path ก่อนตรวจสอบไฟล์
                const normalizedPath = normalizePath(existingImage.file_path);
                if (fs.existsSync(normalizedPath)) {
                    fs.unlinkSync(normalizedPath);
                }

                await connection.execute(`
                    DELETE FROM repair_images WHERE id = ?
                `, [existingImage.id]);
            }
        }

        // จัดการ legacy image
        if (legacyImagePath) {
            if (!keepLegacyImage) {
                const normalizedLegacyPath = normalizePath(legacyImagePath);
                if (fs.existsSync(normalizedLegacyPath)) {
                    fs.unlinkSync(normalizedLegacyPath);
                }

                await connection.execute(`
                    UPDATE repair_requests SET image_path = NULL WHERE id = ?
                `, [repairId]);
            }
        }

        // เพิ่มรูปภาพใหม่
        if (newImages.length > 0) {
            const imageInsertPromises = newImages.map((image) => {
                // ✅ แปลง path ก่อนบันทึกลงฐานข้อมูล
                const normalizedPath = normalizePath(image.path);
                return connection.execute(`
                    INSERT INTO repair_images 
                    (repair_request_id, file_path, file_name, file_size)
                    VALUES (?, ?, ?, ?)
                `, [repairId, normalizedPath, image.originalname, image.size]);
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

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
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

// ✅ อัพเดทสถานะการซ่อม (แก้ไขเพื่อรองรับรูปภาพเสร็จสิ้น)
router.put('/:id/status', authenticateToken, requireRole(['admin', 'technician']), upload.array('completion_images', 50), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        console.log('🔄 Status update started for repair ID:', req.params.id);

        // ✅ Debug incoming data
        console.log('📝 Request body:', req.body);
        console.log('📝 Request files:', req.files ? req.files.length : 0);
        console.log('📝 Headers:', req.headers['content-type']);

        const { status, completion_details, assigned_to, keep_completion_images } = req.body;
        const repairId = req.params.id;
        const newCompletionImages = req.files || [];

        console.log('📝 Parsed data:', { 
            status, 
            assigned_to, 
            completion_details: completion_details ? 'provided' : 'empty',
            newCompletionImagesCount: newCompletionImages.length,
            keepCompletionImages: keep_completion_images
        });

        // ✅ Validate required fields - ยืดหยุ่นกับค่าว่าง
        if (!status || status.trim() === '') {
            throw new Error('กรุณาระบุสถานะ');
        }

        // ตรวจสอบข้อมูลเดิม
        const [oldRepairs] = await connection.execute(
            'SELECT * FROM repair_requests WHERE id = ?',
            [repairId]
        );

        if (oldRepairs.length === 0) {
            throw new Error('ไม่พบข้อมูลการแจ้งซ่อม');
        }

        const oldRepair = oldRepairs[0];
        console.log('📋 Old repair status:', oldRepair.status, '-> New status:', status);

        // ตรวจสอบว่าต้องใส่รายละเอียดเมื่อเสร็จสิ้น
        if (status === 'completed' && (!completion_details || completion_details.trim() === '')) {
            throw new Error('กรุณาใส่รายละเอียดการซ่อมเมื่อเปลี่ยนสถานะเป็นเสร็จสิ้น');
        }

        // ✅ Build update query dynamically
        const updateFields = ['status = ?'];
        const updateParams = [status];

        if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
            updateFields.push('assigned_to = ?');
            updateParams.push(assigned_to);
        }

        if (completion_details !== undefined && completion_details !== null && completion_details.trim() !== '') {
            updateFields.push('completion_details = ?');
            updateParams.push(completion_details.trim());
        }

        if (status === 'completed') {
            updateFields.push('completed_at = NOW()');
        }

        updateParams.push(repairId);

        console.log('🔄 Updating repair with fields:', updateFields.join(', '));
        
        await connection.execute(
            `UPDATE repair_requests SET ${updateFields.join(', ')} WHERE id = ?`,
            updateParams
        );

        console.log('✅ Basic repair status updated');

        // ✅ จัดการรูปภาพเสร็จสิ้น (เฉพาะเมื่อสถานะเป็น completed)
        let keepCompletionImageIds = new Set(); // ✅ ย้ายออกมานอก if block
        
        if (status === 'completed') {
            console.log('🖼️ Managing completion images...');

            // ดึงรูปภาพเสร็จสิ้นที่มีอยู่
            const [existingCompletionImages] = await connection.execute(`
                SELECT id, file_path, file_name FROM completion_images WHERE repair_request_id = ?
            `, [repairId]);

            console.log('📋 Existing completion images:', existingCompletionImages.length);

            // Parse ข้อมูลรูปภาพที่ต้องการเก็บ
            let keepCompletionImageData = [];
            try {
                if (keep_completion_images && keep_completion_images.trim() !== '') {
                    keepCompletionImageData = JSON.parse(keep_completion_images);
                }
                console.log('📋 Keep completion images data:', keepCompletionImageData);
            } catch (parseError) {
                console.log('⚠️ Error parsing keep_completion_images:', parseError.message);
                keepCompletionImageData = [];
            }

            // สร้าง Set ของรูปภาพเสร็จสิ้นที่ต้องการเก็บ
            keepCompletionImageData.forEach(item => {
                if (typeof item === 'object' && item.id) {
                    keepCompletionImageIds.add(parseInt(item.id));
                    console.log('🔄 Will keep completion image ID:', item.id);
                } else if (!isNaN(parseInt(item))) {
                    keepCompletionImageIds.add(parseInt(item));
                }
            });

            console.log('📊 Completion image management plan:', {
                keepCompletionImageIds: Array.from(keepCompletionImageIds),
                newCompletionImagesCount: newCompletionImages.length
            });

            // ลบรูปภาพเสร็จสิ้นที่ไม่ต้องการเก็บ
            for (const existingImage of existingCompletionImages) {
                if (!keepCompletionImageIds.has(existingImage.id)) {
                    console.log('🗑️ Removing completion image:', existingImage.file_path);

                    // ✅ แปลง path ก่อนลบไฟล์
                    const normalizedPath = normalizePath(existingImage.file_path);
                    if (normalizedPath && fs.existsSync(normalizedPath)) {
                        try {
                            fs.unlinkSync(normalizedPath);
                            console.log('✅ Completion file deleted:', normalizedPath);
                        } catch (deleteError) {
                            console.warn('⚠️ Could not delete file:', normalizedPath, deleteError.message);
                        }
                    }

                    // ลบจากฐานข้อมูล
                    await connection.execute(`
                        DELETE FROM completion_images WHERE id = ?
                    `, [existingImage.id]);
                    console.log('✅ Completion image DB record deleted for ID:', existingImage.id);
                } else {
                    console.log('✅ Keeping existing completion image:', existingImage.file_path);
                }
            }

            // เพิ่มรูปภาพเสร็จสิ้นใหม่ที่อัปโหลด
            if (newCompletionImages.length > 0) {
                console.log('📤 Adding new completion images:', newCompletionImages.length);

                const completionImageInsertPromises = newCompletionImages.map((image, index) => {
                    // ✅ แปลง path ก่อนบันทึกลงฐานข้อมูล
                    const normalizedPath = normalizePath(image.path);
                    console.log(`📤 Adding new completion image ${index + 1}:`, {
                        path: normalizedPath,
                        name: image.originalname,
                        size: image.size
                    });

                    return connection.execute(`
                        INSERT INTO completion_images 
                        (repair_request_id, file_path, file_name, file_size)
                        VALUES (?, ?, ?, ?)
                    `, [repairId, normalizedPath, image.originalname, image.size]);
                });

                await Promise.all(completionImageInsertPromises);
                console.log('✅ All new completion images added to DB');
            }
        }

        // บันทึกประวัติการเปลี่ยนสถานะ
        await connection.execute(`
            INSERT INTO status_history (repair_request_id, old_status, new_status, notes, updated_by)
            VALUES (?, ?, ?, ?, ?)
        `, [repairId, oldRepair.status, status, completion_details || null, req.user.id]);

        await connection.commit();
        console.log('✅ Transaction committed successfully');

        // ส่งการแจ้งเตือนการอัพเดทสถานะ (ปิดไว้ก่อนเพราะไม่มี LINE integration)
        try {
            // ✅ ตรวจสอบว่ามี column line_user_id หรือไม่
            const [tableColumns] = await db.execute(`
                SHOW COLUMNS FROM users LIKE 'line_user_id'
            `);

            if (tableColumns.length > 0) {
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

                    // ✅ ตรวจสอบว่ามี lineMessaging หรือไม่
                    if (lineMessaging && typeof lineMessaging.notifyStatusUpdate === 'function') {
                        await lineMessaging.notifyStatusUpdate(userIds, {
                            title: oldRepair.title,
                            completion_details
                        }, oldRepair.status, status, req.user.full_name);
                        console.log('📱 LINE status update notifications sent successfully');
                    } else {
                        console.log('📱 LINE messaging service not available');
                    }
                }
            } else {
                console.log('📱 LINE integration not configured (no line_user_id column)');
            }
        } catch (notifyError) {
            console.error('LINE notify error:', notifyError.message);
        }

        console.log('✅ Repair status updated successfully');
        
        res.json({ 
            message: 'อัพเดทสถานะสำเร็จ',
            details: {
                status,
                newCompletionImagesAdded: newCompletionImages.length,
                completionImagesKept: Array.from(keepCompletionImageIds).length
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('❌ Update status error:', error);

        // ลบไฟล์ใหม่ที่อัพโหลดแล้วถ้าเกิดข้อผิดพลาด
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const normalizedPath = normalizePath(file.path);
                if (normalizedPath && fs.existsSync(normalizedPath)) {
                    try {
                        fs.unlinkSync(normalizedPath);
                        console.log('🧹 Cleaned up uploaded completion file:', normalizedPath);
                    } catch (cleanupError) {
                        console.warn('⚠️ Could not clean up file:', normalizedPath);
                    }
                }
            });
        }

        // ✅ More specific error messages
        let errorMessage = error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
        if (error.code === 'ER_NO_SUCH_TABLE') {
            errorMessage = 'ตารางในฐานข้อมูลไม่สมบูรณ์';
        } else if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'ข้อมูลซ้ำกัน';
        } else if (error.code === 'ER_BAD_FIELD_ERROR') {
            errorMessage = 'ข้อมูลไม่ถูกต้อง';
        }

        res.status(500).json({ 
            message: 'เกิดข้อผิดพลาด: ' + errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
                error: error.message,
                stack: error.stack,
                body: req.body,
                files: req.files ? req.files.length : 0
            } : undefined
        });
    } finally {
        connection.release();
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

        // ✅ ดึงข้อมูลรูปภาพเสร็จสิ้น
        const [completionImages] = await connection.execute(
            'SELECT file_path FROM completion_images WHERE repair_request_id = ?',
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
            if (image.file_path) {
                const normalizedPath = normalizePath(image.file_path);
                if (fs.existsSync(normalizedPath)) {
                    fs.unlinkSync(normalizedPath);
                }
            }
        });

        // ✅ ลบไฟล์รูปภาพเสร็จสิ้น
        completionImages.forEach(image => {
            if (image.file_path) {
                const normalizedPath = normalizePath(image.file_path);
                if (fs.existsSync(normalizedPath)) {
                    fs.unlinkSync(normalizedPath);
                }
            }
        });

        // ลบรูปเก่า (ถ้ามี)
        if (repairs[0].image_path) {
            const normalizedLegacyPath = normalizePath(repairs[0].image_path);
            if (fs.existsSync(normalizedLegacyPath)) {
                fs.unlinkSync(normalizedLegacyPath);
            }
        }

        // ลบข้อมูลในฐานข้อมูล
        await connection.execute('DELETE FROM completion_images WHERE repair_request_id = ?', [req.params.id]);
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

// ✅ Debug endpoint สำหรับตรวจสอบรูปภาพ
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

        // ✅ ดึงรูปภาพเสร็จสิ้น
        const [completionImages] = await db.execute(`
            SELECT id, file_path, file_name, file_size, uploaded_at
            FROM completion_images 
            WHERE repair_request_id = ? 
            ORDER BY id ASC
        `, [repairId]);

        // ตรวจสอบไฟล์ที่มีจริง
        const imageStatus = {
            legacy: null,
            new_images: [],
            completion_images: []
        };

        // ตรวจสอบ legacy image
        if (repairs[0].image_path) {
            const normalizedLegacyPath = normalizePath(repairs[0].image_path);
            imageStatus.legacy = {
                path: repairs[0].image_path,
                normalized_path: normalizedLegacyPath,
                exists: fs.existsSync(normalizedLegacyPath),
                url: `http://localhost:5000/${normalizedLegacyPath}`
            };
        }

        // ตรวจสอบ new images
        for (const img of newImages) {
            const normalizedPath = normalizePath(img.file_path);
            imageStatus.new_images.push({
                id: img.id,
                path: img.file_path,
                normalized_path: normalizedPath,
                name: img.file_name,
                size: img.file_size,
                exists: fs.existsSync(normalizedPath),
                url: `http://localhost:5000/${normalizedPath}`,
                uploaded_at: img.uploaded_at
            });
        }

        // ✅ ตรวจสอบ completion images
        for (const img of completionImages) {
            const normalizedPath = normalizePath(img.file_path);
            imageStatus.completion_images.push({
                id: img.id,
                path: img.file_path,
                normalized_path: normalizedPath,
                name: img.file_name,
                size: img.file_size,
                exists: fs.existsSync(normalizedPath),
                url: `http://localhost:5000/${normalizedPath}`,
                uploaded_at: img.uploaded_at
            });
        }

        res.json({
            repair: repairs[0],
            image_status: imageStatus,
            summary: {
                has_legacy: !!repairs[0].image_path,
                new_images_count: newImages.length,
                completion_images_count: completionImages.length,
                total_images: (repairs[0].image_path ? 1 : 0) + newImages.length + completionImages.length
            }
        });

    } catch (error) {
        console.error('Images debug error:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
    }
});

module.exports = router;