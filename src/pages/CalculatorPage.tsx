import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Delete } from "lucide-react";

type CalcOperator = "+" | "−" | "×" | "÷" | null;

function evaluate(a: number, op: CalcOperator, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b !== 0 ? a / b : 0;
    default: return b;
  }
}

function formatDisplay(n: number): string {
  if (!isFinite(n)) return "0";
  // Up to 12 significant digits, strip trailing zeros
  const s = parseFloat(n.toPrecision(12)).toString();
  return s;
}

export function CalculatorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Where to return the result (the form will pass a `returnPath` state)
  const returnPath: string | number = (location.state as any)?.returnPath ?? -1;

  const [display, setDisplay] = useState("0");       // current number being typed
  const [stored, setStored] = useState<number | null>(null); // left-hand operand
  const [operator, setOperator] = useState<CalcOperator>(null);
  const [justEvaled, setJustEvaled] = useState(false); // after = was pressed

  // Expression string for the small label above display
  const [expression, setExpression] = useState("");

  const handleDigit = useCallback((d: string) => {
    setDisplay((prev) => {
      if (justEvaled) {
        setJustEvaled(false);
        setExpression("");
        return d === "." ? "0." : d === "00" ? "0" : d;
      }
      if (prev === "0" && d !== ".") return d === "00" ? "0" : d;
      if (d === "." && prev.includes(".")) return prev;
      return prev + d;
    });
  }, [justEvaled]);

  const handleOperator = useCallback((op: CalcOperator) => {
    const num = parseFloat(display);
    if (stored !== null && operator && !justEvaled) {
      const result = evaluate(stored, operator, num);
      setStored(result);
      setDisplay(formatDisplay(result));
      setExpression(`${formatDisplay(result)} ${op}`);
    } else {
      setStored(num);
      setExpression(`${display} ${op}`);
    }
    setOperator(op);
    setJustEvaled(false);
    // Next digit will start a fresh operand
    setDisplay("0");
  }, [display, stored, operator, justEvaled]);

  const handleEquals = useCallback(() => {
    if (stored === null || operator === null) return;
    const num = parseFloat(display);
    const result = evaluate(stored, operator, num);
    setExpression(`${formatDisplay(stored)} ${operator} ${display} =`);
    setDisplay(formatDisplay(result));
    setStored(null);
    setOperator(null);
    setJustEvaled(true);
  }, [stored, operator, display]);

  const handleAC = useCallback(() => {
    setDisplay("0");
    setStored(null);
    setOperator(null);
    setJustEvaled(false);
    setExpression("");
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (prev.length <= 1 || justEvaled) return "0";
      return prev.slice(0, -1);
    });
    setJustEvaled(false);
  }, [justEvaled]);

  const handleDone = useCallback(() => {
    // Evaluate any pending operation first
    let finalVal = parseFloat(display);
    if (stored !== null && operator !== null && !justEvaled) {
      finalVal = evaluate(stored, operator, finalVal);
    }
    // Round to avoid floating point noise
    const rounded = Math.round(finalVal);
    const result = rounded > 0 ? String(rounded) : "0";

    if (typeof returnPath === "number") {
      navigate(returnPath as never);
    } else {
      navigate(returnPath, {
        state: { calculatorResult: result },
        replace: true,
      });
    }
  }, [display, stored, operator, justEvaled, navigate, returnPath]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleDigit(e.key);
      else if (e.key === ".") handleDigit(".");
      else if (e.key === "Backspace") handleBackspace();
      else if (e.key === "Enter" || e.key === "=") handleEquals();
      else if (e.key === "+") handleOperator("+");
      else if (e.key === "-") handleOperator("−");
      else if (e.key === "*") handleOperator("×");
      else if (e.key === "/") { e.preventDefault(); handleOperator("÷"); }
      else if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleDigit, handleBackspace, handleEquals, handleOperator, navigate]);

  // Display font size — shrink for long numbers
  const displayFontSize =
    display.length > 12 ? "text-3xl" : display.length > 8 ? "text-4xl" : "text-5xl";

  const btnNum =
    "flex items-center justify-center rounded-2xl text-xl font-semibold h-16 transition-all duration-100 active:scale-95 select-none bg-dark-700 text-dark-100 hover:bg-dark-600";
  const btnOp =
    "flex items-center justify-center rounded-2xl text-xl font-semibold h-16 transition-all duration-100 active:scale-95 select-none bg-dark-800 text-primary-400 hover:bg-dark-700";
  const btnSpecial =
    "flex items-center justify-center rounded-2xl text-xl font-semibold h-16 transition-all duration-100 active:scale-95 select-none bg-dark-800 text-dark-300 hover:bg-dark-700";

  return (
    <div className="max-w-lg mx-auto bg-dark-900 min-h-screen text-dark-100 flex flex-col lg:min-h-0 lg:mt-8 lg:mb-8 lg:rounded-2xl lg:border lg:border-dark-700/50 lg:shadow-2xl lg:overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-dark-800 sticky top-0 bg-dark-900/95 backdrop-blur-sm z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-dark-200 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium text-[15px]">Kalkulator</h1>
        <div className="w-8" />
      </div>

      {/* Display area */}
      <div className="flex-1 flex flex-col justify-end px-6 py-4 min-h-[140px]">
        {/* Expression label */}
        <p className="text-sm text-dark-500 text-right mb-1 h-5 truncate">
          {expression}
        </p>
        {/* Main number */}
        <p className={`${displayFontSize} font-bold text-dark-100 text-right tracking-tight truncate`}>
          {parseFloat(display).toLocaleString("id-ID", { maximumFractionDigits: 10 })}
        </p>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-2 px-4 pb-8">
        {/* Row 1: AC ÷ × ⌫ */}
        <button onClick={handleAC} className={`${btnSpecial} text-expense hover:text-expense`}>
          AC
        </button>
        <button onClick={() => handleOperator("÷")} className={`${btnOp} ${operator === "÷" && !justEvaled ? "bg-primary-500/20 ring-1 ring-primary-500/50" : ""}`}>
          ÷
        </button>
        <button onClick={() => handleOperator("×")} className={`${btnOp} ${operator === "×" && !justEvaled ? "bg-primary-500/20 ring-1 ring-primary-500/50" : ""}`}>
          ×
        </button>
        <button onClick={handleBackspace} className={`${btnSpecial} text-expense`}>
          <Delete className="w-5 h-5" />
        </button>

        {/* Row 2: 7 8 9 − */}
        <button onClick={() => handleDigit("7")} className={btnNum}>7</button>
        <button onClick={() => handleDigit("8")} className={btnNum}>8</button>
        <button onClick={() => handleDigit("9")} className={btnNum}>9</button>
        <button onClick={() => handleOperator("−")} className={`${btnOp} ${operator === "−" && !justEvaled ? "bg-primary-500/20 ring-1 ring-primary-500/50" : ""}`}>
          −
        </button>

        {/* Row 3: 4 5 6 + */}
        <button onClick={() => handleDigit("4")} className={btnNum}>4</button>
        <button onClick={() => handleDigit("5")} className={btnNum}>5</button>
        <button onClick={() => handleDigit("6")} className={btnNum}>6</button>
        <button onClick={() => handleOperator("+")} className={`${btnOp} ${operator === "+" && !justEvaled ? "bg-primary-500/20 ring-1 ring-primary-500/50" : ""}`}>
          +
        </button>

        {/* Row 4: 1 2 3 = */}
        <button onClick={() => handleDigit("1")} className={btnNum}>1</button>
        <button onClick={() => handleDigit("2")} className={btnNum}>2</button>
        <button onClick={() => handleDigit("3")} className={btnNum}>3</button>
        <button onClick={handleEquals} className="flex items-center justify-center rounded-2xl text-xl font-bold h-16 transition-all duration-100 active:scale-95 select-none bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 ring-1 ring-primary-500/40">
          =
        </button>

        {/* Row 5: 00 0 . DONE */}
        <button onClick={() => handleDigit("00")} className={btnNum}>00</button>
        <button onClick={() => handleDigit("0")} className={btnNum}>0</button>
        <button onClick={() => handleDigit(".")} className={btnNum}>.</button>
        <button
          onClick={handleDone}
          className="flex items-center justify-center rounded-2xl text-base font-bold h-16 transition-all duration-100 active:scale-95 select-none bg-primary-500 text-white hover:bg-primary-400 col-span-1"
        >
          DONE
        </button>
      </div>
    </div>
  );
}
