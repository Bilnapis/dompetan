import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, TrendingUp, TrendingDown, Plus, LogOut, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionItem } from '../components/TransactionItem'
import { TransactionForm } from '../components/TransactionForm'
import { EmptyState } from '../components/ui/EmptyState'
import { formatCurrency, getGreeting, getCurrentMonthRange } from '../lib/helpers'
import type { TransactionWithCategory, TransactionInsert } from '../types/database'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const monthRange = getCurrentMonthRange()

  const {
    transactions,
    loading,
    summary,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions({
    startDate: monthRange.start,
    endDate: monthRange.end,
  })

  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(null)

  const handleAdd = async (data: TransactionInsert) => {
    return await addTransaction(data)
  }

  const handleEdit = (tx: TransactionWithCategory) => {
    setEditingTx(tx)
    setShowForm(true)
  }

  const handleSubmit = async (data: TransactionInsert) => {
    if (editingTx) {
      return await updateTransaction(editingTx.id, data)
    }
    return await handleAdd(data)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      await deleteTransaction(id)
    }
  }

  const recentTransactions = transactions.slice(0, 5)

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
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-400" />
            </div>
            <span className="text-sm text-dark-400">Saldo Bulan Ini</span>
          </div>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary-400' : 'text-expense'}`}>
            {formatCurrency(summary.balance)}
          </p>
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
            <p className="text-lg font-bold text-income">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-expense/15 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-expense" />
              </div>
              <span className="text-xs text-dark-400">Pengeluaran</span>
            </div>
            <p className="text-lg font-bold text-expense">
              {formatCurrency(summary.totalExpense)}
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
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              title="Belum ada transaksi"
              description="Mulai catat pemasukan dan pengeluaranmu"
              actionLabel="Tambah Transaksi"
              onAction={() => setShowForm(true)}
            />
          ) : (
            <div className="divide-y divide-dark-700/50">
              {recentTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FAB - Add Transaction */}
      <button
        onClick={() => { setEditingTx(null); setShowForm(true) }}
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

      {/* Transaction Form Modal */}
      <TransactionForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingTx(null) }}
        onSubmit={handleSubmit}
        editData={editingTx}
      />
    </div>
  )
}
