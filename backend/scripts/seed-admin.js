require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedAdmin() {
  const email = 'admin@finanzas360.com';
  const password = 'admin123';
  const nombre = 'Administrador';
  const rol = 'admin';

  console.log('🌱 Iniciando seed de usuario admin...');
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);

  const hashed_password = await bcrypt.hash(password, 10);
  console.log(`   Hash:     ${hashed_password}`);

  const { data, error } = await supabase
    .from('users')
    .upsert(
      { email, nombre, hashed_password, rol, is_active: true },
      { onConflict: 'email' }
    )
    .select('id, email, nombre, rol, is_active');

  if (error) {
    console.error('❌ Error al insertar usuario admin:', error.message);
    if (error.details) console.error('   Detalle:', error.details);
    if (error.hint)    console.error('   Hint:', error.hint);
    console.error('\n⚠️  Si la tabla "users" no existe, ejecutá primero:');
    console.error('   supabase/create_users_table.sql en el SQL Editor de Supabase\n');
    process.exit(1);
  }

  console.log('\n✅ Usuario admin creado/actualizado correctamente:');
  console.table(data);
  console.log('\n🔑 Podés iniciar sesión con:');
  console.log('   Email:    admin@finanzas360.com');
  console.log('   Password: admin123\n');
}

seedAdmin();
