import { LogOut, Mail, Shield, Download, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePWAInstall } from '../hooks'
import { Button } from '../components/ui/Button'

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold text-dark-100 mb-6">Profil</h1>

      {/* User Info Card */}
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-dark-100 truncate">{user?.email}</p>
            <p className="text-xs text-dark-500">Anggota sejak {new Date(user?.created_at || '').toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}</p>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-dark-700">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-dark-400" />
            <span className="text-sm text-dark-300">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-primary-400" />
            <span className="text-sm text-dark-300">Data dilindungi Row Level Security</span>
          </div>
        </div>
      </div>

      {/* PWA Install */}
      {(isInstallable || isInstalled) && (
        <div className="glass rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dark-100">Aplikasi Dompetan</p>
              <p className="text-xs text-dark-400">
                {isInstalled ? 'Sudah terinstall di perangkat ini' : 'Install untuk akses lebih cepat'}
              </p>
            </div>
          </div>
          {!isInstalled && (
            <Button
              variant="primary"
              fullWidth
              onClick={promptInstall}
              icon={<Download className="w-4 h-4" />}
            >
              Install Aplikasi
            </Button>
          )}
          {isInstalled && (
            <Button
              variant="secondary"
              fullWidth
              disabled
              icon={<CheckCircle2 className="w-4 h-4 text-primary-400" />}
            >
              Terinstall
            </Button>
          )}
        </div>
      )}

      {/* Logout */}
      <Button
        variant="danger"
        fullWidth
        onClick={signOut}
        icon={<LogOut className="w-4 h-4" />}
      >
        Keluar dari Akun
      </Button>
    </div>
  )
}
