const supabase = require('../config/supabaseClient');

class SalariosService {
  async listarEmpleados({ estado, search } = {}) {
    let query = supabase
      .from('empleados')
      .select('*')
      .order('apellido', { ascending: true });

    if (estado && estado !== 'Todos') query = query.eq('estado', estado);
    if (search) query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return { data, total: data.length };
  }

  async obtenerEmpleadoPorId(id) {
    const { data, error } = await supabase
      .from('empleados').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) throw Object.assign(new Error('Empleado no encontrado'), { status: 404 });
    return data;
  }

  async crearEmpleado(body) {
    const { nombre, apellido, email, telefono, tipo_permanencia, fecha_ingreso, estado, tipo_salario, monto_base } = body;
    if (!nombre || !apellido || !tipo_permanencia)
      throw Object.assign(new Error('Faltan campos obligatorios: nombre, apellido, tipo_permanencia'), { status: 400 });

    const tipoSalarioValido = ['mensual', 'hora', 'turno'];
    const tipoSalarioFinal = tipoSalarioValido.includes(tipo_salario) ? tipo_salario : 'mensual';
    const modalidadDerived = { mensual: 'Mensual', hora: 'Por Horas', turno: 'Por Turno' }[tipoSalarioFinal];

    const { data, error } = await supabase
      .from('empleados')
      .insert([{
        nombre, apellido, email, telefono,
        tipo_permanencia,
        modalidad_trabajo: modalidadDerived,
        fecha_ingreso,
        estado: estado || 'Activo',
        tipo_salario: tipoSalarioFinal,
        monto_base: monto_base ? Number(monto_base) : 0,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async actualizarEmpleado(id, body) {
    const { nombre, apellido, email, telefono, tipo_permanencia, fecha_ingreso, estado, tipo_salario, monto_base } = body;
    const tipoSalarioValido = ['mensual', 'hora', 'turno'];
    const tipoSalarioFinal = tipoSalarioValido.includes(tipo_salario) ? tipo_salario : 'mensual';
    const updates = {
      nombre, apellido, email, telefono,
      tipo_permanencia, fecha_ingreso, estado,
      modalidad_trabajo: { mensual: 'Mensual', hora: 'Por Horas', turno: 'Por Turno' }[tipoSalarioFinal],
      tipo_salario: tipoSalarioFinal,
    };
    if (monto_base !== undefined) updates.monto_base = Number(monto_base) || 0;

    const { data, error } = await supabase
      .from('empleados').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async eliminarEmpleado(id) {
    const { error } = await supabase.from('empleados').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Empleado eliminado correctamente' };
  }

  async listarCategorias() {
    const { data, error } = await supabase
      .from('categorias_salariales').select('*').order('nombre', { ascending: true });
    if (error) throw error;
    return { data, total: data.length };
  }

  async crearCategoria(body) {
    const { nombre, descripcion } = body;
    if (!nombre)
      throw Object.assign(new Error('El campo nombre es obligatorio'), { status: 400 });
    const { data, error } = await supabase
      .from('categorias_salariales').insert([{ nombre, descripcion }]).select().single();
    if (error) throw error;
    return data;
  }

  async eliminarCategoria(id) {
    const { error } = await supabase.from('categorias_salariales').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Categoría eliminada correctamente' };
  }

  async listarMovimientos({ empleado_id, categoria_id, fecha_desde, fecha_hasta } = {}) {
    let query = supabase
      .from('movimientos_salario')
      .select(`*, empleados (id, nombre, apellido), categorias_salariales (id, nombre)`)
      .order('fecha', { ascending: false });

    if (empleado_id) query = query.eq('empleado_id', empleado_id);
    if (categoria_id) query = query.eq('categoria_id', categoria_id);
    if (fecha_desde) query = query.gte('fecha', fecha_desde);
    if (fecha_hasta) query = query.lte('fecha', fecha_hasta);

    const { data, error } = await query;
    if (error) throw error;
    return { data, total: data.length };
  }

  async crearMovimiento(body) {
    const { empleado_id, categoria_id, monto, fecha, descripcion, cantidad } = body;
    if (!empleado_id || !categoria_id || !fecha)
      throw Object.assign(new Error('Faltan campos obligatorios: empleado_id, categoria_id, fecha'), { status: 400 });

    let montoFinal = Number(monto) || 0;

    if (cantidad !== undefined) {
      const empleado = await this.obtenerEmpleadoPorId(empleado_id);
      const base = Number(empleado.monto_base) || 0;
      const cant = Number(cantidad);
      montoFinal = empleado.tipo_salario === 'mensual' ? base : base * cant;
    }

    if (!montoFinal || montoFinal === 0)
      throw Object.assign(new Error('El monto no puede ser cero'), { status: 400 });

    const { data, error } = await supabase
      .from('movimientos_salario')
      .insert([{ empleado_id, categoria_id, monto: montoFinal, fecha, descripcion }])
      .select(`*, empleados (id, nombre, apellido), categorias_salariales (id, nombre)`)
      .single();
    if (error) throw error;
    return data;
  }

  async actualizarMovimiento(id, body) {
    const { empleado_id, categoria_id, monto, fecha, descripcion, cantidad } = body;
    if (!empleado_id || !categoria_id || !fecha)
      throw Object.assign(new Error('Faltan campos obligatorios: empleado_id, categoria_id, fecha'), { status: 400 });

    let montoFinal = Number(monto) || 0;

    if (cantidad !== undefined) {
      const empleado = await this.obtenerEmpleadoPorId(empleado_id);
      const base = Number(empleado.monto_base) || 0;
      const cant = Number(cantidad);
      montoFinal = empleado.tipo_salario === 'mensual' ? base : base * cant;
    }

    if (!montoFinal || montoFinal === 0)
      throw Object.assign(new Error('El monto no puede ser cero'), { status: 400 });

    const { data, error } = await supabase
      .from('movimientos_salario')
      .update({ empleado_id, categoria_id, monto: montoFinal, fecha, descripcion })
      .eq('id', id)
      .select(`*, empleados (id, nombre, apellido), categorias_salariales (id, nombre)`)
      .single();
    if (error) throw error;
    return data;
  }

  async eliminarMovimiento(id) {
    const { error } = await supabase.from('movimientos_salario').delete().eq('id', id);
    if (error) throw error;
    return { message: 'Movimiento eliminado correctamente' };
  }

  async getMetricas() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0);
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

    const [{ count: totalEmpleados }, { data: movMes }] = await Promise.all([
      supabase.from('empleados').select('id', { count: 'exact', head: true }).eq('estado', 'Activo'),
      supabase.from('movimientos_salario').select('monto').gte('fecha', firstDay).lte('fecha', lastDayStr),
    ]);

    const totalNomina = movMes ? movMes.reduce((sum, m) => sum + Number(m.monto), 0) : 0;
    return { totalEmpleados: totalEmpleados || 0, totalNomina };
  }
}

module.exports = new SalariosService();
