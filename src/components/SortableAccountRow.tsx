import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Wallet } from "lucide-react";
import type { Account } from "../types/database";
import { formatCurrency } from "../lib/helpers";

interface SortableAccountRowProps {
  account: Account;
  onEdit: (acc: Account) => void;
  onDelete: (id: string) => void;
}

export function SortableAccountRow({
  account,
  onEdit,
  onDelete,
}: SortableAccountRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: account.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass rounded-2xl flex items-center gap-2 px-3 py-3 group transition-colors ${
        isDragging ? "bg-dark-800 shadow-xl" : "hover:bg-dark-800/50"
      }`}
    >
      {/* Drag Handle */}
      <button
        className={`touch-none shrink-0 flex items-center justify-center w-6 h-6 rounded-md text-dark-600 hover:text-dark-300 transition-colors cursor-grab active:cursor-grabbing ${
          isDragging ? "text-dark-300" : ""
        }`}
        {...attributes}
        {...listeners}
        tabIndex={-1}
        aria-label="Geser untuk mengubah urutan"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary-500/10">
        <Wallet className="w-4 h-4 text-primary-400" />
      </div>

      {/* Name & Balance */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark-200 truncate">{account.name}</p>
        <p
          className={`text-xs mt-0.5 font-semibold ${
            account.balance && account.balance < 0
              ? "text-expense"
              : "text-primary-400"
          }`}
        >
          {formatCurrency(account.balance || 0)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEdit(account)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-700 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-expense hover:bg-dark-700 transition-colors"
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
