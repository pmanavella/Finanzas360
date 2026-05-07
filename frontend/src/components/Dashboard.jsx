import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, FileText,
  ArrowUpRight, ArrowDownRight, Plus, RefreshCw
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'
import { api } from '../lib/api'

const CATEGORIAS_COLOR = {
  'Tecnología': '#0f5132',
  'RRHH':       '#2e8b57',
  'Insumos':    '#D9A441',
  'Servicios':  '#3b82f6',
  'Inversión':  '#8b5cf6',
  'Otros':      '#94a3b8',
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function MetricCard({ title, value, subtitle, icon: Icon, accent, trend, pct }) {
  const up = pct >= 0
  return (
    <div className="bg-white rounded-xl border border-muted shadow-card px-5 pt-5 pb-4 relative overflow-hidden">
      {/* Acento lateral */}
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full" style={{ background: accent }} />
      <div className="flex items-start justify-between mb-3 pl-2">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">{title}</p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}18` }}>
          <Icon size={15} style={{ color: accent }} strokeWidth={2} />
        </div>
      </div>
      <p className="text-[1.6rem] font-bold text-ink pl-2 leading-none mb-1.5" style={{ letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-400 pl-2 flex items-center gap-1">
          {trend && (
            <span className={`flex items-center gap-0.5 font-semibold ${up ? 'text-primary-600' : 'text-red-500'}`}>
              {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {Math.abs(pct)}%
            </span>
          )}
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default function Dashboard({ onNavigate }) {
  const [metricas, setMetricas] = useState(null)
  const [movRecientes, setMovRecientes] = useState([])
  const [comprobantes, setComprobantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, mov, comp] = await Promise.all([
        api.getMetricas(),
        api.getMovimientos(),
        api.getComprobantes(),
      ])
      setMetricas(m)
      setMovRecientes(mov.data.slice(0, 7))
      setComprobantes(comp.data.slice(0, 4))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-gray-400">
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm">Cargando datos...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="card p-8 text-center">
      <p className="text-red-600 mb-4 text-sm">{error}</p>
      <button onClick={cargar} className="btn-primary mx-auto">Reintentar</button>
    </div>
  )

  const pieData = metricas?.gastosPorCategoria?.map(g => ({
    name: g.categoria,
    value: g.total
  })) || []

  return (
    <div className="animate-fadeIn space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen financiero del período actual</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('gastos', { tipo: 'Gasto' })} className="btn-secondary">
            <TrendingDown size={15} /> Nuevo Gasto
          </button>
          <button onClick={() => onNavigate('ingresos', { tipo: 'Ingreso' })} className="btn-primary">
            <Plus size={15} /> Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ingresos del mes"
          value={fmt(metricas?.ingresos || 0)}
          subtitle="vs mes anterior"
          icon={TrendingUp}
          accent="#2e8b57"
          trend pct={metricas?.pctIngreso || 0}
        />
        <MetricCard
          title="Gastos del mes"
          value={fmt(metricas?.gastos || 0)}
          subtitle="vs mes anterior"
          icon={TrendingDown}
          accent="#ef4444"
          trend pct={metricas?.pctGasto || 0}
        />
        <MetricCard
          title="Balance neto"
          value={fmt(metricas?.balance || 0)}
          subtitle="Actualizado hoy"
          icon={DollarSign}
          accent="#3b82f6"
        />
        <MetricCard
          title="Comprobantes"
          value={comprobantes.length || 0}
          subtitle={`${metricas?.pendientesOCR || 0} pendientes OCR`}
          icon={FileText}
          accent="#D9A441"
        />
      </div>

      {/* Tabla + Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Movimientos recientes */}
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #E6E8DD' }}>
            <div>
              <h2 className="text-[14px] font-bold text-ink">Movimientos recientes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos registros</p>
            </div>
            <div className="flex gap-1">
              {['Todos', 'Ingresos', 'Gastos'].map(t => (
                <button
                  key={t}
                  onClick={() => t !== 'Todos' && onNavigate(t === 'Ingresos' ? 'ingresos' : 'gastos')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    t === 'Todos'
                      ? 'text-white'
                      : 'text-gray-500 hover:bg-cream'
                  }`}
                  style={t === 'Todos' ? { background: '#0f5132' } : {}}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Comp.', 'Monto'].map(h => (
                    <th key={h} className="table-head-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movRecientes.map(m => (
                  <tr key={m.id} className="table-row">
                    <td className="table-cell text-gray-500 whitespace-nowrap text-xs">
                      {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                    </td>
                    <td className="table-cell font-medium text-ink max-w-[160px] truncate">
                      {m.descripcion}
                    </td>
                    <td className="table-cell">
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-medium text-gray-600"
                        style={{ background: '#F7F8F3', border: '1px solid #E6E8DD' }}>
                        {m.categoria}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={m.tipo === 'Ingreso' ? 'badge-ingreso' : 'badge-gasto'}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="table-cell">
                      {m.comprobantes?.length > 0
                        ? <span className="badge-ocr">✓ OCR</span>
                        : <span className="badge-pendiente">—</span>
                      }
                    </td>
                    <td className={`table-cell font-bold whitespace-nowrap ${
                      m.tipo === 'Ingreso' ? 'text-primary-700' : 'text-red-600'
                    }`}>
                      {m.tipo === 'Ingreso' ? '+' : '−'} {fmt(m.monto)}
                    </td>
                  </tr>
                ))}
                {movRecientes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                      No hay movimientos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex flex-col gap-4">

          {/* Gastos por categoría */}
          <div className="card p-5 flex-1">
            <h3 className="text-[13.5px] font-bold text-ink mb-0.5">Gastos por categoría</h3>
            <p className="text-xs text-gray-400 mb-4">Mes actual</p>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value"
                      strokeWidth={2} stroke="#F7F8F3">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORIAS_COLOR[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmt(v)}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #E6E8DD', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {pieData.map((entry) => {
                    const total = pieData.reduce((s, e) => s + e.value, 0)
                    const pct = total > 0 ? Math.round(entry.value / total * 100) : 0
                    return (
                      <div key={entry.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: CATEGORIAS_COLOR[entry.name] || '#94a3b8' }} />
                          {entry.name}
                        </span>
                        <span className="text-xs font-semibold text-ink">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-10">Sin gastos este mes</p>
            )}
          </div>

          {/* Comprobantes recientes */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13.5px] font-bold text-ink">Comprobantes</h3>
              <button onClick={() => onNavigate('comprobantes')}
                className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                Ver todos →
              </button>
            </div>
            <div className="space-y-2">
              {comprobantes.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-1.5" style={{ borderBottom: '1px solid #F7F8F3' }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                    c.tipo_archivo === 'application/pdf' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {c.tipo_archivo === 'application/pdf' ? 'PDF' : 'IMG'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink truncate">{c.nombre_archivo}</p>
                    <p className="text-[10.5px] text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('es-AR')}
                      {c.ocr_monto ? ` · ${fmt(c.ocr_monto)}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${
                    c.ocr_estado === 'procesado' ? 'text-primary-600'
                    : c.ocr_estado === 'error' ? 'text-red-500'
                    : 'text-amber-500'
                  }`}>
                    {c.ocr_estado === 'procesado' ? '✓' : c.ocr_estado === 'error' ? '✕' : '…'}
                  </span>
                </div>
              ))}
              {comprobantes.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-5">Sin comprobantes</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
