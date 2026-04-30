const express = require('express');
const router = express.Router();
const { listar, metricas, obtener, crear, actualizar, eliminar } = require('../controllers/deudasController');

router.get('/',         listar);
router.get('/metricas', metricas);
router.get('/:id',      obtener);
router.post('/',        crear);
router.put('/:id',      actualizar);
router.delete('/:id',   eliminar);

module.exports = router;
