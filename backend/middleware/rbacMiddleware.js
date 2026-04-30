function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.headers['x-user-role']
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'No tenés permisos para acceder a este recurso.' })
    }
    next()
  }
}

module.exports = { requireRole }
