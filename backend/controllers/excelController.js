const excelService = require('../services/excelService');

async function validar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const result = await excelService.validar(req.file.buffer);
    res.json(result);
  } catch (err) {
    if (err.columnasPresentes) {
      return res.status(err.status || 400).json({
        error: err.message,
        columnasPresentes: err.columnasPresentes,
        columnasRequeridas: err.columnasRequeridas
      });
    }
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function importar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
    const result = await excelService.importar(req.file.buffer);
    res.json(result);
  } catch (err) {
    if (err.errores) {
      return res.status(err.status || 400).json({ error: err.message, errores: err.errores });
    }
    res.status(err.status || 500).json({ error: err.message });
  }
}

function getPlantilla(req, res) {
  res.json(excelService.getPlantilla());
}

module.exports = { validar, importar, getPlantilla };
