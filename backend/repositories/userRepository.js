const supabase = require('../config/supabaseClient');

async function findByEmail(email) {
  return supabase
    .from('users')
    .select('id, email, nombre, hashed_password, rol, is_active')
    .eq('email', email)
    .single();
}

module.exports = { findByEmail };
