const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

async function login(email, password) {
  if (!email || !password) {
    throw Object.assign(new Error('Email y contraseña son obligatorios'), { status: 400 });
  }

  const { data: user, error } = await userRepository.findByEmail(email);

  if (error || !user) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  if (!user.is_active) {
    throw Object.assign(new Error('Usuario inactivo'), { status: 403 });
  }

  const passwordMatch = await bcrypt.compare(password, user.hashed_password);
  if (!passwordMatch) {
    throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
  }

  const payload = {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol
    }
  };
}

module.exports = { login };
