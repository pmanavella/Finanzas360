const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/suscripcionesController');
const { requireAuth, requireRole } = require('../middleware/rbacMiddleware');

const canWrite  = requireRole('admin', 'usuario');
const soloAdmin = requireRole('admin');

router.get('/proximas-vencer', requireAuth, ctrl.proximasAVencer);
router.get('/',                requireAuth, ctrl.listar);
router.get('/:id',             requireAuth, ctrl.obtener);
router.post('/',               canWrite,    ctrl.crear);
router.put('/:id',             canWrite,    ctrl.actualizar);
router.delete('/:id',          soloAdmin,   ctrl.eliminar);
router.post('/:id/pago',       canWrite,    ctrl.marcarPago);

module.exports = router;
