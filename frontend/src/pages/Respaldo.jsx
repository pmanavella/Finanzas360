import { useState, useRef } from 'react'
import { Download, Upload, CheckCircle, XCircle, RefreshCw, ShieldCheck, Lock, AlertCircle, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { api } from '../lib/api'
import { canAccessAdmin } from '../lib/permissions'

// ── Mapeos Excel → DB ─────────────────────────────────────────
function excelABackup(wb) {
  const sheets = wb.SheetNames
  const resultado = {
    backup_version: '1.0',
    exported_at: new Date().toISOString(),
    movimientos: [],
    comprobantes: [],
    deudas: [],
    movimientos_salario: [],
  }

  if (sheets.includes('Movimientos')) {
    resultado.movimientos = XLSX.utils.sheet_to_json(wb.Sheets['Movimientos']).map(r => ({
      id:               r['ID']              || undefined,
      fecha:            r['Fecha'],
      tipo:             r['Tipo'],
      categoria:        r['Categoría'],
      descripcion:      r['Descripción'],
      monto:            Number(r['Monto']),
      proveedor_cliente: r['Proveedor/Cliente'] || null,
      notas:            r['Notas'] || null,
    })).filter(r => r.fecha && r.tipo && r.monto)
  }

  if (sheets.includes('Deudas')) {
    resultado.deudas = XLSX.utils.sheet_to_json(wb.Sheets['Deudas']).map(r => ({
      id:          r['ID']           || undefined,
      acreedor:    r['Acreedor'],
      descripcion: r['Descripción']  || null,
      monto:       Number(r['Monto']),
      vencimiento: r['Vencimiento'],
      estado:      r['Estado'],
      notas:       r['Notas']        || null,
    })).filter(r => r.acreedor && r.monto && r.vencimiento)
  }

  if (sheets.includes('Salarios')) {
    resultado.movimientos_salario = XLSX.utils.sheet_to_json(wb.Sheets['Salarios']).map(r => ({
      id:          r['ID']           || undefined,
      empleado_id: r['Empleado ID'],
      categoria_id:r['Categoría ID'],
      monto:       Number(r['Monto']),
      fecha:       r['Fecha'],
      descripcion: r['Descripción']  || null,
    })).filter(r => r.empleado_id && r.categoria_id && r.monto && r.fecha)
  }

  return resultado
}

export default function Respaldo() {
  // ── JSON export ───────────────────────────────────────────────
  const [expJson,    setExpJson]    = useState('idle') // idle|loading|ok|error
  const [expJsonErr, setExpJsonErr] = useState(null)

  // ── JSON restore ──────────────────────────────────────────────
  const [faseJson,    setFaseJson]    = useState('idle')
  const [archivoJson, setArchivoJson] = useState(null)
  const [previewJson, setPreviewJson] = useState(null)
  const [resumenJson, setResumenJson] = useState(null)
  const [errJson,     setErrJson]     = useState(null)
  const fileRefJson = useRef()

  // ── Excel export ──────────────────────────────────────────────
  const [expXls,    setExpXls]    = useState('idle')
  const [expXlsErr, setExpXlsErr] = useState(null)

  // ── Excel restore ─────────────────────────────────────────────
  const [faseXls,    setFaseXls]    = useState('idle')
  const [archivoXls, setArchivoXls] = useState(null)
  const [previewXls, setPreviewXls] = useState(null)
  const [resumenXls, setResumenXls] = useState(null)
  const [errXls,     setErrXls]     = useState(null)
  const fileRefXls = useRef()

  if (!canAccessAdmin()) {
    return (
      <div className="animate-fadeIn flex flex-col items-center justify-center h-72 gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#FEE2E2' }}>
          <Lock size={28} color="#991B1B" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-[18px] text-gray-800">Sin permisos</p>
          <p className="text-[13px] text-gray-400 mt-1">Solo administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  const fmtFecha = (iso) => new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  // ── Handlers JSON export ──────────────────────────────────────
  const handleExportJson = async () => {
    setExpJson('loading'); setExpJsonErr(null)
    try {
      const data = await api.exportarBackup()
      const fecha = new Date().toISOString().split('T')[0]
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `backup_finanzas360_${fecha}.json`
      link.click()
      setExpJson('ok')
      setTimeout(() => setExpJson('idle'), 4000)
    } catch (err) { setExpJson('error'); setExpJsonErr(err.message) }
  }

  // ── Handlers JSON restore ─────────────────────────────────────
  const handleArchivoJson = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (!file.name.endsWith('.json')) {
      setErrJson('El archivo debe ser un .json generado por Finanzas360')
      setFaseJson('error'); return
    }
    setArchivoJson(file); setFaseJson('validando'); setErrJson(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!parsed.backup_version || !parsed.exported_at) {
          setErrJson('El archivo no es un backup válido de Finanzas360')
          setFaseJson('error'); return
        }
        setPreviewJson(parsed); setFaseJson('confirmando')
      } catch { setErrJson('El archivo no es un JSON válido'); setFaseJson('error') }
    }
    reader.readAsText(file)
  }

  const handleRestaurarJson = async () => {
    if (!previewJson) return
    setFaseJson('restaurando')
    try {
      const res = await api.restaurarBackup(previewJson)
      setResumenJson(res.resumen); setFaseJson('success')
    } catch (err) { setErrJson(err.message); setFaseJson('error') }
  }

  const resetJson = () => {
    setFaseJson('idle'); setArchivoJson(null); setPreviewJson(null)
    setResumenJson(null); setErrJson(null)
    if (fileRefJson.current) fileRefJson.current.value = ''
  }

  // ── Handlers Excel export ─────────────────────────────────────
  const handleExportExcel = async () => {
    setExpXls('loading'); setExpXlsErr(null)
    try {
      const data = await api.exportarBackup()
      const wb = XLSX.utils.book_new()

      if (data.movimientos?.length) {
        const rows = data.movimientos.map(r => ({
          'ID': r.id,
          'Fecha': r.fecha, 'Tipo': r.tipo, 'Categoría': r.categoria,
          'Descripción': r.descripcion, 'Monto': r.monto,
          'Proveedor/Cliente': r.proveedor_cliente || '',
          'Notas': r.notas || '',
          'Registrado el': r.created_at ? new Date(r.created_at).toLocaleString('es-AR') : '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Movimientos')
      }
      if (data.comprobantes?.length) {
        const rows = data.comprobantes.map(r => ({
          'Archivo': r.nombre_archivo, 'Tipo de archivo': r.tipo_archivo,
          'Estado OCR': r.ocr_estado, 'Monto detectado': r.ocr_monto ?? '',
          'Proveedor detectado': r.ocr_proveedor || '',
          'Fecha comprobante': r.ocr_fecha || '',
          'Subido el': r.created_at ? new Date(r.created_at).toLocaleString('es-AR') : '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Comprobantes')
      }
      if (data.deudas?.length) {
        const rows = data.deudas.map(r => ({
          'ID': r.id, 'Acreedor': r.acreedor, 'Descripción': r.descripcion || '',
          'Monto': r.monto, 'Vencimiento': r.vencimiento, 'Estado': r.estado,
          'Notas': r.notas || '',
          'Registrado el': r.created_at ? new Date(r.created_at).toLocaleString('es-AR') : '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Deudas')
      }
      if (data.movimientos_salario?.length) {
        const rows = data.movimientos_salario.map(r => ({
          'ID': r.id, 'Empleado ID': r.empleado_id, 'Categoría ID': r.categoria_id,
          'Fecha': r.fecha, 'Monto': r.monto, 'Descripción': r.descripcion || '',
          'Registrado el': r.created_at ? new Date(r.created_at).toLocaleString('es-AR') : '',
        }))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Salarios')
      }

      const fecha = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `reporte_finanzas360_${fecha}.xlsx`)
      setExpXls('ok')
      setTimeout(() => setExpXls('idle'), 4000)
    } catch (err) { setExpXls('error'); setExpXlsErr(err.message) }
  }

  // ── Handlers Excel restore ────────────────────────────────────
  const handleArchivoXls = (e) => {
    const file = e.target.files[0]; if (!file) return
    if (!file.name.endsWith('.xlsx')) {
      setErrXls('El archivo debe ser un .xlsx generado por Finanzas360')
      setFaseXls('error'); return
    }
    setArchivoXls(file); setFaseXls('validando'); setErrXls(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        if (!wb.SheetNames.includes('Movimientos') && !wb.SheetNames.includes('Deudas') && !wb.SheetNames.includes('Salarios')) {
          setErrXls('El archivo no contiene hojas restaurables de Finanzas360')
          setFaseXls('error'); return
        }
        const parsed = excelABackup(wb)
        setPreviewXls(parsed); setFaseXls('confirmando')
      } catch { setErrXls('No se pudo leer el archivo Excel'); setFaseXls('error') }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleRestaurarXls = async () => {
    if (!previewXls) return
    setFaseXls('restaurando')
    try {
      const res = await api.restaurarBackup(previewXls)
      setResumenXls(res.resumen); setFaseXls('success')
    } catch (err) { setErrXls(err.message); setFaseXls('error') }
  }

  const resetXls = () => {
    setFaseXls('idle'); setArchivoXls(null); setPreviewXls(null)
    setResumenXls(null); setErrXls(null)
    if (fileRefXls.current) fileRefXls.current.value = ''
  }

  // ── Sub-componente: zona de upload compact ────────────────────
  const UploadZone = ({ fileRef, onChange, err, accept, label }) => (
    <>
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
        <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
          <Upload size={17} className="text-primary-700" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">Seleccioná el archivo</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
        <input ref={fileRef} type="file" accept={accept} onChange={onChange} className="hidden" />
      </label>
      {err && (
        <div className="mt-2 flex items-start gap-2 p-2.5 bg-red-50 rounded-lg text-xs text-red-700">
          <XCircle size={13} className="flex-shrink-0 mt-0.5" /> {err}
        </div>
      )}
    </>
  )

  const ResumenTablas = ({ resumen }) => (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(resumen).map(([tabla, { insertados, omitidos }]) => (
        <div key={tabla} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
          <p className="text-[10px] font-semibold text-gray-500 capitalize mb-0.5">{tabla.replace('_', ' ')}</p>
          <p className="text-sm font-bold text-green-700">+{insertados} nuevos</p>
          <p className="text-[10px] text-gray-400">{omitidos} ya existían</p>
        </div>
      ))}
    </div>
  )

  return (
    <div className="animate-fadeIn max-w-4xl space-y-6">

      {/* Header */}
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Respaldo y Recuperación</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Descargá y restaurá tus datos en formato JSON (técnico) o Excel (legible).
        </p>
      </div>

      {/* ── CARD 1: JSON ──────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E1F5EE' }}>
            <Download size={15} style={{ color: '#0F6E56' }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Respaldo técnico (JSON)</h3>
            <p className="text-xs text-gray-400">Para restaurar el sistema ante pérdida de datos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Descargar JSON */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descargar</p>
            <p className="text-xs text-gray-500">
              Genera un <span className="font-mono bg-white border border-gray-200 px-1 rounded">.json</span> con todos los registros.
              Guardalo en OneDrive o Google Drive.
            </p>
            <button onClick={handleExportJson} disabled={expJson === 'loading'} className="btn-primary w-full justify-center disabled:opacity-60">
              {expJson === 'loading' ? <><RefreshCw size={14} className="animate-spin" /> Generando...</>
                : expJson === 'ok'  ? <><CheckCircle size={14} /> Descargado ✓</>
                : <><Download size={14} /> Descargar backup .json</>}
            </button>
            {expJson === 'error' && expJsonErr && (
              <p className="text-xs text-red-600 flex items-center gap-1"><XCircle size={12} />{expJsonErr}</p>
            )}
          </div>

          {/* Restaurar desde JSON */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Restaurar</p>

            {(faseJson === 'idle' || faseJson === 'error') && (
              <UploadZone fileRef={fileRefJson} onChange={handleArchivoJson}
                accept=".json,application/json" label="Archivo .json de respaldo" err={errJson} />
            )}
            {faseJson === 'validando' && (
              <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
                <RefreshCw size={20} className="animate-spin text-primary-500" />
                <p className="text-xs">Validando...</p>
              </div>
            )}
            {faseJson === 'confirmando' && previewJson && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-2.5 bg-green-50 rounded-lg">
                  <CheckCircle size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-green-800">{archivoJson?.name}</p>
                    <p className="text-[10px] text-green-700">Generado el {fmtFecha(previewJson.exported_at)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Movimientos', count: previewJson.movimientos?.length ?? 0 },
                    { label: 'Comprobantes', count: previewJson.comprobantes?.length ?? 0 },
                    { label: 'Deudas', count: previewJson.deudas?.length ?? 0 },
                    { label: 'Salarios', count: previewJson.movimientos_salario?.length ?? 0 },
                  ].map(({ label, count }) => (
                    <div key={label} className="bg-white rounded-lg p-2 text-center border border-gray-100">
                      <p className="text-base font-bold text-gray-800">{count}</p>
                      <p className="text-[9px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-amber-50 rounded-lg text-[10px] text-amber-700 flex gap-1.5">
                  <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
                  Solo se insertan registros cuyo ID no exista aún.
                </div>
                <div className="flex gap-2">
                  <button onClick={resetJson} className="btn-secondary flex-1 justify-center text-xs py-2">Cancelar</button>
                  <button onClick={handleRestaurarJson} className="btn-primary flex-1 justify-center text-xs py-2">
                    <ShieldCheck size={13} /> Confirmar
                  </button>
                </div>
              </div>
            )}
            {faseJson === 'restaurando' && (
              <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
                <RefreshCw size={20} className="animate-spin text-primary-500" />
                <p className="text-xs">Restaurando...</p>
              </div>
            )}
            {faseJson === 'success' && resumenJson && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} /> <p className="text-sm font-bold">Restauración exitosa</p>
                </div>
                <ResumenTablas resumen={resumenJson} />
                <button onClick={resetJson} className="btn-secondary w-full justify-center text-xs py-2">Restaurar otro</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CARD 2: EXCEL ─────────────────────────────────────── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
            <FileSpreadsheet size={15} style={{ color: '#4338CA' }} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Reporte legible (Excel)</h3>
            <p className="text-xs text-gray-400">Para revisión humana y restauración de movimientos, deudas y salarios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Descargar Excel */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descargar</p>
            <p className="text-xs text-gray-500">
              Genera un <span className="font-mono bg-white border border-gray-200 px-1 rounded">.xlsx</span> con
              4 hojas: Movimientos, Comprobantes, Deudas y Salarios. Abrilo con Excel o Google Sheets.
            </p>
            <button onClick={handleExportExcel} disabled={expXls === 'loading'} className="btn-primary w-full justify-center disabled:opacity-60">
              {expXls === 'loading' ? <><RefreshCw size={14} className="animate-spin" /> Generando...</>
                : expXls === 'ok'  ? <><CheckCircle size={14} /> Descargado ✓</>
                : <><FileSpreadsheet size={14} /> Descargar reporte .xlsx</>}
            </button>
            {expXls === 'error' && expXlsErr && (
              <p className="text-xs text-red-600 flex items-center gap-1"><XCircle size={12} />{expXlsErr}</p>
            )}
            <div className="p-2 bg-indigo-50 rounded-lg text-[10px] text-indigo-700 flex gap-1.5">
              <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
              La hoja de Comprobantes es solo lectura — los archivos físicos no se pueden restaurar desde Excel.
            </div>
          </div>

          {/* Restaurar desde Excel */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Restaurar</p>

            {(faseXls === 'idle' || faseXls === 'error') && (
              <UploadZone fileRef={fileRefXls} onChange={handleArchivoXls}
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                label="Archivo .xlsx generado por Finanzas360" err={errXls} />
            )}
            {faseXls === 'validando' && (
              <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
                <RefreshCw size={20} className="animate-spin text-primary-500" />
                <p className="text-xs">Validando...</p>
              </div>
            )}
            {faseXls === 'confirmando' && previewXls && (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-2.5 bg-green-50 rounded-lg">
                  <CheckCircle size={13} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-green-800">{archivoXls?.name}</p>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: 'Movimientos', count: previewXls.movimientos?.length ?? 0 },
                    { label: 'Deudas', count: previewXls.deudas?.length ?? 0 },
                    { label: 'Salarios', count: previewXls.movimientos_salario?.length ?? 0 },
                  ].map(({ label, count }) => (
                    <div key={label} className="bg-white rounded-lg p-2 text-center border border-gray-100">
                      <p className="text-base font-bold text-gray-800">{count}</p>
                      <p className="text-[9px] text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 bg-amber-50 rounded-lg text-[10px] text-amber-700 flex gap-1.5">
                  <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
                  Solo se insertan registros cuyo ID no exista aún. Los comprobantes no se restauran desde Excel.
                </div>
                <div className="flex gap-2">
                  <button onClick={resetXls} className="btn-secondary flex-1 justify-center text-xs py-2">Cancelar</button>
                  <button onClick={handleRestaurarXls} className="btn-primary flex-1 justify-center text-xs py-2">
                    <ShieldCheck size={13} /> Confirmar
                  </button>
                </div>
              </div>
            )}
            {faseXls === 'restaurando' && (
              <div className="flex flex-col items-center gap-2 py-4 text-gray-400">
                <RefreshCw size={20} className="animate-spin text-primary-500" />
                <p className="text-xs">Restaurando...</p>
              </div>
            )}
            {faseXls === 'success' && resumenXls && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle size={16} /> <p className="text-sm font-bold">Restauración exitosa</p>
                </div>
                <ResumenTablas resumen={resumenXls} />
                <button onClick={resetXls} className="btn-secondary w-full justify-center text-xs py-2">Restaurar otro</button>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
