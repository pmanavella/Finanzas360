import { useNavigate } from 'react-router-dom'
import { LogOut, ArrowRight, TrendingUp, ShieldCheck } from 'lucide-react'
import LogoIcon from '../components/LogoIcon'

function getUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = getUserFromStorage()

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(145deg, #f0faf4 0%, #F7F8F3 50%, #eef4ff 100%)' }}>

      {/* Top bar */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-muted px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
        <img src="/logo-icon.png" alt="Finanzas360" className="w-9 h-9 object-contain" />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors font-medium"
        >
          <LogOut size={14} />
          Salir
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">

          <div
            className="mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-7 animate-popIn"
            style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', boxShadow: '0 8px 32px rgba(46,139,87,0.18)' }}
          >
            <TrendingUp size={34} strokeWidth={1.8} style={{ color: '#065f46' }} />
          </div>

          <h1 className="text-3xl font-black text-ink mb-2 tracking-tight animate-slideUp delay-75">
            Bienvenido{user?.nombre ? `,` : ''}<br />
            {user?.nombre && <span style={{ color: '#0a3b24' }}>{user.nombre}</span>}
          </h1>

          <p className="text-gray-500 text-sm mb-4 animate-slideUp delay-150">
            Tu sesión está activa y lista para usar.
          </p>

          {user?.rol && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-8 animate-slideUp delay-225"
              style={{ background: '#d1fae5', color: '#065f46' }}
            >
              <ShieldCheck size={11} />
              {user.rol}
            </span>
          )}

          <div className="mt-8 animate-slideUp delay-300">
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-2.5 text-white font-bold px-8 py-4 rounded-2xl text-sm transition-all duration-200 active:scale-[0.97] hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #0f5132 0%, #2e8b57 100%)',
                boxShadow: '0 6px 20px rgba(15,81,50,0.35)',
              }}
            >
              Ir a la aplicación
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
