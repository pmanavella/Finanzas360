import { useState, useEffect } from 'react'
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
      // Pre-completar form con datos OCR si no hay nada
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
        // Vincular comprobante si se subió
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            {movimiento ? 'Editar' : 'Nuevo'} {form.tipo}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Tipo */}
          {!movimiento && (
            <div className="flex gap-2">
              {['Ingreso', 'Gasto'].map(t => (
                <button
                  key={t}
                  onClick={() => set('tipo', t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.tipo === t
                      ? t === 'Ingreso'
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-red-50 border-red-300 text-red-600'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Fecha *</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Monto *</label>
              <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)}
                placeholder="0.00" min="0" step="0.01" className="input-field" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Descripción *</label>
            <input type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Ej: Servidor AWS Marzo 2026" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Categoría *</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)} className="input-field">
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                {form.tipo === 'Ingreso' ? 'Cliente' : 'Proveedor'}
              </label>
              <input type="text" value={form.proveedor_cliente}
                onChange={e => set('proveedor_cliente', e.target.value)}
                placeholder={form.tipo === 'Ingreso' ? 'Nombre cliente' : 'Nombre proveedor'}
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={2} placeholder="Notas adicionales..." className="input-field resize-none" />
          </div>

          {/* Upload comprobante */}
          {!movimiento && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Comprobante (opcional)
              </label>
              <label className={`flex items-center gap-2 px-3 py-2.5 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-sm ${
                archivo ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300 text-gray-500'
              }`}>
                <Upload size={16} />
                {uploadingOCR ? 'Procesando OCR...' : archivo ? archivo.name : 'Subir imagen o PDF'}
                <input type="file" accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handleArchivo} className="hidden" />
              </label>

              {/* OCR resultado */}
              {ocrData && ocrData.estado === 'procesado' && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                  <p className="font-medium mb-1">✓ OCR completado</p>
                  {ocrData.fecha && <p>Fecha detectada: {ocrData.fecha}</p>}
                  {ocrData.monto && <p>Monto detectado: ${ocrData.monto.toLocaleString('es-AR')}</p>}
                  {ocrData.proveedor && <p>Proveedor/emisor: {ocrData.proveedor}</p>}
                  <p className="text-blue-600 mt-1">Los campos se pre-completaron automáticamente.</p>
                </div>
              )}
              {ocrData && ocrData.estado === 'error' && (
                <p className="mt-1 text-xs text-amber-600">
                  No se pudo extraer datos del comprobante. Completá los campos manualmente.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">{error}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 justify-center">
            <Save size={16} />
            {loading ? 'Guardando...' : movimiento ? 'Guardar cambios' : 'Crear registro'}
          </button>
        </div>
      </div>
    </div>
  )
}
