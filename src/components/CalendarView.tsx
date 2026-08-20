import { useMemo, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "../lib/helpers";
import { TransactionItem } from "./TransactionItem";
import type { TransactionWithDetails } from "../types/database";

interface CalendarViewProps {
  transactions: TransactionWithDetails[];
  dateRange: { start: string; end: string } | null;
  onEditTransaction?: (tx: TransactionWithDetails) => void;
}

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAY_NAMES_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ── Day Detail Bottom Sheet ─────────────────────────────────────────────────

interface DaySheetProps {
  dateKey: string;
  transactions: TransactionWithDetails[];
  allDateKeys: string[]; // sorted list of all dates in cycle
  onClose: () => void;
  onNavigate: (key: string) => void;
  onEditTransaction?: (tx: TransactionWithDetails) => void;
}

function DaySheet({
  dateKey,
  transactions,
  allDateKeys,
  onClose,
  onNavigate,
  onEditTransaction,
}: DaySheetProps) {
  const date = parseLocalDate(dateKey);
  const dayNum = date.getDate();
  const dayName = DAY_NAMES_SHORT[date.getDay()];
  const monthYear = `${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;

  const txForDay = transactions.filter((t) => t.transaction_date === dateKey);

  const dailyIncome = txForDay
    .filter((t) => t.type === "income" && t.category_id !== null)
    .reduce((s, t) => s + Number(t.amount), 0);
  const dailyExpense = txForDay
    .filter((t) => t.type === "expense" && t.category_id !== null)
    .reduce((s, t) => s + Number(t.amount), 0);

  const currentIdx = allDateKeys.indexOf(dateKey);
  const prevKey = currentIdx > 0 ? allDateKeys[currentIdx - 1] : null;
  const nextKey = currentIdx < allDateKeys.length - 1 ? allDateKeys[currentIdx + 1] : null;

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Keyboard: Escape closes, ←/→ navigates
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && prevKey) onNavigate(prevKey);
      if (e.key === "ArrowRight" && nextKey) onNavigate(nextKey);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevKey, nextKey, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={handleBackdrop}
    >
      <div
        className="bg-dark-900 rounded-t-3xl overflow-hidden"
        style={{ animation: "slide-up-sheet 0.28s cubic-bezier(0.16,1,0.3,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-dark-700" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-2 pb-3 border-b border-dark-800">
          {/* Big day number */}
          <span className="text-4xl font-bold text-dark-100 leading-none w-12 shrink-0">
            {dayNum}
          </span>

          {/* Day badge + month.year */}
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-dark-700 text-[10px] font-semibold text-dark-300 w-fit">
              {dayName}
            </span>
            <span className="text-xs text-dark-500">{monthYear}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Income / Expense totals */}
          <div className="flex items-center gap-3">
            {dailyIncome > 0 && (
              <span className="text-sm font-semibold text-income">
                +{formatCurrency(dailyIncome)}
              </span>
            )}
            {dailyExpense > 0 && (
              <span className="text-sm font-semibold text-expense">
                -{formatCurrency(dailyExpense)}
              </span>
            )}
          </div>
        </div>

        {/* Transaction list */}
        <div className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
          {txForDay.length === 0 ? (
            <div className="py-12 text-center text-dark-500 text-sm">
              Tidak ada transaksi
            </div>
          ) : (
            <div className="divide-y divide-dark-800/80">
              {txForDay.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onEdit={(t) => onEditTransaction?.(t)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-dark-800">
          <button
            onClick={() => prevKey && onNavigate(prevKey)}
            disabled={!prevKey}
            className="w-9 h-9 flex items-center justify-center rounded-full text-dark-400 disabled:opacity-30 hover:bg-dark-800 hover:text-dark-100 transition-colors active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="px-8 py-2 text-sm font-medium text-dark-300 hover:text-dark-100 transition-colors"
          >
            Tutup
          </button>

          <button
            onClick={() => nextKey && onNavigate(nextKey)}
            disabled={!nextKey}
            className="w-9 h-9 flex items-center justify-center rounded-full text-dark-400 disabled:opacity-30 hover:bg-dark-800 hover:text-dark-100 transition-colors active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main CalendarView ───────────────────────────────────────────────────────

export function CalendarView({
  transactions,
  dateRange,
  onEditTransaction,
}: CalendarViewProps) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Build a map: dateKey → { income, expense }
  const dailyMap = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const tx of transactions) {
      const key = tx.transaction_date;
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      if (tx.type === "income" && tx.category_id !== null) {
        map[key].income += Number(tx.amount);
      } else if (tx.type === "expense" && tx.category_id !== null) {
        map[key].expense += Number(tx.amount);
      }
    }
    return map;
  }, [transactions]);

  // Summary for the whole period
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    for (const v of Object.values(dailyMap)) {
      totalIncome += v.income;
      totalExpense += v.expense;
    }
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [dailyMap]);

  // Build the calendar grid
  const { weeks, calendarStart, calendarEnd, allDateKeys } = useMemo(() => {
    if (!dateRange) return { weeks: [], calendarStart: null, calendarEnd: null, allDateKeys: [] };

    const cycleStart = parseLocalDate(dateRange.start);
    const cycleEnd = parseLocalDate(dateRange.end);

    // Collect all date keys in the cycle range (for sheet navigation)
    const allDateKeys: string[] = [];
    const cur = new Date(cycleStart);
    while (cur <= cycleEnd) {
      allDateKeys.push(toDateKey(cur));
      cur.setDate(cur.getDate() + 1);
    }

    // Calendar starts at the Sunday of the week containing cycleStart
    const gridStart = new Date(cycleStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    // Calendar ends at the Saturday of the week containing cycleEnd
    const gridEnd = new Date(cycleEnd);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const weeks: Date[][] = [];
    const current = new Date(gridStart);
    while (current <= gridEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }

    return { weeks, calendarStart: cycleStart, calendarEnd: cycleEnd, allDateKeys };
  }, [dateRange]);

  const todayKey = toDateKey(new Date());
  const cycleStartKey = dateRange?.start ?? null;

  const handleDayPress = useCallback((date: Date) => {
    setSelectedDateKey(toDateKey(date));
  }, []);

  const handleClose = useCallback(() => setSelectedDateKey(null), []);
  const handleNavigate = useCallback((key: string) => setSelectedDateKey(key), []);

  if (!dateRange || weeks.length === 0) {
    return (
      <div className="text-center text-dark-500 py-10 text-sm">
        Tidak ada data kalender
      </div>
    );
  }

  function isInCycle(date: Date): boolean {
    if (!calendarStart || !calendarEnd) return false;
    const key = toDateKey(date);
    return key >= dateRange!.start && key <= dateRange!.end;
  }

  function isCycleStart(date: Date): boolean {
    if (!cycleStartKey) return false;
    return toDateKey(date) === cycleStartKey;
  }

  function formatAmount(amount: number): string {
    if (amount === 0) return "";
    return new Intl.NumberFormat("id-ID").format(amount);
  }

  return (
    <>
      <div className="animate-fade-in">
        {/* Summary Cards — same style as Daily tab */}
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

        {/* Calendar Grid */}
        <div className="border border-dark-700/40 rounded-xl overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-dark-700/40 bg-dark-800/60">
            {DAY_LABELS.map((day, i) => (
              <div
                key={day}
                className={`py-2 text-center text-[10px] font-semibold tracking-wide
                  ${i === 0 ? "text-expense/80" : i === 6 ? "text-primary-400" : "text-dark-400"}
                `}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className={`grid grid-cols-7 ${wi < weeks.length - 1 ? "border-b border-dark-700/40" : ""}`}
            >
              {week.map((date, di) => {
                const key = toDateKey(date);
                const data = dailyMap[key];
                const inCycle = isInCycle(date);
                const isToday = key === todayKey;
                const isCycleStartDay = isCycleStart(date);
                const isSelected = key === selectedDateKey;

                return (
                  <div
                    key={di}
                    onClick={() => handleDayPress(date)}
                    className={`
                      relative min-h-[70px] p-1 flex flex-col cursor-pointer
                      transition-colors duration-150
                      ${di < 6 ? "border-r border-dark-700/40" : ""}
                      ${!inCycle ? "opacity-30" : ""}
                      ${isSelected ? "bg-primary-500/15" : isToday ? "bg-primary-500/10" : "active:bg-dark-800/60"}
                    `}
                  >
                    {/* Date number */}
                    <div className="flex items-center gap-0.5 mb-0.5">
                      <span
                        className={`
                          text-[11px] font-semibold leading-none inline-flex items-center justify-center
                          ${isToday
                            ? "w-5 h-5 rounded-full bg-primary-500 text-white text-[10px]"
                            : isSelected
                            ? "w-5 h-5 rounded-full bg-primary-500/30 text-primary-300 text-[10px]"
                            : di === 0
                            ? "text-expense/70"
                            : di === 6
                            ? "text-primary-400"
                            : inCycle
                            ? "text-dark-300"
                            : "text-dark-600"
                          }
                        `}
                      >
                        {date.getDate()}
                      </span>
                      {/* Cycle start dot marker */}
                      {isCycleStartDay && !isToday && (
                        <span className="text-[6px] text-primary-400 leading-none">●</span>
                      )}
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Income amount */}
                    {data && data.income > 0 && (
                      <p className="text-[9px] font-medium text-primary-400 leading-tight text-right">
                        {formatAmount(data.income)}
                      </p>
                    )}

                    {/* Expense amount */}
                    {data && data.expense > 0 && (
                      <p className="text-[9px] font-medium text-expense leading-tight text-right">
                        {formatAmount(data.expense)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Bottom Sheet */}
      {selectedDateKey && (
        <DaySheet
          dateKey={selectedDateKey}
          transactions={transactions}
          allDateKeys={allDateKeys}
          onClose={handleClose}
          onNavigate={handleNavigate}
          onEditTransaction={onEditTransaction}
        />
      )}
    </>
  );
}
