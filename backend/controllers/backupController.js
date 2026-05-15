const backupService = require('../services/backupService');

async function exportar(req, res) {
  try {
    const data = await backupService.exportar();
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `backup_finanzas360_${fecha}.json`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function restaurar(req, res) {
  try {
    const backup = req.body;

    if (!backup || typeof backup !== 'object') {
      return res.status(400).json({ error: 'El cuerpo de la solicitud debe ser un JSON válido' });
    }

    const resumen = await backupService.restaurar(backup);
    res.json({ message: 'Restauración completada', resumen });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { exportar, restaurar };
