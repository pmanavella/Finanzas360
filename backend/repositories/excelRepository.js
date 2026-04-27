const supabase = require('../config/supabaseClient');

async function bulkInsert(records) {
  return supabase.from('movimientos').insert(records).select('id');
}

module.exports = { bulkInsert };
