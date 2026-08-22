import { useState, useEffect } from 'react'
import { Plus, Wallet } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useAccounts } from '../hooks/useAccounts'
import { AccountForm } from '../components/AccountForm'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { SortableAccountRow } from '../components/SortableAccountRow'
import { formatCurrency } from '../lib/helpers'
import type { Account, AccountInsert, AccountUpdate } from '../types/database'
import { AccountListSkeleton } from '../components/ui/Skeleton'

export function AccountsPage() {
  const { accounts, loading, addAccount, updateAccount, deleteAccount, adjustBalance, reorderAccounts } = useAccounts()
  const [showForm, setShowForm] = useState(false)
  const [editingAcc, setEditingAcc] = useState<Account | null>(null)

  // Local state untuk optimistic update saat drag
  const [localAccounts, setLocalAccounts] = useState<Account[]>([])

  // Sync local state saat accounts dari server berubah
  useEffect(() => {
    setLocalAccounts(accounts)
  }, [accounts])

  const totalBalance = localAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = localAccounts.findIndex((a) => a.id === active.id)
    const newIndex = localAccounts.findIndex((a) => a.id === over.id)

    const newItems = arrayMove(localAccounts, oldIndex, newIndex)
    setLocalAccounts(newItems)

    reorderAccounts(
      newItems.map((item, index) => ({ id: item.id, sort_order: index }))
    )
  }

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
    <div className="max-w-lg mx-auto lg:max-w-none px-4 lg:px-8 pt-6">
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

      {/* Total Balance Card */}
      {!loading && localAccounts.length > 0 && (
        <div className="glass rounded-2xl p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-dark-400 mb-0.5">Total Saldo Keseluruhan</p>
            <p className={`text-xl font-bold ${totalBalance >= 0 ? 'text-primary-400' : 'text-expense'}`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {loading ? (
        <AccountListSkeleton count={3} />
      ) : localAccounts.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8 text-dark-500" />}
          title="Belum ada dompet"
          description="Tambahkan dompet/pos keuangan pertama Anda"
          actionLabel="Tambah Dompet"
          onAction={() => { setEditingAcc(null); setShowForm(true) }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localAccounts.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {localAccounts.map((acc) => (
                <SortableAccountRow
                  key={acc.id}
                  account={acc}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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
