import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, LayoutList } from 'lucide-react'
import { api } from '../lib/api'

const TIPOS = ['Todos', 'Ingreso', 'Gasto', 'Deuda', 'Salario']

const TIPO_STYLE = {
  Ingreso: { bg: '#dcfce7', color: '#16a34a', prefix: '+' },
  Gasto:   { bg: '#fee2e2', color: '#ef4444', prefix: '−' },
  Deuda:   { bg: '#fef3c7', color: '#d97706', prefix: ''  },
  Salario: { bg: '#e0f2fe', color: '#0284c7', prefix: ''  },
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function normalizeMovimientos(data = []) {
  return data.map(m => ({
    id:          m.id,
    fecha:       m.fecha,
    descripcion: m.descripcion,
    tipo:        m.tipo,
    monto:       Number(m.monto),
    detalle:     m.proveedor_cliente || m.categoria || '',
  }))
}

function normalizeDeudas(data = []) {
  return data.map(d => ({
    id:          d.id,
    fecha:       d.vencimiento,
    descripcion: d.acreedor + (d.descripcion ? ` — ${d.descripcion}` : ''),
    tipo:        'Deuda',
    monto:       Number(d.monto),
    detalle:     d.estado || '',
  }))
}

function normalizeSalarios(data = []) {
  return data.map(s => {
    const nombre = s.empleados
      ? `${s.empleados.nombre} ${s.empleados.apellido}`
      : '—'
    const categoria = s.categorias_salariales?.nombre || ''
    return {
      id:          s.id,
      fecha:       s.fecha,
      descripcion: categoria ? `${nombre} — ${categoria}` : nombre,
      tipo:        'Salario',
      monto:       Number(s.monto),
      detalle:     categoria,
    }
  })
}

export default function TodosMovimientos() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro,  setFiltro]  = useState('Todos')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [movRes, deudasRes, salariosRes] = await Promise.allSettled([
        api.getMovimientos(),
        api.getDeudas(),
        api.getMovimientosSalario(),
      ])
      const movs     = movRes.status     === 'fulfilled' ? normalizeMovimientos(movRes.value.data)     : []
      const deudas   = deudasRes.status  === 'fulfilled' ? normalizeDeudas(deudasRes.value.data)       : []
      const salarios = salariosRes.status === 'fulfilled' ? normalizeSalarios(salariosRes.value.data)  : []

      const merged = [...movs, ...deudas, ...salarios]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
      setItems(merged)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = filtro === 'Todos' ? items : items.filter(i => i.tipo === filtro)

  const conteo = TIPOS.slice(1).reduce((acc, t) => {
    acc[t] = items.filter(i => i.tipo === t).length
    return acc
  }, {})

  return (
    <div className="animate-fadeIn space-y-5">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Todos los movimientos</h1>
          <p className="page-subtitle">
            {filtrados.length} registros · {items.length} en total
          </p>
        </div>
        <button onClick={cargar} className="btn-secondary px-3" title="Actualizar">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Filtros por tipo */}
      <div className="flex gap-2 flex-wrap">
        {TIPOS.map(t => {
          const ts     = t !== 'Todos' ? TIPO_STYLE[t] : null
          const count  = t === 'Todos' ? items.length : conteo[t]
          const active = filtro === t
          return (
            <button
              key={t}
              onClick={() => setFiltro(t)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-150 border"
              style={active
                ? { background: ts?.bg || '#0a3b24', color: ts?.color || '#fff', borderColor: ts?.color || '#0a3b24' }
                : { background: 'white',             color: '#6b7280',           borderColor: '#e5e7eb'              }
              }
            >
              {t}
              <span className="text-[11px] font-bold opacity-60">{count}</span>
            </button>
          )
        })}
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
                  {['Fecha', 'Descripción', 'Tipo', 'Detalle', 'Monto'].map(h => (
                    <th key={h} className="table-head-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(item => {
                  const ts = TIPO_STYLE[item.tipo] || TIPO_STYLE.Gasto
                  return (
                    <tr key={`${item.tipo}-${item.id}`} className="table-row">
                      <td className="table-cell text-gray-500 whitespace-nowrap text-xs">
                        {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold text-ink max-w-[240px] truncate">
                          {item.descripcion}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                          style={{ background: ts.bg, color: ts.color }}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="table-cell text-gray-400 text-xs max-w-[130px] truncate">
                        {item.detalle || '—'}
                      </td>
                      <td className="table-cell font-bold whitespace-nowrap"
                        style={{ color: ts.color }}>
                        {ts.prefix}{fmt(item.monto)}
                      </td>
                    </tr>
                  )
                })}

                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center">
                      <LayoutList size={26} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-400 text-sm">No hay movimientos para mostrar</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
