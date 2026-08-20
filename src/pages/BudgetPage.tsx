import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCategories } from "../hooks/useCategories";
import { useTransactions } from "../hooks/useTransactions";
import { BudgetView } from "../components/BudgetView";
import { useSettings } from "../contexts/SettingsContext";
import { getCycleDateRange, getCurrentCycleMonth, formatDateShort } from "../lib/helpers";

export function BudgetPage() {
  const { settings, loading: settingsLoading } = useSettings();
  
  const [filterMonth, setFilterMonth] = useState<string | null>(null);

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

  const { transactions } = useTransactions(dateRange ? {
    type: "all",
    startDate: dateRange.start,
    endDate: dateRange.end,
  } : undefined);

  const { categories, reorderCategories } = useCategories();

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-dark-100">Budget</h1>
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
        </div>
      </div>

      {/* Indicator of actual date range */}
      {(settings?.month_start_date ?? 1) > 1 && dateRange && (
        <div className="text-[10px] text-dark-400 text-right -mt-4 mb-4 pr-1">
          Rentang: {formatDateShort(dateRange.start)} -{" "}
          {formatDateShort(dateRange.end)}
        </div>
      )}

      {dateRange && (
        <BudgetView 
          categories={categories} 
          transactions={transactions} 
          dateRange={dateRange} 
          filterMonth={resolvedFilterMonth || ""} 
          onReorder={reorderCategories}
        />
      )}
    </div>
  );
}
