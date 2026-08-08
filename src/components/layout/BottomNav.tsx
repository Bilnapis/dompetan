import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  User,
  Wallet,
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/transactions", icon: ArrowLeftRight, label: "Transaksi" },
  { path: "/accounts", icon: Wallet, label: "Dompet" },
  { path: "/categories", icon: Tag, label: "Kategori" },
  { path: "/profile", icon: User, label: "Profil" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/85 backdrop-blur-xl border-t border-dark-700/50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl
                transition-all duration-200 min-w-[56px]
                ${
                  isActive
                    ? "text-primary-400"
                    : "text-dark-500 hover:text-dark-300"
                }
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
        })}
      </div>
      {/* Safe area bottom for iOS PWA */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
