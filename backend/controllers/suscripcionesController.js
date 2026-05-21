const suscripcionesService = require('../services/suscripcionesService');

class SuscripcionesController {
  async listar(req, res, next) {
    try {
      res.json(await suscripcionesService.listar(req.query));
    } catch (err) { next(err) }
  }

  async proximasAVencer(req, res, next) {
    try {
      res.json(await suscripcionesService.proximasAVencer());
    } catch (err) { next(err) }
  }

  async obtener(req, res, next) {
    try {
      res.json(await suscripcionesService.obtenerPorId(req.params.id));
    } catch (err) { next(err) }
  }

  async crear(req, res, next) {
    try {
      res.status(201).json(await suscripcionesService.crear(req.body, req.user?.email));
    } catch (err) { next(err) }
  }

  async actualizar(req, res, next) {
    try {
      res.json(await suscripcionesService.actualizar(req.params.id, req.body));
    } catch (err) { next(err) }
  }

  async eliminar(req, res, next) {
    try {
      res.json(await suscripcionesService.eliminar(req.params.id));
    } catch (err) { next(err) }
  }

  async marcarPago(req, res, next) {
    try {
      const { fecha_pago } = req.body;
      if (!fecha_pago)
        return res.status(400).json({ error: 'La fecha de pago es obligatoria' });
      res.json(await suscripcionesService.marcarPago(req.params.id, fecha_pago));
    } catch (err) { next(err) }
  }
}

module.exports = new SuscripcionesController();
