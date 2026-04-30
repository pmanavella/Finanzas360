const supabase = require('../config/supabaseClient');

class RbacService {
  async listarUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles (id, nombre)')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return { data, total: data.length };
  }

  async obtenerUsuarioPorId(id) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles (id, nombre)')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) throw Object.assign(new Error('Usuario no encontrado'), { status: 404 });
    return data;
  }

  async crearUsuario(body) {
    const { email, nombre, rol_id, estado } = body;
    if (!email || !nombre || !rol_id)
      throw Object.assign(new Error('Faltan campos obligatorios: email, nombre, rol_id'), { status: 400 });
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ email, nombre, rol_id, estado: estado || 'Activo' }])
      .select('*, roles (id, nombre)')
      .single();
    if (error) throw error;
    return data;
  }

  async actualizarUsuario(id, body) {
    const { email, nombre, rol_id, estado } = body;
    const { data, error } = await supabase
      .from('usuarios')
      .update({ email, nombre, rol_id, estado })
      .eq('id', id)
      .select('*, roles (id, nombre)')
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
