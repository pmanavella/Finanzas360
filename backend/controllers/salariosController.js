const salariosService = require('../services/salariosService');

class SalariosController {
  async listarEmpleados(req, res, next) {
    try { res.json(await salariosService.listarEmpleados(req.query)) }
    catch (err) { next(err) }
  }

  async obtenerEmpleado(req, res, next) {
    try { res.json(await salariosService.obtenerEmpleadoPorId(req.params.id)) }
    catch (err) { next(err) }
  }

  async crearEmpleado(req, res, next) {
    try { res.status(201).json(await salariosService.crearEmpleado(req.body, req.user?.email)) }
    catch (err) { next(err) }
  }

  async actualizarEmpleado(req, res, next) {
    try { res.json(await salariosService.actualizarEmpleado(req.params.id, req.body)) }
    catch (err) { next(err) }
  }

  async eliminarEmpleado(req, res, next) {
    try { res.json(await salariosService.eliminarEmpleado(req.params.id)) }
    catch (err) { next(err) }
  }

  async listarCategorias(req, res, next) {
    try { res.json(await salariosService.listarCategorias()) }
    catch (err) { next(err) }
  }

  async crearCategoria(req, res, next) {
    try { res.status(201).json(await salariosService.crearCategoria(req.body, req.user?.email)) }
    catch (err) { next(err) }
  }

  async eliminarCategoria(req, res, next) {
    try { res.json(await salariosService.eliminarCategoria(req.params.id)) }
    catch (err) { next(err) }
  }

  async listarMovimientos(req, res, next) {
    try { res.json(await salariosService.listarMovimientos(req.query)) }
    catch (err) { next(err) }
  }

  async crearMovimiento(req, res, next) {
    try { res.status(201).json(await salariosService.crearMovimiento(req.body, req.user?.email)) }
    catch (err) { next(err) }
  }

  async actualizarMovimiento(req, res, next) {
    try { res.json(await salariosService.actualizarMovimiento(req.params.id, req.body)) }
    catch (err) { next(err) }
  }

  async eliminarMovimiento(req, res, next) {
    try { res.json(await salariosService.eliminarMovimiento(req.params.id)) }
    catch (err) { next(err) }
  }

  async metricas(req, res, next) {
    try { res.json(await salariosService.getMetricas()) }
    catch (err) { next(err) }
  }
}

module.exports = new SalariosController();
