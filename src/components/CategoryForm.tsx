import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react'
import type { Category, CategoryInsert, CategoryUpdate, CategoryType } from '../types/database'

interface CategoryFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CategoryInsert | CategoryUpdate) => Promise<{ error: string | null }>
  editData?: Category | null
  defaultType?: CategoryType
}

export function CategoryForm({ isOpen, onClose, onSubmit, editData, defaultType = 'expense' }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>(defaultType)
  const [icon, setIcon] = useState<string>('')
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (editData) {
      setName(editData.name)
      setType(editData.type)
      setIcon(editData.icon || '')
    } else {
      setName('')
      setType(defaultType)
      setIcon('')
      setError('')
    }
  }, [editData, isOpen, defaultType])

  const handleClose = () => {
    setName('')
    setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nama kategori tidak boleh kosong')
      return
    }

    setLoading(true)

    const data = editData
      ? { name: name.trim(), icon }
      : { name: name.trim(), type, icon, budget_limit: 0 }

    const result = await onSubmit(data)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      handleClose()
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editData ? 'Edit Kategori' : 'Tambah Kategori'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-expense/10 border border-expense/20 text-expense text-sm text-center">
            {error}
          </div>
        )}

        <Input
          label="Nama Kategori"
          placeholder="Contoh: Makanan & Minuman"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        {/* Type Toggle (only for new category) */}
        {!editData && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Tipe</label>
            <div className="flex rounded-xl overflow-hidden border border-dark-700">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`
                  flex-1 py-2.5 text-sm font-medium transition-all duration-200
                  ${type === 'income'
                    ? 'bg-income text-white'
                    : 'bg-dark-800 text-dark-400 hover:text-dark-200'
                  }
                `}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`
                  flex-1 py-2.5 text-sm font-medium transition-all duration-200
                  ${type === 'expense'
                    ? 'bg-expense text-white'
                    : 'bg-dark-800 text-dark-400 hover:text-dark-200'
                  }
                `}
              >
                Pengeluaran
              </button>
            </div>
          </div>
        )}


        {/* Emoji Picker Library */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Icon (Emoji)</label>
          <div className="flex gap-3 items-center">
            <button
              type="button"
              onClick={() => setShowPicker(!showPicker)}
              className="w-12 h-12 rounded-xl bg-dark-800 border border-dark-700 flex items-center justify-center text-2xl hover:bg-dark-700 transition-colors shrink-0"
            >
              {icon || '🎯'}
            </button>
            <span className="text-sm text-dark-400">
              {icon ? 'Klik icon untuk mengganti' : 'Klik icon di sebelah kiri untuk memilih'}
            </span>
          </div>
          
          {showPicker && (
            <div className="mt-3 relative z-50 rounded-xl overflow-hidden shadow-2xl">
              <EmojiPicker
                onEmojiClick={(emojiData) => {
                  setIcon(emojiData.emoji)
                  setShowPicker(false)
                }}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.NATIVE}
                width="100%"
                height={350}
                searchPlaceholder="Cari emoji..."
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit" fullWidth loading={loading}>
            {editData ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
