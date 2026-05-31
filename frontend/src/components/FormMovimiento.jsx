import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Upload, Repeat2, ChevronDown } from 'lucide-react'
import { api } from '../lib/api'

const CATEGORIAS = ['Tecnología', 'RRHH', 'Insumos', 'Servicios', 'Inversión', 'Suscripción', 'Otros']

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']

function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) return 'El archivo excede el tamaño máximo permitido (10 MB)'
  if (!ALLOWED_TYPES.includes(file.type)) return 'Formato de archivo no permitido. Solo JPG, PNG o PDF.'
  return null
}

const INICIAL = {
  fecha: new Date().toISOString().split('T')[0],
  descripcion: '',
  categoria: 'Servicios',
  tipo: 'Gasto',
  monto: '',
  proveedor_cliente: '',
  notas: '',
}

const SUSC_INICIAL = {
  nombre: '', detalle: '', proveedor: '',
  monto: '', moneda: 'ARS',
  dia_vencimiento: '', frecuencia: 'Mensual',
}

const inputCls = 'w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none bg-white transition-colors focus:ring-2 focus:ring-teal-700/10'
const inputStyle = { borderColor: 'rgba(15,110,86,0.25)' }

export default function FormMovimiento({ tipo, movimiento, onClose, onSaved }) {
  const [form, setForm] = useState(
    movimiento ? { ...movimiento } : { ...INICIAL, tipo: tipo || 'Gasto' }
  )

  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
  const [success,      setSuccess]      = useState(false)
  const [archivo,      setArchivo]      = useState(null)
  const [ocrData,      setOcrData]      = useState(null)
  const [uploadingOCR, setUploadingOCR] = useState(false)

  // Integración de suscripciones
  const [suscMode,        setSuscMode]        = useState('ninguna') // 'ninguna' | 'existente' | 'nueva'
  const [suscripciones,   setSuscripciones]   = useState([])
  const [suscripcionId,   setSuscripcionId]   = useState('')
  const [nuevaSusc,       setNuevaSusc]       = useState({ ...SUSC_INICIAL })
  const [loadingSusc,     setLoadingSusc]     = useState(false)

  const esSuscripcion = form.tipo === 'Gasto' && form.categoria === 'Suscripción' && !movimiento

  // Cargar suscripciones activas cuando corresponde
  useEffect(() => {
    if (!esSuscripcion) return
    setLoadingSusc(true)
    api.getSuscripciones({ estado: 'Activa' })
      .then(r => setSuscripciones(r.data || []))
      .catch(() => setSuscripciones([]))
      .finally(() => setLoadingSusc(false))
  }, [esSuscripcion])

  // Autocompletar al seleccionar suscripción existente
  useEffect(() => {
    if (suscMode !== 'existente' || !suscripcionId) return
    const s = suscripciones.find(s => s.id === suscripcionId)
    if (!s) return
    set('descripcion', s.nombre)
    if (s.proveedor) set('proveedor_cliente', s.proveedor)
    if (s.moneda === 'ARS') {
      set('monto', String(s.monto))
    } else {
      api.getCotizacionDolar()
        .then(c => {
          const rate = c.valor_unico ?? c.valor_venta ?? c.valor_compra
          if (!rate) { set('monto', ''); return }
          set('monto', String(Math.round(Number(s.monto) * rate)))
        })
        .catch(() => {
          set('monto', '')
          setError('No se pudo obtener la cotización del dólar. Ingresá el monto manualmente.')
        })
    }
  }, [suscripcionId, suscMode])

  // Limpiar selección al cambiar modo
  useEffect(() => {
    setSuscripcionId('')
    setNuevaSusc({ ...SUSC_INICIAL })
  }, [suscMode])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setNS = (k, v) => setNuevaSusc(f => ({ ...f, [k]: v }))

  const handleArchivo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fileError = validateFile(file)
    if (fileError) { setError(fileError); return }
    setArchivo(file); setUploadingOCR(true); setOcrData(null); setError(null)
    try {
      const fd = new FormData()
      fd.append('archivo', file)
      const res = await api.subirComprobante(fd)
      setOcrData({ comprobanteId: res.comprobante.id, ...res.ocr })
      if (res.ocr.fecha && !form.fecha) set('fecha', res.ocr.fecha)
      if (res.ocr.monto && !form.monto) set('monto', String(res.ocr.monto))
      if (res.ocr.proveedor && !form.proveedor_cliente) set('proveedor_cliente', res.ocr.proveedor)
    } catch (err) {
      setError('No se pudo procesar el comprobante. Completá los campos manualmente.')
    } finally { setUploadingOCR(false) }
  }

  const handleSubmit = async () => {
    if (loading || success) return

    const fechaVal      = form.fecha
    const descripcionVal = form.descripcion?.trim()
    const montoVal      = parseFloat(form.monto)

    if (!fechaVal) { setError('La fecha es obligatoria.'); return }
    if (!descripcionVal) { setError('La descripción no puede estar vacía.'); return }
    if (!form.monto || isNaN(montoVal) || montoVal <= 0) { setError('El monto debe ser un número mayor a 0.'); return }

    // Validaciones de nueva suscripción
    if (esSuscripcion && suscMode === 'nueva') {
      if (!nuevaSusc.nombre?.trim()) { setError('El nombre de la suscripción es obligatorio.'); return }
      const diaNum = parseInt(nuevaSusc.dia_vencimiento)
      if (!nuevaSusc.dia_vencimiento || isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
        setError('El día de vencimiento de la suscripción debe ser entre 1 y 31.'); return
      }
    }

    setLoading(true); setError(null)
    try {
      let suscripcion_id = null

      if (esSuscripcion) {
        if (suscMode === 'existente' && suscripcionId) {
          suscripcion_id = suscripcionId
        } else if (suscMode === 'nueva') {
          const susc = await api.crearSuscripcion({
            nombre:         nuevaSusc.nombre.trim(),
            detalle:        nuevaSusc.detalle?.trim() || null,
            proveedor:      nuevaSusc.proveedor?.trim() || null,
            monto:          montoVal,
            moneda:         nuevaSusc.moneda,
            dia_vencimiento: parseInt(nuevaSusc.dia_vencimiento),
            frecuencia:     nuevaSusc.frecuencia,
            estado:         'Activa',
          })
          suscripcion_id = susc.id
        }
      }

      let saved
      const payload = { ...form, descripcion: descripcionVal, suscripcion_id }
      if (movimiento) {
        saved = await api.editarMovimiento(movimiento.id, payload)
      } else {
        saved = await api.crearMovimiento(payload)
        if (ocrData?.comprobanteId) {
          await api.vincularComprobante(ocrData.comprobanteId, saved.id)
        }
      }
      setSuccess(true)
      setTimeout(() => onSaved(saved), 900)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div data-testid="form-movimiento" className="modal-card fade-in" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
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
                <button key={t} type="button" onClick={() => set('tipo', t)}
                  className="flex-1 py-2 rounded-xl text-[13px] font-medium border transition-all"
                  style={form.tipo === t
                    ? t === 'Ingreso'
                      ? { background: '#E1F5EE', borderColor: '#0F6E56', color: '#0F6E56' }
                      : { background: '#FEE2E2', borderColor: '#DC2626', color: '#DC2626' }
                    : { background: 'white', borderColor: 'rgba(15,110,86,0.2)', color: '#6b7280' }
                  }>
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
              <input data-testid="input-monto" type="number" value={form.monto} onChange={e => set('monto', e.target.value)}
                placeholder="0.00" min="0" step="0.01" className={inputCls} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="form-label">Descripción *</label>
            <input data-testid="input-descripcion" type="text" value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Ej: Servidor AWS Marzo 2026" className={inputCls} style={inputStyle} />
          </div>

          <div>
            <label className="form-label">Categoría</label>
            <div className="relative">
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                className={inputCls + ' appearance-none pr-8'} style={inputStyle}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="form-label">{form.tipo === 'Ingreso' ? 'Cliente' : 'Proveedor'}</label>
            <input type="text" value={form.proveedor_cliente} onChange={e => set('proveedor_cliente', e.target.value)}
              placeholder={form.tipo === 'Ingreso' ? 'Nombre cliente' : 'Nombre proveedor'}
              className={inputCls} style={inputStyle} />
          </div>

          {/* ── Integración de suscripciones ── */}
          {esSuscripcion && (
            <div className="rounded-xl border p-3 space-y-3" style={{ borderColor: 'rgba(15,110,86,0.2)', background: '#F7FBF9' }}>
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-700">
                <Repeat2 size={14} style={{ color: '#0F6E56' }} />
                ¿Este gasto corresponde a una suscripción?
              </div>
              {/* Selector de modo */}
              <div className="flex gap-2">
                {[['ninguna', 'No asociar'], ['existente', 'Seleccionar existente'], ['nueva', 'Crear nueva']].map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setSuscMode(val)}
                    className="flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-all"
                    style={suscMode === val
                      ? { background: '#0F6E56', borderColor: '#0F6E56', color: '#fff' }
                      : { background: '#fff', borderColor: 'rgba(15,110,86,0.25)', color: '#6b7280' }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Seleccionar existente */}
              {suscMode === 'existente' && (
                <div>
                  <label className="form-label">Suscripción activa</label>
                  <div className="relative">
                    <select value={suscripcionId} onChange={e => setSuscripcionId(e.target.value)}
                      className={inputCls + ' appearance-none pr-8'} style={inputStyle}
                      disabled={loadingSusc}>
                      <option value="">— Seleccioná una suscripción —</option>
                      {suscripciones.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nombre}{s.proveedor ? ` (${s.proveedor})` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  {suscripciones.length === 0 && !loadingSusc && (
                    <p className="text-[11.5px] text-gray-400 mt-1">No hay suscripciones activas registradas.</p>
                  )}
                </div>
              )}

              {/* Crear nueva */}
              {suscMode === 'nueva' && (
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="form-label">Nombre *</label>
                      <input value={nuevaSusc.nombre} onChange={e => setNS('nombre', e.target.value)}
                        placeholder="Ej: ChatGPT Plus" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="form-label">Proveedor</label>
                      <input value={nuevaSusc.proveedor} onChange={e => setNS('proveedor', e.target.value)}
                        placeholder="Ej: OpenAI" className={inputCls} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Detalle</label>
                    <input value={nuevaSusc.detalle} onChange={e => setNS('detalle', e.target.value)}
                      placeholder="Ej: Plan mensual con acceso a GPT-4" className={inputCls} style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="form-label">Moneda</label>
                      <div className="flex gap-1.5">
                        {['ARS', 'USD'].map(m => (
                          <button key={m} type="button" onClick={() => setNS('moneda', m)}
                            className="flex-1 py-2 rounded-xl text-[12px] font-semibold border transition-all"
                            style={nuevaSusc.moneda === m
                              ? { background: '#0F6E56', borderColor: '#0F6E56', color: '#fff' }
                              : { background: '#fff', borderColor: 'rgba(15,110,86,0.25)', color: '#6b7280' }}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Día vcto. *</label>
                      <input type="number" value={nuevaSusc.dia_vencimiento}
                        onChange={e => setNS('dia_vencimiento', e.target.value)}
                        placeholder="1–31" min="1" max="31" className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="form-label">Frecuencia</label>
                      <div className="relative">
                        <select value={nuevaSusc.frecuencia} onChange={e => setNS('frecuencia', e.target.value)}
                          className={inputCls + ' appearance-none pr-6 text-[12px]'} style={inputStyle}>
                          {['Mensual', 'Trimestral', 'Semestral', 'Anual'].map(f => <option key={f}>{f}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="form-label">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={2} placeholder="Notas adicionales..."
              className={inputCls + ' resize-none'} style={inputStyle} />
          </div>

          {!movimiento && (
            <div>
              <label className="form-label">Comprobante (opcional)</label>
              <label className={`h-[42px] flex items-center gap-2 px-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-[13px] ${
                archivo ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-gray-300 text-gray-500'
              }`}>
                <Upload size={15} />
                <span className="truncate">
                  {uploadingOCR ? 'Procesando OCR...' : archivo ? archivo.name : 'Subir imagen o PDF (máx. 10 MB)'}
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

          {success && (
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl text-[13px] text-green-700 flex items-center gap-2">
              <span>✓</span> Movimiento guardado correctamente
            </div>
          )}

          {error && !success && (
            <div className="p-2.5 bg-red-50 rounded-xl text-[13px] text-red-600">{error}</div>
          )}
        </div>

        <div className="modal-footer">
          <button
            data-testid="btn-cancelar-movimiento"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ borderColor: 'rgba(15,110,86,0.2)' }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading || success}
            className="flex-1 py-2.5 rounded-xl text-white text-[13px] font-semibold shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#0F6E56' }}>
            <Save size={15} />
            {loading ? 'Guardando...' : success ? 'Guardado ✓' : movimiento ? 'Guardar cambios' : 'Crear registro'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
