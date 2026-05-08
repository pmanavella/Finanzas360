import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Upload } from 'lucide-react'
import { api } from '../lib/api'

const CATEGORIAS = ['Tecnología', 'RRHH', 'Insumos', 'Servicios', 'Inversión', 'Otros']

const INICIAL = {
  fecha: new Date().toISOString().split('T')[0],
  descripcion: '',
  categoria: 'Servicios',
  tipo: 'Gasto',
  monto: '',
  proveedor_cliente: '',
  notas: '',
}

export default function FormMovimiento({ tipo, movimiento, onClose, onSaved }) {
  const [form, setForm] = useState(
    movimiento
      ? { ...movimiento }
      : { ...INICIAL, tipo: tipo || 'Gasto' }
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [archivo, setArchivo] = useState(null)
  const [ocrData, setOcrData] = useState(null)
  const [uploadingOCR, setUploadingOCR] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleArchivo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setArchivo(file)
    setUploadingOCR(true)
    setOcrData(null)
    try {
      const fd = new FormData()
      fd.append('archivo', file)
      const res = await api.subirComprobante(fd)
      setOcrData({ comprobanteId: res.comprobante.id, ...res.ocr })
      if (res.ocr.fecha && !form.fecha) set('fecha', res.ocr.fecha)
      if (res.ocr.monto && !form.monto) set('monto', String(res.ocr.monto))
      if (res.ocr.proveedor && !form.proveedor_cliente) set('proveedor_cliente', res.ocr.proveedor)
    } catch (err) {
      console.error('OCR error:', err)
    } finally {
      setUploadingOCR(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.fecha || !form.descripcion || !form.monto) {
      setError('Completá los campos obligatorios: fecha, descripción y monto.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      let saved
      if (movimiento) {
        saved = await api.editarMovimiento(movimiento.id, form)
      } else {
        saved = await api.crearMovimiento(form)
        if (ocrData?.comprobanteId) {
          await api.vincularComprobante(ocrData.comprobanteId, saved.id)
        }
      }
      onSaved(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none bg-white transition-colors focus:ring-2 focus:ring-teal-700/10'
  const inputStyle = { borderColor: 'rgba(15,110,86,0.25)' }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card fade-in"
        style={{ maxWidth: 480 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-accent" />

        <div className="modal-header">
          <h2 className="modal-title">
            {movimiento ? 'Editar movimiento' : 'Nuevo movimiento'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body space-y-3">
          {!movimiento && (
            <div className="flex gap-2">
              {['Ingreso', 'Gasto'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tipo', t)}
                  className="flex-1 py-2 rounded-xl text-[13px] font-medium border transition-all"
                  style={form.tipo === t
                    ? t === 'Ingreso'
                      ? { background: '#E1F5EE', borderColor: '#0F6E56', color: '#0F6E56' }
                      : { background: '#FEE2E2', borderColor: '#DC2626', color: '#DC2626' }
                    : { background: 'white', borderColor: 'rgba(15,110,86,0.2)', color: '#6b7280' }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                className={inputCls} style={inputStyle} />
            </div>
            <div>
              <label className="form-label">Monto *</label>
              <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)}
                placeholder="0.00" min="0" step="0.01" className={inputCls} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="form-label">Categoría</label>
            <div className="relative">
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                className={inputCls + ' appearance-none pr-8'} style={inputStyle}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div>
            <label className="form-label">Descripción *</label>
            <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Ej: Servidor AWS Marzo 2026" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="form-label">{form.tipo === 'Ingreso' ? 'Cliente' : 'Proveedor'}</label>
            <input type="text" value={form.proveedor_cliente} onChange={e => set('proveedor_cliente', e.target.value)}
              placeholder={form.tipo === 'Ingreso' ? 'Nombre cliente' : 'Nombre proveedor'}
              className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="form-label">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={2} placeholder="Notas adicionales..."
              className={inputCls + ' resize-none'} style={inputStyle} />
          </div>

          {!movimiento && (
            <div>
              <label className="form-label">Comprobante opcional</label>
              <label className={`h-[42px] flex items-center gap-2 px-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-[13px] ${
                archivo ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-gray-300 text-gray-500'
              }`}>
                <Upload size={15} />
                <span className="truncate">
                  {uploadingOCR ? 'Procesando OCR...' : archivo ? archivo.name : 'Subir imagen o PDF'}
                </span>
                <input type="file" accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleArchivo} className="hidden" />
              </label>
            </div>
          )}

          {ocrData && ocrData.estado === 'procesado' && (
            <div className="p-2.5 bg-blue-50 rounded-xl text-xs text-blue-800">
              <p className="font-medium">OCR completado</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {ocrData.fecha && <span>Fecha: {ocrData.fecha}</span>}
                {ocrData.monto && <span>Monto: ${ocrData.monto.toLocaleString('es-AR')}</span>}
                {ocrData.proveedor && <span>Proveedor: {ocrData.proveedor}</span>}
              </div>
            </div>
          )}

          {ocrData && ocrData.estado === 'error' && (
            <p className="text-xs text-amber-600">
              No se pudo extraer datos del comprobante. Completá los campos manualmente.
            </p>
          )}

          {error && (
            <div className="p-2.5 bg-red-50 rounded-xl text-[13px] text-red-600">{error}</div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#0F6E56' }}>
            <Save size={15} />
            {loading ? 'Guardando...' : movimiento ? 'Guardar cambios' : 'Crear registro'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
