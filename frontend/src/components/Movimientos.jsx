import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Edit2, Trash2, RefreshCw, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'
import FormMovimiento from './FormMovimiento'

const CATEGORIAS = ['Todos', 'Tecnología', 'RRHH', 'Insumos', 'Servicios', 'Inversión', 'Otros']

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default function Movimientos({ tipo, openForm, onFormClose }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filtros, setFiltros] = useState({
    search: '', categoria: 'Todos', fecha_desde: '', fecha_hasta: ''
  })
  const [showFiltros, setShowFiltros] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [totales, setTotales] = useState({ count: 0, suma: 0 })

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getMovimientos({
        tipo,
        categoria: filtros.categoria,
        fecha_desde: filtros.fecha_desde,
        fecha_hasta: filtros.fecha_hasta,
        search: filtros.search,
      })
      setItems(data.data)
      const suma = data.data.reduce((s, m) => s + Number(m.monto), 0)
      setTotales({ count: data.data.length, suma })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [tipo, filtros])

  useEffect(() => { cargar() }, [cargar])

  // Abrir form si viene desde Dashboard
  useEffect(() => {
    if (openForm) { setShowForm(true); onFormClose?.() }
  }, [openForm])

  const handleDelete = async (id) => {
    try {
      await api.eliminarMovimiento(id)
      setConfirmDelete(null)
      cargar()
    } catch (e) {
      alert(e.message)
    }
  }

  const setFiltro = (k, v) => setFiltros(f => ({ ...f, [k]: v }))

  const color = tipo === 'Ingreso' ? 'text-green-700' : 'text-red-600'

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tipo}s</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totales.count} registros · Total: <span className={`font-semibold ${color}`}>{fmt(totales.suma)}</span>
          </p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Nuevo {tipo}
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filtros.search}
              onChange={e => setFiltro('search', e.target.value)}
              placeholder="Buscar por descripción..."
              className="input-field pl-9"
            />
          </div>
          <select value={filtros.categoria} onChange={e => setFiltro('categoria', e.target.value)}
            className="input-field w-auto">
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setShowFiltros(v => !v)}
            className={`btn-secondary ${showFiltros ? 'bg-gray-100' : ''}`}
          >
            <Filter size={15} /> Fechas <ChevronDown size={14} className={showFiltros ? 'rotate-180' : ''} />
          </button>
          <button onClick={cargar} className="btn-secondary p-2">
            <RefreshCw size={15} />
          </button>
        </div>

        {showFiltros && (
          <div className="flex gap-3 mt-3 flex-wrap">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Desde</label>
              <input type="date" value={filtros.fecha_desde} onChange={e => setFiltro('fecha_desde', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hasta</label>
              <input type="date" value={filtros.fecha_hasta} onChange={e => setFiltro('fecha_hasta', e.target.value)}
                className="input-field" />
            </div>
            <div className="flex items-end">
              <button onClick={() => setFiltros({ search: '', categoria: 'Todos', fecha_desde: '', fecha_hasta: '' })}
                className="btn-secondary text-xs">
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Fecha', 'Descripción', 'Categoría', tipo === 'Ingreso' ? 'Cliente' : 'Proveedor', 'Comprobante', 'Monto', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 max-w-[200px] truncate">{m.descripcion}</div>
                      {m.notas && <div className="text-xs text-gray-400 truncate max-w-[200px]">{m.notas}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {m.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 max-w-[120px] truncate">
                      {m.proveedor_cliente || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {m.comprobantes?.length > 0 ? (
                        <a href={m.comprobantes[0].url_archivo} target="_blank" rel="noreferrer"
                          className="badge-ocr hover:underline">
                          ✓ Ver
                        </a>
                      ) : (
                        <span className="badge-pendiente">Sin comp.</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 font-semibold whitespace-nowrap ${color}`}>
                      {fmt(m.monto)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditItem(m); setShowForm(true) }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(m)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <p className="text-gray-400 text-sm">No hay {tipo.toLowerCase()}s registrados</p>
                      <button
                        onClick={() => { setEditItem(null); setShowForm(true) }}
                        className="btn-primary mt-4 mx-auto"
                      >
                        <Plus size={16} /> Crear primer {tipo.toLowerCase()}
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <FormMovimiento
          tipo={tipo}
          movimiento={editItem}
          onClose={() => { setShowForm(false); setEditItem(null) }}
          onSaved={() => { setShowForm(false); setEditItem(null); cargar() }}
        />
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full animate-fadeIn">
            <h3 className="font-semibold text-gray-900 mb-2">¿Eliminar registro?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Se eliminará <span className="font-medium">"{confirmDelete.descripcion}"</span> y sus comprobantes asociados. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
