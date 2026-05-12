const express = require('express');
const router = express.Router();
const comprobantesController = require('../controllers/comprobantesController');
const uploadComprobantes = require('../middleware/uploadComprobantes');
const { requireAuth, requireRole } = require('../middleware/rbacMiddleware');

const canWrite = requireRole('admin', 'usuario');

router.get('/',              requireAuth, comprobantesController.getAll);
router.post('/upload', canWrite, (req, res, next) => {
  uploadComprobantes.single('archivo')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo excede el tamaño máximo permitido (10 MB)' });
    }
    return res.status(400).json({ error: err.message });
  });
}, comprobantesController.upload);
router.put('/:id/vincular',  canWrite,    comprobantesController.vincular);
router.delete('/:id',        canWrite,    comprobantesController.remove);

module.exports = router;
