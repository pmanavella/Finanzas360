function getRole() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw).rol : null
  } catch {
    return null
  }
}

export const canWrite        = () => ['admin', 'usuario'].includes(getRole())
export const canAccessAdmin  = () => getRole() === 'admin'
export const isLector        = () => getRole() === 'lector'
