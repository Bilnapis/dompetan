import { useEffect, useCallback } from "react";
import { Calculator, Delete, X } from "lucide-react";
import { useIsDesktop } from "../../hooks";

interface NumpadSheetProps {
  isOpen: boolean;
  value: string;
  onChange: (val: string) => void;
  onDone: () => void;
  onOpenCalculator: () => void;
}

export function NumpadSheet({
  isOpen,
  value,
  onChange,
  onDone,
  onOpenCalculator,
}: NumpadSheetProps) {
  const isDesktop = useIsDesktop();

  // Handle keyboard input while numpad is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handlePress(e.key);
      else if (e.key === "Backspace") handleBackspace();
      else if (e.key === "Enter" || e.key === "Escape") onDone();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, value]);

  const handlePress = useCallback(
    (key: string) => {
      if (value === "0" && key === "0") return;
      if (value === "" && key === "0") return;
      onChange(value + key);
    },
    [value, onChange],
  );

  const handleBackspace = useCallback(() => {
    if (value.length <= 1) onChange("");
    else onChange(value.slice(0, -1));
  }, [value, onChange]);

  const displayValue = value
    ? `Rp ${Number(value).toLocaleString("id-ID")}`
    : "Rp 0";

  if (!isOpen) return null;

  const btnBase =
    "flex items-center justify-center rounded-2xl text-l font-semibold transition-all duration-100 active:scale-95 select-none";

  const numpadContent = (
    <>
      {/* Display value */}
      <div className="flex items-center justify-center px-5 pt-1 pb-3 border-b border-dark-700/60">
        <span className="text-3xl font-bold text-dark-100 tracking-tight">
          {displayValue}
        </span>
      </div>

      {/* Numpad grid */}
      <div className="grid grid-cols-4 gap-2 px-4 py-4">
        {/* Row 1 */}
        <NumBtn label="1" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("1")} />
        <NumBtn label="2" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("2")} />
        <NumBtn label="3" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("3")} />
        <button onClick={handleBackspace} className={`${btnBase} h-18 bg-[#3a1a1a] text-expense hover:bg-[#4a2020]`}>
          <Delete className="w-5 h-5" />
        </button>

        {/* Row 2 */}
        <NumBtn label="4" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("4")} />
        <NumBtn label="5" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("5")} />
        <NumBtn label="6" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("6")} />
        <NumBtn label="−" className={`${btnBase} bg-dark-800 text-dark-400 cursor-default`} onClick={() => {}} />

        {/* Row 3 */}
        <NumBtn label="7" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("7")} />
        <NumBtn label="8" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("8")} />
        <NumBtn label="9" className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("9")} />
        <button onClick={onOpenCalculator} className={`${btnBase} h-18 bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-primary-400`} title="Buka kalkulator">
          <Calculator className="w-5 h-5" />
        </button>

        {/* Row 4 */}
        <NumBtn label="00"  className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("00")} />
        <NumBtn label="0"   className={`${btnBase} bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("0")} />
        <NumBtn label="000" className={`${btnBase} text-base bg-dark-700 text-dark-100 hover:bg-dark-600`} onClick={() => handlePress("000")} />
        <button onClick={onDone} className={`${btnBase} h-18 bg-primary-500 text-white hover:bg-primary-400 font-bold`}>
          Selesai
        </button>
      </div>
    </>
  );

  // ── Desktop: centered modal ──────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] animate-fade-in" onClick={onDone} />
        <div className="relative bg-dark-800 rounded-2xl shadow-2xl shadow-black/70 animate-fade-in w-full max-w-sm mx-4 border border-dark-700/60">
          {/* Close button */}
          <button
            onClick={onDone}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="pt-4">{numpadContent}</div>
        </div>
      </div>
    );
  }

  // ── Mobile: bottom sheet ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in" onClick={onDone} />
      <div className="relative w-full max-w-lg bg-dark-800 rounded-t-3xl shadow-2xl shadow-black/70 animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-4 pb-1">
          <div className="w-10 h-1 rounded-full bg-dark-600" />
        </div>
        {numpadContent}
      </div>
    </div>
  );
}

function NumBtn({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button onClick={onClick} className={`${className} h-18`}>
      {label}
    </button>
  );
}
