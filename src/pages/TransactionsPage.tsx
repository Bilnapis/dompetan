import { useState, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import { useNavigate } from "react-router-dom";
import { TransactionItem } from "../components/TransactionItem";
import { EmptyState } from "../components/ui/EmptyState";
import { useCategories } from "../hooks/useCategories";
import {
  getCycleDateRange,
  getCurrentCycleMonth,
  formatDateShort,
  formatCurrency,
  toDateInputValue,
} from "../lib/helpers";
import { useSettings } from "../contexts/SettingsContext";
import { TransactionListSkeleton } from "../components/ui/Skeleton";
import { CalendarView } from "../components/CalendarView";
import type {
  TransactionWithDetails,
  CategoryType,
  WeekendBehavior,
} from "../types/database";

type FilterType = "all" | CategoryType;
type CycleWeek = {
  start: string;
  end: string;
};

// ── Helper: generate full Sun–Sat calendar weeks that overlap the cycle range ──
function getCycleWeeks(
  year: number,
  month: number, // 0-indexed
  startDay: number,
  weekendBehavior: WeekendBehavior,
): CycleWeek[] {
  const cycleRange = getCycleDateRange(year, month, startDay, weekendBehavior);
  const cycleStart = new Date(cycleRange.start);
  const cycleEnd = new Date(cycleRange.end);

  // Find the Sunday of the week that contains cycleStart
  const firstSunday = new Date(cycleStart);
  firstSunday.setDate(firstSunday.getDate() - firstSunday.getDay()); // go back to Sunday

  const weeks: CycleWeek[] = [];
  let weekStart = new Date(firstSunday);

  while (weekStart <= cycleEnd) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // Saturday

    weeks.push({
      start: toDateInputValue(weekStart),
      end: toDateInputValue(weekEnd),
    });

    weekStart.setDate(weekStart.getDate() + 7);
  }

  // Return newest week first (descending)
  return weeks.reverse();
}

// ── Helper: compute income/expense for a date range from transaction list ──
function computeRangeSummary(
  transactions: TransactionWithDetails[],
  start: string,
  end: string,
) {
  const filtered = transactions.filter(
    (t) => t.transaction_date >= start && t.transaction_date <= end,
  );
  const income = filtered
    .filter((t) => t.type === "income" && t.category_id !== null)
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = filtered
    .filter((t) => t.type === "expense" && t.category_id !== null)
    .reduce((s, t) => s + Number(t.amount), 0);
  return { income, expense, balance: income - expense };
}

// ── Helper: short month name (e.g. "Agu") ──
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const DAY_NAMES_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function TransactionsPage() {
  const { settings, loading: settingsLoading } = useSettings();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("Daily");
  // Monthly view: which month row is expanded (YYYY-MM)
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  // Initialize filterMonth once settings are loaded
  const resolvedFilterMonth = useMemo(() => {
    if (filterMonth !== null) return filterMonth;
    if (settingsLoading) return null;
    return getCurrentCycleMonth(
      settings?.month_start_date || 1,
      settings?.weekend_behavior || "none",
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

  const handlePrevYear = () => {
    const base = filterMonth ?? resolvedFilterMonth;
    if (!base) return;
    const [year, month] = base.split("-").map(Number);
    setFilterMonth(`${year - 1}-${String(month).padStart(2, "0")}`);
  };

  const handleNextYear = () => {
    const base = filterMonth ?? resolvedFilterMonth;
    if (!base) return;
    const [year, month] = base.split("-").map(Number);
    setFilterMonth(`${year + 1}-${String(month).padStart(2, "0")}`);
  };

  const currentYear = resolvedFilterMonth
    ? parseInt(resolvedFilterMonth.split("-")[0], 10)
    : new Date().getFullYear();

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

  const { transactions, loading } = useTransactions(
    dateRange
      ? {
          type: "all",
          startDate: dateRange.start,
          endDate: dateRange.end,
        }
      : undefined,
  );

  // ── For Monthly tab: fetch full year data ──
  // Harus mencakup dari awal cycle Januari s/d akhir cycle Desember tahun ini,
  // karena cycle Desember bisa berakhir di bulan Januari tahun berikutnya.
  const yearDateRange = useMemo(() => {
    if (!resolvedFilterMonth || !settings) return null;
    const year = parseInt(resolvedFilterMonth.split("-")[0], 10);
    const sd = settings.month_start_date || 1;
    const wb = settings.weekend_behavior || "none";
    const janCycle = getCycleDateRange(year, 0, sd, wb); // Jan (0-indexed)
    const decCycle = getCycleDateRange(year, 11, sd, wb); // Dec (0-indexed)

    const start = new Date(janCycle.start);
    start.setDate(start.getDate() - start.getDay()); // Go back to Sunday

    const end = new Date(decCycle.end);
    end.setDate(end.getDate() + (6 - end.getDay())); // Go forward to Saturday

    return { start: toDateInputValue(start), end: toDateInputValue(end) };
  }, [resolvedFilterMonth, settings]);

  const { transactions: yearTransactions, loading: yearLoading } =
    useTransactions(
      activeTab === "Monthly" && yearDateRange
        ? {
            type: "all",
            startDate: yearDateRange.start,
            endDate: yearDateRange.end,
          }
        : undefined,
    );

  useCategories();

  const searchedTransactions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return transactions;

    return transactions.filter((tx) => {
      const note = (tx.note || "").toLowerCase();
      const categoryName = (tx.category?.name || "").toLowerCase();
      const accountName = (tx.account?.name || "").toLowerCase();
      const amountStr = String(tx.amount);

      return (
        note.includes(query) ||
        categoryName.includes(query) ||
        accountName.includes(query) ||
        amountStr.includes(query)
      );
    });
  }, [transactions, searchQuery]);

  // Group transactions by date after search and type filters are applied
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, TransactionWithDetails[]> = {};
    for (const tx of searchedTransactions) {
      if (filterType !== "all" && tx.type !== filterType) continue;

      const dateKey = tx.transaction_date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [searchedTransactions, filterType]);

  // Compute summary from searched transactions so recap cards remain useful filters
  const filteredSummary = useMemo(() => {
    const totalIncome = searchedTransactions
      .filter((t) => t.type === "income" && t.category_id !== null)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = searchedTransactions
      .filter((t) => t.type === "expense" && t.category_id !== null)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [searchedTransactions]);

  const handleEdit = (tx: TransactionWithDetails) => {
    navigate("/transaction/form", { state: { editData: tx } });
  };

  // ── Monthly tab: build list of cycle-months in the selected year ──
  const startDay = settings?.month_start_date || 1;
  const weekendBehavior = settings?.weekend_behavior || "none";

  const monthlyRows = useMemo(() => {
    if (!resolvedFilterMonth) return [];
    const year = parseInt(resolvedFilterMonth.split("-")[0], 10);
    const today = toDateInputValue(new Date());

    const rows = [];
    // Go from month 12 down to 1 (descending, newest first)
    for (let m = 12; m >= 1; m--) {
      const monthKey = `${year}-${String(m).padStart(2, "0")}`;
      const cycle = getCycleDateRange(year, m - 1, startDay, weekendBehavior);
      const summary = computeRangeSummary(
        yearTransactions,
        cycle.start,
        cycle.end,
      );
      const hasTransactions = yearTransactions.some(
        (t) => t.transaction_date >= cycle.start && t.transaction_date <= cycle.end,
      );

      // Skip future months only when there is no transaction data in that cycle.
      if (cycle.start > today && !hasTransactions) continue;

      rows.push({ monthKey, month: m, year, cycle, summary });
    }
    return rows;
  }, [resolvedFilterMonth, yearTransactions, startDay, weekendBehavior]);

  const yearlySummary = useMemo(() => {
    return monthlyRows.reduce(
      (summary, row) => ({
        income: summary.income + row.summary.income,
        expense: summary.expense + row.summary.expense,
        balance: summary.balance + row.summary.balance,
      }),
      { income: 0, expense: 0, balance: 0 },
    );
  }, [monthlyRows]);

  const todayStr = toDateInputValue(new Date());

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-dark-100">Transaksi</h1>
        <div className="flex items-center gap-1">
          {activeTab === "Monthly" ? (
            /* Year-only navigator for Monthly tab */
            <>
              <button
                onClick={handlePrevYear}
                className="p-1 text-dark-400 hover:text-primary-400 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="w-16 text-center text-xs font-semibold text-dark-200 bg-dark-800 border border-dark-700 rounded-lg px-2 py-1.5">
                {currentYear}
              </span>
              <button
                onClick={handleNextYear}
                className="p-1 text-dark-400 hover:text-primary-400 hover:bg-dark-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            /* Month navigator for other tabs */
            <>
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
                  period-picker w-32 bg-dark-800 border border-dark-700 rounded-lg
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
            </>
          )}
        </div>
      </div>

      {/* Indicator of actual date range */}
      {activeTab !== "Monthly" && (settings?.month_start_date ?? 1) > 1 && dateRange && (
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

      {/* ── MONTHLY TAB ── */}
      {activeTab === "Monthly" && (
        <div className="mb-6 animate-fade-in">
          {/* Yearly Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Pemasukan</p>
              <p className="text-sm font-bold text-income">
                {formatCurrency(yearlySummary.income)}
              </p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Pengeluaran</p>
              <p className="text-sm font-bold text-expense">
                {formatCurrency(yearlySummary.expense)}
              </p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-[10px] text-dark-400 mb-1">Selisih</p>
              <p
                className={`text-sm font-bold ${
                  yearlySummary.balance >= 0
                    ? "text-primary-400"
                    : "text-expense"
                }`}
              >
                {formatCurrency(yearlySummary.balance)}
              </p>
            </div>
          </div>

          {yearLoading ? (
            <TransactionListSkeleton count={6} />
          ) : (
            <div className="divide-y divide-dark-700/40">
              {monthlyRows.map(({ monthKey, month, year, cycle, summary }) => {
                const isExpanded = expandedMonth === monthKey;
                const isCurrentCycle =
                  cycle.start <= todayStr && todayStr <= cycle.end;
                const weeks = isExpanded
                  ? getCycleWeeks(year, month - 1, startDay, weekendBehavior)
                  : [];

                const cycleLabel =
                  startDay > 1
                    ? `${formatDateShort(cycle.start)} ~ ${formatDateShort(cycle.end)}`
                    : null;

                return (
                  <div key={monthKey}>
                    {/* Month Row */}
                    <button
                      className="w-full text-left py-3 px-1 flex items-center justify-between"
                      onClick={() =>
                        setExpandedMonth(isExpanded ? null : monthKey)
                      }
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-dark-100">
                          {SHORT_MONTHS[month - 1]}
                        </p>
                        {cycleLabel && (
                          <p className="text-[10px] text-dark-500 mt-0.5">
                            {cycleLabel}
                          </p>
                        )}
                      </div>
                      <div className="flex items-end gap-4">
                        <div className="text-right">
                          {summary.income > 0 && (
                            <p className="text-xs font-medium text-income">
                              {formatCurrency(summary.income)}
                            </p>
                          )}
                          {summary.expense > 0 && (
                            <p className="text-[10px] text-expense">
                              {formatCurrency(summary.expense)}
                            </p>
                          )}
                          {summary.income === 0 && summary.expense === 0 && (
                            <p className="text-xs text-dark-500">Rp 0</p>
                          )}
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p
                            className={`text-xs font-semibold ${
                              summary.balance >= 0
                                ? "text-dark-200"
                                : "text-expense"
                            }`}
                          >
                            {formatCurrency(summary.balance)}
                          </p>
                          {isCurrentCycle && (
                            <p className="text-[10px] text-dark-500">
                              {summary.balance >= 0
                                ? `+${formatCurrency(summary.balance)}`
                                : formatCurrency(summary.balance)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Weekly Sub-Rows (expanded) */}
                    {isExpanded && weeks.length > 0 && (
                      <div className="animate-fade-in">
                        {weeks.map((week) => {
                          const wSummary = computeRangeSummary(
                            yearTransactions,
                            week.start,
                            week.end,
                          );
                          const isCurrentWeek =
                            todayStr >= week.start && todayStr <= week.end;

                          const startParts = week.start.split("-");
                          const endParts = week.end.split("-");
                          const weekLabel = `${startParts[1]}.${startParts[2]} ~ ${endParts[1]}.${endParts[2]}`;

                          return (
                            <div
                              key={week.start}
                              className={`flex items-center justify-between px-3 py-2.5 ${
                                isCurrentWeek
                                  ? "bg-red-900/40 border-l-2 border-red-600/60"
                                  : "bg-dark-800/30"
                              }`}
                            >
                              <p className="text-xs text-dark-400 flex-1">
                                {weekLabel}
                              </p>
                              <div className="flex items-end gap-4">
                                <div className="text-right min-w-[88px]">
                                  {wSummary.income > 0 && (
                                    <p className="text-xs text-income">
                                      {formatCurrency(wSummary.income)}
                                    </p>
                                  )}
                                  {wSummary.expense > 0 && (
                                    <p className="text-[10px] text-expense">
                                      {formatCurrency(wSummary.expense)}
                                    </p>
                                  )}
                                  {wSummary.income === 0 &&
                                    wSummary.expense === 0 && (
                                      <p className="text-xs text-dark-600">
                                        Rp 0
                                      </p>
                                    )}
                                </div>
                                <div className="text-right min-w-[80px]">
                                  <p
                                    className={`text-xs font-medium ${
                                      isCurrentWeek
                                        ? "text-dark-100"
                                        : wSummary.balance >= 0
                                          ? "text-dark-300"
                                          : "text-expense"
                                    }`}
                                  >
                                    {formatCurrency(wSummary.balance)}
                                  </p>
                                  {isCurrentWeek && (
                                    <p className="text-[10px] text-dark-500">
                                      Total Rp 0
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DAILY TAB (default) ── */}
      {activeTab !== "Calendar" && activeTab !== "Monthly" && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <button
              type="button"
              onClick={() =>
                setFilterType(filterType === "income" ? "all" : "income")
              }
              aria-pressed={filterType === "income"}
              className={`
                glass rounded-xl p-3 text-center transition-all duration-200
                ${
                  filterType === "income"
                    ? "bg-income/25 ring-2 ring-income shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_28px_rgba(34,197,94,0.28)]"
                    : "hover:bg-dark-800/60"
                }
              `}
            >
              <p className="text-[10px] text-dark-400 mb-1">Pemasukan</p>
              <p className="text-sm font-bold text-income">
                {formatCurrency(filteredSummary.totalIncome)}
              </p>
            </button>
            <button
              type="button"
              onClick={() =>
                setFilterType(filterType === "expense" ? "all" : "expense")
              }
              aria-pressed={filterType === "expense"}
              className={`
                glass rounded-xl p-3 text-center transition-all duration-200
                ${
                  filterType === "expense"
                    ? "bg-expense/25 ring-2 ring-expense shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_28px_rgba(239,68,68,0.28)]"
                    : "hover:bg-dark-800/60"
                }
              `}
            >
              <p className="text-[10px] text-dark-400 mb-1">Pengeluaran</p>
              <p className="text-sm font-bold text-expense">
                {formatCurrency(filteredSummary.totalExpense)}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className="glass rounded-xl p-3 text-center transition-all duration-200 hover:bg-dark-800/60"
            >
              <p className="text-[10px] text-dark-400 mb-1">Selisih</p>
              <p
                className={`text-sm font-bold ${filteredSummary.balance >= 0 ? "text-primary-400" : "text-expense"}`}
              >
                {formatCurrency(filteredSummary.balance)}
              </p>
            </button>
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
                onAction={() => navigate("/transaction/form")}
              />
            )
          ) : (
            <div className="space-y-4 mb-6">
              {groupedTransactions.map(([date, txs]) => {
                const groupDate = parseLocalDate(date);
                const dayNum = groupDate.getDate();
                const dayName = DAY_NAMES_SHORT[groupDate.getDay()];
                const monthYear = `${String(groupDate.getMonth() + 1).padStart(2, "0")}.${groupDate.getFullYear()}`;
                const dailyIncome = txs
                  .filter((t) => t.type === "income" && t.category_id !== null)
                  .reduce((sum, t) => sum + Number(t.amount), 0);
                const dailyExpense = txs
                  .filter((t) => t.type === "expense" && t.category_id !== null)
                  .reduce((sum, t) => sum + Number(t.amount), 0);

                return (
                  <div key={date} className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-700/50">
                      <span className="text-4xl font-bold text-dark-100 leading-none w-12 shrink-0">
                        {dayNum}
                      </span>

                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-dark-700 text-[10px] font-semibold text-dark-300 w-fit">
                          {dayName}
                        </span>
                        <span className="text-xs text-dark-500">{monthYear}</span>
                      </div>

                      <div className="flex-1" />

                      <div className="flex items-center gap-3 text-sm font-semibold">
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
                    <div className="divide-y divide-dark-700/50">
                      {txs.map((tx) => (
                        <TransactionItem
                          key={tx.id}
                          transaction={tx}
                          onEdit={handleEdit}
                          showDate={false}
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
    </div>
  );
}
