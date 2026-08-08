import { TrendingUp, TrendingDown, Pencil, Trash2, Wallet } from 'lucide-react'
import type { TransactionWithDetails } from '../types/database'
import { formatCurrency, formatDateShort } from '../lib/helpers'

interface TransactionItemProps {
  transaction: TransactionWithDetails
  onEdit: (transaction: TransactionWithDetails) => void
  onDelete: (id: string) => void
}

export function TransactionItem({ transaction, onEdit, onDelete }: TransactionItemProps) {
  const isIncome = transaction.type === 'income'

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-dark-800/50 rounded-xl transition-all duration-200">
      {/* Icon */}
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center shrink-0
        ${isIncome ? 'bg-income/10' : 'bg-expense/10'}
      `}>
        {isIncome ? (
          <TrendingUp className="w-5 h-5 text-income" />
        ) : (
          <TrendingDown className="w-5 h-5 text-expense" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark-100 truncate flex items-center gap-2">
          {transaction.category?.name || 'Tanpa Kategori'}
          {transaction.account && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-dark-700 text-dark-300 whitespace-nowrap font-normal">
              <Wallet className="w-3 h-3" />
              {transaction.account.name}
            </span>
          )}
        </p>
        {transaction.note && (
          <p className="text-xs text-dark-500 truncate">{transaction.note}</p>
        )}
      </div>

      {/* Amount & Date */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-semibold ${isIncome ? 'text-income' : 'text-expense'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
        </p>
        <p className="text-[10px] text-dark-500">
          {formatDateShort(transaction.transaction_date)}
        </p>
      </div>

      {/* Actions (visible on hover / always on mobile) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-0">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(transaction) }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-700 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(transaction.id) }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-400 hover:text-expense hover:bg-dark-700 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
