const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');

const categoriesRoutes = require('./categories');
const technicianRoutes = require('./technicians');
const repairRequestRoutes = require('./repairRequests');
const systemSettingsRoutes = require('./systemSettings');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - User: ${req.user?.role || 'none'}`);
    next();
});

router.use('/categories', categoriesRoutes);
router.use('/technicians', technicianRoutes);
router.use('/system-settings', systemSettingsRoutes);
router.use('/', repairRequestRoutes);

module.exports = router;