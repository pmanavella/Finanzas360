import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, FileText,
  ArrowUpRight, ArrowDownRight, Plus, RefreshCw
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { api } from '../lib/api'

const COLORS = ['#1e6e45', '#37a86c', '#f59e0b', '#94a3b8']
const CATEGORIAS_COLOR = {
  'Tecnología': '#1e6e45',
  'RRHH': '#37a86c',
  'Insumos': '#f59e0b',
  'Servicios': '#3b82f6',
  'Inversión': '#8b5cf6',
  'Otros': '#94a3b8',
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function MetricCard({ title, value, subtitle, icon: Icon, color, trend, pct }) {
  const up = pct >= 0
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          {trend && (
            <span className={`flex items-center gap-0.5 font-medium ${up ? 'text-green-600' : 'text-red-500'}`}>
              {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
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
      <div className="flex items-center gap-3 text-gray-500">
        <RefreshCw size={20} className="animate-spin" />
        <span>Cargando datos...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="card p-6 text-center">
      <p className="text-red-600 mb-3">{error}</p>
      <button onClick={cargar} className="btn-primary mx-auto">Reintentar</button>
    </div>
  )

  const pieData = metricas?.gastosPorCategoria?.map(g => ({
    name: g.categoria,
    value: g.total
  })) || []

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Resumen financiero del mes actual</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('gastos', { tipo: 'Gasto' })} className="btn-secondary">
            <TrendingDown size={16} /> Nuevo Gasto
          </button>
          <button onClick={() => onNavigate('ingresos', { tipo: 'Ingreso' })} className="btn-primary">
            <Plus size={16} /> Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Ingresos del Mes"
          value={fmt(metricas?.ingresos || 0)}
          subtitle="vs mes anterior"
          icon={TrendingUp}
          color="bg-green-600"
          trend pct={metricas?.pctIngreso || 0}
        />
        <MetricCard
          title="Gastos del Mes"
          value={fmt(metricas?.gastos || 0)}
          subtitle="vs mes anterior"
          icon={TrendingDown}
          color="bg-red-500"
          trend pct={metricas?.pctGasto || 0}
        />
        <MetricCard
          title="Balance Neto"
          value={fmt(metricas?.balance || 0)}
          subtitle="Actualizado hoy"
          icon={DollarSign}
          color="bg-blue-600"
        />
        <MetricCard
          title="Comprobantes"
          value={comprobantes.length || 0}
          subtitle={`${metricas?.pendientesOCR || 0} pendientes de OCR`}
          icon={FileText}
          color="bg-amber-500"
        />
      </div>

      {/* Tabla + Gráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Movimientos recientes */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 className="font-semibold text-gray-900">Movimientos recientes</h2>
              <p className="text-xs text-gray-500">Últimos 30 días</p>
            </div>
            <div className="flex gap-1">
              {['Todos', 'Ingresos', 'Gastos'].map(t => (
                <button
                  key={t}
                  onClick={() => t !== 'Todos' && onNavigate(t === 'Ingresos' ? 'ingresos' : 'gastos')}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    t === 'Todos' ? 'bg-primary-700 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-gray-100">
                  {['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Comprobante', 'Monto'].map(h => (
                    <th key={h} className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movRecientes.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 max-w-[180px] truncate">
                      {m.descripcion}
                    </td>
                    <td className="py-3 px-4 text-gray-600">{m.categoria}</td>
                    <td className="py-3 px-4">
                      <span className={m.tipo === 'Ingreso' ? 'badge-ingreso' : 'badge-gasto'}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {m.comprobantes?.length > 0 ? (
                        <span className="badge-ocr">✓ OCR</span>
                      ) : (
                        <span className="badge-pendiente">Pendiente</span>
                      )}
                    </td>
                    <td className={`py-3 px-4 font-semibold whitespace-nowrap ${
                      m.tipo === 'Ingreso' ? 'text-green-700' : 'text-red-600'
                    }`}>
                      {m.tipo === 'Ingreso' ? '+' : '-'} {fmt(m.monto)}
                    </td>
                  </tr>
                ))}
                {movRecientes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400 text-sm">
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
            <h3 className="font-semibold text-gray-900 mb-1">Gastos por categoría</h3>
            <p className="text-xs text-gray-500 mb-3">Mes actual</p>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={CATEGORIAS_COLOR[entry.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {pieData.map((entry) => {
                    const total = pieData.reduce((s, e) => s + e.value, 0)
                    const pct = total > 0 ? Math.round(entry.value / total * 100) : 0
                    return (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-600">
                          <span className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: CATEGORIAS_COLOR[entry.name] || '#94a3b8' }} />
                          {entry.name}
                        </span>
                        <span className="font-medium text-gray-700">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Sin gastos este mes</p>
            )}
          </div>

          {/* Comprobantes recientes */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-sm">Comprobantes recientes</h3>
              <button onClick={() => onNavigate('comprobantes')} className="text-xs text-primary-700 hover:underline font-medium">
                Ver todos →
              </button>
            </div>
            <div className="space-y-2">
              {comprobantes.map(c => (
                <div key={c.id} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    c.tipo_archivo === 'application/pdf' ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {c.tipo_archivo === 'application/pdf' ? 'PDF' : 'IMG'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{c.nombre_archivo}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('es-AR')}
                      {c.ocr_monto ? ` · OCR $${c.ocr_monto.toLocaleString('es-AR')}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs ${c.ocr_estado === 'procesado' ? 'text-green-600' : c.ocr_estado === 'error' ? 'text-red-500' : 'text-yellow-600'}`}>
                    {c.ocr_estado === 'procesado' ? '✓' : c.ocr_estado === 'error' ? '✕' : '…'}
                  </span>
                </div>
              ))}
              {comprobantes.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Sin comprobantes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
