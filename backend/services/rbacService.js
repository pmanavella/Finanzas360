const bcrypt = require('bcrypt');
const supabase = require('../config/supabaseClient');

const USER_SELECT = 'id, email, nombre, rol_id, estado, created_at, created_by, updated_by, roles (id, nombre)';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 72;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 60;
const MAX_EMAIL_LENGTH = 120;

const BLOCKED_WORDS = [
  'puto', 'puta', 'mierda', 'culo', 'coño', 'polla', 'joder', 'gilipollas',
  'marica', 'maricon', 'pendejo', 'pelotudo', 'boludo', 'carajo', 'concha',
  'perra', 'hdp', 'hijo de puta', 'la puta', 'la concha',
  'fuck', 'shit', 'asshole', 'bitch', 'bastard', 'cunt', 'cock', 'dick',
  'nigger', 'faggot',
];

function containsBlockedWord(value) {
  const normalized = (value || '').toLowerCase();
  return BLOCKED_WORDS.some(word => normalized.includes(word));
}

function validateUserInput({ email, nombre, password, requirePassword = true }) {
  const emailTrimmed = (email || '').trim();
  if (!emailTrimmed)
    throw Object.assign(new Error('El email es obligatorio'), { status: 400 });
  if (emailTrimmed.length > MAX_EMAIL_LENGTH)
    throw Object.assign(new Error(`El email no puede superar los ${MAX_EMAIL_LENGTH} caracteres`), { status: 400 });
  if (!EMAIL_REGEX.test(emailTrimmed))
    throw Object.assign(new Error('El formato del correo electrónico no es válido'), { status: 400 });
  if (containsBlockedWord(emailTrimmed))
    throw Object.assign(new Error('El campo email contiene palabras no permitidas'), { status: 400 });

  const nombreTrimmed = (nombre || '').trim();
  if (!nombreTrimmed)
    throw Object.assign(new Error('El nombre es obligatorio'), { status: 400 });
  if (nombreTrimmed.length < MIN_NAME_LENGTH)
    throw Object.assign(new Error(`El nombre debe tener al menos ${MIN_NAME_LENGTH} caracteres`), { status: 400 });
  if (nombreTrimmed.length > MAX_NAME_LENGTH)
    throw Object.assign(new Error(`El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres`), { status: 400 });
  if (containsBlockedWord(nombreTrimmed))
    throw Object.assign(new Error('El campo nombre contiene palabras no permitidas'), { status: 400 });

  if (password || requirePassword) {
    if (!password && requirePassword)
      throw Object.assign(new Error('La contraseña es obligatoria'), { status: 400 });
    if (password) {
      if (password.length < MIN_PASSWORD_LENGTH)
        throw Object.assign(new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`), { status: 400 });
      if (password.length > MAX_PASSWORD_LENGTH)
        throw Object.assign(new Error(`La contraseña no puede superar los ${MAX_PASSWORD_LENGTH} caracteres`), { status: 400 });
    }
  }
}

class RbacService {
  async listarUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select(USER_SELECT)
      .not('estado', 'eq', 'Eliminado')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return { data, total: data.length };
  }

  async obtenerUsuarioPorId(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(USER_SELECT)
      .eq('id', id)
      .not('estado', 'eq', 'Eliminado')
      .single();
    if (error) throw error;
    if (!data) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    return data;
  }

  async crearUsuario(body, performedBy) {
    const { email, nombre, rol_id, estado, password } = body;
    if (!rol_id)
      throw Object.assign(new Error('El rol es obligatorio'), { status: 400 });

    validateUserInput({ email, nombre, password, requirePassword: true });

    const emailTrimmed = email.trim();

    // Verificar unicidad de email antes de insertar
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', emailTrimmed)
      .not('estado', 'eq', 'Eliminado')
      .limit(1);
    if (existing && existing.length > 0)
      throw Object.assign(
        new Error('Ya existe un usuario registrado con ese correo electrónico'),
        { status: 409 }
      );

    const hashed_password = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        email: emailTrimmed,
        nombre: nombre.trim(),
        rol_id,
        estado: estado || 'Activo',
        hashed_password,
        created_by: performedBy || null,
      }])
      .select(USER_SELECT)
      .single();
    if (error) {
      if (error.code === '23505')
        throw Object.assign(
          new Error('Ya existe un usuario registrado con ese correo electrónico'),
          { status: 409 }
        );
      throw error;
    }
    console.log(`[RBAC] Usuario creado — email: ${emailTrimmed}, por: ${performedBy}`);
    return data;
  }

  async actualizarUsuario(id, body, performedBy) {
    const { email, nombre, rol_id, estado, password } = body;

    validateUserInput({ email, nombre, password, requirePassword: false });

    const emailTrimmed = email.trim();

    // Verificar que el email no esté en uso por otro usuario
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', emailTrimmed)
      .not('estado', 'eq', 'Eliminado')
      .neq('id', id)
      .limit(1);
    if (existing && existing.length > 0)
      throw Object.assign(
        new Error('Ya existe un usuario registrado con ese correo electrónico'),
        { status: 409 }
      );

    const updates = {
      email: emailTrimmed,
      nombre: nombre.trim(),
      rol_id,
      estado,
      updated_by: performedBy || null,
    };
    if (password) {
      updates.hashed_password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .not('estado', 'eq', 'Eliminado')
      .select(USER_SELECT)
      .single();
    if (error) {
      if (error.code === '23505')
        throw Object.assign(
          new Error('Ya existe un usuario registrado con ese correo electrónico'),
          { status: 409 }
        );
      throw error;
    }
    console.log(`[RBAC] Usuario actualizado — id: ${id}, por: ${performedBy}`);
    return data;
  }

  async eliminarUsuario(id, performedBy, requesterId) {
    if (id === requesterId) {
      throw Object.assign(
        new Error('No podés eliminar tu propia cuenta'),
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('usuarios')
      .update({
        estado:     'Eliminado',
        deleted_by: performedBy || null,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
    console.log(`[RBAC] Usuario eliminado (soft) — id: ${id}, por: ${performedBy}`);
    return { message: 'Usuario eliminado correctamente' };
  }

  async listarRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return { data, total: data.length };
  }
}

module.exports = new RbacService();
