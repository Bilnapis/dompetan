import { LogOut, Mail, Shield, Download, CheckCircle2, Settings as SettingsIcon, Tag, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { usePWAInstall } from '../hooks'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import type { WeekendBehavior } from '../types/database'

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { settings, updateSettings, loading: settingsLoading } = useSettings()
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall()

  const [startDate, setStartDate] = useState('1')
  const [weekendBehavior, setWeekendBehavior] = useState<WeekendBehavior>('none')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (settings) {
      setStartDate(settings.month_start_date.toString())
      setWeekendBehavior(settings.weekend_behavior)
    }
  }, [settings])

  const handleSaveSettings = async () => {
    setSaving(true)
    setMessage('')
    
    let parsedDate = parseInt(startDate)
    if (isNaN(parsedDate) || parsedDate < 1 || parsedDate > 31) {
      parsedDate = 1
      setStartDate('1')
    }

    const { error } = await updateSettings({
      month_start_date: parsedDate,
      weekend_behavior: weekendBehavior,
    })

    if (error) {
      setMessage('Gagal menyimpan pengaturan')
    } else {
      setMessage('Pengaturan berhasil disimpan')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

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

      {/* Settings Card */}
      <div className="glass rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark-100">Pengaturan Siklus Bulan</p>
            <p className="text-xs text-dark-400">Atur tanggal awal bulan untuk pencatatan</p>
          </div>
        </div>

        {settingsLoading ? (
          <div className="text-sm text-dark-400 py-2">Memuat pengaturan...</div>
        ) : (
          <div className="space-y-4">
            <Input
              type="number"
              min="1"
              max="31"
              label="Tanggal Awal Siklus"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Contoh: 25"
            />

            <Select
              label="Jika Jatuh Pada Akhir Pekan (Sabtu/Minggu)"
              value={weekendBehavior}
              onChange={(e) => setWeekendBehavior(e.target.value as WeekendBehavior)}
              options={[
                { value: 'none', label: 'Tetap pada tanggal tersebut' },
                { value: 'previous_friday', label: 'Maju ke Jumat sebelumnya' },
                { value: 'next_monday', label: 'Mundur ke Senin berikutnya' },
              ]}
            />

            <Button
              variant="primary"
              fullWidth
              onClick={handleSaveSettings}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
            
            {message && (
              <p className={`text-sm text-center ${message.includes('Gagal') ? 'text-expense' : 'text-income'}`}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Categories Setting Card */}
      <div 
        onClick={() => navigate('/categories')}
        className="glass rounded-2xl p-5 mb-4 flex items-center justify-between cursor-pointer hover:bg-dark-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-expense/15 flex items-center justify-center">
            <Tag className="w-5 h-5 text-expense" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dark-100">Pengaturan Kategori</p>
            <p className="text-xs text-dark-400">Atur kategori pemasukan & pengeluaran</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-dark-400" />
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
