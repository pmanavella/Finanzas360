import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../lib/api'
import { canWrite } from '../lib/permissions'
import {
  Users, DollarSign, Tag, Plus, Trash2, X, ChevronDown,
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

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
}

function TabEmpleados() {
  const puedeEscribir = canWrite()
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [form, setForm]           = useState(EMP_VACIO)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.getEmpleados()
      setEmpleados(data)
    } catch { /* leave empty */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo = () => { setForm(EMP_VACIO); setError(null); setModal('nuevo') }
  const abrirEditar = (emp) => { setForm({ ...emp }); setError(null); setModal(emp) }

  const guardar = async (e) => {
    e.preventDefault()
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
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{emp.monto_base ? fmt(emp.monto_base) : '—'}</td>
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
            <div>
              <SelectField label="Tipo permanencia *" value={form.tipo_permanencia} onChange={set('tipo_permanencia')} options={TIPO_PERMANENCIA} />
            </div>
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
                <Label>{MONTO_BASE_LABEL[form.tipo_salario] || 'Monto base'}</Label>
                <input type="number" step="0.01" min="0"
                  value={form.monto_base || ''}
                  onChange={e => set('monto_base')(e.target.value)}
                  className={inputCls} style={inputStyle} placeholder="0.00" />
              </div>
            </div>
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

const MOV_VACIO = { empleado_id: '', categoria_id: '', monto: '', fecha: '', descripcion: '', cantidad: '' }

function TabMovimientos() {
  const puedeEscribir = canWrite()
  const [movs, setMovs]           = useState([])
  const [empleados, setEmpleados] = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState(MOV_VACIO)
  const [empInfo, setEmpInfo]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)

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
      setEmpInfo({ tipo_salario: emp.tipo_salario, monto_base: Number(emp.monto_base) || 0 })
      setForm(f => ({
        ...f,
        empleado_id,
        monto: emp.tipo_salario === 'mensual' ? String(emp.monto_base || '') : '',
        cantidad: '',
      }))
    } else {
      setEmpInfo(null)
      setForm(f => ({ ...f, empleado_id, monto: '', cantidad: '' }))
    }
  }

  const onCantidadChange = (val) => {
    setForm(f => {
      const monto = empInfo ? String(empInfo.monto_base * Number(val)) : f.monto
      return { ...f, cantidad: val, monto }
    })
  }

  const abrirNuevo = () => {
    const hoy = new Date().toISOString().split('T')[0]
    const primerEmp = empleados[0]
    setForm({ ...MOV_VACIO, fecha: hoy, categoria_id: categorias[0]?.id || '' })
    setEmpInfo(null)
    setError(null)
    setModal('nuevo')
    if (primerEmp) cargarInfoEmpleado(primerEmp.id, empleados)
  }

  const abrirEditar = (mov) => {
    setForm({
      empleado_id:  mov.empleado_id,
      categoria_id: mov.categoria_id,
      monto:        String(mov.monto),
      fecha:        mov.fecha,
      descripcion:  mov.descripcion || '',
      cantidad:     '',
    })
    const emp = empleados.find(e => String(e.id) === String(mov.empleado_id))
    setEmpInfo(emp?.tipo_salario ? { tipo_salario: emp.tipo_salario, monto_base: Number(emp.monto_base) || 0 } : null)
    setError(null)
    setModal(mov)
  }

  const cerrarModal = () => setModal(false)

  const guardar = async (e) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const payload = {
        empleado_id:  form.empleado_id,
        categoria_id: form.categoria_id,
        fecha:        form.fecha,
        descripcion:  form.descripcion,
      }
      if (modal === 'nuevo' && empInfo && empInfo.tipo_salario !== 'mensual' && form.cantidad) {
        payload.cantidad = Number(form.cantidad)
      } else {
        payload.monto = Number(form.monto)
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
                {['Empleado', 'Categoría', 'Monto', 'Fecha', 'Descripción', ''].map(h => (
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
                  <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap">
                    {fmt(m.monto)}
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

            {empInfo && (
              <div className="rounded-xl px-3 py-2.5 text-[12.5px] flex items-center gap-2"
                style={{ background: '#E1F5EE', color: '#0F6E56' }}>
                <span className="font-medium">{TIPO_SALARIO_LABEL[empInfo.tipo_salario]}</span>
                <span>·</span>
                <span>{fmt(empInfo.monto_base)} {empInfo.tipo_salario === 'hora' ? '/ hora' : empInfo.tipo_salario === 'turno' ? '/ turno' : '/ mes'}</span>
              </div>
            )}

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
                <Label>Monto total *</Label>
                <input
                  type="number" step="0.01"
                  value={form.monto}
                  onChange={e => set('monto')(e.target.value)}
                  readOnly={!esEdicion && !!(empInfo && empInfo.tipo_salario !== 'mensual')}
                  required className={inputCls} style={{
                    ...inputStyle,
                    background: (!esEdicion && empInfo && empInfo.tipo_salario !== 'mensual') ? '#f9fafb' : 'white',
                  }}
                  placeholder="0.00"
                />
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
          <h2 className="font-serif text-[20px] font-semibold text-gray-900">Estructura Salarial</h2>
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
