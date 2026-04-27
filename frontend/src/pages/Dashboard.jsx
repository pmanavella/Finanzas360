import { useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">F3</span>
          </div>
          <span className="font-bold text-primary-900 text-base tracking-tight">Finanzas360</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-colors duration-150"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg text-center">

          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-6">
            <LayoutDashboard size={32} className="text-primary-600" />
          </div>

          {/* Welcome message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido a Finanzas360
          </h1>

          {user?.nombre && (
            <p className="text-lg text-primary-600 font-medium mb-2">
              {user.nombre}
            </p>
          )}

          <p className="text-gray-500 text-sm mb-8">
            Tu sesión está activa.{' '}
            {user?.rol && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium ml-1">
                {user.rol}
              </span>
            )}
          </p>

          {/* Go to app button */}
          <button
            onClick={() => navigate('/app')}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-150 text-sm"
          >
            Ir a la aplicación
            <ArrowRight size={16} />
          </button>

        </div>
      </main>

    </div>
  )
}
