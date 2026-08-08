import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
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
import type { Category, TransactionWithDetails, CategoryBudget } from '../types/database'
import { formatCurrency } from '../lib/helpers'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SortableCategoryItem } from './SortableCategoryItem'

interface BudgetViewProps {
  categories: Category[]
  transactions: TransactionWithDetails[]
  dateRange: { start: string; end: string }
  filterMonth: string
  onReorder?: (updates: { id: string; sort_order: number }[]) => void
}

export function BudgetView({ categories, transactions, dateRange, filterMonth, onReorder }: BudgetViewProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [monthlyBudgets, setMonthlyBudgets] = useState<CategoryBudget[]>([])

  useEffect(() => {
    if (!user) return
    supabase
      .from('category_budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', filterMonth)
      .then(({ data }) => {
        if (data) setMonthlyBudgets(data)
      })
  }, [user, filterMonth])

  // Only consider expense categories that have a budget limit > 0
  const budgetCategories = useMemo(() => {
    return categories
      .filter(c => c.type === 'expense')
      .map(c => {
        const override = monthlyBudgets.find(b => b.category_id === c.id)
        return {
          ...c,
          budget_limit: override ? override.amount : c.budget_limit
        }
      })
      .filter(c => Number(c.budget_limit) > 0)
  }, [categories, monthlyBudgets])

  // Local state for optimistic updates during drag and drop
  const [localCategories, setLocalCategories] = useState(budgetCategories)

  // Sync local state when props change (except when we are dragging, but useEffect is fine here)
  useEffect(() => {
    setLocalCategories(budgetCategories)
  }, [budgetCategories])

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms hold to start drag on mobile
        tolerance: 5, // 5px movement cancels the hold
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = localCategories.findIndex((c) => c.id === active.id)
      const newIndex = localCategories.findIndex((c) => c.id === over.id)

      const newItems = arrayMove(localCategories, oldIndex, newIndex)
      setLocalCategories(newItems)

      if (onReorder) {
        // Calculate the new sort_order based on the new array index
        const updates = newItems.map((item, index) => ({
          id: item.id,
          sort_order: index,
        }))
        onReorder(updates)
      }
    }
  }

  const totalBudget = useMemo(() => {
    return budgetCategories.reduce((sum, cat) => sum + (Number(cat.budget_limit) || 0), 0)
  }, [budgetCategories])

  const totalSpent = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense' && t.category_id)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }, [transactions])

  const totalPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
  const isTotalExceeded = totalSpent > totalBudget && totalBudget > 0

  // Calculate 'Today' percentage
  const todayPercentage = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0)
    const start = new Date(dateRange.start).setHours(0, 0, 0, 0)
    const end = new Date(dateRange.end).setHours(0, 0, 0, 0)
    
    if (today >= start && today <= end && end > start) {
      return ((today - start) / (end - start)) * 100
    } else if (today > end) {
      return 100
    }
    return 0
  }, [dateRange])
  
  const showTodayMarker = todayPercentage > 0 && todayPercentage <= 100

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header section with Setting button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="p-1.5 bg-dark-800 rounded-lg">📝</span> Budget
        </h2>
        <button
          onClick={() => navigate('/categories')}
          className="flex items-center text-xs text-dark-400 hover:text-dark-200"
        >
          Pengaturan Budget <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>

      {/* Total Budget Card */}
      <div className="flex gap-3 items-start relative mt-4">
        {/* Left Side */}
        <div className="w-[110px] shrink-0 flex flex-col gap-0.5 pt-0.5">
          <span className="text-[11px] text-dark-400">Total Budget</span>
          <span className="text-[13px] font-semibold text-dark-100">{formatCurrency(totalBudget)}</span>
        </div>
        
        {/* Right Side */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0 relative">
          
          {/* Today Bubble for Total Budget */}
          {showTodayMarker && (
            <div 
              className="absolute -top-6 flex flex-col items-center z-20"
              style={{ left: `calc(${todayPercentage}% - 20px)` }}
            >
              <div className="bg-dark-500 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                Today
              </div>
              <div className="w-1 h-1 bg-dark-500 rotate-45 -mt-0.5" />
            </div>
          )}

          <div className="h-6 bg-dark-800 rounded-md overflow-hidden flex relative">
            <div
              className={`h-full transition-all duration-500 ${isTotalExceeded ? 'bg-expense/80' : 'bg-primary-500/80'}`}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
            {showTodayMarker && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white/70 z-10 shadow-sm"
                style={{ left: `${todayPercentage}%` }}
              />
            )}
            {isTotalExceeded && (
               <div className="absolute right-2 top-0 bottom-0 flex items-center text-[11px] text-dark-100 font-medium">
                 {totalPercentage}%
               </div>
            )}
            {!isTotalExceeded && totalPercentage > 0 && (
               <div className="absolute left-2 top-0 bottom-0 flex items-center text-[11px] text-dark-100 font-medium">
                 {totalPercentage}%
               </div>
            )}
          </div>
          <div className="flex justify-between items-center text-[11px]">
             <span className={isTotalExceeded ? 'text-expense font-medium' : 'text-primary-400 font-medium'}>
               {formatCurrency(totalSpent)}
             </span>
             <span className="text-dark-200">
               {isTotalExceeded ? (
                 `Excess Rp ${formatCurrency(totalBudget - totalSpent).replace('Rp ', '')}`
               ) : (
                 `Rp ${formatCurrency(totalBudget - totalSpent).replace('Rp ', '')}`
               )}
             </span>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-4 pt-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localCategories.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {localCategories.map(cat => {
              const limit = Number(cat.budget_limit) || 0
              const spent = transactions
                .filter(t => t.category_id === cat.id && t.type === 'expense')
                .reduce((sum, t) => sum + Number(t.amount), 0)
              
              const percentage = limit > 0 ? Math.round((spent / limit) * 100) : (spent > 0 ? 100 : 0)
              const isExceeded = spent > limit && limit > 0

              return (
                <SortableCategoryItem
                  key={cat.id}
                  category={cat}
                  limit={limit}
                  spent={spent}
                  percentage={percentage}
                  isExceeded={isExceeded}
                  showTodayMarker={showTodayMarker}
                  todayPercentage={todayPercentage}
                />
              )
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
