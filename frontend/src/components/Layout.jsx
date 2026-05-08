import {
  LayoutDashboard, TrendingUp, TrendingDown,
  FileText, Upload, LogOut, Menu, X,
  CreditCard, Users, Wallet, ChevronDown,
  LayoutGrid, ArrowUpDown, Settings
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import LogoIcon from './LogoIcon'

function getUserFromStorage() {
  try { return JSON.parse(localStorage.getItem('user')) }
  catch { return null }
}

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard, group: 'PRINCIPAL'     },
  { id: 'ingresos',     label: 'Ingresos',       icon: TrendingUp,      group: 'MOVIMIENTOS'   },
  { id: 'gastos',       label: 'Gastos',         icon: TrendingDown,    group: 'MOVIMIENTOS'   },
  { id: 'deudas',       label: 'Deudas',         icon: CreditCard,      group: 'MOVIMIENTOS'   },
  { id: 'salarios',     label: 'Salarios',       icon: Wallet,          group: 'MOVIMIENTOS'   },
  { id: 'comprobantes', label: 'Comprobantes',   icon: FileText,        group: 'DOCUMENTOS'    },
  { id: 'excel',        label: 'Importar Excel', icon: Upload,          group: 'DOCUMENTOS'    },
  { id: 'usuarios',     label: 'Usuarios',       icon: Users,           group: 'ADMINISTRACIÓN'},
]

const GROUP_META = {
  PRINCIPAL:       { icon: LayoutGrid,  label: 'Dashboard'      },
  MOVIMIENTOS:     { icon: ArrowUpDown, label: 'Movimientos'    },
  DOCUMENTOS:      { icon: FileText,    label: 'Documentos'     },
  ADMINISTRACIÓN:  { icon: Settings,    label: 'Administración' },
}

const NAV_BG     = '#0a3b24'
const ACTIVE_LINE = '#84cca2'
const GOLD       = '#D9A441'

/* ── Dropdown items ─────────────────────────────────── */
function DropdownMenu({ group, items, page, onNavigate, onClose }) {
  return (
    <div
      className="absolute top-full left-0 mt-0 w-52 rounded-b-xl rounded-tr-xl shadow-xl overflow-hidden z-50"
      style={{ background: '#0d4a2d', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none' }}
    >
      {items.map(item => {
        const active = page === item.id
        return (
          <button
            key={item.id}
            onClick={() => { onNavigate(item.id); onClose() }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium text-left transition-colors duration-100"
            style={{ color: active ? ACTIVE_LINE : 'rgba(255,255,255,0.72)' }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <item.icon size={14} strokeWidth={active ? 2.3 : 1.8} />
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

/* ── Dropdown trigger ───────────────────────────────── */
function NavDropdown({ group, items, page, onNavigate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const timer = useRef(null)
  const isActive = items.some(i => i.id === page)
  const { icon: GroupIcon, label } = GROUP_META[group]

  const open_ = () => { clearTimeout(timer.current); setOpen(true) }
  const close_ = () => { timer.current = setTimeout(() => setOpen(false), 130) }
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="relative h-14 flex items-center" ref={ref} onMouseEnter={open_} onMouseLeave={close_}>
      <button
        className="relative h-full flex items-center gap-1.5 px-5 text-[13px] font-medium transition-colors duration-150"
        style={{ color: isActive || open ? '#fff' : 'rgba(255,255,255,0.62)' }}
      >
        <GroupIcon size={15} strokeWidth={isActive ? 2.2 : 1.7} />
        {label}
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        {isActive && (
          <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full"
            style={{ background: ACTIVE_LINE }} />
        )}
      </button>
      {open && (
        <DropdownMenu group={group} items={items} page={page}
          onNavigate={onNavigate} onClose={() => setOpen(false)} />
      )}
    </div>
  )
}

/* ── Layout ─────────────────────────────────────────── */
export default function Layout({ children, page, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const user = getUserFromStorage()

  const groups = [...new Set(navItems.map(i => i.group))]
  const otherGroups = groups.filter(g => g !== 'PRINCIPAL')

  function handleLogoutConfirm() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F7F8F3' }}>

      {/* ── Navbar ─────────────────────────────────── */}
      <header className="flex-shrink-0" style={{ background: NAV_BG }}>
        <div className="flex items-stretch h-14 px-4 md:px-6">

          {/* Logo + nombre */}
          <div className="flex items-center gap-2.5 mr-6 flex-shrink-0">
            <img src="/logo-icon.png" alt="Finanzas360" className="w-9 h-9 object-contain flex-shrink-0" />
            <span className="font-bold text-white text-[15px] tracking-tight">Finanzas360</span>
          </div>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-stretch flex-1 justify-center">

            {/* Dashboard (link directo) */}
            <div className="relative h-14 flex items-center">
              <button
                onClick={() => onNavigate('dashboard')}
                className="relative h-full flex items-center gap-1.5 px-5 text-[13px] font-medium transition-colors duration-150"
                style={{ color: page === 'dashboard' ? '#fff' : 'rgba(255,255,255,0.62)' }}
              >
                <LayoutGrid size={15} strokeWidth={page === 'dashboard' ? 2.2 : 1.7} />
                Dashboard
                {page === 'dashboard' && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2.5px] rounded-full"
                    style={{ background: ACTIVE_LINE }} />
                )}
              </button>
            </div>

            {/* Dropdowns */}
            {otherGroups.map(group => (
              <NavDropdown key={group} group={group}
                items={navItems.filter(i => i.group === group)}
                page={page} onNavigate={onNavigate} />
            ))}
          </nav>

          {/* Usuario + salir – desktop */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0"
                style={{ background: '#2e8b57' }}
              >
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="leading-tight">
                <p className="text-[12.5px] font-semibold text-white">{user?.nombre || 'Usuario'}</p>
                <p className="text-[11px] capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {user?.rol || 'Sin rol'}
                </p>
              </div>
            </div>
            <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <button
              onClick={() => setShowLogout(true)}
              className="flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.55)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
            >
              <LogOut size={14} />
              Salir
            </button>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden ml-auto flex items-center p-2 rounded-lg"
            style={{ color: 'rgba(255,255,255,0.7)' }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#0d4a2d' }}>
            <div className="px-4 py-3 space-y-1">
              {groups.map(group => (
                <div key={group}>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] px-2 pt-3 pb-1"
                    style={{ color: GOLD }}>{GROUP_META[group]?.label || group}</p>
                  {navItems.filter(i => i.group === group).map(item => {
                    const active = page === item.id
                    return (
                      <button key={item.id}
                        onClick={() => { onNavigate(item.id); setMobileOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-left"
                        style={{ color: active ? ACTIVE_LINE : 'rgba(255,255,255,0.7)', background: active ? 'rgba(46,139,87,0.18)' : 'transparent' }}
                      >
                        <item.icon size={14} strokeWidth={active ? 2.2 : 1.8} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} className="pt-3 mt-2 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#2e8b57' }}>
                    {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-white">{user?.nombre || 'Usuario'}</p>
                    <p className="text-[10px]" style={{ color: GOLD }}>{user?.rol}</p>
                  </div>
                </div>
                <button onClick={() => { setMobileOpen(false); setShowLogout(true) }}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-red-400 px-3 py-2">
                  <LogOut size={13} /> Salir
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Contenido */}
      <main className="flex-1 p-5 md:p-7">
        {children}
      </main>

      {/* Modal logout */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-card-lg p-7 mx-4 w-full max-w-sm border border-muted animate-fadeIn">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FEF2F2' }}>
              <LogOut size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-ink text-center mb-1">Cerrar sesión</h3>
            <p className="text-sm text-gray-500 text-center mb-6">¿Confirmás que querés cerrar la sesión?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogout(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-muted text-sm font-medium text-gray-600 hover:bg-cream transition-colors">
                Cancelar
              </button>
              <button onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
