const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET /api/movimientos - Listar con filtros
router.get('/', async (req, res) => {
  try {
    const { tipo, categoria, fecha_desde, fecha_hasta, search } = req.query;

    let query = supabase
      .from('movimientos')
      .select(`
        *,
        comprobantes (id, nombre_archivo, url_archivo, ocr_estado)
      `)
      .order('fecha', { ascending: false });

    if (tipo && tipo !== 'Todos') query = query.eq('tipo', tipo);
    if (categoria && categoria !== 'Todos') query = query.eq('categoria', categoria);
    if (fecha_desde) query = query.gte('fecha', fecha_desde);
    if (fecha_hasta) query = query.lte('fecha', fecha_hasta);
    if (search) query = query.ilike('descripcion', `%${search}%`);

    const { data, error } = await query;

    if (error) throw error;
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movimientos/metricas - Dashboard metrics
router.get('/metricas', async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const now = new Date();
    const targetMes = parseInt(mes) || now.getMonth() + 1;
    const targetAnio = parseInt(anio) || now.getFullYear();

    const firstDay = `${targetAnio}-${String(targetMes).padStart(2, '0')}-01`;
    const lastDay = new Date(targetAnio, targetMes, 0);
    const lastDayStr = `${targetAnio}-${String(targetMes).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    // Mes actual
    const { data: mesActual } = await supabase
      .from('movimientos')
      .select('tipo, monto')
      .gte('fecha', firstDay)
      .lte('fecha', lastDayStr);

    // Mes anterior
    const prevMes = targetMes === 1 ? 12 : targetMes - 1;
    const prevAnio = targetMes === 1 ? targetAnio - 1 : targetAnio;
    const prevFirst = `${prevAnio}-${String(prevMes).padStart(2, '0')}-01`;
    const prevLast = new Date(prevAnio, prevMes, 0);
    const prevLastStr = `${prevAnio}-${String(prevMes).padStart(2, '0')}-${String(prevLast.getDate()).padStart(2, '0')}`;

    const { data: mesAnterior } = await supabase
      .from('movimientos')
      .select('tipo, monto')
      .gte('fecha', prevFirst)
      .lte('fecha', prevLastStr);

    // Comprobantes pendientes OCR
    const { count: pendientesOCR } = await supabase
      .from('comprobantes')
      .select('id', { count: 'exact' })
      .eq('ocr_estado', 'pendiente');

    // Gastos por categoria del mes
    const { data: porCategoria } = await supabase
      .from('movimientos')
      .select('categoria, monto')
      .eq('tipo', 'Gasto')
      .gte('fecha', firstDay)
      .lte('fecha', lastDayStr);

    const calcTotales = (arr) => {
      if (!arr) return { ingresos: 0, gastos: 0 };
      return arr.reduce((acc, m) => {
        if (m.tipo === 'Ingreso') acc.ingresos += Number(m.monto);
        else acc.gastos += Number(m.monto);
        return acc;
      }, { ingresos: 0, gastos: 0 });
    };

    const actual = calcTotales(mesActual);
    const anterior = calcTotales(mesAnterior);

    // Agrupar por categoría
    const categoriaMap = {};
    if (porCategoria) {
      porCategoria.forEach(m => {
        categoriaMap[m.categoria] = (categoriaMap[m.categoria] || 0) + Number(m.monto);
      });
    }
    const gastosPorCategoria = Object.entries(categoriaMap).map(([cat, total]) => ({ categoria: cat, total }));

    const pctIngreso = anterior.ingresos > 0
      ? ((actual.ingresos - anterior.ingresos) / anterior.ingresos * 100).toFixed(1)
      : 0;
    const pctGasto = anterior.gastos > 0
      ? ((actual.gastos - anterior.gastos) / anterior.gastos * 100).toFixed(1)
      : 0;

    res.json({
      ingresos: actual.ingresos,
      gastos: actual.gastos,
      balance: actual.ingresos - actual.gastos,
      pendientesOCR: pendientesOCR || 0,
      pctIngreso: Number(pctIngreso),
      pctGasto: Number(pctGasto),
      gastosPorCategoria
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movimientos/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('movimientos')
      .select('*, comprobantes(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'No encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/movimientos
router.post('/', async (req, res) => {
  try {
    const { fecha, descripcion, categoria, tipo, monto, proveedor_cliente, notas } = req.body;

    if (!fecha || !descripcion || !categoria || !tipo || !monto) {
      return res.status(400).json({ error: 'Faltan campos obligatorios: fecha, descripcion, categoria, tipo, monto' });
    }
    if (!['Ingreso', 'Gasto'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo debe ser Ingreso o Gasto' });
    }
    if (Number(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const { data, error } = await supabase
      .from('movimientos')
      .insert([{ fecha, descripcion, categoria, tipo, monto: Number(monto), proveedor_cliente, notas }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/movimientos/:id
router.put('/:id', async (req, res) => {
  try {
    const { fecha, descripcion, categoria, tipo, monto, proveedor_cliente, notas } = req.body;

    const { data, error } = await supabase
      .from('movimientos')
      .update({ fecha, descripcion, categoria, tipo, monto: Number(monto), proveedor_cliente, notas })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/movimientos/:id
router.delete('/:id', async (req, res) => {
  try {
    // Primero eliminar comprobantes del storage
    const { data: comps } = await supabase
      .from('comprobantes')
      .select('storage_path')
      .eq('movimiento_id', req.params.id);

    if (comps && comps.length > 0) {
      const paths = comps.map(c => c.storage_path);
      await supabase.storage.from('comprobantes').remove(paths);
      await supabase.from('comprobantes').delete().eq('movimiento_id', req.params.id);
    }

    const { error } = await supabase
      .from('movimientos')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Movimiento eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
