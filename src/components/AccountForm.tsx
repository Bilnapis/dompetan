import { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import type { Account, AccountInsert, AccountUpdate } from '../types/database'

interface AccountFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AccountInsert | AccountUpdate) => Promise<{ error: string | null }>
  editData?: Account | null
}

export function AccountForm({ isOpen, onClose, onSubmit, editData }: AccountFormProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editData) {
      setName(editData.name)
    } else {
      setName('')
      setError('')
    }
  }, [editData, isOpen])

  const handleClose = () => {
    setName('')
    setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nama pos keuangan tidak boleh kosong')
      return
    }

    setLoading(true)

    const data = { name: name.trim() }
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
      title={editData ? 'Edit Dompet / Pos' : 'Tambah Dompet / Pos'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-expense/10 border border-expense/20 text-expense text-sm text-center">
            {error}
          </div>
        )}

        <Input
          label="Nama Dompet / Pos Keuangan"
          placeholder="Contoh: BCA, OVO, Tunai"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

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
