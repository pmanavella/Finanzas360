import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, BookOpen, Download, ChevronLeft, RefreshCw } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { api } from '../lib/api'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const FUENTES = [
  { value: 'Caja / Banco', label: 'Caja / Banco (por defecto)' },
  { value: 'Caja',                  label: 'Caja' },
  { value: 'Banco',                 label: 'Banco' },
  { value: 'Transferencia bancaria',label: 'Transferencia bancaria' },
  { value: 'Efectivo',              label: 'Efectivo' },
  { value: 'Cuenta corriente',      label: 'Cuenta corriente' },
  { value: 'Mercado Pago',          label: 'Mercado Pago' },
  { value: 'Tarjeta',               label: 'Tarjeta' },
  { value: 'Otra',                  label: 'Otra' },
]

const TIPO_STYLE = {
  Ingreso: { bg: '#dcfce7', color: '#16a34a' },
  Gasto:   { bg: '#fee2e2', color: '#ef4444' },
  Salario: { bg: '#fee2e2', color: '#ef4444' },
}

const CLSF_STYLE = {
  'Ingresos Operativos':  { bg: '#dcfce7', color: '#16a34a' },
  'Ingresos Financieros': { bg: '#dbeafe', color: '#2563eb' },
  'Egresos Operativos':   { bg: '#fef3c7', color: '#d97706' },
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

function getClasificacion(item) {
  if (item.tipo === 'Ingreso') {
    return ['Inversión', 'Financiero'].includes(item.categoria)
      ? 'Ingresos Financieros'
      : 'Ingresos Operativos'
  }
  return 'Egresos Operativos'
}

function getIncomeAccount(item) {
  return ['Inversión', 'Financiero'].includes(item.categoria)
    ? 'Ingresos financieros'
    : 'Ingresos por servicios'
}

function getExpenseAccount(item) {
  if (item.tipo === 'Salario') return 'Sueldos y jornales'
  const map = {
    Insumos:      'Gastos en insumos',
    'Tecnología': 'Gastos en tecnología',
    Servicios:    'Gastos en servicios',
    Sueldos:      'Sueldos y jornales',
    RRHH:         'Sueldos y jornales',
  }
  return map[item.categoria] || `Gastos en ${(item.categoria || 'otros').toLowerCase()}`
}

// Agrupa movimientos por (fecha, dirección) → construye asientos contables
function buildAsientos(items, fuentes) {
  const sorted = [...items].sort((a, b) => {
    const dc = a.fecha.localeCompare(b.fecha)
    if (dc !== 0) return dc
    return (a.tipo === 'Ingreso' ? 0 : 1) - (b.tipo === 'Ingreso' ? 0 : 1)
  })

  const groups = new Map()
  sorted.forEach(item => {
    const key = `${item.fecha}::${item.tipo === 'Ingreso' ? 'i' : 'e'}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })

  const asientos = []
  let num = 1

  groups.forEach((movs, key) => {
    const [fecha, dir] = key.split('::')
    const code = `A-${String(num++).padStart(3, '0')}`
    const lines = []
    let totalDebe = 0, totalHaber = 0

    if (dir === 'i') {
      // Ingreso: Caja/Banco Debe, cuenta de ingreso Haber
      const byFuente = {}
      movs.forEach(m => {
        const f = fuentes[`${m.tipo}-${m.id}`] || 'Caja / Banco'
        byFuente[f] = (byFuente[f] || 0) + m.monto
      })
      Object.entries(byFuente).forEach(([cuenta, monto]) => {
        lines.push({ side: 'debe', cuenta, monto })
        totalDebe += monto
      })
      movs.forEach(m => {
        lines.push({ side: 'haber', cuenta: getIncomeAccount(m), monto: m.monto })
        totalHaber += m.monto
      })
    } else {
      // Egreso/Salario: cuenta de gasto Debe, Caja/Banco Haber
      const byFuente = {}
      movs.forEach(m => {
        lines.push({ side: 'debe', cuenta: getExpenseAccount(m), monto: m.monto })
        totalDebe += m.monto
        const f = fuentes[`${m.tipo}-${m.id}`] || 'Caja / Banco'
        byFuente[f] = (byFuente[f] || 0) + m.monto
      })
      Object.entries(byFuente).forEach(([cuenta, monto]) => {
        lines.push({ side: 'haber', cuenta, monto })
        totalHaber += monto
      })
    }

    asientos.push({
      code, fecha, lines, totalDebe, totalHaber,
      ref: movs.map(m => m.descripcion).join(' · '),
    })
  })

  return asientos
}

function buildAndDownloadPDF(asientos, mes, anio, totalItems) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const PW = 210, PH = 297, M = 14, CW = PW - M * 2

  const mesNombre = MESES[mes - 1]
  const lastDayNum = new Date(anio, mes, 0).getDate()
  const fromStr = `01/${String(mes).padStart(2, '0')}/${anio}`
  const toStr   = `${String(lastDayNum).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`
  const today   = new Date().toLocaleDateString('es-AR')
  const totalD  = asientos.reduce((s, a) => s + a.totalDebe, 0)
  const totalH  = asientos.reduce((s, a) => s + a.totalHaber, 0)

  // Posiciones de columnas
  const COL = {
    fecha:  M,
    code:   M + 22,
    conc:   M + 44,
    concH:  M + 54,       // sangría para líneas Haber
    debeR:  PW - M - 28,  // alineación derecha columna Debe
    haberR: PW - M,       // alineación derecha columna Haber
  }
  const RH = 6 // altura de fila

  let y = 0

  function drawHeader() {
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(10, 59, 36)
    doc.text('Finanzas360', M, 13)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(23, 32, 51)
    doc.text('LIBRO DIARIO', M, 20)

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(110, 110, 110)
    doc.text(`Período: ${mesNombre} ${anio}   Desde: ${fromStr}   Hasta: ${toStr}`, M, 27)
    doc.text(`Generado: ${today}  ·  Asientos: ${asientos.length}  ·  Movimientos: ${totalItems}`, M, 32)

    doc.setDrawColor(200, 205, 200)
    doc.line(M, 35, PW - M, 35)
    return 37
  }

  function drawColHeader(startY) {
    doc.setFillColor(247, 248, 243)
    doc.rect(M, startY, CW, 7, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(140, 140, 140)
    doc.text('FECHA',    COL.fecha + 1,   startY + 5)
    doc.text('CÓDIGO',   COL.code + 1,    startY + 5)
    doc.text('CONCEPTO', COL.conc,        startY + 5)
    doc.text('DEBE',     COL.debeR,       startY + 5, { align: 'right' })
    doc.text('HABER',    COL.haberR,      startY + 5, { align: 'right' })
    return startY + 7
  }

  function ensureSpace(needed) {
    if (y + needed > PH - 18) {
      doc.addPage()
      y = drawHeader()
      y = drawColHeader(y)
    }
  }

  y = drawHeader()
  y = drawColHeader(y)

  asientos.forEach(asiento => {
    ensureSpace(RH * (asiento.lines.length + 2) + 14)

    // Fila encabezado de asiento (fecha + código)
    doc.setFillColor(248, 250, 248)
    doc.rect(M, y, CW, RH, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(60, 60, 60)
    const dateDisp = new Date(asiento.fecha + 'T00:00:00')
      .toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    doc.text(dateDisp,      COL.fecha + 1, y + 4.2)
    doc.text(asiento.code,  COL.code + 1,  y + 4.2)
    y += RH

    // Líneas de debe / haber
    asiento.lines.forEach(line => {
      ensureSpace(RH)
      doc.setFontSize(8)
      doc.setFont('helvetica', line.side === 'haber' ? 'normal' : 'bold')
      doc.setTextColor(23, 32, 51)
      doc.text(line.cuenta, line.side === 'haber' ? COL.concH : COL.conc, y + 4.2)
      if (line.side === 'debe') {
        doc.text(fmt(line.monto), COL.debeR,  y + 4.2, { align: 'right' })
      } else {
        doc.text(fmt(line.monto), COL.haberR, y + 4.2, { align: 'right' })
      }
      y += RH
    })

    // Ref (cursiva, pequeña)
    ensureSpace(8)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(155, 155, 155)
    const refW = COL.debeR - COL.conc - 4
    const refLines = doc.splitTextToSize(`Ref: ${asiento.ref}`, refW)
    doc.text(refLines, COL.conc, y + 4)
    y += Math.max(6, refLines.length * 4.2)

    // Separador + TOTAL ASIENTO
    ensureSpace(RH + 4)
    doc.setDrawColor(185, 190, 185)
    doc.line(COL.debeR - 32, y, PW - M, y)
    y += 2

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(23, 32, 51)
    doc.text('TOTAL ASIENTO',    COL.conc,  y + 4.2)
    doc.text(fmt(asiento.totalDebe),  COL.debeR,  y + 4.2, { align: 'right' })
    doc.text(fmt(asiento.totalHaber), COL.haberR, y + 4.2, { align: 'right' })
    y += RH + 5
  })

  // TOTAL PERÍODO
  ensureSpace(RH + 2)
  doc.setFillColor(225, 242, 230)
  doc.rect(M, y, CW, RH + 1, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 59, 36)
  doc.text('TOTAL PERÍODO',   COL.conc,  y + 5)
  doc.text(fmt(totalD),       COL.debeR,  y + 5, { align: 'right' })
  doc.text(fmt(totalH),       COL.haberR, y + 5, { align: 'right' })

  // Pie de página en todas las páginas
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(165, 165, 165)
    doc.setDrawColor(205, 210, 205)
    doc.line(M, PH - 12, PW - M, PH - 12)
    doc.text(
      `Documento generado automáticamente por Finanzas360  ·  Página ${i} de ${totalPages}`,
      M, PH - 7
    )
  }

  doc.save(`libro-diario-${mesNombre.toLowerCase()}-${anio}.pdf`)
}

// ── Componente principal ──────────────────────────────────────────
export default function LibroDiario({ onClose }) {
  const now = new Date()
  const [step,       setStep]       = useState(1)
  const [mes,        setMes]        = useState(now.getMonth() + 1)
  const [anio,       setAnio]       = useState(now.getFullYear())
  const [items,      setItems]      = useState([])
  const [fuentes,    setFuentes]    = useState({})
  const [loading,    setLoading]    = useState(false)
  const [generating, setGenerating] = useState(false)

  // Bloquear scroll del body mientras el modal esté abierto
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  async function cargarMovimientos() {
    setLoading(true)
    const firstDay = `${anio}-${String(mes).padStart(2, '0')}-01`
    const lastDay  = `${anio}-${String(mes).padStart(2, '0')}-${String(new Date(anio, mes, 0).getDate()).padStart(2, '0')}`

    try {
      const [movRes, salRes] = await Promise.allSettled([
        api.getMovimientos({ fecha_desde: firstDay, fecha_hasta: lastDay }),
        api.getMovimientosSalario({ fecha_desde: firstDay, fecha_hasta: lastDay }),
      ])

      const movs = movRes.status === 'fulfilled'
        ? (movRes.value.data || []).map(m => ({
            id:          m.id,
            fecha:       m.fecha,
            descripcion: m.descripcion,
            tipo:        m.tipo,
            categoria:   m.categoria,
            monto:       Number(m.monto),
            detalle:     m.categoria || '',
          }))
        : []

      const sals = salRes.status === 'fulfilled'
        ? (salRes.value.data || []).map(s => {
            const nombre = s.empleados
              ? `${s.empleados.nombre} ${s.empleados.apellido}`
              : '—'
            const cat = s.categorias_salariales?.nombre || 'Sueldo Base'
            return {
              id:          s.id,
              fecha:       s.fecha,
              descripcion: cat ? `${nombre} — ${cat}` : nombre,
              tipo:        'Salario',
              categoria:   cat,
              monto:       Number(s.monto),
              detalle:     cat,
            }
          })
        : []

      const all = [...movs, ...sals].sort((a, b) => a.fecha.localeCompare(b.fecha))
      setItems(all)

      const initFuentes = {}
      all.forEach(i => { initFuentes[`${i.tipo}-${i.id}`] = 'Caja / Banco' })
      setFuentes(initFuentes)
    } finally {
      setLoading(false)
    }
  }

  function handleConfirmar() {
    setGenerating(true)
    try {
      const asientos = buildAsientos(items, fuentes)
      buildAndDownloadPDF(asientos, mes, anio, items.length)
    } finally {
      setGenerating(false)
    }
  }

  // ── Modal paso 1: selector de período ────────────────────────────
  if (step === 1) {
    return createPortal(
      <div className="modal-overlay" style={{ background: 'rgba(10, 40, 25, 0.40)', overflow: 'hidden' }}>
        <div
          className="relative w-full max-w-md rounded-2xl shadow-xl p-6 animate-popIn"
          style={{ background: '#F7F8F3' }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2.5 mb-6">
            <BookOpen size={20} className="text-primary-900" />
            <h2 className="text-lg font-bold text-ink">Generar Libro Diario</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Mes</label>
              <select
                value={mes}
                onChange={e => setMes(Number(e.target.value))}
                className="input-field"
              >
                {MESES.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Año</label>
              <input
                type="number"
                value={anio}
                onChange={e => setAnio(Number(e.target.value))}
                min="2020"
                max="2099"
                className="input-field"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancelar
            </button>
            <button
              onClick={async () => { await cargarMovimientos(); setStep(2) }}
              disabled={loading}
              className="btn-primary flex-1 justify-center"
              style={{ opacity: loading ? 0.75 : 1 }}
            >
              {loading
                ? <><RefreshCw size={13} className="animate-spin" /> Cargando...</>
                : <><BookOpen size={13} /> Revisar movimientos</>
              }
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // ── Modal paso 2: revisión de movimientos ─────────────────────────
  return createPortal(
    <div className="modal-overlay" style={{ background: 'rgba(10, 40, 25, 0.40)', overflow: 'hidden' }}>
      <div
        className="relative w-full rounded-2xl shadow-xl flex flex-col animate-popIn"
        style={{ background: '#F7F8F3', maxWidth: '940px', maxHeight: 'calc(100vh - 40px)' }}
      >
        {/* Cabecera */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-muted flex-shrink-0">
          <button
            onClick={() => setStep(1)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Volver"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h2 className="text-base font-bold text-ink">
              Revisión · {MESES[mes - 1]} {anio}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {items.length} movimientos · Completá la fuente/modalidad donde corresponda
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabla con scroll */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 gap-2 text-sm">
              <RefreshCw size={15} className="animate-spin" />
              Cargando movimientos...
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No hay movimientos para este período
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10" style={{ background: '#eef0ea' }}>
                <tr>
                  {['FECHA', 'TIPO', 'CLASIFICACIÓN CONTABLE', 'DESCRIPCIÓN', 'MONTO', 'FUENTE / MODALIDAD'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-gray-400 tracking-wide uppercase whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => {
                  const ts   = TIPO_STYLE[item.tipo] || TIPO_STYLE.Gasto
                  const cls  = getClasificacion(item)
                  const cs   = CLSF_STYLE[cls] || {}
                  const fKey = `${item.tipo}-${item.id}`
                  const d    = new Date(item.fecha + 'T00:00:00')
                  return (
                    <tr key={fKey} className="border-b border-gray-100 hover:bg-white/40 transition-colors">
                      <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                        {d.getDate()}/{d.getMonth() + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: ts.bg, color: ts.color }}
                        >
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: cs.bg, color: cs.color }}
                        >
                          {cls}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-ink max-w-[170px] truncate" style={{ fontSize: '11px' }}>
                          {item.descripcion}
                        </div>
                        {item.detalle && (
                          <div className="text-gray-400 text-[10px] truncate max-w-[170px]">
                            {item.detalle}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-bold whitespace-nowrap text-ink">
                        $ {item.monto.toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={fuentes[fKey] || 'Caja / Banco'}
                          onChange={e => setFuentes(prev => ({ ...prev, [fKey]: e.target.value }))}
                          className="input-field text-[11px]"
                          style={{ minHeight: 'auto', paddingTop: '5px', paddingBottom: '5px' }}
                        >
                          {FUENTES.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Botón fijo al fondo */}
        <div className="px-6 py-4 border-t border-muted flex-shrink-0">
          <button
            onClick={handleConfirmar}
            disabled={generating || items.length === 0}
            className="btn-primary w-full justify-center py-3 text-sm"
            style={{ opacity: generating || items.length === 0 ? 0.6 : 1 }}
          >
            <Download size={15} />
            {generating ? 'Generando PDF...' : 'Confirmar y generar PDF'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
