const bcrypt = require('bcrypt');
const supabase = require('../config/supabaseClient');

const USER_SELECT = 'id, email, nombre, rol_id, estado, created_at, created_by, updated_by, roles (id, nombre)';

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
    if (!email || !nombre || !rol_id || !password)
      throw Object.assign(
        new Error('Faltan campos obligatorios: email, nombre, rol_id, password'),
        { status: 400 }
      );

    const hashed_password = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        email, nombre, rol_id,
        estado: estado || 'Activo',
        hashed_password,
        created_by: performedBy || null,
      }])
      .select(USER_SELECT)
      .single();
    if (error) throw error;
    console.log(`[RBAC] Usuario creado — email: ${email}, por: ${performedBy}`);
    return data;
  }

  async actualizarUsuario(id, body, performedBy) {
    const { email, nombre, rol_id, estado, password } = body;

    const updates = { email, nombre, rol_id, estado, updated_by: performedBy || null };
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
    if (error) throw error;
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
