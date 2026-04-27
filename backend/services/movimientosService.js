const movimientosRepository = require('../repositories/movimientosRepository');
const comprobantesRepository = require('../repositories/comprobantesRepository');

async function getAll(filters) {
  const { data, error } = await movimientosRepository.findAll(filters);
  if (error) throw error;
  return { data, total: data.length };
}

async function getById(id) {
  const { data, error } = await movimientosRepository.findById(id);
  if (error) throw error;
  if (!data) throw Object.assign(new Error('No encontrado'), { status: 404 });
  return data;
}

async function create(body) {
  const { fecha, descripcion, categoria, tipo, monto, proveedor_cliente, notas } = body;

  if (!fecha || !descripcion || !categoria || !tipo || !monto) {
    throw Object.assign(
      new Error('Faltan campos obligatorios: fecha, descripcion, categoria, tipo, monto'),
      { status: 400 }
    );
  }
  if (!['Ingreso', 'Gasto'].includes(tipo)) {
    throw Object.assign(new Error('Tipo debe ser Ingreso o Gasto'), { status: 400 });
  }
  if (Number(monto) <= 0) {
    throw Object.assign(new Error('El monto debe ser mayor a 0'), { status: 400 });
  }

  const { data, error } = await movimientosRepository.create({
    fecha, descripcion, categoria, tipo, monto: Number(monto), proveedor_cliente, notas
  });
  if (error) throw error;
  return data;
}

async function update(id, body) {
  const { fecha, descripcion, categoria, tipo, monto, proveedor_cliente, notas } = body;
  const { data, error } = await movimientosRepository.update(id, {
    fecha, descripcion, categoria, tipo, monto: Number(monto), proveedor_cliente, notas
  });
  if (error) throw error;
  return data;
}

async function remove(id) {
  const { data: comps } = await comprobantesRepository.findByMovimientoId(id);
  if (comps && comps.length > 0) {
    const paths = comps.map(c => c.storage_path);
    await comprobantesRepository.removeFromStorage(paths);
    await comprobantesRepository.removeByMovimientoId(id);
  }
  const { error } = await movimientosRepository.remove(id);
  if (error) throw error;
}

async function getMetricas({ mes, anio } = {}) {
  const now = new Date();
  const targetMes = parseInt(mes) || now.getMonth() + 1;
  const targetAnio = parseInt(anio) || now.getFullYear();

  const firstDay = `${targetAnio}-${String(targetMes).padStart(2, '0')}-01`;
  const lastDay = new Date(targetAnio, targetMes, 0);
  const lastDayStr = `${targetAnio}-${String(targetMes).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

  const prevMes = targetMes === 1 ? 12 : targetMes - 1;
  const prevAnio = targetMes === 1 ? targetAnio - 1 : targetAnio;
  const prevFirst = `${prevAnio}-${String(prevMes).padStart(2, '0')}-01`;
  const prevLast = new Date(prevAnio, prevMes, 0);
  const prevLastStr = `${prevAnio}-${String(prevMes).padStart(2, '0')}-${String(prevLast.getDate()).padStart(2, '0')}`;

  const [
    { data: mesActual },
    { data: mesAnterior },
    { count: pendientesOCR },
    { data: porCategoria }
  ] = await Promise.all([
    movimientosRepository.getByDateRange(firstDay, lastDayStr),
    movimientosRepository.getByDateRange(prevFirst, prevLastStr),
    movimientosRepository.getPendientesOCRCount(),
    movimientosRepository.getGastosByCategoriaInRange(firstDay, lastDayStr)
  ]);

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

  return {
    ingresos: actual.ingresos,
    gastos: actual.gastos,
    balance: actual.ingresos - actual.gastos,
    pendientesOCR: pendientesOCR || 0,
    pctIngreso: Number(pctIngreso),
    pctGasto: Number(pctGasto),
    gastosPorCategoria
  };
}

module.exports = { getAll, getById, create, update, remove, getMetricas };
