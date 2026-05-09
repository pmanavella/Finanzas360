import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, Trash2, RefreshCw, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'
import { canWrite } from '../lib/permissions'
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
      if (tipo !== 'Gasto') {
        // Ingresos: lógica sin cambios
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
        return
      }

      // Gastos: combina movimientos regulares + movimientos salariales
      const [movRes, salRes] = await Promise.allSettled([
        api.getMovimientos({
          tipo,
          categoria: filtros.categoria,
          fecha_desde: filtros.fecha_desde,
          fecha_hasta: filtros.fecha_hasta,
          search: filtros.search,
        }),
        api.getMovimientosSalario({
          fecha_desde: filtros.fecha_desde || undefined,
          fecha_hasta: filtros.fecha_hasta || undefined,
        }),
      ])

      const movs = movRes.status === 'fulfilled' ? (movRes.value.data || []) : []

      const rawSals = salRes.status === 'fulfilled' ? (salRes.value.data || []) : []
      const sals = rawSals
        .filter(s => {
          // Búsqueda client-side sobre nombre + categoría salarial
          if (filtros.search) {
            const nombre = s.empleados
              ? `${s.empleados.nombre} ${s.empleados.apellido}`
              : ''
            const cat = s.categorias_salariales?.nombre || ''
            if (!`${nombre} ${cat}`.toLowerCase().includes(filtros.search.toLowerCase())) return false
          }
          // Si hay filtro de categoría activo, los salarios no coinciden → omitir
          if (filtros.categoria && filtros.categoria !== 'Todos') return false
          return true
        })
        .map(s => {
          const nombre = s.empleados
            ? `${s.empleados.nombre} ${s.empleados.apellido}`
            : '—'
          const cat = s.categorias_salariales?.nombre || 'Sueldo Base'
          return {
            id:                s.id,
            fecha:             s.fecha,
            descripcion:       cat ? `${nombre} — ${cat}` : nombre,
            categoria:         cat,
            tipo:              'Salario',
            monto:             Number(s.monto),
            proveedor_cliente: null,
            notas:             null,
            comprobantes:      [],
            _isSalario:        true,
          }
        })

      const merged = [...movs, ...sals].sort((a, b) => b.fecha.localeCompare(a.fecha))
      setItems(merged)
      const suma = merged.reduce((s, m) => s + Number(m.monto), 0)
      setTotales({ count: merged.length, suma })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [tipo, filtros])

  useEffect(() => { cargar() }, [cargar])

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

  const isIngreso = tipo === 'Ingreso'
  const accentColor = isIngreso ? '#2e8b57' : '#ef4444'
  const puedeEscribir = canWrite()

  return (
    <div className="animate-fadeIn space-y-5">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{tipo}s</h1>
          <p className="page-subtitle">
            {totales.count} registros · Total:{' '}
            <span className="font-bold" style={{ color: accentColor }}>{fmt(totales.suma)}</span>
          </p>
        </div>
        {puedeEscribir && (
          <button onClick={() => { setEditItem(null); setShowForm(true) }} className="btn-primary">
            <Plus size={15} /> Nuevo {tipo}
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex gap-2.5 flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filtros.search}
              onChange={e => setFiltro('search', e.target.value)}
              placeholder="Buscar por descripción..."
              className="input-field pl-9"
            />
          </div>
          <select
            value={filtros.categoria}
            onChange={e => setFiltro('categoria', e.target.value)}
            className="input-field w-auto"
          >
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setShowFiltros(v => !v)}
            className={`btn-secondary ${showFiltros ? 'border-primary-300 text-primary-700' : ''}`}
          >
            <Filter size={14} /> Fechas
            <ChevronDown size={13} className={`transition-transform duration-200 ${showFiltros ? 'rotate-180' : ''}`} />
          </button>
          <button onClick={cargar} className="btn-secondary px-3">
            <RefreshCw size={14} />
          </button>
        </div>

        {showFiltros && (
          <div className="flex gap-4 mt-4 pt-4 flex-wrap" style={{ borderTop: '1px solid #E6E8DD' }}>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Desde</label>
              <input type="date" value={filtros.fecha_desde}
                onChange={e => setFiltro('fecha_desde', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Hasta</label>
              <input type="date" value={filtros.fecha_hasta}
                onChange={e => setFiltro('fecha_hasta', e.target.value)} className="input-field" />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFiltros({ search: '', categoria: 'Todos', fecha_desde: '', fecha_hasta: '' })}
                className="btn-ghost text-xs"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52 text-gray-400">
            <RefreshCw size={18} className="animate-spin mr-2" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Fecha', 'Descripción', 'Categoría', isIngreso ? 'Cliente' : 'Proveedor', 'Comp.', 'Monto', ''].map(h => (
                    <th key={h} className="table-head-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(m => (
                  <tr key={m._isSalario ? `sal-${m.id}` : m.id} className="table-row group">
                    <td className="table-cell text-gray-500 whitespace-nowrap text-xs">
                      {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                    </td>
                    <td className="table-cell">
                      <div className="font-semibold text-ink max-w-[200px] truncate">{m.descripcion}</div>
                      {m.notas && <div className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{m.notas}</div>}
                    </td>
                    <td className="table-cell">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium text-gray-600"
                        style={{ background: '#F7F8F3', border: '1px solid #E6E8DD' }}>
                        {m.categoria}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500 max-w-[120px] truncate">
                      {m.proveedor_cliente || '—'}
                    </td>
                    <td className="table-cell">
                      {m.comprobantes?.length > 0 ? (
                        <a href={m.comprobantes[0].url_archivo} target="_blank" rel="noreferrer"
                          className="badge-ocr hover:underline">
                          ✓ Ver
                        </a>
                      ) : (
                        <span className="badge-pendiente">—</span>
                      )}
                    </td>
                    <td className="table-cell font-bold whitespace-nowrap" style={{ color: accentColor }}>
                      {fmt(m.monto)}
                    </td>
                    <td className="table-cell">
                      {!m._isSalario && puedeEscribir && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={() => { setEditItem(m); setShowForm(true) }}
                            className="px-2.5 py-1 rounded-lg text-[12px] font-medium text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(m)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: '#DFF3E4' }}>
                        <Plus size={22} style={{ color: '#0f5132' }} />
                      </div>
                      <p className="text-gray-400 text-sm mb-4">No hay {tipo.toLowerCase()}s registrados</p>
                      {puedeEscribir && (
                        <button
                          onClick={() => { setEditItem(null); setShowForm(true) }}
                          className="btn-primary mx-auto"
                        >
                          <Plus size={15} /> Crear primer {tipo.toLowerCase()}
                        </button>
                      )}
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
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-card-lg p-6 max-w-sm w-full animate-fadeIn border border-muted">
            <h3 className="font-bold text-ink mb-2">¿Eliminar registro?</h3>
            <p className="text-sm text-gray-500 mb-5">
              Se eliminará <span className="font-semibold text-ink">"{confirmDelete.descripcion}"</span> y sus comprobantes asociados.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmDelete(null)} className="btn-secondary flex-1 justify-center">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
