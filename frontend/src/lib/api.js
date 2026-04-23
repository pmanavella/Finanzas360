import { API_URL } from './supabase'

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud')
  return data
}

export const api = {
  // Movimientos
  getMovimientos: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'Todos'))
    ).toString()
    return request(`/api/movimientos${qs ? `?${qs}` : ''}`)
  },
  getMetricas: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/api/movimientos/metricas${qs ? `?${qs}` : ''}`)
  },
  getMovimiento: (id) => request(`/api/movimientos/${id}`),
  crearMovimiento: (body) => request('/api/movimientos', { method: 'POST', body: JSON.stringify(body) }),
  editarMovimiento: (id, body) => request(`/api/movimientos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarMovimiento: (id) => request(`/api/movimientos/${id}`, { method: 'DELETE' }),

  // Comprobantes
  getComprobantes: () => request('/api/comprobantes'),
  subirComprobante: (formData) =>
    fetch(`${API_URL}/api/comprobantes/upload`, { method: 'POST', body: formData })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d }),
  vincularComprobante: (id, movimiento_id) =>
    request(`/api/comprobantes/${id}/vincular`, { method: 'PUT', body: JSON.stringify({ movimiento_id }) }),
  eliminarComprobante: (id) => request(`/api/comprobantes/${id}`, { method: 'DELETE' }),

  // Excel
  validarExcel: (formData) =>
    fetch(`${API_URL}/api/excel/validar`, { method: 'POST', body: formData })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d }),
  importarExcel: (formData) =>
    fetch(`${API_URL}/api/excel/importar`, { method: 'POST', body: formData })
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d }),
  getPlantillaInfo: () => request('/api/excel/plantilla'),
}
