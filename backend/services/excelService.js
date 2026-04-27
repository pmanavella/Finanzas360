const XLSX = require('xlsx');
const { CATEGORIAS_VALIDAS, TIPOS_VALIDOS, COLUMNAS_REQUERIDAS, validarFila, parsearFecha } = require('../utils/excelUtils');
const excelRepository = require('../repositories/excelRepository');

function parseFile(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { raw: true });

  return rows.map(row => {
    const normalized = {};
    Object.keys(row).forEach(k => {
      normalized[k.toLowerCase().trim().replace(/\s+/g, '_')] = row[k];
    });
    return normalized;
  });
}

async function validar(buffer) {
  const filas = parseFile(buffer);

  if (filas.length === 0) {
    throw Object.assign(new Error('El archivo está vacío o no tiene datos'), { status: 400 });
  }

  const columnasPresentes = Object.keys(filas[0]);
  const faltantes = COLUMNAS_REQUERIDAS.filter(c => !columnasPresentes.includes(c));

  if (faltantes.length > 0) {
    throw Object.assign(
      new Error(`Columnas faltantes en el archivo: ${faltantes.join(', ')}`),
      { status: 400, columnasPresentes, columnasRequeridas: COLUMNAS_REQUERIDAS }
    );
  }

  const errores = [];
  filas.forEach((fila, i) => errores.push(...validarFila(fila, i)));

  return {
    valido: errores.length === 0,
    totalFilas: filas.length,
    errores,
    preview: filas.slice(0, 5).map(f => ({ ...f, fecha: parsearFecha(f.fecha), monto: Number(f.monto) }))
  };
}

async function importar(buffer) {
  const filas = parseFile(buffer);

  if (filas.length === 0) {
    throw Object.assign(new Error('El archivo está vacío'), { status: 400 });
  }

  const errores = [];
  filas.forEach((fila, i) => errores.push(...validarFila(fila, i)));

  if (errores.length > 0) {
    throw Object.assign(
      new Error('El archivo tiene errores de validación'),
      { status: 400, errores: errores.slice(0, 20) }
    );
  }

  const registros = filas.map(f => ({
    fecha: parsearFecha(f.fecha),
    descripcion: String(f.descripcion).trim(),
    categoria: String(f.categoria).trim(),
    tipo: String(f.tipo).trim(),
    monto: Number(f.monto),
    proveedor_cliente: f.proveedor_cliente ? String(f.proveedor_cliente).trim() : null,
    notas: f.notas ? String(f.notas).trim() : null
  }));

  let insertados = 0;
  const loteSize = 100;
  for (let i = 0; i < registros.length; i += loteSize) {
    const lote = registros.slice(i, i + loteSize);
    const { data, error } = await excelRepository.bulkInsert(lote);
    if (error) throw new Error(`Error en lote ${Math.floor(i / loteSize) + 1}: ${error.message}`);
    insertados += data.length;
  }

  return { success: true, insertados, mensaje: `Se importaron ${insertados} registros exitosamente` };
}

function getPlantilla() {
  return {
    columnas: [
      { nombre: 'fecha', tipo: 'fecha', formato: 'YYYY-MM-DD o DD/MM/YYYY', requerido: true },
      { nombre: 'descripcion', tipo: 'texto', requerido: true },
      { nombre: 'categoria', tipo: 'texto', opciones: CATEGORIAS_VALIDAS, requerido: true },
      { nombre: 'tipo', tipo: 'texto', opciones: TIPOS_VALIDOS, requerido: true },
      { nombre: 'monto', tipo: 'numero', requerido: true },
      { nombre: 'proveedor_cliente', tipo: 'texto', requerido: false },
      { nombre: 'notas', tipo: 'texto', requerido: false }
    ],
    ejemplo: [
      { fecha: '2026-04-01', descripcion: 'Servidor AWS', categoria: 'Tecnología', tipo: 'Gasto', monto: 38400, proveedor_cliente: 'AWS' },
      { fecha: '2026-04-02', descripcion: 'Cobro Cliente A', categoria: 'Servicios', tipo: 'Ingreso', monto: 120000, proveedor_cliente: 'Cliente A' }
    ]
  };
}

module.exports = { validar, importar, getPlantilla };
