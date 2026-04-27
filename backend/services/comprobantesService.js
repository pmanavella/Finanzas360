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

  const montoPatterns = [
    /(?:total|importe|monto|precio)\s*:?\s*\$?\s*([\d.,]+)/i,
    /\$\s*([\d.,]+)/,
    /(?:ars|pesos)\s*([\d.,]+)/i,
  ];
  for (const p of montoPatterns) {
    const match = texto.match(p);
    if (match) {
      const raw = match[1].replace(/\./g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0) { resultado.monto = val; break; }
    }
  }

  const fechaPatterns = [
    /(\d{2})\/(\d{2})\/(\d{4})/,
    /(\d{4})-(\d{2})-(\d{2})/,
    /(\d{2})-(\d{2})-(\d{4})/,
  ];
  for (const p of fechaPatterns) {
    const match = texto.match(p);
    if (match) {
      try {
        let fecha;
        if (match[0].includes('-') && match[1].length === 4) {
          fecha = new Date(`${match[1]}-${match[2]}-${match[3]}`);
        } else {
          fecha = new Date(`${match[3]}-${match[2]}-${match[1]}`);
        }
        if (!isNaN(fecha.getTime())) { resultado.fecha = fecha.toISOString().split('T')[0]; break; }
      } catch { continue; }
    }
  }

  const proveedorPatterns = [
    /(?:razón social|empresa|proveedor|emisor|nombre)\s*:?\s*([A-ZÁÉÍÓÚa-záéíóú\s.]{3,40})/i,
    /^([A-ZÁÉÍÓÚ][A-Za-záéíóúñÑ\s.]{5,40})$/m,
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
