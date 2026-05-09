import { API_URL } from './supabase'

function getToken() {
  return localStorage.getItem('token') || null
}

async function request(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
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
  getTrazabilidad: () => request('/api/movimientos/trazabilidad'),
  getMovimiento: (id) => request(`/api/movimientos/${id}`),
  crearMovimiento: (body) => request('/api/movimientos', { method: 'POST', body: JSON.stringify(body) }),
  editarMovimiento: (id, body) => request(`/api/movimientos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarMovimiento: (id) => request(`/api/movimientos/${id}`, { method: 'DELETE' }),

  // Comprobantes
  getComprobantes: () => request('/api/comprobantes'),
  subirComprobante: (formData) => {
    const token = getToken()
    return fetch(`${API_URL}/api/comprobantes/upload`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d })
  },
  vincularComprobante: (id, movimiento_id) =>
    request(`/api/comprobantes/${id}/vincular`, { method: 'PUT', body: JSON.stringify({ movimiento_id }) }),
  eliminarComprobante: (id) => request(`/api/comprobantes/${id}`, { method: 'DELETE' }),

  // Excel
  validarExcel: (formData) => {
    const token = getToken()
    return fetch(`${API_URL}/api/excel/validar`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d })
  },
  importarExcel: (formData) => {
    const token = getToken()
    return fetch(`${API_URL}/api/excel/importar`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d })
  },
  getPlantillaInfo: () => request('/api/excel/plantilla'),

  // Deudas
  getDeudas: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'Todos'))
    ).toString()
    return request(`/api/deudas${qs ? `?${qs}` : ''}`)
  },
  getMetricasDeudas: () => request('/api/deudas/metricas'),
  crearDeuda:    (body)     => request('/api/deudas', { method: 'POST', body: JSON.stringify(body) }),
  editarDeuda:   (id, body) => request(`/api/deudas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarDeuda: (id)       => request(`/api/deudas/${id}`, { method: 'DELETE' }),

  // Salarios — Empleados
  getMetricasSalarios: () => request('/api/salarios/metricas'),
  getEmpleados: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'Todos'))
    ).toString()
    return request(`/api/salarios/empleados${qs ? `?${qs}` : ''}`)
  },
  getEmpleado:       (id)       => request(`/api/salarios/empleados/${id}`),
  crearEmpleado:     (body)     => request('/api/salarios/empleados', { method: 'POST', body: JSON.stringify(body) }),
  editarEmpleado:    (id, body) => request(`/api/salarios/empleados/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarEmpleado:  (id)       => request(`/api/salarios/empleados/${id}`, { method: 'DELETE' }),

  // Salarios — Categorías
  getCategoriasSalario:     ()       => request('/api/salarios/categorias'),
  crearCategoriaSalario:    (body)   => request('/api/salarios/categorias', { method: 'POST', body: JSON.stringify(body) }),
  eliminarCategoriaSalario: (id)     => request(`/api/salarios/categorias/${id}`, { method: 'DELETE' }),

  // Salarios — Movimientos
  getMovimientosSalario: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString()
    return request(`/api/salarios/movimientos${qs ? `?${qs}` : ''}`)
  },
  crearMovimientoSalario:   (body)     => request('/api/salarios/movimientos', { method: 'POST', body: JSON.stringify(body) }),
  editarMovimientoSalario:  (id, body) => request(`/api/salarios/movimientos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarMovimientoSalario:(id)       => request(`/api/salarios/movimientos/${id}`, { method: 'DELETE' }),

  // RBAC — Usuarios
  getUsuarios:    ()         => request('/api/rbac/usuarios'),
  crearUsuario:   (body)     => request('/api/rbac/usuarios', { method: 'POST', body: JSON.stringify(body) }),
  editarUsuario:  (id, body) => request(`/api/rbac/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  eliminarUsuario:(id)       => request(`/api/rbac/usuarios/${id}`, { method: 'DELETE' }),
  getRoles:       ()         => request('/api/rbac/roles'),
}
