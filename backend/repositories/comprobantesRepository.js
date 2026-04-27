const supabase = require('../config/supabaseClient');

async function findAll() {
  return supabase
    .from('comprobantes')
    .select('*, movimientos(id, descripcion, tipo, monto, fecha)')
    .order('created_at', { ascending: false });
}

async function findById(id) {
  return supabase.from('comprobantes').select('storage_path').eq('id', id).single();
}

async function findByMovimientoId(movimientoId) {
  return supabase.from('comprobantes').select('storage_path').eq('movimiento_id', movimientoId);
}

async function create(data) {
  return supabase.from('comprobantes').insert([data]).select().single();
}

async function update(id, data) {
  return supabase.from('comprobantes').update(data).eq('id', id).select().single();
}

async function remove(id) {
  return supabase.from('comprobantes').delete().eq('id', id);
}

async function removeByMovimientoId(movimientoId) {
  return supabase.from('comprobantes').delete().eq('movimiento_id', movimientoId);
}

async function uploadToStorage(path, buffer, contentType) {
  return supabase.storage.from('comprobantes').upload(path, buffer, { contentType, upsert: false });
}

async function removeFromStorage(paths) {
  return supabase.storage.from('comprobantes').remove(paths);
}

function getPublicUrl(path) {
  return supabase.storage.from('comprobantes').getPublicUrl(path);
}

module.exports = {
  findAll,
  findById,
  findByMovimientoId,
  create,
  update,
  remove,
  removeByMovimientoId,
  uploadToStorage,
  removeFromStorage,
  getPublicUrl
};
