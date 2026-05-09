const express = require('express');
const router = express.Router();
const movimientosController = require('../controllers/movimientosController');
const { requireAuth, requireRole } = require('../middleware/rbacMiddleware');

const canWrite  = requireRole('admin', 'usuario');
const soloAdmin = requireRole('admin');

router.get('/',              requireAuth, movimientosController.getAll);
router.get('/metricas',      requireAuth, movimientosController.getMetricas);
router.get('/trazabilidad',  soloAdmin,   movimientosController.getTrazabilidad);
router.get('/:id',           requireAuth, movimientosController.getById);
router.post('/',             canWrite,    movimientosController.create);
router.put('/:id',           canWrite,    movimientosController.update);
router.delete('/:id',        canWrite,    movimientosController.remove);

module.exports = router;
