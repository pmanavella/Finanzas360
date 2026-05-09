const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

async function login(email, password) {
  console.log(`[AUTH] Intento de login — email: ${email}`);

  if (!email || !password) {
    console.warn('[AUTH] Faltan email o password en el request');
    throw Object.assign(new Error('Email y contraseña son obligatorios'), { status: 400 });
  }

  const { data: user, error } = await userRepository.findByEmail(email);

  if (error) {
    console.error('[AUTH] Error de DB al buscar usuario:', error.message, error.details || '');
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  if (!user) {
    console.warn(`[AUTH] Usuario no encontrado — email: ${email}`);
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  const rol = user.roles?.nombre || null;
  console.log(`[AUTH] Usuario encontrado — id: ${user.id}, rol: ${rol}, estado: ${user.estado}`);

  if (user.estado !== 'Activo') {
    console.warn(`[AUTH] Usuario inactivo — email: ${email}`);
    throw Object.assign(new Error('Usuario inactivo'), { status: 403 });
  }

  if (!user.hashed_password) {
    console.warn(`[AUTH] Usuario sin contraseña configurada — email: ${email}`);
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  const passwordMatch = await bcrypt.compare(password, user.hashed_password);
  console.log(`[AUTH] Password match: ${passwordMatch}`);

  if (!passwordMatch) {
    console.warn(`[AUTH] Contraseña incorrecta — email: ${email}`);
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  const payload = {
    id:     user.id,
    email:  user.email,
    nombre: user.nombre,
    rol,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
  console.log(`[AUTH] JWT generado correctamente — email: ${email}, rol: ${rol}`);

  return {
    token,
    user: {
      id:     user.id,
      email:  user.email,
      nombre: user.nombre,
      rol,
    },
  };
}

module.exports = { login };
