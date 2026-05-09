const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');
const uploadExcel = require('../middleware/uploadExcel');
const { requireAuth, requireRole } = require('../middleware/rbacMiddleware');

const canWrite = requireRole('admin', 'usuario');

router.get('/plantilla',  requireAuth, excelController.getPlantilla);
router.post('/validar',   canWrite,    uploadExcel.single('archivo'), excelController.validar);
router.post('/importar',  canWrite,    uploadExcel.single('archivo'), excelController.importar);

module.exports = router;
