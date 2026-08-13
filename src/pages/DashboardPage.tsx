import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, Plus, LogOut, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionItem } from '../components/TransactionItem'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency, getGreeting, getCurrentCycleRange, formatDateShort } from '../lib/helpers'
import { useSettings } from '../contexts/SettingsContext'
import { DashboardSummarySkeleton } from '../components/ui/Skeleton'
import type { TransactionWithDetails } from '../types/database'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const { settings, loading: settingsLoading } = useSettings()
  const navigate = useNavigate()
  
  const monthRange = useMemo(() => {
    if (settingsLoading) return null
    return getCurrentCycleRange(
      settings?.month_start_date || 1, 
      settings?.weekend_behavior || 'none'
    )
  }, [settings, settingsLoading])

  const {
    transactions,
    loading,
    summary,
  } = useTransactions(monthRange ? {
    startDate: monthRange.start,
    endDate: monthRange.end,
  } : undefined)

  const handleEdit = (tx: TransactionWithDetails) => {
    navigate('/transaction/form', { state: { editData: tx } })
  }



  const recentTransactions = transactions.slice(0, 5)

  // State untuk menyembunyikan nominal
  const [showNominal, setShowNominal] = useState(() => {
    const saved = localStorage.getItem('showNominal')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [shake, setShake] = useState(false)

  // Simpan state ke localStorage tiap kali berubah
  useEffect(() => {
    localStorage.setItem('showNominal', JSON.stringify(showNominal))
  }, [showNominal])

  const toggleNominal = () => {
    setShowNominal((prev: boolean) => !prev)
    setShake(true)
    setTimeout(() => setShake(false), 200) // durasi animasi shake
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-dark-400">{getGreeting()} 👋</p>
          <p className="text-base font-semibold text-dark-100 truncate max-w-[200px]">
            {user?.email}
          </p>
        </div>
        <button
          onClick={signOut}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-dark-400 hover:text-expense hover:bg-dark-800 transition-colors"
          title="Keluar"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {/* Balance Card */}
        <div className="glass rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-dark-400">Saldo Bulan Ini</span>
              <span className="text-[10px] text-dark-500">
                {monthRange ? `${formatDateShort(monthRange.start)} - ${formatDateShort(monthRange.end)}` : '...'}
              </span>
            </div>
          </div>
          <div className="relative z-10 flex items-center gap-2">
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary-400' : 'text-expense'} ${shake ? 'animate-shake' : ''}`}>
              {showNominal ? formatCurrency(summary.balance) : 'Rp ••••••••'}
            </p>
            <button
              onClick={toggleNominal}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-800 transition-colors cursor-pointer"
              title={showNominal ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
            >
              {showNominal ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Income & Expense Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-income/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-income" />
              </div>
              <span className="text-xs text-dark-400">Pemasukan</span>
            </div>
            <p className={`text-lg font-bold text-income ${shake ? 'animate-shake' : ''}`}>
              {showNominal ? formatCurrency(summary.totalIncome) : 'Rp ••••••••'}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-expense/15 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-expense" />
              </div>
              <span className="text-xs text-dark-400">Pengeluaran</span>
            </div>
            <p className={`text-lg font-bold text-expense ${shake ? 'animate-shake' : ''}`}>
              {showNominal ? formatCurrency(summary.totalExpense) : 'Rp ••••••••'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-dark-200">Transaksi Terakhir</h2>
          <button
            onClick={() => navigate('/transactions')}
            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            Lihat Semua
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          {loading ? (
            <DashboardSummarySkeleton />
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              title="Belum ada transaksi"
              description="Mulai catat pemasukan dan pengeluaranmu"
              actionLabel="Tambah Transaksi"
              onAction={() => navigate('/transaction/form')}
            />
          ) : (
            <div className="divide-y divide-dark-700/50">
              {recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB - Add Transaction */}
      <button
        onClick={() => navigate('/transaction/form')}
        className="
          fixed bottom-24 right-6 z-30
          w-14 h-14 rounded-2xl
          bg-gradient-to-br from-primary-400 to-primary-600
          text-white shadow-lg shadow-primary-500/30
          flex items-center justify-center
          hover:shadow-xl hover:shadow-primary-500/40
          active:scale-95
          transition-all duration-200
        "
      >
        <Plus className="w-6 h-6" />
      </button>

    </div>
  )
}
