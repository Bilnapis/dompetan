import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Category } from '../types/database';
import { formatCurrency } from '../lib/helpers';

interface SortableCategoryItemProps {
  category: Category;
  limit: number;
  spent: number;
  percentage: number;
  isExceeded: boolean;
  showTodayMarker: boolean;
  todayPercentage: number;
}

export function SortableCategoryItem({
  category,
  limit,
  spent,
  percentage,
  isExceeded,
  showTodayMarker,
  todayPercentage,
}: SortableCategoryItemProps) {
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
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-2 items-start p-2 -mx-2 rounded-xl transition-colors ${
        isDragging ? 'bg-dark-800 shadow-lg' : 'hover:bg-dark-800/30 bg-transparent'
      }`}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="mt-1 p-1 text-dark-500 hover:text-dark-300 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Content */}
      <div className="flex-1 flex gap-3 items-start">
        {/* Left Side */}
        <div className="w-[100px] shrink-0 flex flex-col gap-0.5 pt-0.5">
          <span className="text-[12px] text-dark-200 flex items-center gap-1.5 truncate">
            <span>{category.icon || '🏷️'}</span> {category.name}
          </span>
          <span className="text-[13px] font-semibold text-dark-100">
            {formatCurrency(limit)}
          </span>
        </div>

        {/* Right Side */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
          <div className="h-6 bg-dark-800 rounded-md overflow-hidden flex relative">
            <div
              className={`h-full transition-all duration-500 ${
                isExceeded ? 'bg-expense/80' : 'bg-primary-500/80'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
            {showTodayMarker && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10 shadow-sm"
                style={{ left: `${todayPercentage}%` }}
              />
            )}
            <div className="absolute right-2 top-0 bottom-0 flex items-center text-[11px] text-dark-100 font-medium z-10">
              {percentage}%
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px]">
            <span
              className={
                isExceeded ? 'text-expense font-medium' : 'text-primary-400 font-medium'
              }
            >
              {formatCurrency(spent)}
            </span>
            <span className="text-dark-200">
              {isExceeded
                ? `Excess Rp ${formatCurrency(limit - spent).replace('Rp ', '')}`
                : `Rp ${formatCurrency(limit - spent).replace('Rp ', '')}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
