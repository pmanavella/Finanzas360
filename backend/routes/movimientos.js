const express = require('express');
const router = express.Router();
const movimientosController = require('../controllers/movimientosController');

router.get('/', movimientosController.getAll);
router.get('/metricas', movimientosController.getMetricas);
router.get('/:id', movimientosController.getById);
router.post('/', movimientosController.create);
router.put('/:id', movimientosController.update);
router.delete('/:id', movimientosController.remove);

module.exports = router;
