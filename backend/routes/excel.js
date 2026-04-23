const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls') || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'));
    }
  }
});

const CATEGORIAS_VALIDAS = ['Tecnología', 'RRHH', 'Insumos', 'Servicios', 'Inversión', 'Otros'];
const TIPOS_VALIDOS = ['Ingreso', 'Gasto'];
const COLUMNAS_REQUERIDAS = ['fecha', 'descripcion', 'categoria', 'tipo', 'monto'];

function validarFila(fila, index) {
  const errores = [];
  const num = index + 2; // fila real en excel (1 es header)

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

  // Validar fecha
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
  // Si es número de serie de Excel
  if (typeof valor === 'number') {
    const date = new Date((valor - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  const str = String(valor).trim();
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m}-${d}`;
  }
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Intentar parseado genérico
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return null;
}

// POST /api/excel/validar - Solo validar sin importar
router.post('/validar', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: true });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El archivo está vacío o no tiene datos' });
    }

    // Normalizar nombres de columnas (lowercase, sin espacios)
    const filas = rows.map(row => {
      const normalized = {};
      Object.keys(row).forEach(k => {
        normalized[k.toLowerCase().trim().replace(/\s+/g, '_')] = row[k];
      });
      return normalized;
    });

    // Verificar columnas mínimas
    const primeraFila = filas[0];
    const columnasPresentes = Object.keys(primeraFila);
    const faltantes = COLUMNAS_REQUERIDAS.filter(c => !columnasPresentes.includes(c));

    if (faltantes.length > 0) {
      return res.status(400).json({
        error: `Columnas faltantes en el archivo: ${faltantes.join(', ')}`,
        columnasPresentes,
        columnasRequeridas: COLUMNAS_REQUERIDAS
      });
    }

    const errores = [];
    filas.forEach((fila, i) => errores.push(...validarFila(fila, i)));

    res.json({
      valido: errores.length === 0,
      totalFilas: filas.length,
      errores,
      preview: filas.slice(0, 5).map(f => ({
        ...f,
        fecha: parsearFecha(f.fecha),
        monto: Number(f.monto)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/excel/importar - Validar e importar
router.post('/importar', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: true });

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El archivo está vacío' });
    }

    const filas = rows.map(row => {
      const normalized = {};
      Object.keys(row).forEach(k => {
        normalized[k.toLowerCase().trim().replace(/\s+/g, '_')] = row[k];
      });
      return normalized;
    });

    // Validar todo antes de insertar
    const errores = [];
    filas.forEach((fila, i) => errores.push(...validarFila(fila, i)));

    if (errores.length > 0) {
      return res.status(400).json({
        error: 'El archivo tiene errores de validación',
        errores: errores.slice(0, 20)
      });
    }

    // Preparar datos para inserción
    const registros = filas.map(f => ({
      fecha: parsearFecha(f.fecha),
      descripcion: String(f.descripcion).trim(),
      categoria: String(f.categoria).trim(),
      tipo: String(f.tipo).trim(),
      monto: Number(f.monto),
      proveedor_cliente: f.proveedor_cliente ? String(f.proveedor_cliente).trim() : null,
      notas: f.notas ? String(f.notas).trim() : null
    }));

    // Insertar en lotes de 100
    let insertados = 0;
    const loteSize = 100;
    for (let i = 0; i < registros.length; i += loteSize) {
      const lote = registros.slice(i, i + loteSize);
      const { data, error } = await supabase.from('movimientos').insert(lote).select('id');
      if (error) throw new Error(`Error en lote ${Math.floor(i / loteSize) + 1}: ${error.message}`);
      insertados += data.length;
    }

    res.json({
      success: true,
      insertados,
      mensaje: `Se importaron ${insertados} registros exitosamente`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/excel/plantilla - Info de la plantilla esperada
router.get('/plantilla', (req, res) => {
  res.json({
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
  });
});

module.exports = router;
