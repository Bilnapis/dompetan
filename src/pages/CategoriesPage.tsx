import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { CategoryForm } from '../components/CategoryForm'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { formatCurrency } from '../lib/helpers'
import type { Category, CategoryInsert, CategoryUpdate, CategoryType } from '../types/database'
import { CategoryListSkeleton } from '../components/ui/Skeleton'

export function CategoriesPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CategoryType>('expense')
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories(activeTab)

  const [showForm, setShowForm] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)

  const handleSubmit = async (data: CategoryInsert | CategoryUpdate) => {
    if (editingCat) {
      return await updateCategory(editingCat.id, data as CategoryUpdate)
    }
    return await addCategory(data as CategoryInsert)
  }

  const handleEdit = (cat: Category) => {
    setEditingCat(cat)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kategori ini? Transaksi dengan kategori ini tidak akan dihapus.')) {
      await deleteCategory(id)
    }
  }

  const tabs: { value: CategoryType; label: string }[] = [
    { value: 'expense', label: 'Pengeluaran' },
    { value: 'income', label: 'Pemasukan' },
  ]

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-dark-100">Kategori</h1>
        <Button
          size="sm"
          onClick={() => { setEditingCat(null); setShowForm(true) }}
          icon={<Plus className="w-4 h-4" />}
        >
          Tambah
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-dark-700 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`
              flex-1 py-2.5 text-sm font-medium transition-all duration-200
              ${activeTab === tab.value
                ? tab.value === 'income'
                  ? 'bg-income/15 text-income'
                  : 'bg-expense/15 text-expense'
                : 'bg-dark-800/50 text-dark-400 hover:text-dark-200'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category List */}
      {loading ? (
        <CategoryListSkeleton count={5} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-8 h-8 text-dark-500" />}
          title="Belum ada kategori"
          description={`Tambahkan kategori ${activeTab === 'income' ? 'pemasukan' : 'pengeluaran'} baru`}
          actionLabel="Tambah Kategori"
          onAction={() => { setEditingCat(null); setShowForm(true) }}
        />
      ) : (
        <div className="glass rounded-2xl overflow-hidden divide-y divide-dark-700/50">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                if (cat.type === 'expense') {
                  navigate(`/categories/${cat.id}`)
                }
              }}
              className="flex items-center gap-3 px-4 py-3 group hover:bg-dark-800/50 transition-colors cursor-pointer"
            >
              <div className={`
                w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                ${cat.type === 'income' ? 'bg-income/10' : 'bg-expense/10'}
              `}>
                {cat.icon ? (
                  <span className="text-lg leading-none">{cat.icon}</span>
                ) : (
                  <Tag className={`w-4 h-4 ${cat.type === 'income' ? 'text-income' : 'text-expense'}`} />
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col">
                <span className="text-sm font-medium text-dark-200 truncate">{cat.name}</span>
                {cat.type === 'expense' && cat.budget_limit > 0 && (
                  <span className="text-[10px] text-dark-400 mt-0.5">
                    Limit: {formatCurrency(cat.budget_limit)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-primary-400 hover:bg-dark-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-expense hover:bg-dark-700 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingCat(null) }}
        onSubmit={handleSubmit}
        editData={editingCat}
        defaultType={activeTab}
      />
    </div>
  )
}
