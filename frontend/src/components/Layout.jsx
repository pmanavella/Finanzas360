import {
  LayoutDashboard, TrendingUp, TrendingDown,
  FileText, Upload, ChevronRight, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'PRINCIPAL' },
  { id: 'ingresos', label: 'Ingresos', icon: TrendingUp, group: 'MOVIMIENTOS' },
  { id: 'gastos', label: 'Gastos', icon: TrendingDown, group: 'MOVIMIENTOS' },
  { id: 'comprobantes', label: 'Comprobantes', icon: FileText, group: 'DOCUMENTOS' },
  { id: 'excel', label: 'Importar Excel', icon: Upload, group: 'DOCUMENTOS' },
]

export default function Layout({ children, page, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const groups = [...new Set(navItems.map(i => i.group))]

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-primary-900 text-white w-56 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-primary-700">
        <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">F3</span>
        </div>
        <span className="font-bold text-base tracking-tight">Finanzas360</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {groups.map(group => (
          <div key={group} className="mb-5">
            <p className="text-primary-400 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
              {group}
            </p>
            {navItems.filter(i => i.group === group).map(item => {
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setMobileOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-0.5 transition-all duration-150 ${
                    active
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-200 hover:bg-primary-800 hover:text-white'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                  {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-primary-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold">
            VC
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">Valentina C.</p>
            <p className="text-xs text-primary-400">Admin financiero</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu size={20} />
          </button>
          <span className="font-bold text-primary-800">Finanzas360</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
