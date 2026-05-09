const express = require('express');
const router = express.Router();
const comprobantesController = require('../controllers/comprobantesController');
const uploadComprobantes = require('../middleware/uploadComprobantes');
const { requireAuth, requireRole } = require('../middleware/rbacMiddleware');

const canWrite = requireRole('admin', 'usuario');

router.get('/',              requireAuth, comprobantesController.getAll);
router.post('/upload',       canWrite,    uploadComprobantes.single('archivo'), comprobantesController.upload);
router.put('/:id/vincular',  canWrite,    comprobantesController.vincular);
router.delete('/:id',        canWrite,    comprobantesController.remove);

module.exports = router;
