import {
  LayoutDashboard, TrendingUp, TrendingDown,
  FileText, Upload, Menu, X, LogOut,
  CreditCard, Users, Wallet, ChevronRight
} from 'lucide-react'
import { useState } from 'react'

function getUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard, group: 'PRINCIPAL' },
  { id: 'ingresos',    label: 'Ingresos',        icon: TrendingUp,      group: 'MOVIMIENTOS' },
  { id: 'gastos',      label: 'Gastos',          icon: TrendingDown,    group: 'MOVIMIENTOS' },
  { id: 'deudas',      label: 'Deudas',          icon: CreditCard,      group: 'MOVIMIENTOS' },
  { id: 'salarios',    label: 'Salarios',        icon: Wallet,          group: 'MOVIMIENTOS' },
  { id: 'comprobantes',label: 'Comprobantes',    icon: FileText,        group: 'DOCUMENTOS' },
  { id: 'excel',       label: 'Importar Excel',  icon: Upload,          group: 'DOCUMENTOS' },
  { id: 'usuarios',    label: 'Usuarios',        icon: Users,           group: 'ADMINISTRACIÓN' },
]

const SIDEBAR_BG   = '#0a3b24'
const ACTIVE_BG    = 'rgba(46,139,87,0.18)'
const ACTIVE_COLOR = '#84cca2'
const GROUP_COLOR  = '#D9A441'
const ITEM_COLOR   = 'rgba(255,255,255,0.55)'
const ITEM_HOVER   = 'rgba(255,255,255,0.08)'

export default function Layout({ children, page, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const user = getUserFromStorage()

  const groups = [...new Set(navItems.map(i => i.group))]

  const Sidebar = () => (
    <div
      className="flex flex-col h-full w-56 flex-shrink-0"
      style={{ background: SIDEBAR_BG }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: '#2e8b57' }}>
          <span className="text-white font-black text-xs tracking-tight">F3</span>
        </div>
        <div>
          <span className="font-bold text-white text-[13.5px] tracking-tight block leading-none">Finanzas360</span>
          <span className="text-[10px] font-medium" style={{ color: '#D9A441', letterSpacing: '0.05em' }}>
            GESTIÓN EMPRESARIAL
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-5">
        {groups.map(group => (
          <div key={group}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 mb-1.5"
              style={{ color: GROUP_COLOR }}>
              {group}
            </p>
            <div className="space-y-0.5">
              {navItems.filter(i => i.group === group).map(item => {
                const active = page === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => { onNavigate(item.id); setMobileOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 text-left relative"
                    style={{
                      background: active ? ACTIVE_BG : 'transparent',
                      color: active ? ACTIVE_COLOR : ITEM_COLOR,
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = ITEM_HOVER }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                        style={{ background: '#2e8b57' }} />
                    )}
                    <item.icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                    {item.label}
                    {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg mb-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: '#2e8b57' }}
          >
            {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold text-white truncate leading-tight">{user?.nombre || 'Usuario'}</p>
            <p className="text-[10.5px] capitalize truncate" style={{ color: '#D9A441' }}>
              {user?.rol || 'Sin rol'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(239,68,68,0.12)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  function handleLogoutConfirm() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F8F3' }}>

      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex animate-fadeInLeft">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-muted">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg hover:bg-cream text-ink transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-ink text-sm">Finanzas360</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          {children}
        </main>
      </div>

      {/* Logout modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-card-lg p-7 mx-4 w-full max-w-sm border border-muted animate-fadeIn">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FEF2F2' }}>
              <LogOut size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-ink text-center mb-1">Cerrar sesión</h3>
            <p className="text-sm text-gray-500 text-center mb-6">¿Confirmas que querés cerrar la sesión?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-muted text-sm font-medium text-gray-600 hover:bg-cream transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
