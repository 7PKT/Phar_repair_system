
const db = require('../config/database');
const imageService = require('./imageService');

const lineMessaging = require('./lineMessaging');

class RepairService {
    async getRepairRequests(queryParams, user) {
        const { status, category, priority, page, limit } = queryParams;

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

        for (let repair of repairs) {
            await this.loadRepairImages(repair);
        }

        const total = await this.getTotalRepairCount({ status, category, priority });

        const response = { repairs, total };

        if (shouldPaginate) {
            response.pagination = {
                page: actualPage,
                limit: actualLimit,
                total,
                totalPages: Math.ceil(total / actualLimit)
            };
        }

        return response;
    }

    async getRepairById(repairId) {
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
        `, [repairId]);

        if (repairs.length === 0) return null;

        const repair = repairs[0];
        await this.loadRepairImages(repair);

        const [history] = await db.execute(`
            SELECT 
                sh.*,
                u.full_name as updated_by_name
            FROM status_history sh
            LEFT JOIN users u ON sh.updated_by = u.id
            WHERE sh.repair_request_id = ?
            ORDER BY sh.created_at DESC
        `, [repairId]);

        repair.status_history = history;
        return repair;
    }

    async loadRepairImages(repair) {
        const [images] = await db.execute(`
            SELECT id, file_path, file_name, file_size, uploaded_at
            FROM repair_images 
            WHERE repair_request_id = ? 
            ORDER BY id ASC
        `, [repair.id]);

        repair.images = images.map(img => ({
            ...img,
            file_path: imageService.normalizePath(img.file_path)
        }));

        const [completionImages] = await db.execute(`
            SELECT id, file_path, file_name, file_size, uploaded_at
            FROM completion_images 
            WHERE repair_request_id = ? 
            ORDER BY id ASC
        `, [repair.id]);

        repair.completion_images = completionImages.map(img => ({
            ...img,
            file_path: imageService.normalizePath(img.file_path)
        }));

        if (repair.image_path) {
            repair.image_path = imageService.normalizePath(repair.image_path);
        }
    }

    async getTotalRepairCount(filters) {
        let countQuery = 'SELECT COUNT(*) as total FROM repair_requests r WHERE 1=1';
        const countParams = [];

        if (filters.status) {
            countQuery += ' AND r.status = ?';
            countParams.push(filters.status);
        }
        if (filters.category) {
            countQuery += ' AND r.category_id = ?';
            countParams.push(filters.category);
        }
        if (filters.priority) {
            countQuery += ' AND r.priority = ?';
            countParams.push(filters.priority);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        return countResult[0].total;
    }

    async createRepair(repairData) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const { title, description, category_id, location, priority, requester_id, images } = repairData;

            if (!title || !description || !category_id || !location || !priority) {
                throw new Error('กรุณากรอกข้อมูลให้ครบถ้วน');
            }


            const [result] = await connection.execute(`
                INSERT INTO repair_requests 
                (title, description, category_id, location, priority, requester_id)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [title, description, category_id, location, priority, requester_id]);

            const repairId = result.insertId;

            if (images && images.length > 0) {
                await imageService.saveImagesToDatabase(connection, repairId, images, 'repair');
            }

            await connection.commit();
            console.log(`✅ Repair created successfully with ID: ${repairId}`);


            console.log('📝 Repair created - No LINE notification sent (only send when completed)');

            return {
                id: repairId,
                title,
                description,
                category_id,
                location,
                priority,
                imageCount: images ? images.length : 0
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async updateRepair(repairId, updateData, user) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const { title, description, category_id, location, priority, new_images, keep_images } = updateData;

            const [oldRepairs] = await connection.execute(
                'SELECT * FROM repair_requests WHERE id = ?',
                [repairId]
            );

            if (oldRepairs.length === 0) {
                throw new Error('ไม่พบข้อมูลการแจ้งซ่อม');
            }

            const oldRepair = oldRepairs[0];

            if (user.role === 'user' && oldRepair.requester_id !== user.id) {
                throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลนี้');
            }

            if (user.role === 'user' && oldRepair.status !== 'pending') {
                throw new Error('ไม่สามารถแก้ไขได้เนื่องจากสถานะไม่ใช่ "รอดำเนินการ"');
            }

            await connection.execute(`
                UPDATE repair_requests 
                SET title = ?, description = ?, category_id = ?, location = ?, priority = ?
                WHERE id = ?
            `, [title, description, category_id, location, priority, repairId]);

            const [existingImages] = await connection.execute(`
                SELECT id, file_path, file_name FROM repair_images WHERE repair_request_id = ?
            `, [repairId]);

            let keepImageData = [];
            try {
                keepImageData = keep_images ? JSON.parse(keep_images) : [];
            } catch (parseError) {
                keepImageData = [];
            }

            const keepImageIds = new Set();
            keepImageData.forEach(item => {
                if (typeof item === 'object' && item.id) {
                    keepImageIds.add(parseInt(item.id));
                } else if (!isNaN(parseInt(item))) {
                    keepImageIds.add(parseInt(item));
                }
            });

            for (const existingImage of existingImages) {
                if (!keepImageIds.has(existingImage.id)) {
                    imageService.deleteFile(existingImage.file_path);
                    await connection.execute(`
                        DELETE FROM repair_images WHERE id = ?
                    `, [existingImage.id]);
                }
            }

            if (new_images && new_images.length > 0) {
                await imageService.saveImagesToDatabase(connection, repairId, new_images, 'repair');
            }

            await connection.commit();
            console.log(`✅ Repair updated successfully: ${repairId}`);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async updateRepairStatus(repairId, statusData) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const { status, completion_details, assigned_to, completion_images, updated_by, keep_completion_images } = statusData;

            const [oldRepairs] = await connection.execute(
                'SELECT * FROM repair_requests WHERE id = ?',
                [repairId]
            );

            if (oldRepairs.length === 0) {
                throw new Error('ไม่พบข้อมูลการแจ้งซ่อม');
            }

            const oldRepair = oldRepairs[0];
            const oldStatus = oldRepair.status;

            if (status === 'completed' && (!completion_details || completion_details.trim() === '')) {
                throw new Error('กรุณาใส่รายละเอียดการซ่อมเมื่อเปลี่ยนสถานะเป็นเสร็จสิ้น');
            }

            const updateFields = ['status = ?'];
            const updateParams = [status];

            if (assigned_to !== undefined && assigned_to !== null) {
                if (assigned_to === '' || assigned_to === 0 || assigned_to === '0') {
                    updateFields.push('assigned_to = NULL');
                } else {
                    updateFields.push('assigned_to = ?');
                    updateParams.push(parseInt(assigned_to, 10));
                }
            }

            if (completion_details !== undefined && completion_details !== null) {
                updateFields.push('completion_details = ?');
                updateParams.push(completion_details.trim());
            }

            if (status === 'completed') {
                updateFields.push('completed_at = NOW()');
            }

            updateParams.push(repairId);

            console.log('🔄 Executing update query:', {
                updateFields,
                updateParams: updateParams.slice(0, -1),
                repairId
            });

            console.log('Received statusData:', {
                status: statusData.status,
                assigned_to: statusData.assigned_to,
                assigned_to_type: typeof statusData.assigned_to,
                completion_details: statusData.completion_details
            });

            await connection.execute(
                `UPDATE repair_requests SET ${updateFields.join(', ')} WHERE id = ?`,
                updateParams
            );

            if (status === 'completed') {
                const [existingCompletionImages] = await connection.execute(`
                SELECT id, file_path FROM completion_images WHERE repair_request_id = ?
            `, [repairId]);

                let keepCompletionImageData = [];
                try {
                    keepCompletionImageData = keep_completion_images ? JSON.parse(keep_completion_images) : [];
                } catch (parseError) {
                    keepCompletionImageData = [];
                }

                const keepCompletionImageIds = new Set();
                keepCompletionImageData.forEach(item => {
                    if (typeof item === 'object' && item.id) {
                        keepCompletionImageIds.add(parseInt(item.id));
                    } else if (!isNaN(parseInt(item))) {
                        keepCompletionImageIds.add(parseInt(item));
                    }
                });

                for (const existingImage of existingCompletionImages) {
                    if (!keepCompletionImageIds.has(existingImage.id)) {
                        imageService.deleteFile(existingImage.file_path);
                        await connection.execute(`
                        DELETE FROM completion_images WHERE id = ?
                    `, [existingImage.id]);
                    }
                }

                if (completion_images && completion_images.length > 0) {
                    await imageService.saveImagesToDatabase(connection, repairId, completion_images, 'completion');
                }
            }

            await connection.execute(`
            INSERT INTO status_history (repair_request_id, old_status, new_status, notes, updated_by)
            VALUES (?, ?, ?, ?, ?)
        `, [repairId, oldStatus, status, completion_details || null, updated_by]);

            await connection.commit();
            console.log(`✅ Repair status updated: ${repairId} (${oldStatus} -> ${status})`);

            if (status === 'completed') {
                try {
                    console.log('🔔 Preparing LINE notification for completion...');

                    const [repairDetail] = await connection.execute(`
                    SELECT 
                        r.*,
                        c.name as category_name,
                        u1.full_name as requester_name,
                        u2.full_name as assigned_to_name,
                        u3.full_name as updated_by_name
                    FROM repair_requests r
                    LEFT JOIN categories c ON r.category_id = c.id
                    LEFT JOIN users u1 ON r.requester_id = u1.id
                    LEFT JOIN users u2 ON r.assigned_to = u2.id
                    LEFT JOIN users u3 ON u3.id = ?
                    WHERE r.id = ?
                `, [updated_by, repairId]);

                    if (repairDetail.length > 0) {
                        const notificationData = repairDetail[0];

                        console.log('📤 Completion notification data:', {
                            id: notificationData.id,
                            title: notificationData.title,
                            assigned_to_name: notificationData.assigned_to_name,
                            oldStatus: oldStatus,
                            newStatus: status,
                            updated_by_name: notificationData.updated_by_name
                        });

                        setImmediate(async () => {
                            try {
                                await lineMessaging.refreshConfig();

                                if (lineMessaging.isEnabled()) {
                                    console.log('📱 Sending LINE completion notification...');
                                    const result = await lineMessaging.notifyStatusUpdate(
                                        notificationData,
                                        oldStatus,
                                        status,
                                        notificationData.updated_by_name || 'ไม่ระบุ'
                                    );

                                    if (result.success) {
                                        console.log(`✅ LINE completion notification sent successfully for repair ID: ${repairId}`);
                                    } else {
                                        console.error(`❌ Failed to send LINE completion notification for repair ID: ${repairId}`, result.error);
                                    }
                                } else {
                                    console.log('⚠️ LINE notifications disabled or not configured properly');
                                }
                            } catch (lineError) {
                                console.error('❌ LINE completion notification error:', lineError);
                            }
                        });
                    } else {
                        console.error('❌ Could not find repair details for completion notification');
                    }
                } catch (notifyError) {
                    console.error('❌ Error preparing LINE completion notification:', notifyError);
                }
            } else {
                console.log(`📝 Status updated to "${status}" - No LINE notification sent (only send when completed)`);
            }

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async deleteRepair(repairId) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            const [images] = await connection.execute(
                'SELECT file_path FROM repair_images WHERE repair_request_id = ?',
                [repairId]
            );

            const [completionImages] = await connection.execute(
                'SELECT file_path FROM completion_images WHERE repair_request_id = ?',
                [repairId]
            );

            const [repairs] = await connection.execute(
                'SELECT image_path FROM repair_requests WHERE id = ?',
                [repairId]
            );

            if (repairs.length === 0) {
                throw new Error('ไม่พบข้อมูลการแจ้งซ่อม');
            }

            images.forEach(image => {
                if (image.file_path) {
                    imageService.deleteFile(image.file_path);
                }
            });

            completionImages.forEach(image => {
                if (image.file_path) {
                    imageService.deleteFile(image.file_path);
                }
            });

            if (repairs[0].image_path) {
                imageService.deleteFile(repairs[0].image_path);
            }

            await connection.execute('DELETE FROM completion_images WHERE repair_request_id = ?', [repairId]);
            await connection.execute('DELETE FROM repair_images WHERE repair_request_id = ?', [repairId]);
            await connection.execute('DELETE FROM status_history WHERE repair_request_id = ?', [repairId]);
            await connection.execute('DELETE FROM repair_requests WHERE id = ?', [repairId]);

            await connection.commit();
            console.log(`✅ Repair deleted successfully: ${repairId}`);
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new RepairService();