import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  PieChart,
  Wallet,
} from "lucide-react";

const leftItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
];

const rightItems = [
  { path: "/accounts", icon: Wallet, label: "Dompet" },
  { path: "/budget", icon: PieChart, label: "Budget" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const renderItem = (item: { path: string; icon: React.ElementType; label: string }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`
          flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl
          transition-all duration-200 flex-1
          ${isActive ? "text-primary-400" : "text-dark-500 hover:text-dark-300"}
        `}
      >
        <div
          className={`
            relative p-1.5 rounded-xl transition-all duration-200
            ${isActive ? "bg-primary-500/15" : ""}
          `}
        >
          <Icon className="w-5 h-5" />
          {isActive && (
            <div className="absolute inset-0 rounded-xl bg-primary-400/10 blur-md" />
          )}
        </div>
        <span className="text-[10px] font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/85 backdrop-blur-xl border-t border-dark-700/50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2 relative">
        {/* Left items */}
        {leftItems.map(renderItem)}

        {/* Center FAB */}
        <div className="flex flex-col items-center flex-1 relative">
          <button
            onClick={() => navigate("/transaction/form")}
            className="
              absolute -top-7
              w-14 h-14 rounded-full
              bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600
              text-white
              flex items-center justify-center
              shadow-lg shadow-primary-500/50
              hover:shadow-xl hover:shadow-primary-500/60
              hover:scale-110
              active:scale-95
              transition-all duration-200
              ring-4 ring-dark-900
            "
            title="Tambah Transaksi"
          >
            {/* Glow ring */}
            <span className="absolute inset-0 rounded-full bg-primary-400/20 blur-md animate-pulse" />
            <Plus className="w-6 h-6 relative z-10" />
          </button>
          {/* Spacer label */}
          <span className="text-[10px] font-medium text-transparent mt-1 pt-2">•</span>
        </div>

        {/* Right items */}
        {rightItems.map(renderItem)}
      </div>
      {/* Safe area bottom for iOS PWA */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
