import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, DollarSign, FileText,
  Plus, RefreshCw, Calendar, ChevronDown, CheckCircle2
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../lib/api'

/* ── Colores ──────────────────────────────────────────── */
const CAT_COLORS = {
  Tecnología: '#6ee7b7', RRHH: '#86efac', Insumos: '#fde68a',
  Servicios: '#93c5fd', Inversión: '#c4b5fd', Otros: '#e2e8f0',
}
const FALLBACK_COLORS = ['#86efac','#fde68a','#93c5fd','#c4b5fd','#fed7aa','#a5f3fc']

const CARDS = [
  { key:'ingresos',     title:'Ingresos del mes', icon:TrendingUp,  iconBg:'#dcfce7', iconColor:'#16a34a', wave:'#22c55e', trendKey:'pctIngreso', subtitle:'vs mes anterior', trend:true  },
  { key:'gastos',       title:'Gastos del mes',   icon:TrendingDown,iconBg:'#fee2e2', iconColor:'#ef4444', wave:'#ef4444', trendKey:'pctGasto',   subtitle:'vs mes anterior', trend:true  },
  { key:'balance',      title:'Balance neto',     icon:DollarSign,  iconBg:'#fef9c3', iconColor:'#ca8a04', wave:'#eab308', subtitle:'Actualizado hoy',              trend:false },
  { key:'comprobantes', title:'Comprobantes',     icon:FileText,    iconBg:'#e0f2fe', iconColor:'#0284c7', wave:'#0ea5e9', subtitle:null,                           trend:false },
]

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(n)
}
function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}
function todayStr() {
  return new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' })
}

/* ── Wave SVG decoración ──────────────────────────────── */
function CardWave({ color }) {
  return (
    <svg viewBox="0 0 320 72" preserveAspectRatio="none"
      style={{ position:'absolute', bottom:0, left:0, width:'100%', height:58, pointerEvents:'none' }}>
      <path d="M0,36 C53,66 106,6 160,36 C213,66 266,6 320,36 L320,72 L0,72 Z"
        fill={color} fillOpacity="0.09" />
      <path d="M0,50 C60,80 120,20 180,50 C220,70 265,35 320,50 L320,72 L0,72 Z"
        fill={color} fillOpacity="0.06" />
    </svg>
  )
}

/* ── Metric Card ──────────────────────────────────────── */
function MetricCard({ cfg, value, pct, pendientes, delay }) {
  const { title, icon:Icon, iconBg, iconColor, wave, subtitle, trend } = cfg
  const isComprobantes = cfg.key === 'comprobantes'
  const displayValue = isComprobantes ? (value || 0) : fmt(value || 0)
  const displaySub = isComprobantes ? `${pendientes || 0} pendientes OCR` : subtitle
  const up = pct >= 0

  return (
    <div
      className={`bg-white rounded-2xl px-5 py-5 relative overflow-hidden animate-popIn ${delay}`}
      style={{ boxShadow:'0 1px 4px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.05)', transition:'transform .2s cubic-bezier(.16,1,.3,1), box-shadow .2s ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.09), 0 12px 32px rgba(0,0,0,0.07)' }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.05), 0 6px 20px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}>
          <Icon size={20} style={{ color: iconColor }} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium mb-1">{title}</p>
          <p className="font-black text-ink leading-none mb-1.5"
            style={{ fontSize:'clamp(1.3rem,2.5vw,1.65rem)', letterSpacing:'-0.02em' }}>
            {displayValue}
          </p>
          {trend && pct !== undefined ? (
            <p className="text-xs flex items-center gap-1 font-medium" style={{ color: up ? '#16a34a' : '#ef4444' }}>
              {up ? '↑' : '↓'} {Math.abs(pct)}% <span className="text-gray-400 font-normal">{displaySub}</span>
            </p>
          ) : displaySub ? (
            <p className="text-xs text-gray-400">{displaySub}</p>
          ) : null}
        </div>
      </div>
      <CardWave color={wave} />
    </div>
  )
}

/* ── Tooltip del gráfico ──────────────────────────────── */
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-card-lg px-3 py-2 border border-muted text-xs animate-fadeIn">
      <p className="font-bold text-ink mb-0.5">{payload[0].name}</p>
      <p className="text-gray-500">{fmt(payload[0].value)}</p>
    </div>
  )
}

/* ── Dashboard ────────────────────────────────────────── */
export default function Dashboard({ onNavigate }) {
  const [metricas,        setMetricas]        = useState(null)
  const [movs,            setMovs]            = useState([])
  const [allMovs,         setAllMovs]         = useState([])
  const [comps,           setComps]           = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)
  const [filtro,          setFiltro]          = useState('Todos')
  const [periodoGrafico,  setPeriodoGrafico]  = useState('mes')
  const [showPeriodoMenu, setShowPeriodoMenu] = useState(false)

  const cargar = async () => {
    setLoading(true); setError(null)
    try {
      const [m, mov, comp] = await Promise.all([
        api.getMetricas(), api.getMovimientos(), api.getComprobantes(),
      ])
      setMetricas(m)
      setAllMovs(mov.data)
      setMovs(mov.data.slice(0, 7))
      setComps(comp.data.slice(0, 6))
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-primary-100" />
          <div className="absolute inset-0 rounded-full border-2 border-t-primary-600 animate-spin" />
        </div>
        <span className="text-sm text-gray-400 font-medium">Cargando datos...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="card p-8 text-center animate-fadeIn">
      <p className="text-red-500 mb-4 text-sm">{error}</p>
      <button onClick={cargar} className="btn-primary mx-auto">Reintentar</button>
    </div>
  )

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  const now = new Date()
  const periodoStart = periodoGrafico === 'mes'
    ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    : `${now.getFullYear()}-01-01`
  const pieData = allMovs
    .filter(m => m.tipo === 'Gasto' && m.fecha >= periodoStart)
    .reduce((acc, m) => {
      const found = acc.find(e => e.name === m.categoria)
      if (found) found.value += Number(m.monto)
      else acc.push({ name: m.categoria, value: Number(m.monto) })
      return acc
    }, [])
  const movFiltrados = filtro === 'Todos' ? movs : movs.filter(m => m.tipo === (filtro === 'Ingresos' ? 'Ingreso' : 'Gasto'))
  const delays = ['delay-0','delay-75','delay-150','delay-225']

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slideUp">
        <div>
          <p className="text-[13.5px] font-semibold mb-0.5" style={{ color:'#16a34a' }}>
            ¡{greeting()}{user?.nombre ? `, ${user.nombre}` : ''}!
          </p>
          <h1 className="text-[1.75rem] font-black text-ink tracking-tight leading-tight">
            Resumen financiero
          </h1>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Calendar size={11} className="text-gray-400" />
            <p className="text-xs text-gray-400 capitalize">{todayStr()}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => onNavigate('gastos')} className="btn-secondary">
            <TrendingDown size={14} /> Nuevo Gasto
          </button>
          <button onClick={() => onNavigate('ingresos')} className="btn-primary">
            <Plus size={14} /> Nuevo Ingreso
          </button>
        </div>
      </div>

      {/* ── Métricas ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((cfg, i) => (
          <MetricCard key={cfg.key} cfg={cfg}
            value={cfg.key === 'comprobantes' ? comps.length : metricas?.[cfg.key]}
            pct={metricas?.[cfg.trendKey]}
            pendientes={metricas?.pendientesOCR}
            delay={delays[i]}
          />
        ))}
      </div>

      {/* ── Tabla + Gráfico ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Movimientos recientes */}
        <div className="card lg:col-span-2 overflow-hidden animate-slideUp delay-300">
          <div className="flex items-center justify-between px-5 pt-5 pb-3"
            style={{ borderBottom:'1px solid #f1f5f9' }}>
            <div>
              <h2 className="text-[14px] font-bold text-ink">Movimientos recientes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Últimos registros</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5 p-1 rounded-xl" style={{ background:'#f8fafc' }}>
                {['Todos','Ingresos','Gastos'].map(t => (
                  <button key={t} onClick={() => setFiltro(t)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all duration-150"
                    style={filtro === t
                      ? { background:'#0a3b24', color:'#fff', boxShadow:'0 1px 4px rgba(10,59,36,.25)' }
                      : { color:'#9ca3af' }}>
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={() => onNavigate('todos')}
                className="text-xs font-bold hidden sm:flex items-center gap-1 transition-opacity hover:opacity-60"
                style={{ color:'#16a34a' }}>
                Ver todos →
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Fecha','Descripción','Categoría','Tipo','Comp.','Monto'].map(h => (
                    <th key={h} className="table-head-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movFiltrados.map((m, idx) => (
                  <tr key={m.id} className="table-row animate-fadeIn"
                    style={{ animationDelay:`${idx * 35}ms` }}>
                    <td className="table-cell text-gray-400 whitespace-nowrap text-xs font-medium">
                      {new Date(m.fecha + 'T00:00:00').toLocaleDateString('es-AR')}
                    </td>
                    <td className="table-cell font-semibold text-ink max-w-[150px] truncate">
                      {m.descripcion}
                    </td>
                    <td className="table-cell">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold"
                        style={{
                          background: (CAT_COLORS[m.categoria] || '#e2e8f0') + '40',
                          color: '#374151',
                          border: `1px solid ${CAT_COLORS[m.categoria] || '#e2e8f0'}`,
                        }}>
                        {m.categoria}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                        style={m.tipo === 'Ingreso'
                          ? { background:'#dcfce7', color:'#16a34a' }
                          : { background:'#fee2e2', color:'#ef4444' }}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="table-cell">
                      {m.comprobantes?.length > 0
                        ? <CheckCircle2 size={16} style={{ color:'#16a34a' }} />
                        : <span className="text-gray-300 text-sm">—</span>}
                    </td>
                    <td className="table-cell font-black whitespace-nowrap"
                      style={{ color: m.tipo === 'Ingreso' ? '#16a34a' : '#ef4444' }}>
                      {m.tipo === 'Ingreso' ? '+' : '−'}{fmt(m.monto)}
                    </td>
                  </tr>
                ))}
                {movFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <p className="text-sm text-gray-400">No hay movimientos para mostrar</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gastos por categoría */}
        <div className="card p-5 animate-slideUp delay-400">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-ink">Gastos por categoría</h3>
            <div className="relative">
              <button
                onClick={() => setShowPeriodoMenu(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-500 font-medium px-2.5 py-1.5 rounded-lg border border-muted hover:bg-cream transition-colors">
                {periodoGrafico === 'mes' ? 'Este mes' : 'Este año'} <ChevronDown size={12} className={`transition-transform duration-150 ${showPeriodoMenu ? 'rotate-180' : ''}`} />
              </button>
              {showPeriodoMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPeriodoMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-muted rounded-xl shadow-lg py-1 z-20 w-28">
                    {[['mes', 'Este mes'], ['año', 'Este año']].map(([val, label]) => (
                      <button key={val}
                        onClick={() => { setPeriodoGrafico(val); setShowPeriodoMenu(false) }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-cream transition-colors"
                        style={{ color: periodoGrafico === val ? '#0a3b24' : '#6b7280', fontWeight: periodoGrafico === val ? 700 : 500 }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {pieData.length > 0 ? (
            <div className="flex items-center gap-3">
              {/* Donut chart */}
              <div style={{ width:155, height:175, flexShrink:0 }}>
                <PieChart width={155} height={175}>
                  <Pie data={pieData} cx={77} cy={87}
                    innerRadius={50} outerRadius={72}
                    dataKey="value" strokeWidth={3} stroke="#fff"
                    paddingAngle={4} animationBegin={200} animationDuration={900}>
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={CAT_COLORS[e.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </div>
              {/* Leyenda lateral */}
              <div className="flex-1 space-y-3 min-w-0">
                {pieData.map((entry, i) => {
                  const total = pieData.reduce((s, e) => s + e.value, 0)
                  const pct = total > 0 ? Math.round(entry.value / total * 100) : 0
                  const color = CAT_COLORS[entry.name] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                  return (
                    <div key={entry.name} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-[12px] text-gray-600 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background:color }} />
                        <span className="truncate">{entry.name}</span>
                      </span>
                      <span className="text-[12px] font-bold text-ink flex-shrink-0">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <TrendingDown size={30} className="mb-2" />
              <p className="text-sm">Sin gastos este mes</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Comprobantes (full width) ───────────────────── */}
      <div className="card p-5 animate-slideUp delay-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-bold text-ink">Comprobantes</h3>
          <button onClick={() => onNavigate('comprobantes')}
            className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-60"
            style={{ color:'#16a34a' }}>
            Ver todos →
          </button>
        </div>

        {comps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {comps.map((c, idx) => (
              <div key={c.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 animate-fadeIn"
                style={{ background:'#f8fafc', animationDelay:`${500 + idx * 50}ms` }}
                onMouseEnter={e => e.currentTarget.style.background='#f0fdf4'}
                onMouseLeave={e => e.currentTarget.style.background='#f8fafc'}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0"
                  style={c.tipo_archivo === 'application/pdf'
                    ? { background:'#fee2e2', color:'#991b1b' }
                    : { background:'#dbeafe', color:'#1e40af' }}>
                  {c.tipo_archivo === 'application/pdf' ? 'PDF' : 'IMG'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{c.nombre_archivo}</p>
                  <p className="text-[10.5px] text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('es-AR')}
                    {c.ocr_monto ? ` · ${fmt(c.ocr_monto)}` : ''}
                  </p>
                </div>
                <span className="text-xs font-black flex-shrink-0"
                  style={{ color: c.ocr_estado === 'procesado' ? '#16a34a' : c.ocr_estado === 'error' ? '#ef4444' : '#d97706' }}>
                  {c.ocr_estado === 'procesado' ? '✓' : c.ocr_estado === 'error' ? '✕' : '…'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background:'#f0fdf4' }}>
              <FileText size={24} style={{ color:'#16a34a' }} strokeWidth={1.8} />
            </div>
            <p className="text-[13.5px] font-semibold text-gray-600 mb-1">Aún no hay comprobantes</p>
            <p className="text-xs text-gray-400">Cuando subas comprobantes, aparecerán aquí.</p>
          </div>
        )}
      </div>

    </div>
  )
}
