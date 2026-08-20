import { useState, useMemo, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { TransactionItem } from "../components/TransactionItem";
import { EmptyState } from "../components/ui/EmptyState";
import { useCategories } from "../hooks/useCategories";
import {
  formatDateGroup,
  getCycleDateRange,
  getCurrentCycleMonth,
  formatDateShort,
  formatCurrency,
} from "../lib/helpers";
import { useSettings } from "../contexts/SettingsContext";
import { TransactionListSkeleton } from "../components/ui/Skeleton";
import { CalendarView } from "../components/CalendarView";
import type { TransactionWithDetails, CategoryType } from "../types/database";

type FilterType = "all" | CategoryType;

export function TransactionsPage() {
  const { settings, loading: settingsLoading } = useSettings();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("Daily");

  // Initialize filterMonth once settings are loaded
  const resolvedFilterMonth = useMemo(() => {
    if (filterMonth !== null) return filterMonth;
    if (settingsLoading) return null;
    return getCurrentCycleMonth(
      settings?.month_start_date || 1,
      settings?.weekend_behavior || "none"
    );
  }, [filterMonth, settingsLoading, settings]);

  const handlePrevMonth = () => {
    const base = filterMonth ?? resolvedFilterMonth;
    if (!base) return;
    const [year, month] = base.split("-").map(Number);
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setFilterMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const base = filterMonth ?? resolvedFilterMonth;
    if (!base) return;
    const [year, month] = base.split("-").map(Number);
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setFilterMonth(`${newYear}-${String(newMonth).padStart(2, "0")}`);
  };

  // Calculate date range from month filter and user settings
  const dateRange = useMemo(() => {
    if (!resolvedFilterMonth) return null;
    const [year, month] = resolvedFilterMonth.split("-").map(Number);
    return getCycleDateRange(
      year,
      month - 1, // 0-indexed month
      settings?.month_start_date || 1,
      settings?.weekend_behavior || "none",
    );
  }, [resolvedFilterMonth, settings]);

  const {
    transactions,
    loading,
  } = useTransactions(dateRange ? {
    type: "all",
    startDate: dateRange.start,
    endDate: dateRange.end,
  } : undefined);

  useCategories();

  // Group and filter transactions by date and search query
  const groupedTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const groups: Record<string, TransactionWithDetails[]> = {};
    for (const tx of transactions) {
      if (filterType !== "all" && tx.type !== filterType) continue;

      // Search filter: match note, category name, or account name
      if (query) {
        const note = (tx.note || "").toLowerCase();
        const categoryName = (tx.category?.name || "").toLowerCase();
        const accountName = (tx.account?.name || "").toLowerCase();
        const amountStr = String(tx.amount);
        if (
          !note.includes(query) &&
          !categoryName.includes(query) &&
          !accountName.includes(query) &&
          !amountStr.includes(query)
        ) {
          continue;
        }
      }

      const dateKey = tx.transaction_date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions, filterType, searchQuery]);

  // Compute summary from the visible (filtered) transactions
  const filteredSummary = useMemo(() => {
    const allFiltered = groupedTransactions.flatMap(([, txs]) => txs);
    const totalIncome = allFiltered
      .filter((t) => t.type === "income" && t.category_id !== null)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = allFiltered
      .filter((t) => t.type === "expense" && t.category_id !== null)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [groupedTransactions]);

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
            value={resolvedFilterMonth || ""}
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
      {(settings?.month_start_date ?? 1) > 1 && dateRange && (
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

      {/* ── CALENDAR TAB ── */}
      {activeTab === "Calendar" && (
        <div className="mb-6">
          <CalendarView
            transactions={transactions}
            dateRange={dateRange}
            onEditTransaction={handleEdit}
          />
        </div>
      )}

      {/* ── DAILY TAB (default) ── */}
      {activeTab !== "Calendar" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Pemasukan</p>
              <p className="text-sm font-bold text-income">
                {formatCurrency(filteredSummary.totalIncome)}
              </p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Pengeluaran</p>
              <p className="text-sm font-bold text-expense">
                {formatCurrency(filteredSummary.totalExpense)}
              </p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Selisih</p>
              <p
                className={`text-sm font-bold ${filteredSummary.balance >= 0 ? "text-primary-400" : "text-expense"}`}
              >
                {formatCurrency(filteredSummary.balance)}
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

          {/* Search Bar */}
          <div className="relative mb-5 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-dark-500 group-focus-within:text-primary-400 transition-colors" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi..."
              className="
                w-full pl-10 pr-9 py-2.5 text-sm
                bg-dark-800/60 border border-dark-700/60 rounded-xl
                text-dark-100 placeholder:text-dark-500
                focus:outline-none focus:ring-1 focus:ring-primary-500/50 focus:border-primary-500/50
                focus:bg-dark-800
                transition-all duration-200
              "
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-500 hover:text-dark-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Transactions List */}
          {loading ? (
            <TransactionListSkeleton count={5} />
          ) : groupedTransactions.length === 0 ? (
            searchQuery ? (
              <EmptyState
                title="Tidak ditemukan"
                description={`Tidak ada transaksi yang cocok dengan "${searchQuery}"`}
              />
            ) : (
              <EmptyState
                title="Belum ada transaksi"
                description="Transaksi yang kamu buat akan muncul di sini"
                actionLabel="Tambah Transaksi"
                onAction={() => navigate('/transaction/form')}
              />
            )
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
      )}

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
