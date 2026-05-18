import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../lib/api'
import { obtenerCotizacionDetalle } from '../lib/dolarService'
import { canWrite } from '../lib/permissions'
import {
  Users, DollarSign, Tag, Plus, Trash2, X, ChevronDown,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtUSD = (n) =>
  `USD ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const TIPO_PERMANENCIA = ['Planta', 'Temporal']
const ESTADO_EMP       = ['Activo', 'Inactivo']
const TIPO_SALARIO     = ['mensual', 'hora', 'turno']

const TIPO_SALARIO_LABEL = { mensual: 'Mensual', hora: 'Por hora', turno: 'Por turno' }
const MONTO_BASE_LABEL   = { mensual: 'Monto mensual', hora: 'Monto por hora', turno: 'Monto por turno' }

const BADGE = {
  'Planta':    { bg: '#DBEAFE', color: '#1E40AF' },
  'Temporal':  { bg: '#FEF3C7', color: '#92400E' },
  'Mensual':   { bg: '#EFF6FF', color: '#1D4ED8' },
  'Por Turno': { bg: '#F3E8FF', color: '#6B21A8' },
  'Por Horas': { bg: '#FEE2E2', color: '#991B1B' },
  'Activo':    { bg: '#E1F5EE', color: '#0F6E56' },
  'Inactivo':  { bg: '#F3F4F6', color: '#6B7280' },
}

function Badge({ label }) {
  const s = BADGE[label] || { bg: '#F3F4F6', color: '#374151' }
  return (
    <span
      className="inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}
    >
      {label}
    </span>
  )
}

// ── Bloque de cotización del dólar ────────────────────────────────────────────

function CotizacionBlock({ cotizacion, loading, cotizacionTipo, onSelect }) {
  if (loading) {
    return (
      <div
        className="rounded-xl p-3 text-[12.5px] text-gray-400 text-center"
        style={{ border: '1px solid rgba(15,110,86,0.2)', background: '#f0fdf9' }}
      >
        Obteniendo cotización del día…
      </div>
    )
  }
  if (!cotizacion) {
    return (
      <div
        className="rounded-xl p-3 text-[12.5px] text-red-600"
        style={{ border: '1px solid #fca5a5', background: '#fff5f5' }}
      >
        No se pudo obtener la cotización. Verifique su conexión e intente nuevamente.
      </div>
    )
  }
  return (
    <div className="rounded-xl p-3" style={{ border: '1px solid rgba(15,110,86,0.2)', background: '#f0fdf9' }}>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10.5px] font-bold text-gray-500 uppercase tracking-widest">
          Cotización del día
        </span>
        <span className="text-[11px] text-gray-400">
          {cotizacion.fecha} · {cotizacion.fuente}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSelect('compra', cotizacion.valor_compra)}
          className="rounded-xl p-2.5 text-left transition-all"
          style={
            cotizacionTipo === 'compra'
              ? { background: 'white', border: '2px solid #0F6E56' }
              : { background: 'rgba(255,255,255,0.6)', border: '2px solid transparent' }
          }
        >
          <div className="text-[11px] text-gray-500 mb-0.5">Dólar compra</div>
          <div className="text-[16px] font-bold text-gray-900">
            $ {cotizacion.valor_compra.toLocaleString('es-AR')}
          </div>
        </button>
        <button
          type="button"
          onClick={() => onSelect('venta', cotizacion.valor_venta)}
          className="rounded-xl p-2.5 text-left transition-all"
          style={
            cotizacionTipo === 'venta'
              ? { background: '#0F6E56', border: '2px solid #0F6E56' }
              : { background: 'rgba(255,255,255,0.6)', border: '2px solid transparent' }
          }
        >
          <div className={`text-[11px] mb-0.5 ${cotizacionTipo === 'venta' ? 'text-teal-100' : 'text-gray-500'}`}>
            Dólar venta
          </div>
          <div className={`text-[16px] font-bold ${cotizacionTipo === 'venta' ? 'text-white' : 'text-gray-900'}`}>
            $ {cotizacion.valor_venta.toLocaleString('es-AR')}
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none bg-white transition-colors focus:ring-2 focus:ring-teal-700/10'
const inputStyle = { borderColor: 'rgba(15,110,86,0.25)' }

function Label({ children }) {
  return <label className="text-[11.5px] font-medium text-gray-500 mb-1.5 block">{children}</label>
}

// ── Modal base (con createPortal → se renderiza en document.body) ─────────────

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card fade-in"
        style={{ maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-accent" />
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Form field wrappers ───────────────────────────────────────────────────────

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <select value={value} onChange={e => onChange(e.target.value)}
          className={inputCls + ' appearance-none pr-8'} style={inputStyle}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

// ── TAB: Empleados ────────────────────────────────────────────────────────────

const EMP_VACIO = {
  nombre: '', apellido: '', email: '', telefono: '',
  tipo_permanencia: 'Planta', modalidad_trabajo: 'Mensual',
  fecha_ingreso: '', estado: 'Activo',
  tipo_salario: 'mensual', monto_base: '',
  moneda: 'ARS',
  cotizacion_tipo: '', cotizacion_valor: '', cotizacion_fecha: '', cotizacion_fuente: '',
}

function TabEmpleados() {
  const puedeEscribir = canWrite()
  const [empleados, setEmpleados]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null)
  const [form, setForm]                 = useState(EMP_VACIO)
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState(null)
  const [cotizacion, setCotizacion]     = useState(null)
  const [loadingCot, setLoadingCot]     = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.getEmpleados()
      setEmpleados(data)
    } catch { /* leave empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Fetch cotizacion cuando el modal está abierto y moneda = USD
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!modal || form.moneda !== 'USD') return
    if (cotizacion || loadingCot) return
    setLoadingCot(true)
    obtenerCotizacionDetalle()
      .then(data => setCotizacion(data))
      .catch(() => setCotizacion(null))
      .finally(() => setLoadingCot(false))
  }, [form.moneda, modal])

  const abrirNuevo = () => {
    setForm(EMP_VACIO)
    setError(null)
    setCotizacion(null)
    setModal('nuevo')
  }

  const abrirEditar = (emp) => {
    setForm({ ...EMP_VACIO, ...emp })
    setError(null)
    setCotizacion(null)
    setModal(emp)
  }

  const handleMonedaChange = (val) => {
    setForm(f => ({
      ...f,
      moneda: val,
      cotizacion_tipo: '',
      cotizacion_valor: '',
      cotizacion_fecha: '',
      cotizacion_fuente: '',
    }))
    setCotizacion(null)
  }

  const handleSelectCotizacion = (tipo, valor) => {
    setForm(f => ({
      ...f,
      cotizacion_tipo:   tipo,
      cotizacion_valor:  String(valor),
      cotizacion_fecha:  cotizacion?.fecha  || '',
      cotizacion_fuente: cotizacion?.fuente || '',
    }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (form.moneda === 'USD' && !form.cotizacion_tipo) {
      setError('Debe seleccionar el tipo de cotización (compra o venta) para empleados en USD')
      return
    }
    setSaving(true); setError(null)
    try {
      if (modal === 'nuevo') {
        await api.crearEmpleado(form)
      } else {
        await api.editarEmpleado(modal.id, form)
      }
      setModal(null)
      cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este empleado?')) return
    try {
      await api.eliminarEmpleado(id)
      cargar()
    } catch (err) {
      alert(err.message)
    }
  }

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

  const formatMonto = (emp) => {
    if (!emp.monto_base) return '—'
    return emp.moneda === 'USD' ? fmtUSD(emp.monto_base) : fmt(emp.monto_base)
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-gray-500">{empleados.length} empleados registrados</p>
        {puedeEscribir && (
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-medium shadow-sm"
            style={{ background: '#0F6E56' }}
          >
            <Plus size={14} /> Nuevo empleado
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b bg-gray-50/60" style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
                {['Nombre', 'Email', 'Tipo', 'Salario', 'Monto base', 'Ingreso', 'Estado', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-[13px]">Cargando…</td></tr>
              ) : empleados.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-gray-400 text-[13px]">Sin empleados registrados</td></tr>
              ) : empleados.map(emp => (
                <tr key={emp.id} className="border-b hover:bg-gray-50/50 transition-colors group" style={{ borderColor: 'rgba(15,110,86,0.06)' }}>
                  <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">{emp.nombre} {emp.apellido}</td>
                  <td className="py-3 px-4 text-gray-500">{emp.email || '—'}</td>
                  <td className="py-3 px-4"><Badge label={emp.tipo_permanencia} /></td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{TIPO_SALARIO_LABEL[emp.tipo_salario] || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    {formatMonto(emp)}
                    {emp.moneda === 'USD' && emp.cotizacion_tipo && (
                      <span className="ml-1.5 text-[10.5px] text-teal-600">({emp.cotizacion_tipo})</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{emp.fecha_ingreso || '—'}</td>
                  <td className="py-3 px-4"><Badge label={emp.estado} /></td>
                  <td className="py-3 px-4">
                    {puedeEscribir && (
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => abrirEditar(emp)}
                          className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminar(emp.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={modal === 'nuevo' ? 'Nuevo empleado' : 'Editar empleado'} onClose={() => setModal(null)}>
          <form onSubmit={guardar} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre *</Label>
                <input value={form.nombre} onChange={e => set('nombre')(e.target.value)}
                  required className={inputCls} style={inputStyle} />
              </div>
              <div>
                <Label>Apellido *</Label>
                <input value={form.apellido} onChange={e => set('apellido')(e.target.value)}
                  required className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <input type="email" value={form.email || ''} onChange={e => set('email')(e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <input value={form.telefono || ''} onChange={e => set('telefono')(e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <SelectField label="Tipo permanencia *" value={form.tipo_permanencia} onChange={set('tipo_permanencia')} options={TIPO_PERMANENCIA} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de salario *</Label>
                <div className="relative">
                  <select value={form.tipo_salario} onChange={e => set('tipo_salario')(e.target.value)}
                    className={inputCls + ' appearance-none pr-8'} style={inputStyle}>
                    {TIPO_SALARIO.map(o => (
                      <option key={o} value={o}>{TIPO_SALARIO_LABEL[o]}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <Label>Moneda *</Label>
                <div className="relative">
                  <select value={form.moneda} onChange={e => handleMonedaChange(e.target.value)}
                    className={inputCls + ' appearance-none pr-8'} style={inputStyle}>
                    <option value="ARS">ARS — Peso Argentino</option>
                    <option value="USD">USD — Dólar</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <Label>
                {MONTO_BASE_LABEL[form.tipo_salario] || 'Monto base'}
                {' '}{form.moneda === 'USD' ? '(USD)' : '(ARS)'} *
              </Label>
              <input
                type="number" step="0.01" min="0"
                value={form.monto_base || ''}
                onChange={e => set('monto_base')(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="0.00"
              />
            </div>
            {form.moneda === 'USD' && (
              <CotizacionBlock
                cotizacion={cotizacion}
                loading={loadingCot}
                cotizacionTipo={form.cotizacion_tipo}
                onSelect={handleSelectCotizacion}
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha ingreso</Label>
                <input type="date" value={form.fecha_ingreso || ''} onChange={e => set('fecha_ingreso')(e.target.value)}
                  className={inputCls} style={inputStyle} />
              </div>
              <SelectField label="Estado" value={form.estado} onChange={set('estado')} options={ESTADO_EMP} />
            </div>
            {error && <p className="text-[12.5px] text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 hover:bg-gray-50"
                style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold shadow-sm disabled:opacity-60"
                style={{ background: '#0F6E56' }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── TAB: Movimientos salariales ───────────────────────────────────────────────

const MOV_VACIO = {
  empleado_id: '', categoria_id: '', monto: '', fecha: '', descripcion: '', cantidad: '',
  moneda_origen: 'ARS', monto_origen: '', cotizacion_usada: '',
  cotizacion_tipo: '', cotizacion_fecha: '', cotizacion_fuente: '', monto_ars: '',
}

function TabMovimientos() {
  const puedeEscribir = canWrite()
  const [movs, setMovs]                     = useState([])
  const [empleados, setEmpleados]           = useState([])
  const [categorias, setCategorias]         = useState([])
  const [loading, setLoading]               = useState(true)
  const [modal, setModal]                   = useState(false)
  const [form, setForm]                     = useState(MOV_VACIO)
  const [empInfo, setEmpInfo]               = useState(null)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState(null)
  const [movCotizacion, setMovCotizacion]   = useState(null)
  const [movLoadingCot, setMovLoadingCot]   = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [r1, r2, r3] = await Promise.allSettled([
        api.getMovimientosSalario(),
        api.getEmpleados(),
        api.getCategoriasSalario(),
      ])
      if (r1.status === 'fulfilled') setMovs(r1.value.data)
      if (r2.status === 'fulfilled') setEmpleados(r2.value.data)
      if (r3.status === 'fulfilled') setCategorias(r3.value.data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const cargarInfoEmpleado = (empleado_id, lista) => {
    const emp = lista.find(e => String(e.id) === String(empleado_id))
    if (emp && emp.tipo_salario) {
      const isUSD     = emp.moneda === 'USD'
      const cotizVal  = isUSD && emp.cotizacion_valor ? Number(emp.cotizacion_valor) : null
      const montoBase = Number(emp.monto_base) || 0
      const montoARS  = isUSD && cotizVal ? montoBase * cotizVal : montoBase

      setEmpInfo({
        tipo_salario:      emp.tipo_salario,
        monto_base:        montoBase,
        moneda:            emp.moneda || 'ARS',
        cotizacion_valor:  cotizVal,
        cotizacion_tipo:   emp.cotizacion_tipo  || null,
        cotizacion_fecha:  emp.cotizacion_fecha || null,
        cotizacion_fuente: emp.cotizacion_fuente || null,
      })

      const shouldAutoFill = emp.tipo_salario === 'mensual'
      setForm(f => ({
        ...f,
        empleado_id,
        monto:             shouldAutoFill ? String(Math.round(montoARS)) : '',
        cantidad:          '',
        moneda_origen:     emp.moneda || 'ARS',
        monto_origen:      isUSD ? String(montoBase) : '',
        cotizacion_usada:  cotizVal ? String(cotizVal) : '',
        cotizacion_tipo:   emp.cotizacion_tipo  || '',
        cotizacion_fecha:  emp.cotizacion_fecha || '',
        cotizacion_fuente: emp.cotizacion_fuente || '',
        monto_ars:         shouldAutoFill ? String(Math.round(montoARS)) : '',
      }))

      // Si es USD sin cotización guardada, buscar cotización actual
      if (isUSD && !cotizVal && !movLoadingCot) {
        setMovLoadingCot(true)
        obtenerCotizacionDetalle()
          .then(setMovCotizacion)
          .catch(() => setMovCotizacion(null))
          .finally(() => setMovLoadingCot(false))
      }
    } else {
      setEmpInfo(null)
      setForm(f => ({
        ...f, empleado_id, monto: '', cantidad: '',
        moneda_origen: 'ARS', monto_origen: '', cotizacion_usada: '',
        cotizacion_tipo: '', cotizacion_fecha: '', cotizacion_fuente: '', monto_ars: '',
      }))
    }
  }

  const onSelectMovCotizacion = (tipo, valor) => {
    if (!empInfo) return
    const montoARS = empInfo.tipo_salario === 'mensual'
      ? Math.round(empInfo.monto_base * valor)
      : 0
    setForm(f => ({
      ...f,
      cotizacion_tipo:   tipo,
      cotizacion_usada:  String(valor),
      cotizacion_fecha:  movCotizacion?.fecha  || '',
      cotizacion_fuente: movCotizacion?.fuente || '',
      monto:    empInfo.tipo_salario === 'mensual' ? String(montoARS) : f.monto,
      monto_ars: empInfo.tipo_salario === 'mensual' ? String(montoARS) : f.monto_ars,
    }))
  }

  const onCantidadChange = (val) => {
    setForm(f => {
      if (!empInfo) return { ...f, cantidad: val }
      const cant = Number(val)
      if (empInfo.moneda === 'USD') {
        const montoUSD = empInfo.monto_base * cant
        const cotizVal = Number(f.cotizacion_usada) || empInfo.cotizacion_valor || 0
        const montoARS = cotizVal ? Math.round(montoUSD * cotizVal) : 0
        return { ...f, cantidad: val, monto_origen: String(montoUSD), monto: String(montoARS), monto_ars: String(montoARS) }
      }
      return { ...f, cantidad: val, monto: String(empInfo.monto_base * cant) }
    })
  }

  const abrirNuevo = () => {
    const hoy = new Date().toISOString().split('T')[0]
    const primerEmp = empleados[0]
    setForm({ ...MOV_VACIO, fecha: hoy, categoria_id: categorias[0]?.id || '' })
    setEmpInfo(null)
    setMovCotizacion(null)
    setMovLoadingCot(false)
    setError(null)
    setModal('nuevo')
    if (primerEmp) cargarInfoEmpleado(primerEmp.id, empleados)
  }

  const abrirEditar = (mov) => {
    setForm({
      empleado_id:       mov.empleado_id,
      categoria_id:      mov.categoria_id,
      monto:             String(mov.monto),
      fecha:             mov.fecha,
      descripcion:       mov.descripcion || '',
      cantidad:          '',
      moneda_origen:     mov.moneda_origen     || 'ARS',
      monto_origen:      mov.monto_origen      ? String(mov.monto_origen) : '',
      cotizacion_usada:  mov.cotizacion_usada  ? String(mov.cotizacion_usada) : '',
      cotizacion_tipo:   mov.cotizacion_tipo   || '',
      cotizacion_fecha:  mov.cotizacion_fecha  || '',
      cotizacion_fuente: mov.cotizacion_fuente || '',
      monto_ars:         mov.monto_ars         ? String(mov.monto_ars) : '',
    })
    const emp = empleados.find(e => String(e.id) === String(mov.empleado_id))
    setEmpInfo(emp?.tipo_salario ? {
      tipo_salario:      emp.tipo_salario,
      monto_base:        Number(emp.monto_base) || 0,
      moneda:            emp.moneda || 'ARS',
      cotizacion_valor:  emp.cotizacion_valor  ? Number(emp.cotizacion_valor) : null,
      cotizacion_tipo:   emp.cotizacion_tipo   || null,
      cotizacion_fecha:  emp.cotizacion_fecha  || null,
      cotizacion_fuente: emp.cotizacion_fuente || null,
    } : null)
    setMovCotizacion(null)
    setError(null)
    setModal(mov)
  }

  const cerrarModal = () => {
    setModal(false)
    setMovCotizacion(null)
    setMovLoadingCot(false)
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (empInfo?.moneda === 'USD' && !form.cotizacion_usada) {
      setError('Debe seleccionar una cotización (compra o venta) para registrar este movimiento')
      return
    }
    setSaving(true); setError(null)
    try {
      const esUSD = empInfo?.moneda === 'USD'
      const payload = {
        empleado_id:  form.empleado_id,
        categoria_id: form.categoria_id,
        fecha:        form.fecha,
        descripcion:  form.descripcion,
      }

      if (modal === 'nuevo' && empInfo && empInfo.tipo_salario !== 'mensual' && form.cantidad && !esUSD) {
        payload.cantidad = Number(form.cantidad)
      } else {
        payload.monto = Number(form.monto)
      }

      if (esUSD) {
        payload.moneda_origen    = 'USD'
        payload.monto_origen     = Number(form.monto_origen)
        payload.cotizacion_usada = Number(form.cotizacion_usada)
        payload.cotizacion_tipo  = form.cotizacion_tipo
        payload.cotizacion_fecha = form.cotizacion_fecha
        payload.cotizacion_fuente = form.cotizacion_fuente
        payload.monto_ars        = Number(form.monto)
      }

      if (modal === 'nuevo') {
        await api.crearMovimientoSalario(payload)
      } else {
        await api.editarMovimientoSalario(modal.id, payload)
      }
      cerrarModal()
      cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este movimiento?')) return
    try { await api.eliminarMovimientoSalario(id); cargar() }
    catch (err) { alert(err.message) }
  }

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))
  const esEdicion = modal && modal !== 'nuevo'
  const isUSDMov  = (m) => m.moneda_origen === 'USD' && m.monto_origen && m.cotizacion_usada

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-gray-500">{movs.length} movimientos registrados</p>
        {puedeEscribir && (
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-medium shadow-sm"
            style={{ background: '#0F6E56' }}
          >
            <Plus size={14} /> Registrar movimiento
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b bg-gray-50/60" style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
                {['Empleado', 'Categoría', 'Monto (ARS)', 'Fecha', 'Descripción', ''].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-[13px]">Cargando…</td></tr>
              ) : movs.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-[13px]">Sin movimientos registrados</td></tr>
              ) : movs.map(m => (
                <tr key={m.id} className="border-b hover:bg-gray-50/50 transition-colors group" style={{ borderColor: 'rgba(15,110,86,0.06)' }}>
                  <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                    {m.empleados ? `${m.empleados.nombre} ${m.empleados.apellido}` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Badge label={m.categorias_salariales?.nombre || '—'} />
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{fmt(m.monto)}</div>
                    {isUSDMov(m) && (
                      <div className="text-[11px] text-gray-400">
                        USD {Number(m.monto_origen).toLocaleString('es-AR', { minimumFractionDigits: 2 })} × ${Number(m.cotizacion_usada).toLocaleString('es-AR')}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{m.fecha}</td>
                  <td className="py-3 px-4 text-gray-500 max-w-[200px] truncate">{m.descripcion || '—'}</td>
                  <td className="py-3 px-4">
                    {puedeEscribir && (
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => abrirEditar(m)}
                          className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminar(m.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title={esEdicion ? 'Editar movimiento salarial' : 'Registrar movimiento salarial'} onClose={cerrarModal}>
          <form onSubmit={guardar} className="space-y-3">
            <div>
              <Label>Empleado *</Label>
              <div className="relative">
                <select
                  value={form.empleado_id}
                  onChange={e => cargarInfoEmpleado(e.target.value, empleados)}
                  required className={inputCls + ' appearance-none pr-8'} style={inputStyle}
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Empleado ARS — info simple */}
            {empInfo && empInfo.moneda !== 'USD' && (
              <div className="rounded-xl px-3 py-2.5 text-[12.5px] flex items-center gap-2"
                style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                <span className="font-medium">{TIPO_SALARIO_LABEL[empInfo.tipo_salario]}</span>
                <span>·</span>
                <span>
                  {fmt(empInfo.monto_base)}
                  {' '}{empInfo.tipo_salario === 'hora' ? '/ hora' : empInfo.tipo_salario === 'turno' ? '/ turno' : '/ mes'}
                </span>
              </div>
            )}

            {/* Empleado USD con cotización guardada — info enriquecida */}
            {empInfo && empInfo.moneda === 'USD' && empInfo.cotizacion_valor && (
              <div className="rounded-xl px-3 py-2.5 text-[12.5px]"
                style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                  <span className="font-medium">{TIPO_SALARIO_LABEL[empInfo.tipo_salario]}</span>
                  <span>·</span>
                  <span>
                    USD {empInfo.monto_base.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    {' '}/{empInfo.tipo_salario === 'hora' ? ' hora' : empInfo.tipo_salario === 'turno' ? ' turno' : ' mes'}
                  </span>
                  <span>·</span>
                  <span>Cotización: $ {empInfo.cotizacion_valor.toLocaleString('es-AR')} ARS</span>
                  <span>·</span>
                  <span>
                    Equiv: $ {Math.round(empInfo.monto_base * empInfo.cotizacion_valor).toLocaleString('es-AR')}
                    {' '}/{empInfo.tipo_salario === 'hora' ? ' hora' : empInfo.tipo_salario === 'turno' ? ' turno' : ' mes'}
                  </span>
                </div>
              </div>
            )}

            {/* Empleado USD sin cotización guardada — selector de cotización */}
            {empInfo && empInfo.moneda === 'USD' && !empInfo.cotizacion_valor && (
              <>
                <div className="rounded-xl px-3 py-2.5 text-[12.5px]"
                  style={{ background: '#FEF3C7', color: '#92400E' }}>
                  Este empleado no tiene cotización registrada. Seleccioná una para continuar.
                </div>
                <CotizacionBlock
                  cotizacion={movCotizacion}
                  loading={movLoadingCot}
                  cotizacionTipo={form.cotizacion_tipo}
                  onSelect={onSelectMovCotizacion}
                />
              </>
            )}

            {/* Cantidad horas/turnos (ARS y USD) */}
            {!esEdicion && empInfo && empInfo.tipo_salario !== 'mensual' && (
              <div>
                <Label>{empInfo.tipo_salario === 'hora' ? 'Cantidad de horas *' : 'Cantidad de turnos *'}</Label>
                <input
                  type="number" step="1" min="1"
                  value={form.cantidad}
                  onChange={e => onCantidadChange(e.target.value)}
                  required className={inputCls} style={inputStyle} placeholder="0"
                />
              </div>
            )}

            <div>
              <Label>Categoría *</Label>
              <div className="relative">
                <select value={form.categoria_id} onChange={e => set('categoria_id')(e.target.value)}
                  required className={inputCls + ' appearance-none pr-8'} style={inputStyle}>
                  <option value="">Seleccionar categoría</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Monto total (ARS) *</Label>
                <input
                  type="number" step="0.01"
                  value={form.monto}
                  onChange={e => set('monto')(e.target.value)}
                  readOnly={
                    (!esEdicion && !!(empInfo && empInfo.tipo_salario !== 'mensual') && empInfo?.moneda !== 'USD') ||
                    (empInfo?.moneda === 'USD' && !!form.cotizacion_usada)
                  }
                  required
                  className={`${inputCls} no-number-arrows`}
                  style={{
                    ...inputStyle,
                    background:
                      ((!esEdicion && empInfo && empInfo.tipo_salario !== 'mensual' && empInfo?.moneda !== 'USD') ||
                      (empInfo?.moneda === 'USD' && !form.cotizacion_usada))
                        ? '#f9fafb'
                        : 'white',
                  }}
                  placeholder="0.00"
                />
                {empInfo?.moneda === 'USD' && form.cotizacion_usada && form.monto_origen && (
                  <p className="text-[11.5px] text-gray-400 mt-1">
                    USD {Number(form.monto_origen).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    {' '}× $ {Number(form.cotizacion_usada).toLocaleString('es-AR')}
                    {' '}= $ {Number(form.monto).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
              <div>
                <Label>Fecha *</Label>
                <input type="date" value={form.fecha} onChange={e => set('fecha')(e.target.value)}
                  required className={inputCls} style={inputStyle} />
              </div>
            </div>

            <div>
              <Label>Descripción</Label>
              <input value={form.descripcion} onChange={e => set('descripcion')(e.target.value)}
                className={inputCls} style={inputStyle} placeholder="Opcional" />
            </div>

            {error && <p className="text-[12.5px] text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={cerrarModal}
                className="flex-1 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 hover:bg-gray-50"
                style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold shadow-sm disabled:opacity-60"
                style={{ background: '#0F6E56' }}>
                {saving ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── TAB: Categorías ───────────────────────────────────────────────────────────

function TabCategorias() {
  const puedeEscribir = canWrite()
  const [cats, setCats]       = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState({ nombre: '', descripcion: '' })
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try { const { data } = await api.getCategoriasSalario(); setCats(data) }
    catch { /* leave empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await api.crearCategoriaSalario(form)
      setModal(false)
      setForm({ nombre: '', descripcion: '' })
      cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    try { await api.eliminarCategoriaSalario(id); cargar() }
    catch (err) { alert(err.message) }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] text-gray-500">{cats.length} categorías registradas</p>
        {puedeEscribir && (
          <button
            onClick={() => { setForm({ nombre: '', descripcion: '' }); setError(null); setModal(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-[13px] font-medium shadow-sm"
            style={{ background: '#0F6E56' }}
          >
            <Plus size={14} /> Nueva categoría
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b bg-gray-50/60" style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
              {['Nombre', 'Descripción', ''].map(h => (
                <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="py-10 text-center text-gray-400 text-[13px]">Cargando…</td></tr>
            ) : cats.length === 0 ? (
              <tr><td colSpan={3} className="py-10 text-center text-gray-400 text-[13px]">Sin categorías</td></tr>
            ) : cats.map(c => (
              <tr key={c.id} className="border-b hover:bg-gray-50/50 transition-colors group" style={{ borderColor: 'rgba(15,110,86,0.06)' }}>
                <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">{c.nombre}</td>
                <td className="py-3 px-4 text-gray-500">{c.descripcion || '—'}</td>
                <td className="py-3 px-4">
                  {puedeEscribir && (
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => eliminar(c.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Nueva categoría salarial" onClose={() => setModal(false)}>
          <form onSubmit={guardar} className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                required className={inputCls} style={inputStyle} />
            </div>
            <div>
              <Label>Descripción</Label>
              <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className={inputCls} style={inputStyle} />
            </div>
            {error && <p className="text-[12.5px] text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setModal(false)}
                className="flex-1 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 hover:bg-gray-50"
                style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold shadow-sm disabled:opacity-60"
                style={{ background: '#0F6E56' }}>
                {saving ? 'Guardando…' : 'Crear'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const SUBTABS = [
  { id: 'empleados',   label: 'Empleados',   icon: Users      },
  { id: 'movimientos', label: 'Movimientos', icon: DollarSign },
  { id: 'categorias',  label: 'Categorías',  icon: Tag        },
]

export default function Salarios() {
  const [tab, setTab] = useState('empleados')

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[20px] font-semibold text-gray-900">Salarios</h2>
          <p className="text-[13px] text-gray-500 mt-0.5">Gestión de empleados, movimientos y categorías</p>
        </div>
      </div>

      <div
        className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border w-fit"
        style={{ borderColor: 'rgba(15,110,86,0.1)' }}
      >
        {SUBTABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150"
              style={active ? { background: '#0F6E56', color: '#fff' } : { color: '#6b7280' }}
            >
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      {tab === 'empleados'   && <TabEmpleados />}
      {tab === 'movimientos' && <TabMovimientos />}
      {tab === 'categorias'  && <TabCategorias />}
    </div>
  )
}
