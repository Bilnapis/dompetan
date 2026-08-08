import { useState } from 'react'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { AccountForm } from '../components/AccountForm'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../lib/helpers'
import type { Account, AccountInsert, AccountUpdate } from '../types/database'

export function AccountsPage() {
  const { accounts, loading, addAccount, updateAccount, deleteAccount, adjustBalance } = useAccounts()
  const [showForm, setShowForm] = useState(false)
  const [editingAcc, setEditingAcc] = useState<Account | null>(null)

  const handleSubmit = async (data: AccountInsert | AccountUpdate, desiredBalance: number) => {
    if (editingAcc) {
      const result = await updateAccount(editingAcc.id, data as AccountUpdate)
      if (result.error) return result
      
      const diff = desiredBalance - (editingAcc.balance || 0)
      if (diff !== 0) {
        return await adjustBalance(editingAcc.id, diff)
      }
      return result
    }
    
    const result = await addAccount(data as AccountInsert)
    if (result.error) return { error: result.error }
    
    // Add initial balance transaction if non-zero
    if (desiredBalance !== 0 && result.data) {
      return await adjustBalance(result.data.id, desiredBalance)
    }
    return { error: null }
  }

  const handleEdit = (acc: Account) => {
    setEditingAcc(acc)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Hapus pos keuangan ini? Transaksi yang menggunakan pos keuangan ini akan kehilangan relasinya (tapi tidak terhapus).')) {
      const result = await deleteAccount(id)
      if (result?.error) {
        alert(result.error)
      }
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-dark-100">Pos Keuangan</h1>
        <Button
          size="sm"
          onClick={() => { setEditingAcc(null); setShowForm(true) }}
          icon={<Plus className="w-4 h-4" />}
        >
          Tambah
        </Button>
      </div>

      <p className="text-sm text-dark-400 mb-5">
        Kelola dompet, rekening bank, atau e-wallet yang Anda gunakan.
      </p>

      {/* Accounts List */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-dark-500" />}
          title="Belum ada dompet"
          description="Tambahkan dompet/pos keuangan pertama Anda"
          actionLabel="Tambah Dompet"
          onAction={() => { setEditingAcc(null); setShowForm(true) }}
        />
      ) : (
        <div className="glass rounded-2xl overflow-hidden divide-y divide-dark-700/50">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center gap-3 px-4 py-3 group hover:bg-dark-800/50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary-500/10">
                <Wallet className="w-4 h-4 text-primary-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark-200 truncate">{acc.name}</p>
                <p className={`text-xs mt-0.5 font-semibold ${acc.balance && acc.balance < 0 ? 'text-expense' : 'text-primary-400'}`}>
                  {formatCurrency(acc.balance || 0)}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(acc)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-expense hover:bg-dark-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Account Form Modal */}
      <AccountForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingAcc(null) }}
        onSubmit={handleSubmit}
        editData={editingAcc}
      />
    </div>
  )
}
