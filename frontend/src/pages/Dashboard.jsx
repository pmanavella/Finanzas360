import { useNavigate } from 'react-router-dom'
import { LogOut, ArrowRight, BarChart3 } from 'lucide-react'

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
    <div className="min-h-screen" style={{ background: '#F7F8F3' }}>

      {/* Top bar */}
      <header className="bg-white border-b border-muted px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#0f5132' }}>
            <span className="text-white font-black text-xs">F3</span>
          </div>
          <div>
            <span className="font-bold text-ink text-[13.5px] tracking-tight block leading-none">Finanzas360</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#D9A441' }}>
              GESTIÓN EMPRESARIAL
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-600 transition-colors font-medium"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </header>

      {/* Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-65px)] p-6">
        <div className="w-full max-w-md text-center">

          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: '#DFF3E4' }}>
            <BarChart3 size={30} style={{ color: '#0f5132' }} />
          </div>

          <h1 className="text-3xl font-bold text-ink mb-2 tracking-tight">
            Bienvenido{user?.nombre ? `, ${user.nombre}` : ''}
          </h1>

          <p className="text-gray-500 text-sm mb-2">
            Tu sesión está activa y lista para usar.
          </p>

          {user?.rol && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-8"
              style={{ background: '#DFF3E4', color: '#0f5132' }}>
              {user.rol}
            </span>
          )}

          <div className="mt-8">
            <button
              onClick={() => navigate('/app')}
              className="inline-flex items-center gap-2.5 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all duration-150 active:scale-[0.98] shadow-card-md"
              style={{ background: '#0f5132' }}
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
