import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input, Select } from "./ui/Input";
import { useCategories } from "../hooks/useCategories";
import { useAccounts } from "../hooks/useAccounts";
import { toDateInputValue } from "../lib/helpers";
import type { TransactionWithDetails, CategoryType } from "../types/database";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<{ error: string | null }>;
  editData?: TransactionWithDetails | null;
  onDelete?: (id: string) => void;
}

export function TransactionForm({
  isOpen,
  onClose,
  onSubmit,
  editData,
  onDelete,
}: TransactionFormProps) {
  const [type, setType] = useState<CategoryType | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toDateInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch categories based on selected type
  const { categories } = useCategories(type);
  const { accounts } = useAccounts();

  // Pre-fill form when editing
  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setAmount(String(editData.amount));
      setCategoryId(editData.category_id || "");
      setAccountId(editData.account_id || "");
      setNote(editData.note || "");
      setDate(toDateInputValue(editData.transaction_date));
    } else {
      resetForm();
    }
  }, [editData, isOpen]);

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setCategoryId("");
    setAccountId("");
    setToAccountId("");
    setNote("");
    setDate(toDateInputValue());
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Masukkan jumlah yang valid");
      return;
    }

    if (type === "transfer") {
      if (accountId === toAccountId) {
        setError("Pos keuangan asal dan tujuan tidak boleh sama");
        return;
      }
      if (!accountId || !toAccountId) {
        setError("Pilih pos keuangan asal dan tujuan");
        return;
      }
    }

    setLoading(true);

    let data: any;
    if (type === "transfer") {
      data = {
        type: "transfer",
        amount: numAmount,
        from_account_id: accountId,
        to_account_id: toAccountId,
        note: note.trim() || null,
        transaction_date: date,
      };
    } else {
      data = {
        amount: numAmount,
        type,
        category_id: categoryId || null,
        account_id: accountId || null,
        note: note.trim() || null,
        transaction_date: date,
      };
    }

    const result = await onSubmit(data);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      handleClose();
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editData ? "Edit Transaksi" : "Tambah Transaksi"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-expense/10 border border-expense/20 text-expense text-sm text-center">
            {error}
          </div>
        )}

        {/* Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">
            Tipe
          </label>
          <div className="flex rounded-xl overflow-hidden border border-dark-700">
            <button
              type="button"
              onClick={() => {
                setType("income");
                setCategoryId("");
              }}
              className={`
                flex-1 py-2.5 text-sm font-medium transition-all duration-200
                ${
                  type === "income"
                    ? "bg-income text-white"
                    : "bg-dark-800 text-dark-400 hover:text-dark-200"
                }
              `}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => {
                setType("expense");
                setCategoryId("");
              }}
              className={`
                flex-1 py-2.5 text-sm font-medium transition-all duration-200
                ${
                  type === "expense"
                    ? "bg-expense text-white"
                    : "bg-dark-800 text-dark-400 hover:text-dark-200"
                }
              `}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setType("transfer");
                setCategoryId("");
              }}
              className={`
                flex-1 py-2.5 text-sm font-medium transition-all duration-200 border-l border-dark-700
                ${
                  type === "transfer"
                    ? "bg-primary-500 text-white"
                    : "bg-dark-800 text-dark-400 hover:text-dark-200"
                }
              `}
            >
              Transfer
            </button>
          </div>
        </div>

        {/* Note */}
        <Input
          type="text"
          label="Catatan"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Misal: Makan siang..."
          autoFocus
        />


        <Input
          type="text"
          inputMode="numeric"
          label="Jumlah"
          placeholder="Rp 0"
          value={amount ? `Rp ${Number(amount).toLocaleString('id-ID')}` : ''}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '')
            setAmount(val)
          }}
          required
        />

        {/* Category */}
        {type !== "transfer" && (
          <Select
            label="Kategori"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            placeholder="Pilih kategori"
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
          />
        )}

        {/* Account / Dompet */}
        <Select
          label={
            type === "transfer" ? "Dari Pos Keuangan" : "Pos Keuangan / Dompet"
          }
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="Pilih dompet"
          required
          options={accounts.map((acc) => ({
            value: acc.id,
            label: acc.name,
          }))}
        />

        {/* To Account (Only for Transfer) */}
        {type === "transfer" && (
          <Select
            label="Ke Pos Keuangan"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            placeholder="Pilih dompet tujuan"
            required
            options={accounts.map((acc) => ({
              value: acc.id,
              label: acc.name,
            }))}
          />
        )}

        {/* Date */}
        <Input
          type="date"
          label="Tanggal"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />


        {/* Submit */}
        <div className="flex gap-3 pt-2">
          {editData && onDelete && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onDelete(editData.id);
                handleClose();
              }}
              className="!px-3 text-expense hover:bg-expense/10 hover:text-expense hover:border-expense/30"
            >
              Hapus
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleClose}
          >
            Batal
          </Button>
          <Button type="submit" fullWidth loading={loading}>
            {editData ? "Simpan" : "Tambah"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
