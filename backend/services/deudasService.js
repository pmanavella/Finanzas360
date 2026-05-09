const supabase = require('../config/supabaseClient');

class DeudasService {
  async listar({ estado, search } = {}) {
    let query = supabase
      .from('deudas')
      .select('*')
      .order('vencimiento', { ascending: true });

    if (estado && estado !== 'Todos') query = query.eq('estado', estado);
    if (search) query = query.ilike('acreedor', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return { data, total: data.length };
  }

  async getMetricas() {
    const { data, error } = await supabase.from('deudas').select('monto, estado, vencimiento');
    if (error) throw error;

    const hoy = new Date().toISOString().split('T')[0];
    const pendientes = data.filter(d => d.estado !== 'Pagada');
    const vencidas = data.filter(d => d.estado !== 'Pagada' && d.vencimiento < hoy);
    const totalPendiente = pendientes.reduce((s, d) => s + Number(d.monto), 0);
    const totalVencido = vencidas.reduce((s, d) => s + Number(d.monto), 0);

    return { totalPendiente, totalVencido, cantPendientes: pendientes.length, cantVencidas: vencidas.length };
  }

  async obtenerPorId(id) {
    const { data, error } = await supabase.from('deudas').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) throw Object.assign(new Error('No encontrado'), { status: 404 });
    return data;
  }

  async crear(body, createdBy) {
    const { acreedor, descripcion, monto, vencimiento, estado, notas } = body;
    if (!acreedor || !monto || !vencimiento)
      throw Object.assign(new Error('Faltan campos obligatorios: acreedor, monto, vencimiento'), { status: 400 });
    if (Number(monto) <= 0)
      throw Object.assign(new Error('El monto debe ser mayor a 0'), { status: 400 });

    const { data, error } = await supabase
      .from('deudas')
      .insert([{ acreedor, descripcion, monto: Number(monto), vencimiento, estado: estado || 'Pendiente', notas, created_by: createdBy || null }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizar(id, body) {
    const { acreedor, descripcion, monto, vencimiento, estado, notas } = body;
    const { data, error } = await supabase
      .from('deudas')
      .update({ acreedor, descripcion, monto: Number(monto), vencimiento, estado, notas, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async eliminar(id) {
    const { error } = await supabase.from('deudas').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Deuda eliminada correctamente' };
  }
}

module.exports = new DeudasService();
