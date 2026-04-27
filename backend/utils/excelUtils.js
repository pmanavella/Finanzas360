const CATEGORIAS_VALIDAS = ['Tecnología', 'RRHH', 'Insumos', 'Servicios', 'Inversión', 'Otros'];
const TIPOS_VALIDOS = ['Ingreso', 'Gasto'];
const COLUMNAS_REQUERIDAS = ['fecha', 'descripcion', 'categoria', 'tipo', 'monto'];

function validarFila(fila, index) {
  const errores = [];
  const num = index + 2;

  for (const col of COLUMNAS_REQUERIDAS) {
    if (!fila[col] && fila[col] !== 0) {
      errores.push(`Fila ${num}: falta la columna "${col}"`);
    }
  }

  if (fila.tipo && !TIPOS_VALIDOS.includes(fila.tipo)) {
    errores.push(`Fila ${num}: tipo "${fila.tipo}" inválido. Debe ser "Ingreso" o "Gasto"`);
  }

  if (fila.categoria && !CATEGORIAS_VALIDAS.includes(fila.categoria)) {
    errores.push(`Fila ${num}: categoría "${fila.categoria}" inválida. Opciones: ${CATEGORIAS_VALIDAS.join(', ')}`);
  }

  if (fila.monto && (isNaN(Number(fila.monto)) || Number(fila.monto) <= 0)) {
    errores.push(`Fila ${num}: monto "${fila.monto}" debe ser un número positivo`);
  }

  if (fila.fecha) {
    const fecha = new Date(fila.fecha);
    if (isNaN(fecha.getTime())) {
      errores.push(`Fila ${num}: fecha "${fila.fecha}" inválida. Usar formato YYYY-MM-DD o DD/MM/YYYY`);
    }
  }

  return errores;
}

function parsearFecha(valor) {
  if (!valor) return null;
  if (typeof valor === 'number') {
    const date = new Date((valor - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  const str = String(valor).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return null;
}

module.exports = { CATEGORIAS_VALIDAS, TIPOS_VALIDOS, COLUMNAS_REQUERIDAS, validarFila, parsearFecha };
