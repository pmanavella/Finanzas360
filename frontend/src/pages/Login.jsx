import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { API_URL } from '../lib/supabase'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 6

function validateLoginForm(email, password) {
  if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
    return 'Ingresá un correo electrónico válido'
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
  }
  return null
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const validationError = validateLoginForm(email, password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/app')
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = `w-full border rounded-xl px-4 py-3 text-[13.5px] outline-none bg-white transition-all
    focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 placeholder-gray-400`
  const inputStyle = { borderColor: 'rgba(15,110,86,0.3)' }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo ── */}
      <div
        className="hidden lg:flex lg:w-[50%] flex-col justify-between p-12"
        style={{ background: '#0a3b24' }}
      >
        {/* Logo centrado arriba */}
        <div className="flex justify-center">
          <img src="/logo-icon.png" alt="Finanzas360" className="w-52 h-52 object-contain" />
        </div>

        {/* Texto central */}
        <div>
          <p className="text-3xl font-extrabold uppercase tracking-widest mb-5"
            style={{ color: '#D9A441' }}>
            BIENVENIDO.
          </p>
          <p className="text-4xl font-bold text-white leading-tight tracking-tight">
            Gestioná tus<br />
            <span style={{ color: '#D9A441' }}>finanzas<br />empresariales</span><br />
            en un solo lugar.
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Finanzas360 &copy; {new Date().getFullYear()} — Gestión financiera para PYMES y startups
        </p>
      </div>

      {/* ── Panel derecho ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 py-12"
        style={{ background: '#F4F5EF' }}
      >
        {/* Logo mobile */}
        <div className="flex justify-center mb-8 lg:hidden">
          <img src="/logo-icon.png" alt="Finanzas360" className="h-16 object-contain" />
        </div>

        <div className="w-full max-w-[360px]">
          {/* Card */}
          <div className="bg-white rounded-2xl px-8 py-9 shadow-sm border" style={{ borderColor: 'rgba(15,110,86,0.12)' }}>

            <h2 className="text-[22px] font-bold text-gray-900 mb-1">Iniciar sesión</h2>
            <p className="text-[13px] text-gray-400 mb-7">Ingresá tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  Email
                </label>
                <input
                  type="text"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="admin@finanzas360.com"
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="••••••••"
                    className={inputCls + ' pr-11'}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-600 flex items-start gap-2">
                  <span className="flex-shrink-0">⚠</span>
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[14px] text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60 mt-2"
                style={{ background: '#0a3b24' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0f5132' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0a3b24' }}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? 'Ingresando...' : 'Ingresar al sistema'}
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  )
}
