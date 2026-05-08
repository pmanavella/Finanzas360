import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Clock, X, Save } from 'lucide-react'
import { api } from '../lib/api'

function fmt(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0
  }).format(n)
}

function isVencida(fechaStr) {
  if (!fechaStr) return false
  return new Date(fechaStr + 'T00:00:00') < new Date(new Date().toDateString())
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '—'
  const [y, m, d] = fechaStr.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

const ESTADOS = ['Pendiente', 'Pagada', 'Vencida']

const inputCls = `w-full border rounded-xl px-3 py-2.5 text-[13.5px] outline-none bg-white transition-colors focus:ring-2 focus:ring-teal-700/10`
const inputStyle = { borderColor: 'rgba(15,110,86,0.25)' }

const INICIAL = {
  acreedor: '',
  descripcion: '',
  monto: '',
  vencimiento: '',
  estado: 'Pendiente',
  notas: '',
}

function FormDeuda({ deuda, onClose, onSaved }) {
  const [form, setForm] = useState(deuda ? { ...deuda } : { ...INICIAL })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.acreedor || !form.monto || !form.vencimiento) {
      setError('Completá acreedor, monto y vencimiento.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (deuda) {
        await api.editarDeuda(deuda.id, form)
      } else {
        await api.crearDeuda(form)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card fade-in" style={{ maxWidth: 480 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-accent" />
        <div className="modal-header" style={{ borderBottom: '1px solid rgba(15,110,86,0.1)' }}>
          <h2 className="modal-title">{deuda ? 'Editar deuda' : 'Registrar deuda'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <div>
            <label className="form-label">Acreedor *</label>
            <input type="text" value={form.acreedor} onChange={e => set('acreedor', e.target.value)}
              placeholder="Ej: TechAR SRL" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="form-label">Descripción</label>
            <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Ej: Servicio soporte Abril" className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Monto *</label>
              <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)}
                placeholder="0.00" min="0" step="0.01" className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="form-label">Vencimiento *</label>
              <input type="date" value={form.vencimiento} onChange={e => set('vencimiento', e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="form-label">Estado</label>
            <div className="flex gap-2">
              {ESTADOS.map(e => (
                <button key={e} onClick={() => set('estado', e)}
                  className="flex-1 py-2 rounded-xl text-[12.5px] font-medium border transition-all"
                  style={form.estado === e
                    ? { background: e === 'Pagada' ? '#1D9E75' : e === 'Vencida' ? '#E24B4A' : '#EF9F27', color: '#fff', borderColor: 'transparent' }
                    : { borderColor: 'rgba(15,110,86,0.2)', color: '#6b7280', background: 'white' }
                  }>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={2} placeholder="Notas adicionales..."
              className={inputCls + ' resize-none'} style={inputStyle} />
          </div>
          {error && <div className="p-3 rounded-xl text-[13px] text-red-600 bg-red-50">{error}</div>}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid rgba(15,110,86,0.1)' }}>
          <button onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium shadow-sm transition-colors disabled:opacity-60"
            style={{ background: '#0F6E56' }}>
            <Save size={15} />
            {loading ? 'Guardando...' : deuda ? 'Guardar cambios' : 'Registrar deuda'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function Deudas() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [pagandoId, setPagandoId] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getDeudas()
      setItems(data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const handlePagar = async (deuda) => {
    setPagandoId(deuda.id)
    try {
      await api.editarDeuda(deuda.id, { ...deuda, estado: 'Pagada' })
      cargar()
    } catch (e) {
      alert(e.message)
    } finally {
      setPagandoId(null)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.eliminarDeuda(id)
      setConfirmDelete(null)
      cargar()
    } catch (e) {
      alert(e.message)
    }
  }

  const pendientes    = items.filter(d => d.estado !== 'Pagada')
  const vencidas      = items.filter(d => d.estado !== 'Pagada' && isVencida(d.vencimiento))
  const totalPendiente = pendientes.reduce((s, d) => s + Number(d.monto), 0)

  function estadoChip(d) {
    const estado = d.estado !== 'Pagada' && isVencida(d.vencimiento) ? 'Vencida' : d.estado
    const styles = {
      Pagada:    { background: '#E1F5EE', color: '#0F6E56' },
      Pendiente: { background: '#FEF3C7', color: '#92400E' },
      Vencida:   { background: '#FEE2E2', color: '#B91C1C' },
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-medium"
        style={styles[estado] || styles.Pendiente}>
        {estado}
      </span>
    )
  }

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-[20px] font-semibold text-gray-900">Deudas & Obligaciones</h2>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''} · Total:{' '}
            <span className="font-semibold text-red-500">{fmt(totalPendiente)}</span>
            {vencidas.length > 0 && (
              <span className="ml-2 text-red-500 font-medium">
                · {vencidas.length} vencida{vencidas.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={cargar}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={() => { setEditItem(null); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium shadow-sm"
            style={{ background: '#0F6E56' }}>
            <Plus size={15} /> Registrar deuda
          </button>
        </div>
      </div>

      {vencidas.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px]"
          style={{ background: '#FEE2E2', color: '#B91C1C' }}>
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>
            Tenés <strong>{vencidas.length}</strong> deuda{vencidas.length !== 1 ? 's' : ''} vencida{vencidas.length !== 1 ? 's' : ''} sin pagar.
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden"
        style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-[13.5px]">
            <RefreshCw size={18} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b bg-gray-50/60" style={{ borderColor: 'rgba(15,110,86,0.1)' }}>
                  {['ACREEDOR', 'DESCRIPCIÓN', 'MONTO', 'VENCIMIENTO', 'ESTADO', ''].map(h => (
                    <th key={h} className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(d => {
                  const venc = d.estado !== 'Pagada' && isVencida(d.vencimiento)
                  const pagada = d.estado === 'Pagada'
                  return (
                    <tr key={d.id} className="border-b hover:bg-gray-50/50 transition-colors group"
                      style={{ borderColor: 'rgba(15,110,86,0.06)' }}>
                      <td className="py-4 px-5 font-semibold text-gray-900">{d.acreedor}</td>
                      <td className="py-4 px-5 text-gray-500">{d.descripcion || '—'}</td>
                      <td className="py-4 px-5 font-semibold" style={{ color: pagada ? '#1D9E75' : '#E24B4A' }}>
                        {fmt(d.monto)}
                      </td>
                      <td className="py-4 px-5 font-medium" style={{ color: venc ? '#E24B4A' : '#374151' }}>
                        {formatFecha(d.vencimiento)}
                      </td>
                      <td className="py-4 px-5">{estadoChip(d)}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 justify-end">
                          {!pagada && (
                            <button onClick={() => handlePagar(d)} disabled={pagandoId === d.id}
                              className="px-4 py-1.5 rounded-lg text-[12.5px] font-medium border transition-all disabled:opacity-50"
                              style={venc
                                ? { background: '#0F6E56', color: '#fff', borderColor: '#0F6E56' }
                                : { background: 'white', color: '#374151', borderColor: 'rgba(15,110,86,0.25)' }
                              }>
                              {pagandoId === d.id ? '...' : 'Pagar'}
                            </button>
                          )}
                          {pagada && (
                            <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color: '#1D9E75' }}>
                              <CheckCircle size={14} /> Pagada
                            </span>
                          )}
                          <button onClick={() => { setEditItem(d); setShowForm(true) }}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100">
                            ✏️
                          </button>
                          <button onClick={() => setConfirmDelete(d)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: '#E1F5EE' }}>
                        <Clock size={22} style={{ color: '#0F6E56' }} />
                      </div>
                      <p className="text-gray-400 text-[13.5px]">No hay deudas registradas</p>
                      <button onClick={() => { setEditItem(null); setShowForm(true) }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium shadow-sm mt-4 mx-auto"
                        style={{ background: '#0F6E56' }}>
                        <Plus size={15} /> Registrar primera deuda
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <FormDeuda
          deuda={editItem}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSaved={() => { setShowForm(false); setEditItem(null); cargar() }}
        />
      )}

      {confirmDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full fade-in">
            <h3 className="font-serif font-semibold text-gray-900 mb-2 text-[16px]">¿Eliminar deuda?</h3>
            <p className="text-[13px] text-gray-500 mb-5">
              Se eliminará la deuda con{' '}
              <span className="font-medium text-gray-700">"{confirmDelete.acreedor}"</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 flex items-center justify-center px-4 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 bg-white hover:bg-gray-50 transition-colors"
                style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-medium bg-red-500 hover:bg-red-600 transition-colors">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
