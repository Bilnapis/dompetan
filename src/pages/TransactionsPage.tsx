import { useState, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { TransactionItem } from "../components/TransactionItem";
import { EmptyState } from "../components/ui/EmptyState";
import { useCategories } from "../hooks/useCategories";
import {
  formatDateGroup,
  getCycleDateRange,
  formatDateShort,
  formatCurrency,
} from "../lib/helpers";
import { useSettings } from "../contexts/SettingsContext";
import { TransactionListSkeleton } from "../components/ui/Skeleton";
import type { TransactionWithDetails, CategoryType } from "../types/database";

type FilterType = "all" | CategoryType;

export function TransactionsPage() {
  const { settings } = useSettings();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("Daily");

  const handlePrevMonth = () => {
    setFilterMonth((prev) => {
      const [year, month] = prev.split("-").map(Number);
      let newMonth = month - 1;
      let newYear = year;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
      return `${newYear}-${String(newMonth).padStart(2, "0")}`;
    });
  };

  const handleNextMonth = () => {
    setFilterMonth((prev) => {
      const [year, month] = prev.split("-").map(Number);
      let newMonth = month + 1;
      let newYear = year;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
      return `${newYear}-${String(newMonth).padStart(2, "0")}`;
    });
  };

  // Calculate date range from month filter and user settings
  const dateRange = useMemo(() => {
    const [year, month] = filterMonth.split("-").map(Number);
    return getCycleDateRange(
      year,
      month - 1, // 0-indexed month
      settings?.month_start_date || 1,
      settings?.weekend_behavior || "none",
    );
  }, [filterMonth, settings]);

  const {
    transactions,
    loading,
    summary,
  } = useTransactions({
    type: "all",
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  useCategories();

  // Group and filter transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithDetails[]> = {};
    for (const tx of transactions) {
      if (filterType !== "all" && tx.type !== filterType) continue;

      const dateKey = tx.transaction_date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions, filterType]);

  const handleEdit = (tx: TransactionWithDetails) => {
    navigate('/transaction/form', { state: { editData: tx } });
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "income", label: "Pemasukan" },
    { value: "expense", label: "Pengeluaran" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-dark-100">Transaksi</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-dark-400 hover:text-primary-400 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            onClick={(e) => {
              try {
                if ("showPicker" in HTMLInputElement.prototype) {
                  e.currentTarget.showPicker();
                }
              } catch (err) {
                // Ignore if not supported
              }
            }}
            className="
              w-32 bg-dark-800 border border-dark-700 rounded-lg
              px-2 py-1.5 text-xs text-dark-200 text-center
              focus:outline-none focus:ring-1 focus:ring-primary-500
              [&::-webkit-calendar-picker-indicator]:hidden
              [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:justify-center
            "
          />
          <button
            onClick={handleNextMonth}
            className="p-1 text-dark-400 hover:text-primary-400 hover:bg-dark-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Indicator of actual date range */}
      {(settings?.month_start_date ?? 1) > 1 && (
        <div className="text-[10px] text-dark-400 text-right -mt-4 mb-4 pr-1">
          Rentang: {formatDateShort(dateRange.start)} -{" "}
          {formatDateShort(dateRange.end)}
        </div>
      )}

      {/* Top Navigation Tabs */}
      <div className="flex justify-between items-center border-b border-dark-700/50 mb-6 overflow-x-auto no-scrollbar">
        {["Daily", "Calendar", "Monthly", "Note"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors relative
              ${activeTab === tab ? "text-dark-100" : "text-dark-500 hover:text-dark-300"}
            `}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <>
        {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Pemasukan</p>
              <p className="text-sm font-bold text-income">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Pengeluaran</p>
              <p className="text-sm font-bold text-expense">
                {formatCurrency(summary.totalExpense)}
              </p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Selisih</p>
              <p
                className={`text-sm font-bold ${summary.balance >= 0 ? "text-primary-400" : "text-expense"}`}
              >
                {formatCurrency(summary.balance)}
              </p>
            </div>
          </div>

          {/* Type Filter Tabs */}
          <div className="flex rounded-xl overflow-hidden border border-dark-700 mb-5">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterType(f.value)}
                className={`
                  flex-1 py-2 text-xs font-medium transition-all duration-200
                  ${
                    filterType === f.value
                      ? "bg-primary-500/15 text-primary-400 border-b-2 border-primary-400"
                      : "bg-dark-800/50 text-dark-400 hover:text-dark-200"
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          {loading ? (
            <TransactionListSkeleton count={5} />
          ) : groupedTransactions.length === 0 ? (
            <EmptyState
              title="Belum ada transaksi"
              description="Transaksi yang kamu buat akan muncul di sini"
              actionLabel="Tambah Transaksi"
              onAction={() => navigate('/transaction/form')}
            />
          ) : (
            <div className="space-y-4 mb-6">
              {groupedTransactions.map(([date, txs]) => {
                const dailyIncome = txs
                  .filter((t) => t.type === "income" && t.category_id !== null)
                  .reduce((sum, t) => sum + Number(t.amount), 0);
                const dailyExpense = txs
                  .filter((t) => t.type === "expense" && t.category_id !== null)
                  .reduce((sum, t) => sum + Number(t.amount), 0);

                return (
                  <div key={date}>
                    <div className="flex items-center justify-between mb-2 px-1">
                      <p className="text-xs font-medium text-dark-500">
                        {formatDateGroup(date)}
                      </p>
                      <div className="flex gap-3 text-[10px] font-semibold">
                        {dailyIncome > 0 && (
                          <span className="text-income">
                            +{formatCurrency(dailyIncome)}
                          </span>
                        )}
                        {dailyExpense > 0 && (
                          <span className="text-expense">
                            -{formatCurrency(dailyExpense)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="glass rounded-2xl overflow-hidden divide-y divide-dark-700/50">
                      {txs.map((tx) => (
                        <TransactionItem
                          key={tx.id}
                          transaction={tx}
                          onEdit={handleEdit}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </>

      {/* FAB */}
      <button
        onClick={() => navigate('/transaction/form')}
        className="
          fixed bottom-24 right-6 z-30
          w-14 h-14 rounded-2xl
          bg-gradient-to-br from-primary-400 to-primary-600
          text-white shadow-lg shadow-primary-500/30
          flex items-center justify-center
          hover:shadow-xl hover:shadow-primary-500/40
          active:scale-95
          transition-all duration-200
        "
      >
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
}
