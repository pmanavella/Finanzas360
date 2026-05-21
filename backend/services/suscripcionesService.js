const supabase = require('../config/supabaseClient');

const FRECUENCIAS = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];
const MONEDAS    = ['ARS', 'USD'];
const ESTADOS    = ['Activa', 'Pausada', 'Cancelada'];

const MESES_POR_FRECUENCIA = { Mensual: 1, Trimestral: 3, Semestral: 6, Anual: 12 };

function calcularProximoVencimiento(diaVencimiento, frecuencia, ultimoPago) {
  const dia = parseInt(diaVencimiento);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let base;

  if (ultimoPago) {
    // Desde el último pago, sumar el período correspondiente
    base = new Date(ultimoPago + 'T00:00:00');
    const meses = MESES_POR_FRECUENCIA[frecuencia] || 1;
    base.setMonth(base.getMonth() + meses);
  } else {
    // Sin pago previo: buscar la próxima fecha con ese día en el calendario
    const maxDiaMesActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const diaAjustado = Math.min(dia, maxDiaMesActual);
    base = new Date(hoy.getFullYear(), hoy.getMonth(), diaAjustado);

    if (base <= hoy) {
      // Ya pasó este mes → avanzar al próximo período
      const meses = MESES_POR_FRECUENCIA[frecuencia] || 1;
      base.setMonth(base.getMonth() + meses);
    }
  }

  // Ajustar el día al máximo del mes destino (ej: día 31 en febrero)
  const maxDia = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(dia, maxDia));

  return base.toISOString().split('T')[0];
}

function validarCampos({ nombre, monto, moneda, dia_vencimiento, frecuencia, estado }) {
  if (!nombre?.trim())
    throw Object.assign(new Error('El nombre es obligatorio'), { status: 400 });
  const montoNum = Number(monto);
  if (!monto || isNaN(montoNum) || montoNum <= 0)
    throw Object.assign(new Error('El monto debe ser un número mayor a 0'), { status: 400 });
  if (!MONEDAS.includes(moneda))
    throw Object.assign(new Error('La moneda debe ser ARS o USD'), { status: 400 });
  const diaNum = parseInt(dia_vencimiento);
  if (!dia_vencimiento || isNaN(diaNum) || diaNum < 1 || diaNum > 31)
    throw Object.assign(new Error('El día de vencimiento debe ser entre 1 y 31'), { status: 400 });
  if (!FRECUENCIAS.includes(frecuencia))
    throw Object.assign(new Error('Frecuencia inválida'), { status: 400 });
  if (estado && !ESTADOS.includes(estado))
    throw Object.assign(new Error('Estado inválido'), { status: 400 });
}

class SuscripcionesService {
  async listar({ estado, search } = {}) {
    let query = supabase
      .from('suscripciones')
      .select('*')
      .order('nombre', { ascending: true });

    if (estado && estado !== 'Todas') query = query.eq('estado', estado);
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,detalle.ilike.%${search}%,proveedor.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], total: (data || []).length };
  }

  async proximasAVencer() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7 = new Date(hoy);
    en7.setDate(en7.getDate() + 7);

    const hoyStr  = hoy.toISOString().split('T')[0];
    const en7Str  = en7.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('estado', 'Activa')
      .gte('proximo_vencimiento', hoyStr)
      .lte('proximo_vencimiento', en7Str)
      .order('proximo_vencimiento', { ascending: true });

    if (error) throw error;
    return { data: data || [] };
  }

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) throw Object.assign(new Error('Suscripción no encontrada'), { status: 404 });
    return data;
  }

  async crear(body, createdBy) {
    const { nombre, detalle, proveedor, monto, moneda, dia_vencimiento, frecuencia, estado } = body;

    validarCampos({ nombre, monto, moneda, dia_vencimiento, frecuencia, estado });

    const diaNum   = parseInt(dia_vencimiento);
    const montoNum = Number(monto);
    const estadoVal = estado || 'Activa';
    const proximo_vencimiento = calcularProximoVencimiento(diaNum, frecuencia, null);

    const { data, error } = await supabase
      .from('suscripciones')
      .insert([{
        nombre: nombre.trim(),
        detalle: detalle?.trim() || null,
        proveedor: proveedor?.trim() || null,
        monto: montoNum,
        moneda,
        dia_vencimiento: diaNum,
        frecuencia,
        estado: estadoVal,
        proximo_vencimiento,
        created_by: createdBy || null,
      }])
      .select()
      .single();
    if (error) throw error;
    console.log(`[SUSC] Suscripción creada — nombre: ${nombre}, por: ${createdBy}`);
    return data;
  }

  async actualizar(id, body) {
    const { nombre, detalle, proveedor, monto, moneda, dia_vencimiento, frecuencia, estado } = body;

    validarCampos({ nombre, monto, moneda, dia_vencimiento, frecuencia, estado });

    const { data: existing } = await supabase.from('suscripciones').select('ultimo_pago').eq('id', id).single();

    const diaNum   = parseInt(dia_vencimiento);
    const montoNum = Number(monto);
    const proximo_vencimiento = calcularProximoVencimiento(diaNum, frecuencia, existing?.ultimo_pago || null);

    const { data, error } = await supabase
      .from('suscripciones')
      .update({
        nombre: nombre.trim(),
        detalle: detalle?.trim() || null,
        proveedor: proveedor?.trim() || null,
        monto: montoNum,
        moneda,
        dia_vencimiento: diaNum,
        frecuencia,
        estado,
        proximo_vencimiento,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    console.log(`[SUSC] Suscripción actualizada — id: ${id}`);
    return data;
  }

  async eliminar(id) {
    const { error } = await supabase.from('suscripciones').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Suscripción eliminada correctamente' };
  }

  async marcarPago(id, fechaPago) {
    const { data: existing, error: findErr } = await supabase
      .from('suscripciones')
      .select('*')
      .eq('id', id)
      .single();

    if (findErr || !existing)
      throw Object.assign(new Error('Suscripción no encontrada'), { status: 404 });
    if (existing.estado !== 'Activa')
      throw Object.assign(new Error('Solo se pueden registrar pagos en suscripciones activas'), { status: 400 });

    const proximo_vencimiento = calcularProximoVencimiento(
      existing.dia_vencimiento,
      existing.frecuencia,
      fechaPago
    );

    const { data, error } = await supabase
      .from('suscripciones')
      .update({ ultimo_pago: fechaPago, proximo_vencimiento, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    console.log(`[SUSC] Pago registrado — id: ${id}, fecha: ${fechaPago}, próximo: ${proximo_vencimiento}`);
    return data;
  }
}

module.exports = new SuscripcionesService();
