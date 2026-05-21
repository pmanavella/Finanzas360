import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, RefreshCw, Search, X, ChevronDown, Repeat2, Trash2 } from 'lucide-react'
import { api } from '../lib/api'
import { canWrite } from '../lib/permissions'

const ESTADOS_FILTRO = ['Todas', 'Activa', 'Pausada', 'Cancelada']
const FRECUENCIAS    = ['Mensual', 'Trimestral', 'Semestral', 'Anual']
const MONEDAS        = ['ARS', 'USD']
const ESTADO_VALS    = ['Activa', 'Pausada', 'Cancelada']

const ESTADO_STYLE = {
  Activa:    { background: '#E1F5EE', color: '#0F6E56' },
  Pausada:   { background: '#FEF3C7', color: '#92400E' },
  Cancelada: { background: '#FEE2E2', color: '#DC2626' },
}

const INICIAL = {
  nombre: '', detalle: '', proveedor: '',
  monto: '', moneda: 'ARS',
  dia_vencimiento: '', frecuencia: 'Mensual', estado: 'Activa',
}

const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none bg-white transition-colors focus:ring-2 focus:ring-teal-700/10'
const inputStyle = { borderColor: 'rgba(15,110,86,0.25)' }

function fmtMonto(n, moneda) {
  if (moneda === 'USD') {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n)
  }
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

const MESES_EQUIV = { Mensual: 1, Trimestral: 3, Semestral: 6, Anual: 12 }

function mensualEquiv(monto, frecuencia) {
  return Number(monto) / (MESES_EQUIV[frecuencia] || 1)
}

function FormSuscripcion({ suscripcion, onClose, onSaved }) {
  const [form, setForm]     = useState(suscripcion ? { ...suscripcion } : { ...INICIAL })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (saving) return
    if (!form.nombre?.trim()) { setError('El nombre es obligatorio'); return }
    const montoNum = Number(form.monto)
    if (!form.monto || isNaN(montoNum) || montoNum <= 0) { setError('El monto debe ser mayor a 0'); return }
    const diaNum = parseInt(form.dia_vencimiento)
    if (!form.dia_vencimiento || isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
      setError('El día de vencimiento debe ser entre 1 y 31'); return
    }
    setSaving(true); setError(null)
    try {
      if (suscripcion) {
        await api.editarSuscripcion(suscripcion.id, form)
      } else {
        await api.crearSuscripcion(form)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card fade-in" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-accent" />
        <div className="modal-header">
          <h2 className="modal-title">{suscripcion ? 'Editar suscripción' : 'Nueva suscripción'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        <div className="modal-body space-y-3">
          <div>
            <label className="form-label">Nombre *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
              placeholder="Ej: ChatGPT Plus" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="form-label">Detalle / Motivo</label>
            <input value={form.detalle} onChange={e => set('detalle', e.target.value)}
              placeholder="Ej: Plan Plus con acceso a GPT-4" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="form-label">Proveedor</label>
            <input value={form.proveedor} onChange={e => set('proveedor', e.target.value)}
              placeholder="Ej: OpenAI" className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Monto *</label>
              <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)}
                placeholder="0.00" min="0" step="0.01" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="form-label">Moneda</label>
              <div className="flex gap-2">
                {MONEDAS.map(m => (
                  <button key={m} type="button" onClick={() => set('moneda', m)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all"
                    style={form.moneda === m
                      ? { background: '#0F6E56', borderColor: '#0F6E56', color: '#fff' }
                      : { background: '#fff', borderColor: 'rgba(15,110,86,0.25)', color: '#6b7280' }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Día de vencimiento *</label>
              <input type="number" value={form.dia_vencimiento} onChange={e => set('dia_vencimiento', e.target.value)}
                placeholder="Ej: 10" min="1" max="31" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="form-label">Frecuencia</label>
              <div className="relative">
                <select value={form.frecuencia} onChange={e => set('frecuencia', e.target.value)}
                  className={inputCls + ' appearance-none pr-8'} style={inputStyle}>
                  {FRECUENCIAS.map(f => <option key={f}>{f}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div>
            <label className="form-label">Estado</label>
            <div className="flex gap-2">
              {ESTADO_VALS.map(e => (
                <button key={e} type="button" onClick={() => set('estado', e)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border transition-all"
                  style={form.estado === e
                    ? { background: '#0F6E56', borderColor: '#0F6E56', color: '#fff' }
                    : { background: '#fff', borderColor: 'rgba(15,110,86,0.25)', color: '#6b7280' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-[12.5px] text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
        </div>
        <div className="modal-footer">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 hover:bg-gray-50"
            style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#0F6E56' }}>
            <Repeat2 size={15} />
            {saving ? 'Guardando…' : suscripcion ? 'Guardar cambios' : 'Crear suscripción'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function Suscripciones() {
  const [lista, setLista]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [estadoFiltro, setEstado] = useState('Todas')
  const [search, setSearch]       = useState('')
  const [modal, setModal]         = useState(null)   // null | 'nuevo' | suscripcion
  const [confirmDel, setConfDel]  = useState(null)
  const puedeEscribir = canWrite()

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (estadoFiltro !== 'Todas') params.estado = estadoFiltro
      if (search.trim()) params.search = search.trim()
      const res = await api.getSuscripciones(params)
      setLista(res.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [estadoFiltro, search])

  useEffect(() => { cargar() }, [cargar])

  const handleEliminar = async (id) => {
    try {
      await api.eliminarSuscripcion(id)
      setConfDel(null)
      cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  // Totales mensuales equivalentes de suscripciones activas
  const activas = lista.filter(s => s.estado === 'Activa')
  const totalARS = activas.filter(s => s.moneda === 'ARS')
    .reduce((acc, s) => acc + mensualEquiv(s.monto, s.frecuencia), 0)
  const totalUSD = activas.filter(s => s.moneda === 'USD')
    .reduce((acc, s) => acc + mensualEquiv(s.monto, s.frecuencia), 0)

  return (
    <div className="fade-in space-y-4">

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><span>⚠</span> {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Suscripciones</h2>
          <p className="page-subtitle">
            {loading ? '…' : `${lista.length} registros · ${activas.length} activas`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar} className="btn-secondary px-3" title="Recargar">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {puedeEscribir && (
            <button onClick={() => setModal('nuevo')} className="btn-primary">
              <Plus size={15} /> Nueva suscripción
            </button>
          )}
        </div>
      </div>

      {/* Métricas rápidas */}
      {!loading && (totalARS > 0 || totalUSD > 0) && (
        <div className="flex gap-3 flex-wrap">
          {totalARS > 0 && (
            <div className="bg-white rounded-xl border px-5 py-3 flex items-center gap-3 shadow-sm"
              style={{ borderColor: 'rgba(15,110,86,0.12)' }}>
              <Repeat2 size={18} style={{ color: '#0F6E56' }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mensual ARS</p>
                <p className="text-[18px] font-black" style={{ color: '#0F6E56' }}>
                  {fmtMonto(totalARS, 'ARS')}
                </p>
              </div>
            </div>
          )}
          {totalUSD > 0 && (
            <div className="bg-white rounded-xl border px-5 py-3 flex items-center gap-3 shadow-sm"
              style={{ borderColor: 'rgba(15,110,86,0.12)' }}>
              <Repeat2 size={18} style={{ color: '#1D4ED8' }} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mensual USD</p>
                <p className="text-[18px] font-black" style={{ color: '#1D4ED8' }}>
                  {fmtMonto(totalUSD, 'USD')}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border shadow-sm px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
        style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, detalle o proveedor…"
            className="w-full border rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none bg-white focus:ring-2 focus:ring-teal-700/10"
            style={{ borderColor: 'rgba(15,110,86,0.25)' }}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#f8fafc' }}>
          {ESTADOS_FILTRO.map(e => (
            <button key={e} onClick={() => setEstado(e)}
              className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150"
              style={estadoFiltro === e
                ? { background: '#0a3b24', color: '#fff', boxShadow: '0 1px 4px rgba(10,59,36,.25)' }
                : { color: '#9ca3af' }}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden"
        style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-52 text-gray-400">
            <RefreshCw size={18} className="animate-spin mr-2" />
            <span className="text-sm">Cargando…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr>
                  {['Nombre', 'Detalle', 'Proveedor', 'Monto', 'Moneda', 'Día Vcto.', 'Frecuencia', 'Estado', ''].map(h => (
                    <th key={h} className="table-head-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: '#E1F5EE' }}>
                        <Repeat2 size={22} style={{ color: '#0F6E56' }} />
                      </div>
                      <p className="text-gray-400 text-sm mb-4">No hay suscripciones registradas</p>
                      {puedeEscribir && (
                        <button onClick={() => setModal('nuevo')} className="btn-primary mx-auto">
                          <Plus size={15} /> Nueva suscripción
                        </button>
                      )}
                    </td>
                  </tr>
                ) : lista.map(s => {
                  const estStyle = ESTADO_STYLE[s.estado] || ESTADO_STYLE.Cancelada
                  return (
                    <tr key={s.id} className="table-row group">
                      <td className="table-cell font-semibold text-gray-900 whitespace-nowrap">{s.nombre}</td>
                      <td className="table-cell text-gray-500 max-w-[160px] truncate">{s.detalle || '—'}</td>
                      <td className="table-cell text-gray-500 whitespace-nowrap">{s.proveedor || '—'}</td>
                      <td className="table-cell font-bold whitespace-nowrap" style={{ color: '#0F6E56' }}>
                        {fmtMonto(s.monto, s.moneda)}
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={s.moneda === 'USD'
                            ? { background: '#EFF6FF', color: '#1D4ED8' }
                            : { background: '#F7F8F3', color: '#374151', border: '1px solid #E6E8DD' }}>
                          {s.moneda}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500">Día {s.dia_vencimiento}</td>
                      <td className="table-cell">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium text-gray-600"
                          style={{ background: '#F7F8F3', border: '1px solid #E6E8DD' }}>
                          {s.frecuencia}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium"
                          style={estStyle}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="table-cell">
                        {puedeEscribir && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setModal(s)}
                              className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                              Editar
                            </button>
                            <button onClick={() => setConfDel(s)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <FormSuscripcion
          suscripcion={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); cargar() }}
        />
      )}

      {/* Confirm eliminar */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfDel(null)} />
          <div className="relative bg-white rounded-2xl shadow-card-lg p-6 max-w-sm w-full fade-in border border-muted">
            <h3 className="font-bold text-ink mb-2">¿Eliminar suscripción?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Se eliminará <span className="font-semibold text-ink">"{confirmDel.nombre}"</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfDel(null)} className="btn-secondary flex-1 justify-center">Cancelar</button>
              <button onClick={() => handleEliminar(confirmDel.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
