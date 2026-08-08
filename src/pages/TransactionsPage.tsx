import { useState, useMemo } from 'react'
import { Plus, Filter } from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'
import { TransactionItem } from '../components/TransactionItem'
import { TransactionForm } from '../components/TransactionForm'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDateGroup } from '../lib/helpers'
import type { TransactionWithCategory, TransactionInsert, CategoryType } from '../types/database'

type FilterType = 'all' | CategoryType

export function TransactionsPage() {
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [showForm, setShowForm] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionWithCategory | null>(null)

  // Calculate date range from month filter
  const dateRange = useMemo(() => {
    const [year, month] = filterMonth.split('-').map(Number)
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0)
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }, [filterMonth])

  const {
    transactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions({
    type: filterType,
    startDate: dateRange.start,
    endDate: dateRange.end,
  })

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithCategory[]> = {}
    for (const tx of transactions) {
      const dateKey = tx.transaction_date
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(tx)
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }, [transactions])

  const handleSubmit = async (data: TransactionInsert) => {
    if (editingTx) {
      return await updateTransaction(editingTx.id, data)
    }
    return await addTransaction(data)
  }

  const handleEdit = (tx: TransactionWithCategory) => {
    setEditingTx(tx)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Hapus transaksi ini?')) {
      await deleteTransaction(id)
    }
  }

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Semua' },
    { value: 'income', label: 'Pemasukan' },
    { value: 'expense', label: 'Pengeluaran' },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-dark-100">Transaksi</h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="
              bg-dark-800 border border-dark-700 rounded-lg
              px-3 py-1.5 text-xs text-dark-200
              focus:outline-none focus:ring-1 focus:ring-primary-500
            "
          />
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-dark-700 mb-5">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            className={`
              flex-1 py-2 text-xs font-medium transition-all duration-200
              ${filterType === f.value
                ? 'bg-primary-500/15 text-primary-400 border-b-2 border-primary-400'
                : 'bg-dark-800/50 text-dark-400 hover:text-dark-200'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groupedTransactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Transaksi yang kamu buat akan muncul di sini"
          actionLabel="Tambah Transaksi"
          onAction={() => { setEditingTx(null); setShowForm(true) }}
        />
      ) : (
        <div className="space-y-4 mb-6">
          {groupedTransactions.map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs font-medium text-dark-500 mb-2 px-1">
                {formatDateGroup(date)}
              </p>
              <div className="glass rounded-2xl overflow-hidden divide-y divide-dark-700/50">
                {txs.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
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

      {/* Form Modal */}
      <TransactionForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingTx(null) }}
        onSubmit={handleSubmit}
        editData={editingTx}
      />
    </div>
  )
}
