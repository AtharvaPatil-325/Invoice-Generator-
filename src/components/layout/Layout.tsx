import { useState } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu, Plus, Receipt } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/common/Avatar'

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

  // Generate breadcrumb title based on path
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/dashboard')) return 'Dashboard'
    if (path.includes('/invoices/create')) return 'Create New Invoice'
    if (path.includes('/invoices') && path.includes('/edit')) return 'Edit Invoice'
    if (path.includes('/invoices/')) return 'Invoice Details'
    if (path.includes('/invoices')) return 'Invoices List'
    if (path.includes('/clients')) return 'Client Management'
    if (path.includes('/business-profile')) return 'Business Profile'
    if (path.includes('/settings')) return 'Settings'
    return 'InvoiceGen'
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors duration-150"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Logo Indicator */}
            <div className="lg:hidden flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">InvoiceGen</span>
            </div>

            {/* Desktop Page Title / Breadcrumb */}
            <div className="hidden lg:block">
              <h2 className="text-sm font-semibold text-slate-800">{getPageTitle()}</h2>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center space-x-3">
            {/* Create Invoice Action */}
            <NavLink
              to="/app/invoices/create"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-sm shadow-primary-500/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </NavLink>

            {/* Divider */}
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            {/* User Avatar Badge */}
            <div className="flex items-center space-x-2 pl-1">
              <Avatar email={user?.email} size="sm" />
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}