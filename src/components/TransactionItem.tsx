import { TrendingUp, TrendingDown, Wallet, ArrowRightLeft } from "lucide-react";
import type { TransactionWithDetails } from "../types/database";
import { formatCurrency, formatDateShort } from "../lib/helpers";

interface TransactionItemProps {
  transaction: TransactionWithDetails;
  onEdit: (transaction: TransactionWithDetails) => void;
}

export function TransactionItem({
  transaction,
  onEdit,
}: TransactionItemProps) {
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.category_id === null;

  return (
    <div
      onClick={() => onEdit(transaction)}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-dark-800/50 rounded-xl transition-all duration-200 cursor-pointer active:scale-[0.98]"
    >
      {/* Icon */}
      <div
        className={`
        w-10 h-10 rounded-xl flex items-center justify-center shrink-0
        ${isTransfer ? "bg-primary-500/10" : isIncome ? "bg-income/10" : "bg-expense/10"}
      `}
      >
        {isTransfer ? (
          <ArrowRightLeft className="w-5 h-5 text-primary-400" />
        ) : transaction.category?.icon ? (
          <span className="text-xl leading-none">{transaction.category.icon}</span>
        ) : isIncome ? (
          <TrendingUp className="w-5 h-5 text-income" />
        ) : (
          <TrendingDown className="w-5 h-5 text-expense" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark-100 truncate">
          {transaction.note || transaction.category?.name || (isTransfer ? "Transfer" : "Tanpa Kategori")}
        </p>
        <div className="flex items-center gap-1.5 text-[11px] text-dark-400 mt-0.5 truncate">
          {transaction.account && (
            <span className="inline-flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {transaction.account.name}
            </span>
          )}
          {transaction.note && (
            <>
              {transaction.account && <span className="text-dark-600 text-[8px]">●</span>}
              <span className="truncate">
                {transaction.category?.name || (isTransfer ? "Transfer" : "Tanpa Kategori")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount & Date */}
      <div className="text-right shrink-0">
        <p
          className={`text-sm font-semibold ${isTransfer ? "text-primary-400" : isIncome ? "text-income" : "text-expense"}`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(Number(transaction.amount))}
        </p>
        <p className="text-[10px] text-dark-500">
          {formatDateShort(transaction.transaction_date)}
        </p>
      </div>
    </div>
  );
}
