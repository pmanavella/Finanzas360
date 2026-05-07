import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import logo from '../../resources/logo.png'
import { API_URL } from '../lib/supabase'

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
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo (brand) ── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0a3b24 0%, #0f5132 55%, #1a5a37 100%)' }}
      >
        {/* Circles decorativos */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: '#D9A441' }} />
        <div className="absolute bottom-0 -left-16 w-72 h-72 rounded-full opacity-[0.07]"
          style={{ background: '#2e8b57' }} />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full opacity-[0.06]"
          style={{ background: '#fff' }} />

        {/* Logo */}
        <div className="relative z-10">
          <img src={logo} alt="Finanzas360" className="h-32 object-contain" />
        </div>

        {/* Contenido central */}
        <div className="relative z-10">
          <p className="text-3xl font-bold uppercase tracking-[0.15em] mb-4" style={{ color: '#D9A441' }}>
            BIENVENIDO
          </p>
          <h1 className="text-4xl font-bold text-white leading-snug tracking-tight">
            Gestioná tus finanzas<br />
            <span style={{ color: '#D9A441' }}>empresariales</span><br />
            en un solo lugar.
          </h1>
        </div>

        {/* Footer brand */}
        <p className="relative z-10 text-primary-400 text-xs">
          Finanzas360 &copy; {new Date().getFullYear()} — Gestion financiera para PYMES y startups
        </p>
      </div>

      {/* ── Panel derecho (form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-cream">
        <div className="w-full max-w-[400px]">

          {/* Logo mobile */}
          <div className="flex justify-center mb-8 lg:hidden">
            <img src={logo} alt="Finanzas360" className="h-10 object-contain" />
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-card-lg px-8 py-10 border border-muted">

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-ink tracking-tight">Iniciar sesión</h2>
              <p className="text-sm text-gray-500 mt-1.5">Ingresá tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@finanzas360.com"
                  className="input-field"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 uppercase tracking-wide">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5 flex-shrink-0">⚠</span>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-60"
                style={{ background: loading ? '#1a5a37' : '#0f5132' }}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? 'Ingresando...' : 'Ingresar al sistema'}
              </button>

            </form>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Finanzas360 &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

    </div>
  )
}
