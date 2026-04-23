const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG o PDF.'));
  }
});

// Función para extraer datos con OCR de imagen
async function ocrImagen(buffer) {
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, 'spa+eng', {
      logger: () => {}
    });
    return text;
  } catch (err) {
    console.error('OCR error:', err.message);
    return null;
  }
}

// Función para extraer texto de PDF
async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('PDF parse error:', err.message);
    return null;
  }
}

// Función para extraer datos estructurados del texto OCR
function extraerDatosOCR(texto) {
  if (!texto) return { fecha: null, monto: null, proveedor: null };

  const resultado = { fecha: null, monto: null, proveedor: null };

  // Extraer monto - patrones comunes en facturas argentinas
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
      if (!isNaN(val) && val > 0) {
        resultado.monto = val;
        break;
      }
    }
  }

  // Extraer fecha
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
        if (!isNaN(fecha.getTime())) {
          resultado.fecha = fecha.toISOString().split('T')[0];
          break;
        }
      } catch { continue; }
    }
  }

  // Extraer proveedor/emisor
  const proveedorPatterns = [
    /(?:razón social|empresa|proveedor|emisor|nombre)\s*:?\s*([A-ZÁÉÍÓÚa-záéíóú\s.]{3,40})/i,
    /^([A-ZÁÉÍÓÚ][A-Za-záéíóúñÑ\s.]{5,40})$/m,
  ];
  for (const p of proveedorPatterns) {
    const match = texto.match(p);
    if (match) {
      resultado.proveedor = match[1].trim().substring(0, 100);
      break;
    }
  }

  return resultado;
}

// POST /api/comprobantes/upload
router.post('/upload', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const { movimiento_id } = req.body;
    const file = req.file;
    const ext = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const storagePath = `comprobantes/${fileName}`;

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('comprobantes')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw new Error(`Storage error: ${uploadError.message}`);

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(storagePath);

    // Procesar OCR en background
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

    // Guardar en BD
    const { data: comprobante, error: dbError } = await supabase
      .from('comprobantes')
      .insert([{
        movimiento_id: movimiento_id || null,
        nombre_archivo: file.originalname,
        tipo_archivo: file.mimetype,
        url_archivo: urlData.publicUrl,
        storage_path: storagePath,
        ocr_estado: ocrEstado,
        ocr_texto: ocrTexto ? ocrTexto.substring(0, 5000) : null,
        ocr_fecha: ocrFecha,
        ocr_monto: ocrMonto,
        ocr_proveedor: ocrProveedor
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    res.status(201).json({
      comprobante,
      ocr: { estado: ocrEstado, fecha: ocrFecha, monto: ocrMonto, proveedor: ocrProveedor }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/comprobantes - Listar todos
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('comprobantes')
      .select('*, movimientos(id, descripcion, tipo, monto, fecha)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/comprobantes/:id/vincular - Vincular a movimiento
router.put('/:id/vincular', async (req, res) => {
  try {
    const { movimiento_id } = req.body;
    const { data, error } = await supabase
      .from('comprobantes')
      .update({ movimiento_id })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/comprobantes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { data: comp } = await supabase
      .from('comprobantes')
      .select('storage_path')
      .eq('id', req.params.id)
      .single();

    if (comp) {
      await supabase.storage.from('comprobantes').remove([comp.storage_path]);
    }

    const { error } = await supabase.from('comprobantes').delete().eq('id', req.params.id);
    if (error) throw error;

    res.json({ message: 'Comprobante eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
