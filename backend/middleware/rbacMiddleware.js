const jwt = require('jsonwebtoken');

function verifyToken(req, res) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido.' });
    return null;
  }
  try {
    return jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado.' });
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = verifyToken(req, res);
  if (!payload) return;
  req.user = payload;
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const payload = verifyToken(req, res);
    if (!payload) return;
    if (!payload.rol || !allowedRoles.includes(payload.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para acceder a este recurso.' });
    }
    req.user = payload;
    next();
  };
}

module.exports = { requireAuth, requireRole };
