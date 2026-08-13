import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { CategoryPickerSheet } from "../components/ui/CategoryPickerSheet";
import { useCategories } from "../hooks/useCategories";
import { useAccounts } from "../hooks/useAccounts";
import { useTransactions } from "../hooks/useTransactions";
import { useSettings } from "../contexts/SettingsContext";
import { toDateInputValue, getCurrentCycleRange } from "../lib/helpers";
import type { CategoryType, TransactionWithDetails } from "../types/database";

export function TransactionFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = (location.state as any)
    ?.editData as TransactionWithDetails | null;
  const { settings } = useSettings();

  const monthRange = getCurrentCycleRange(
    settings?.month_start_date || 1,
    settings?.weekend_behavior || "none",
  );

  const { addTransaction, addTransfer, updateTransaction, deleteTransaction } =
    useTransactions({
      startDate: monthRange.start,
      endDate: monthRange.end,
    });

  const [type, setType] = useState<CategoryType | "transfer">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toDateInputValue());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Fetch categories based on selected type
  const { categories } = useCategories(type);
  const { accounts } = useAccounts();

  // Find selected category for display
  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Pre-fill form when editing
  useEffect(() => {
    if (editData) {
      setType(editData.type);
      setAmount(String(editData.amount));
      setCategoryId(editData.category_id || "");
      setAccountId(editData.account_id || "");
      setNote(editData.note || "");
      setDate(toDateInputValue(editData.transaction_date));
    }
  }, [editData]);

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

    let result;
    if (type === "transfer") {
      const data = {
        type: "transfer" as const,
        amount: numAmount,
        from_account_id: accountId,
        to_account_id: toAccountId,
        note: note.trim() || null,
        transaction_date: date,
      };
      result = await addTransfer(
        data.from_account_id,
        data.to_account_id,
        data.amount,
        data.transaction_date,
        data.note || undefined,
      );
    } else {
      const data = {
        amount: numAmount,
        type: type as CategoryType,
        category_id: categoryId || null,
        account_id: accountId || null,
        note: note.trim() || null,
        transaction_date: date,
      };

      if (editData) {
        result = await updateTransaction(editData.id, data);
      } else {
        result = await addTransaction(data);
      }
    }

    if (result && "error" in result && result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      navigate(-1); // Go back after success
    }
  };

  const handleDelete = async () => {
    if (!editData) return;
    if (confirm("Hapus transaksi ini?")) {
      await deleteTransaction(editData.id);
      navigate(-1);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-dark-900 min-h-screen text-dark-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-dark-800 sticky top-0 bg-dark-900/95 backdrop-blur-sm z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-dark-200 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium text-[15px]">
          {editData ? "Edit Transaksi" : "Tambah Transaksi"}
        </h1>
        <div className="w-8"></div> {/* Spacer to center title */}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
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
                  ${type === "income" ? "bg-income text-white" : "bg-dark-800 text-dark-400 hover:text-dark-200"}
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
                  ${type === "expense" ? "bg-expense text-white" : "bg-dark-800 text-dark-400 hover:text-dark-200"}
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
                  ${type === "transfer" ? "bg-primary-500 text-white" : "bg-dark-800 text-dark-400 hover:text-dark-200"}
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
            value={amount ? `Rp ${Number(amount).toLocaleString("id-ID")}` : ""}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              setAmount(val);
            }}
            required
          />

          {/* Category - Tappable field that opens bottom sheet */}
          {type !== "transfer" && (
            <div className="w-full">
              <label className="block text-sm font-medium text-dark-300 mb-1.5">
                Kategori
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryPicker(true)}
                className={`
                  w-full px-4 py-2.5 rounded-xl text-left
                  bg-dark-800 border border-dark-700
                  transition-all duration-200
                  hover:border-dark-600
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                  flex items-center gap-3
                `}
              >
                {selectedCategory ? (
                  <>
                    <span className="text-lg leading-none">
                      {selectedCategory.icon || "📁"}
                    </span>
                    <span className="text-dark-100 text-sm">
                      {selectedCategory.name}
                    </span>
                  </>
                ) : (
                  <span className="text-dark-500 text-sm">Pilih kategori</span>
                )}
              </button>
            </div>
          )}

          {/* Account / Dompet */}
          <Select
            label={
              type === "transfer"
                ? "Dari Pos Keuangan"
                : "Pos Keuangan / Dompet"
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
          <div className="flex gap-3 pt-4">
            {editData && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleDelete}
                className="!px-4 text-expense hover:bg-expense/10 hover:text-expense hover:border-expense/30"
              >
                Hapus
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => navigate(-1)}
            >
              Batal
            </Button>
            <Button type="submit" fullWidth loading={loading}>
              {editData ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </div>

      {/* Category Picker Bottom Sheet */}
      {type !== "transfer" && (
        <CategoryPickerSheet
          isOpen={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          categories={categories}
          selectedId={categoryId}
          onSelect={(id) => setCategoryId(id)}
        />
      )}
    </div>
  );
}

