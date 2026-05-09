const movimientosService = require('../services/movimientosService');

async function getAll(req, res) {
  try {
    const result = await movimientosService.getAll(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getMetricas(req, res) {
  try {
    const result = await movimientosService.getMetricas(req.query);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getById(req, res) {
  try {
    const data = await movimientosService.getById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const data = await movimientosService.create(req.body, req.user?.email);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const data = await movimientosService.update(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    await movimientosService.remove(req.params.id);
    res.json({ message: 'Movimiento eliminado correctamente' });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getTrazabilidad(req, res) {
  try {
    const result = await movimientosService.getTrazabilidad();
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { getAll, getMetricas, getById, create, update, remove, getTrazabilidad };
