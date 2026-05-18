const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/salariosController');
const { requireAuth, requireRole } = require('../middleware/rbacMiddleware');

const canRead  = requireAuth;
const canWrite = requireRole('admin', 'usuario');

// Métricas
router.get('/metricas', canRead, ctrl.metricas.bind(ctrl));

// Cotización dólar (con cache en BD)
router.get('/cotizacion-dolar', canRead, ctrl.cotizacionDolar.bind(ctrl));

// Empleados
router.get('/empleados',        canRead,  ctrl.listarEmpleados.bind(ctrl));
router.get('/empleados/:id',    canRead,  ctrl.obtenerEmpleado.bind(ctrl));
router.post('/empleados',       canWrite, ctrl.crearEmpleado.bind(ctrl));
router.put('/empleados/:id',    canWrite, ctrl.actualizarEmpleado.bind(ctrl));
router.delete('/empleados/:id', canWrite, ctrl.eliminarEmpleado.bind(ctrl));

// Categorías
router.get('/categorias',        canRead,  ctrl.listarCategorias.bind(ctrl));
router.post('/categorias',       canWrite, ctrl.crearCategoria.bind(ctrl));
router.delete('/categorias/:id', canWrite, ctrl.eliminarCategoria.bind(ctrl));

// Movimientos salariales
router.get('/movimientos',        canRead,  ctrl.listarMovimientos.bind(ctrl));
router.post('/movimientos',       canWrite, ctrl.crearMovimiento.bind(ctrl));
router.put('/movimientos/:id',    canWrite, ctrl.actualizarMovimiento.bind(ctrl));
router.delete('/movimientos/:id', canWrite, ctrl.eliminarMovimiento.bind(ctrl));

module.exports = router;
