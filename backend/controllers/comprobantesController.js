const comprobantesService = require('../services/comprobantesService');

async function upload(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const result = await comprobantesService.upload(req.file, req.body.movimiento_id);
    res.status(201).json(result);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getAll(req, res) {
  try {
    const result = await comprobantesService.getAll();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function vincular(req, res) {
  try {
    const data = await comprobantesService.vincular(req.params.id, req.body.movimiento_id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await comprobantesService.remove(req.params.id);
    res.json({ message: 'Comprobante eliminado' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { upload, getAll, vincular, remove };
