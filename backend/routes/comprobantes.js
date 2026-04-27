const express = require('express');
const router = express.Router();
const comprobantesController = require('../controllers/comprobantesController');
const uploadComprobantes = require('../middleware/uploadComprobantes');

router.post('/upload', uploadComprobantes.single('archivo'), comprobantesController.upload);
router.get('/', comprobantesController.getAll);
router.put('/:id/vincular', comprobantesController.vincular);
router.delete('/:id', comprobantesController.remove);

module.exports = router;
