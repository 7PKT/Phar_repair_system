const multer = require('multer');
const path = require('path');
const fs = require('fs');

class ImageService {
    constructor() {
        // เพิ่มการตั้งค่า base URL
        this.baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        this.ensureDirectories();
    }

    ensureDirectories() {
        const dirs = [
            'uploads',
            'uploads/repair-images',
            'uploads/completion-images'
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    createStorage() {
        return multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = file.fieldname === 'completion_images'
                    ? 'uploads/completion-images'
                    : 'uploads/repair-images';
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const prefix = file.fieldname === 'completion_images' ? 'completion-' : 'repair-';
                cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
            }
        });
    }

    fileFilter(req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WebP)'));
        }
    }

    normalizePath(filePath) {
        if (!filePath) return filePath;
        return filePath.replace(/\\/g, '/');
    }

    // เพิ่มฟังก์ชันแปลง file path เป็น URL
    pathToUrl(filePath) {
        if (!filePath) return filePath;
        const normalizedPath = this.normalizePath(filePath);
        // แปลง uploads/repair-images/repair-xxx.jpg เป็น http://localhost:3000/uploads/repair-images/repair-xxx.jpg
        return `${this.baseUrl}/${normalizedPath}`;
    }

    // เพิ่มฟังก์ชันแปลง URL กลับเป็น file path (สำหรับการลบไฟล์)
    urlToPath(fileUrl) {
        if (!fileUrl) return fileUrl;
        // ตัด base URL ออก เหลือแค่ path
        return fileUrl.replace(`${this.baseUrl}/`, '');
    }

    deleteFile(filePath) {
        try {
            // ถ้าได้รับ URL ให้แปลงเป็น path ก่อน
            let actualPath = filePath;
            if (filePath.startsWith('http')) {
                actualPath = this.urlToPath(filePath);
            }
            
            const normalizedPath = this.normalizePath(actualPath);
            if (normalizedPath && fs.existsSync(normalizedPath)) {
                fs.unlinkSync(normalizedPath);
                return true;
            }
        } catch (error) {
            console.warn('ไม่สามารถลบไฟล์:', filePath, error.message);
        }
        return false;
    }

    async saveImagesToDatabase(connection, repairId, images, type = 'repair') {
        if (!images || images.length === 0) return [];

        const tableName = type === 'completion' ? 'completion_images' : 'repair_images';
        
        const imageInsertPromises = images.map(image => {
            const normalizedPath = this.normalizePath(image.path);
            // แปลง path เป็น URL ก่อนบันทึกลง database
            const imageUrl = this.pathToUrl(normalizedPath);
            
            return connection.execute(`
                INSERT INTO ${tableName} 
                (repair_request_id, file_path, file_name, file_size)
                VALUES (?, ?, ?, ?)
            `, [repairId, imageUrl, image.originalname, image.size]);
        });

        await Promise.all(imageInsertPromises);
        return images.map(img => ({
            file_path: this.pathToUrl(this.normalizePath(img.path)), // ส่งกลับเป็น URL
            file_name: img.originalname,
            file_size: img.size
        }));
    }

    // เพิ่มฟังก์ชันสำหรับดึงข้อมูลรูปภาพจาก database และแปลงเป็น URL
    async getImagesFromDatabase(connection, repairId, type = 'repair') {
        const tableName = type === 'completion' ? 'completion_images' : 'repair_images';
        
        const [rows] = await connection.execute(`
            SELECT * FROM ${tableName} WHERE repair_request_id = ?
        `, [repairId]);

        // ถ้า file_path ในฐานข้อมูลยังเป็น path ให้แปลงเป็น URL
        return rows.map(row => ({
            ...row,
            file_path: row.file_path.startsWith('http') 
                ? row.file_path 
                : this.pathToUrl(row.file_path)
        }));
    }
}

module.exports = new ImageService();