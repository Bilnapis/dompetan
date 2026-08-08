import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { useCategoryBudgets } from '../hooks/useCategoryBudgets'
import { formatCurrency } from '../lib/helpers'

export function CategoryBudgetPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [year, setYear] = useState(() => new Date().getFullYear().toString())
  
  // We need to fetch the category details
  const { categories, updateCategory, deleteCategory } = useCategories('expense')
  const category = categories.find(c => c.id === id)
  
  const { budgets, setCategoryBudget } = useCategoryBudgets(id, year)

  // State for the modal/prompt to set budget
  const [editingMonth, setEditingMonth] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // If category is not found (e.g. invalid ID or still loading)
  if (!category && categories.length > 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-dark-400">Kategori tidak ditemukan.</p>
        <button onClick={() => navigate(-1)} className="text-primary-400 mt-2">Kembali</button>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!category) return
    if (confirm('Hapus kategori ini? Transaksi dengan kategori ini tidak akan dihapus.')) {
      await deleteCategory(category.id)
      navigate('/categories')
    }
  }

  const handleEditDefault = () => {
    const newVal = prompt('Set Default Budget:', category?.budget_limit?.toString() || '0')
    if (newVal !== null && !isNaN(Number(newVal))) {
      updateCategory(category!.id, { budget_limit: Number(newVal) })
    }
  }

  const handleEditMonth = (monthCode: string, currentVal: number) => {
    const newVal = prompt(`Set Budget for ${monthCode}:`, currentVal.toString())
    if (newVal !== null && !isNaN(Number(newVal))) {
      setCategoryBudget(category!.id, monthCode, Number(newVal))
    }
  }

  // Generate months for the selected year (Dec down to Jan)
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = 12 - i
    const monthStr = monthNum.toString().padStart(2, '0')
    const monthCode = `${year}-${monthStr}` // '2026-12'
    
    // Find if there's a specific budget override
    const specificBudget = budgets.find(b => b.month === monthCode)
    const amount = specificBudget ? specificBudget.amount : (category?.budget_limit || 0)
    
    // Short month name
    const dateObj = new Date(`${year}-${monthStr}-01T00:00:00`)
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' })
    
    return {
      monthCode,
      monthName,
      amount,
      isOverride: !!specificBudget,
      isCurrentMonth: monthCode === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    }
  })

  return (
    <div className="max-w-lg mx-auto bg-dark-900 min-h-screen text-dark-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-dark-800">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-dark-200 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 flex items-center justify-center gap-4">
          <h1 className="font-semibold text-[15px] flex items-center gap-1.5">
            <span>{category?.icon || '🏷️'}</span> {category?.name}
          </h1>
          
          <div className="flex items-center gap-1 text-sm text-dark-300">
            <button 
              onClick={() => setYear(y => (Number(y) - 1).toString())}
              className="p-0.5 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-10 text-center">{year}</span>
            <button 
              onClick={() => setYear(y => (Number(y) + 1).toString())}
              className="p-0.5 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <button onClick={handleDelete} className="p-1 -mr-1 text-dark-400 hover:text-expense transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 flex gap-4 items-center border-b border-dark-800 bg-dark-900/50">
        <div className="w-10 h-10 rounded-full border border-expense/30 flex items-center justify-center shrink-0">
          <span className="text-expense text-xl">📝</span>
        </div>
        <p className="text-[11px] text-dark-400 leading-relaxed">
          You can set the budget settings for each month. If you change the default budget, it will be applied starting next month.
        </p>
      </div>

      {/* Default Budget */}
      <div 
        onClick={handleEditDefault}
        className="px-4 py-4 flex items-center justify-between border-b border-dark-800 cursor-pointer hover:bg-dark-800/50 transition-colors"
      >
        <span className="text-[15px] text-dark-100">Default Budget</span>
        <span className="text-[15px] text-dark-100 font-medium">
          {formatCurrency(category?.budget_limit || 0)}
        </span>
      </div>

      {/* Monthly Budgets List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-dark-800">
          {months.map(m => (
            <div 
              key={m.monthCode}
              onClick={() => handleEditMonth(m.monthCode, m.amount)}
              className="px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-dark-800/50 transition-colors"
            >
              <div className={`
                px-3 py-1 rounded text-[13px] border 
                ${m.isCurrentMonth 
                  ? 'border-expense text-expense' 
                  : 'border-dark-700 text-dark-400'
                }
              `}>
                {m.monthName}
              </div>
              <span className={`text-[15px] ${m.isOverride ? 'text-primary-400' : 'text-dark-100'}`}>
                {formatCurrency(m.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
