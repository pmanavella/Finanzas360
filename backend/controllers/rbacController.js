const rbacService = require('../services/rbacService');

class RbacController {
  async listarUsuarios(req, res, next) {
    try { res.json(await rbacService.listarUsuarios()) }
    catch (err) { next(err) }
  }

  async obtenerUsuario(req, res, next) {
    try { res.json(await rbacService.obtenerUsuarioPorId(req.params.id)) }
    catch (err) { next(err) }
  }

  async crearUsuario(req, res, next) {
    try {
      res.status(201).json(
        await rbacService.crearUsuario(req.body, req.user?.email)
      )
    } catch (err) { next(err) }
  }

  async actualizarUsuario(req, res, next) {
    try {
      res.json(
        await rbacService.actualizarUsuario(req.params.id, req.body, req.user?.email)
      )
    } catch (err) { next(err) }
  }

  async eliminarUsuario(req, res, next) {
    try {
      res.json(
        await rbacService.eliminarUsuario(req.params.id, req.user?.email, req.user?.id)
      )
    } catch (err) { next(err) }
  }

  async listarRoles(req, res, next) {
    try { res.json(await rbacService.listarRoles()) }
    catch (err) { next(err) }
  }
}

module.exports = new RbacController();
