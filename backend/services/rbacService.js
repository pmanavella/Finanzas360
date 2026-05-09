const bcrypt = require('bcrypt');
const supabase = require('../config/supabaseClient');

class RbacService {
  async listarUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol_id, estado, created_at, roles (id, nombre)')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return { data, total: data.length };
  }

  async obtenerUsuarioPorId(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nombre, rol_id, estado, created_at, roles (id, nombre)')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    return data;
  }

  async crearUsuario(body) {
    const { email, nombre, rol_id, estado, password } = body;
    if (!email || !nombre || !rol_id || !password)
      throw Object.assign(
        new Error('Faltan campos obligatorios: email, nombre, rol_id, password'),
        { status: 400 }
      );

    const hashed_password = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ email, nombre, rol_id, estado: estado || 'Activo', hashed_password }])
      .select('id, email, nombre, rol_id, estado, created_at, roles (id, nombre)')
      .single();
    if (error) throw error;
    return data;
  }

  async actualizarUsuario(id, body) {
    const { email, nombre, rol_id, estado, password } = body;

    const updates = { email, nombre, rol_id, estado };
    if (password) {
      updates.hashed_password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select('id, email, nombre, rol_id, estado, created_at, roles (id, nombre)')
      .single();
    if (error) throw error;
    return data;
  }

  async eliminarUsuario(id) {
    const { error } = await supabase.from('usuarios').delete().eq('id', id);
    if (error) throw error;
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
