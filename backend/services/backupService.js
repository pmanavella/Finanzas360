const supabase = require('../config/supabaseClient');

const BACKUP_VERSION = '1.0';

const TABLAS = ['movimientos', 'comprobantes', 'deudas', 'movimientos_salario'];

async function exportar() {
  const resultado = {
    backup_version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    movimientos: [],
    comprobantes: [],
    deudas: [],
    movimientos_salario: [],
  };

  for (const tabla of TABLAS) {
    const { data, error } = await supabase.from(tabla).select('*');
    if (error) throw Object.assign(new Error(`Error al exportar tabla ${tabla}: ${error.message}`), { status: 500 });
    resultado[tabla] = data || [];
  }

  return resultado;
}

async function restaurar(backup) {
  if (!backup.backup_version || !backup.exported_at) {
    throw Object.assign(new Error('El archivo no es un backup válido de Finanzas360'), { status: 400 });
  }

  const resumen = {};

  for (const tabla of TABLAS) {
    const registros = backup[tabla];
    if (!Array.isArray(registros) || registros.length === 0) {
      resumen[tabla] = { insertados: 0, omitidos: 0 };
      continue;
    }

    const { data, error } = await supabase
      .from(tabla)
      .upsert(registros, { onConflict: 'id', ignoreDuplicates: true })
      .select();

    if (error) throw Object.assign(new Error(`Error al restaurar tabla ${tabla}: ${error.message}`), { status: 500 });

    resumen[tabla] = {
      insertados: data?.length || 0,
      omitidos: registros.length - (data?.length || 0),
    };
  }

  return resumen;
}

module.exports = { exportar, restaurar };
