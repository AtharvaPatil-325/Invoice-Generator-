import { NavLink } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/common/Avatar'
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  Settings,
  LogOut,
  Receipt,
  PlusCircle,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/invoices', label: 'Invoices', icon: FileText },
  { to: '/app/clients', label: 'Clients', icon: Users },
  { to: '/app/business-profile', label: 'Business Profile', icon: Building2 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { signOut, user } = useAuth()

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header / Logo */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm shadow-primary-500/20">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight">InvoiceGen</span>
                <span className="block text-[10px] font-semibold tracking-wider text-primary-600 uppercase">
                  SaaS Dashboard
                </span>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Action Quick Button */}
          <div className="px-4 pt-5 pb-2">
            <NavLink
              to="/app/invoices/create"
              onClick={onClose}
              className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-sm shadow-primary-500/20 transition-all active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Invoice</span>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group relative flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-50/80 text-primary-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary-600 rounded-r-full transition-all duration-150" />
                      )}
                      <Icon
                        className={`mr-3 w-4 h-4 shrink-0 transition-colors duration-150 ${
                          isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/60">
              <div className="flex items-center space-x-2.5 min-w-0">
                <Avatar email={user?.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">Account</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={signOut}
                title="Sign Out"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}