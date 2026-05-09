require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedAdmin() {
  const email    = 'admin@finanzas360.com';
  const password = 'admin123';
  const nombre   = 'Administrador';

  console.log('🌱 Iniciando seed de usuario admin...');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);

  // Obtener el rol 'admin'
  const { data: rol, error: rolError } = await supabase
    .from('roles')
    .select('id')
    .eq('nombre', 'admin')
    .single();

  if (rolError || !rol) {
    console.error('❌ No se encontró el rol "admin" en la tabla roles.');
    console.error('   Ejecutá primero: supabase/migration_auth_unification.sql en Supabase SQL Editor');
    process.exit(1);
  }

  const hashed_password = await bcrypt.hash(password, 10);
  console.log(`   Hash:     ${hashed_password}`);

  const { data, error } = await supabase
    .from('usuarios')
    .upsert(
      { email, nombre, hashed_password, rol_id: rol.id, estado: 'Activo' },
      { onConflict: 'email' }
    )
    .select('id, email, nombre, estado, roles (nombre)');

  if (error) {
    console.error('❌ Error al insertar usuario admin:', error.message);
    if (error.details) console.error('   Detalle:', error.details);
    if (error.hint)    console.error('   Hint:', error.hint);
    process.exit(1);
  }

  console.log('\n✅ Usuario admin creado/actualizado correctamente:');
  console.table(data);
  console.log('\n🔑 Podés iniciar sesión con:');
  console.log('   Email:    admin@finanzas360.com');
  console.log('   Password: admin123\n');
}

seedAdmin();
