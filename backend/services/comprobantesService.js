const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const comprobantesRepository = require('../repositories/comprobantesRepository');

async function ocrImagen(buffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'spa+eng', { logger: () => {} });
    return text;
  } catch (err) {
    console.error('OCR error:', err.message);
    return null;
  }
}

async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('PDF parse error:', err.message);
    return null;
  }
}

function extraerDatosOCR(texto) {
  if (!texto) return { fecha: null, monto: null, proveedor: null };
  const resultado = { fecha: null, monto: null, proveedor: null };

  // MONTO: anclar con ^ y flag m para no cruzar saltos de línea.
  // "Precio Total" está en el encabezado de la tabla y NO empieza la línea con "Total",
  // así que el primer patrón lo ignora correctamente.
  const montoPatterns = [
    /^[ \t]*total[ \t]*:?[ \t]*\$?[ \t]*([\d.,]+)/im,                          // "Total $ 19707,50"  (AFIP)
    /^[ \t]*subtotal[ \t]*:?[ \t]*\$?[ \t]*([\d.,]+)/im,                       // "Subtotal $ 19707,50"
    /^[ \t]*monto[ \t]+total[ \t]*(?:final)?[ \t]*:?[ \t]*\$?[ \t]*([\d.,]+)/im, // "Monto total final: $ 52.940" (recibos)
    /^[ \t]*importe[ \t]+total[ \t]*:?[ \t]*\$?[ \t]*([\d.,]+)/im,
    /^[ \t]*(?:monto|importe)[ \t]*:[ \t]*\$?[ \t]*([\d.,]+)/im,
    /\$\s*([\d.,]+)/,                                                            // fallback genérico
  ];
  for (const p of montoPatterns) {
    const match = texto.match(p);
    if (match) {
      // Normalización argentina: punto = separador de miles, coma = decimal
      const raw = match[1].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0 && val < 100_000_000) { resultado.monto = val; break; }
    }
  }

  // FECHA: priorizar "Fecha de Emisión" (AFIP) sobre cualquier otra fecha del documento
  const fechaLabelPatterns = [
    /fecha\s+de\s+emisi[oó]n\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
    /fecha\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
  ];
  for (const p of fechaLabelPatterns) {
    const match = texto.match(p);
    if (match) {
      const parts = match[1].split(/[\/\-]/);
      try {
        const fecha = parts[0].length === 4
          ? new Date(`${parts[0]}-${parts[1]}-${parts[2]}`)
          : new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        if (!isNaN(fecha.getTime())) { resultado.fecha = fecha.toISOString().split('T')[0]; break; }
      } catch { continue; }
    }
  }
  if (!resultado.fecha) {
    // Fallback: primera fecha con formato reconocible
    const fallbackPatterns = [
      { re: /(\d{2})\/(\d{2})\/(\d{4})/, iso: (m) => `${m[3]}-${m[2]}-${m[1]}` },
      { re: /(\d{4})-(\d{2})-(\d{2})/, iso: (m) => `${m[1]}-${m[2]}-${m[3]}` },
      { re: /(\d{2})-(\d{2})-(\d{4})/, iso: (m) => `${m[3]}-${m[2]}-${m[1]}` },
    ];
    for (const { re, iso } of fallbackPatterns) {
      const m = texto.match(re);
      if (m) {
        try {
          const fecha = new Date(iso(m));
          if (!isNaN(fecha.getTime())) { resultado.fecha = fecha.toISOString().split('T')[0]; break; }
        } catch { continue; }
      }
    }
  }

  // PROVEEDOR: capturar solo hasta el salto de línea para no arrastrar el domicilio
  const proveedorPatterns = [
    /^raz[oó]n\s+social\s*:?\s*([^\n\r]+)/im,                       // "Razón Social: Farmcity S.A" — solo si empieza la línea (excluye "Nombre / Razón social:")
    /(?:empresa|proveedor|emisor)\s*:?\s*([^\n\r]+)/i,              // etiqueta explícita
    /^([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÑ0-9\s.,]+?)\s*-\s/m,             // "ZFC S.A.S. - Sede Paraná..."  (recibos)
    /^([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÑ\s.,]+(S\.?\s*A\.?\s*S\.|S\.?\s*A\.?|S\.?\s*R\.?\s*L\.))\s*$/m,
  ];
  for (const p of proveedorPatterns) {
    const match = texto.match(p);
    if (match) { resultado.proveedor = match[1].trim().substring(0, 100); break; }
  }

  return resultado;
}

async function upload(file, movimientoId) {
  const ext = file.originalname.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const storagePath = `comprobantes/${fileName}`;

  const { error: uploadError } = await comprobantesRepository.uploadToStorage(storagePath, file.buffer, file.mimetype);
  if (uploadError) throw new Error(`Storage error: ${uploadError.message}`);

  const { data: urlData } = comprobantesRepository.getPublicUrl(storagePath);

  let ocrTexto = null;
  let ocrEstado = 'pendiente';
  let ocrFecha = null;
  let ocrMonto = null;
  let ocrProveedor = null;

  try {
    if (file.mimetype === 'application/pdf') {
      ocrTexto = await parsePDF(file.buffer);
    } else {
      ocrTexto = await ocrImagen(file.buffer);
    }
    if (ocrTexto) {
      const datos = extraerDatosOCR(ocrTexto);
      ocrFecha = datos.fecha;
      ocrMonto = datos.monto;
      ocrProveedor = datos.proveedor;
      ocrEstado = 'procesado';
    }
  } catch (ocrErr) {
    console.error('OCR falló:', ocrErr.message);
    ocrEstado = 'error';
  }

  const { data: comprobante, error: dbError } = await comprobantesRepository.create({
    movimiento_id: movimientoId || null,
    nombre_archivo: file.originalname,
    tipo_archivo: file.mimetype,
    url_archivo: urlData.publicUrl,
    storage_path: storagePath,
    ocr_estado: ocrEstado,
    ocr_texto: ocrTexto ? ocrTexto.substring(0, 5000) : null,
    ocr_fecha: ocrFecha,
    ocr_monto: ocrMonto,
    ocr_proveedor: ocrProveedor
  });

  if (dbError) throw dbError;

  return {
    comprobante,
    ocr: { estado: ocrEstado, fecha: ocrFecha, monto: ocrMonto, proveedor: ocrProveedor }
  };
}

async function getAll() {
  const { data, error } = await comprobantesRepository.findAll();
  if (error) throw error;
  return { data };
}

async function vincular(id, movimientoId) {
  const { data, error } = await comprobantesRepository.update(id, { movimiento_id: movimientoId });
  if (error) throw error;
  return data;
}

async function remove(id) {
  const { data: comp } = await comprobantesRepository.findById(id);
  if (comp) {
    await comprobantesRepository.removeFromStorage([comp.storage_path]);
  }
  const { error } = await comprobantesRepository.remove(id);
  if (error) throw error;
}

module.exports = { upload, getAll, vincular, remove };
