const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { requireRole } = require('../middleware/rbacMiddleware');

const soloAdmin = requireRole('admin');

router.get('/export',   soloAdmin, backupController.exportar);
router.post('/restore', soloAdmin, backupController.restaurar);

module.exports = router;
