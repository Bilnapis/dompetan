import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Category } from "../types/database";
import { formatCurrency } from "../lib/helpers";

interface SortableCategoryRowProps {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
}

export function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: SortableCategoryRowProps) {
  const navigate = useNavigate();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.75 : 1,
  };

  const handleRowClick = () => {
    if (category.type === "expense") {
      navigate(`/categories/${category.id}`);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-3 group transition-colors ${
        isDragging ? "bg-dark-800 shadow-xl rounded-xl" : "hover:bg-dark-800/50"
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
      <div
        onClick={handleRowClick}
        className={`
          w-9 h-9 rounded-xl flex items-center justify-center shrink-0 cursor-pointer
          ${category.type === "income" ? "bg-income/10" : "bg-expense/10"}
        `}
      >
        {category.icon ? (
          <span className="text-lg leading-none">{category.icon}</span>
        ) : (
          <Tag
            className={`w-4 h-4 ${
              category.type === "income" ? "text-income" : "text-expense"
            }`}
          />
        )}
      </div>

      {/* Name & Budget */}
      <div
        onClick={handleRowClick}
        className="flex-1 min-w-0 flex flex-col cursor-pointer"
      >
        <span className="text-sm font-medium text-dark-200 truncate">
          {category.name}
        </span>
        {category.type === "expense" && category.budget_limit > 0 && (
          <span className="text-[10px] text-dark-400 mt-0.5">
            Limit: {formatCurrency(category.budget_limit)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(category);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-700 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(category.id);
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-expense hover:bg-dark-700 transition-colors"
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
