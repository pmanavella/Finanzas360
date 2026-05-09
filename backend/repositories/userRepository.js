const supabase = require('../config/supabaseClient');

async function findByEmail(email) {
  return supabase
    .from('usuarios')
    .select('id, email, nombre, hashed_password, estado, rol_id, roles (nombre)')
    .eq('email', email)
    .single();
}

module.exports = { findByEmail };
