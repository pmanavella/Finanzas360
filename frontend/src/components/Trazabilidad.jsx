import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, RefreshCw, Activity } from 'lucide-react'
import { api } from '../lib/api'

const TIPO_STYLE = {
  Ingreso: { bg: '#dcfce7', color: '#16a34a' },
  Gasto:   { bg: '#fee2e2', color: '#ef4444' },
}

function fmt(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function fmtFecha(str) {
  if (!str) return '—'
  return new Date(str + 'T00:00:00').toLocaleDateString('es-AR')
}

function fmtFechaHora(str) {
  if (!str) return 'Sin fecha'
  return new Date(str).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Trazabilidad({ onClose }) {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    api.getTrazabilidad()
      .then(res => setRows(res.data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '100%', maxWidth: 860, maxHeight: '88vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-700" />
            <h2 className="text-base font-bold text-gray-800">Trazabilidad de movimientos</h2>
            {!loading && !error && (
              <span className="text-xs text-gray-400 font-normal ml-1">{rows.length} registros</span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-52 text-gray-400">
              <RefreshCw size={18} className="animate-spin mr-2" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-52 text-red-400 text-sm">{error}</div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400">
              <Activity size={26} className="mb-3 text-gray-300" />
              <p className="text-sm">No hay registros de trazabilidad</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Fecha mov.', 'Descripción', 'Tipo', 'Monto', 'Creado por', 'Fecha de creación'].map(h => (
                    <th key={h} className="table-head-cell">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const ts = TIPO_STYLE[row.tipo] || { bg: '#f3f4f6', color: '#6b7280' }
                  return (
                    <tr key={row.id} className="table-row">
                      <td className="table-cell text-gray-500 whitespace-nowrap text-xs">
                        {fmtFecha(row.fecha)}
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold text-ink max-w-[200px] truncate">
                          {row.descripcion || '—'}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold"
                          style={{ background: ts.bg, color: ts.color }}>
                          {row.tipo || '—'}
                        </span>
                      </td>
                      <td className="table-cell font-bold whitespace-nowrap" style={{ color: ts.color }}>
                        {row.monto != null ? fmt(row.monto) : '—'}
                      </td>
                      <td className="table-cell text-gray-500 text-xs">
                        {row.created_by || <span className="italic text-gray-300">No registrado</span>}
                      </td>
                      <td className="table-cell text-gray-400 text-xs whitespace-nowrap">
                        {fmtFechaHora(row.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex justify-end">
          <button onClick={onClose} className="btn-secondary text-sm px-4">Cerrar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
