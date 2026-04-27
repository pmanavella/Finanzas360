const express = require('express');
const router = express.Router();
const excelController = require('../controllers/excelController');
const uploadExcel = require('../middleware/uploadExcel');

router.post('/validar', uploadExcel.single('archivo'), excelController.validar);
router.post('/importar', uploadExcel.single('archivo'), excelController.importar);
router.get('/plantilla', excelController.getPlantilla);

module.exports = router;
