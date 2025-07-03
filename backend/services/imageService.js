const multer = require('multer');
const path = require('path');
const fs = require('fs');

class ImageService {
    constructor() {
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

    deleteFile(filePath) {
        try {
            const normalizedPath = this.normalizePath(filePath);
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
            return connection.execute(`
                INSERT INTO ${tableName} 
                (repair_request_id, file_path, file_name, file_size)
                VALUES (?, ?, ?, ?)
            `, [repairId, normalizedPath, image.originalname, image.size]);
        });

        await Promise.all(imageInsertPromises);
        return images.map(img => ({
            file_path: this.normalizePath(img.path),
            file_name: img.originalname,
            file_size: img.size
        }));
    }
}

module.exports = new ImageService();