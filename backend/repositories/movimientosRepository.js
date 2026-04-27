const supabase = require('../config/supabaseClient');

async function findAll({ tipo, categoria, fecha_desde, fecha_hasta, search } = {}) {
  let query = supabase
    .from('movimientos')
    .select('*, comprobantes (id, nombre_archivo, url_archivo, ocr_estado)')
    .order('fecha', { ascending: false });

  if (tipo && tipo !== 'Todos') query = query.eq('tipo', tipo);
  if (categoria && categoria !== 'Todos') query = query.eq('categoria', categoria);
  if (fecha_desde) query = query.gte('fecha', fecha_desde);
  if (fecha_hasta) query = query.lte('fecha', fecha_hasta);
  if (search) query = query.ilike('descripcion', `%${search}%`);

  return query;
}

async function findById(id) {
  return supabase.from('movimientos').select('*, comprobantes(*)').eq('id', id).single();
}

async function create(data) {
  return supabase.from('movimientos').insert([data]).select().single();
}

async function update(id, data) {
  return supabase.from('movimientos').update(data).eq('id', id).select().single();
}

async function remove(id) {
  return supabase.from('movimientos').delete().eq('id', id);
}

async function getByDateRange(startDate, endDate) {
  return supabase.from('movimientos').select('tipo, monto').gte('fecha', startDate).lte('fecha', endDate);
}

async function getPendientesOCRCount() {
  return supabase.from('comprobantes').select('id', { count: 'exact' }).eq('ocr_estado', 'pendiente');
}

async function getGastosByCategoriaInRange(startDate, endDate) {
  return supabase.from('movimientos').select('categoria, monto').eq('tipo', 'Gasto').gte('fecha', startDate).lte('fecha', endDate);
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  getByDateRange,
  getPendientesOCRCount,
  getGastosByCategoriaInRange
};
