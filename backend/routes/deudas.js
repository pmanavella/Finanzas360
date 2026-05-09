const express = require('express');
const router = express.Router();
const { listar, metricas, obtener, crear, actualizar, eliminar } = require('../controllers/deudasController');
const { requireAuth, requireRole } = require('../middleware/rbacMiddleware');

const canWrite = requireRole('admin', 'usuario');

router.get('/',         requireAuth, listar);
router.get('/metricas', requireAuth, metricas);
router.get('/:id',      requireAuth, obtener);
router.post('/',        canWrite,    crear);
router.put('/:id',      canWrite,    actualizar);
router.delete('/:id',   canWrite,    eliminar);

module.exports = router;
