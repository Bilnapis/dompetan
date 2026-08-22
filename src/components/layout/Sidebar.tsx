import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  PieChart,
  Wallet,
  UserRound,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
  { path: '/accounts', icon: Wallet, label: 'Dompet' },
  { path: '/budget', icon: PieChart, label: 'Budget' },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-dark-900/95 backdrop-blur-xl border-r border-dark-700/50 z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-dark-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-dark-100 tracking-tight">
            Dompetan
          </span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-400'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/60'
                }
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  transition-all duration-200
                  ${isActive ? 'bg-primary-500/20' : ''}
                `}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
              )}
            </Link>
          )
        })}

        {/* Divider */}
        <div className="pt-3 pb-1">
          <div className="h-px bg-dark-700/50" />
        </div>

        {/* Add Transaction */}
        <button
          onClick={() => navigate('/transaction/form')}
          className="
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            bg-gradient-to-r from-primary-500/20 to-primary-600/10
            border border-primary-500/20
            text-sm font-medium text-primary-400
            hover:bg-primary-500/25 hover:border-primary-500/30
            transition-all duration-200
          "
        >
          <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          Tambah Transaksi
        </button>
      </nav>

      {/* Bottom: User + Logout */}
      <div className="px-3 py-4 border-t border-dark-700/50 space-y-1">
        <Link
          to="/profile"
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-sm font-medium transition-all duration-200
            ${
              location.pathname === '/profile'
                ? 'bg-primary-500/15 text-primary-400'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/60'
            }
          `}
        >
          <div className="w-8 h-8 rounded-lg bg-dark-700/50 flex items-center justify-center shrink-0 overflow-hidden">
            <div className="w-full h-full bg-gradient-to-br from-primary-400/30 to-primary-600/30 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-300">
                {user?.email?.charAt(0).toUpperCase() ?? '?'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-dark-200 truncate">{user?.email}</p>
            <p className="text-[10px] text-dark-500">Profil & Pengaturan</p>
          </div>
          <UserRound className="w-4 h-4 shrink-0" />
        </Link>

        <button
          onClick={signOut}
          className="
            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-sm font-medium text-dark-400
            hover:text-expense hover:bg-expense/10
            transition-all duration-200
          "
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4" />
          </div>
          Keluar
        </button>
      </div>
    </aside>
  )
}
