import { api } from './api'

const CACHE_TTL_MS = 5 * 60 * 1000
let _cache     = null
let _cacheTime = 0

export async function obtenerCotizacionDetalle() {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL_MS) return _cache
  const data = await api.getCotizacionDolar()
  _cache     = data
  _cacheTime = Date.now()
  return data
}

export async function obtenerCotizacion() {
  const { valor_venta } = await obtenerCotizacionDetalle()
  return valor_venta
}
