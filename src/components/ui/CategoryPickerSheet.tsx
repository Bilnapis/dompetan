import { useEffect, useRef } from "react";
import { X, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Category } from "../../types/database";

interface CategoryPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CategoryPickerSheet({
  isOpen,
  onClose,
  categories,
  selectedId,
  onSelect,
}: CategoryPickerSheetProps) {
  const navigate = useNavigate();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="category-sheet relative w-full max-w-lg bg-dark-800 border-t border-dark-700 rounded-t-2xl shadow-2xl shadow-black/60 max-h-[65dvh] flex flex-col"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-dark-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5">
          <h3 className="text-[15px] font-semibold text-dark-100">
            Category
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                navigate("/categories");
              }}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
              title="Edit kategori"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Category Grid */}
        <div className="overflow-y-auto flex-1 px-3 pb-8">
          {categories.length === 0 ? (
            <div className="text-center py-10 text-dark-500 text-sm">
              Belum ada kategori
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {categories.map((cat) => {
                const isSelected = cat.id === selectedId;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onSelect(cat.id);
                      onClose();
                    }}
                    className={`
                      flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-xl
                      transition-all duration-150 relative
                      ${
                        isSelected
                          ? "bg-primary-500/15 ring-1 ring-primary-500/40"
                          : "hover:bg-dark-700/60 active:scale-95"
                      }
                    `}
                  >
                    <span className="text-2xl leading-none">
                      {cat.icon || "📁"}
                    </span>
                    <span
                      className={`text-xs leading-tight text-center line-clamp-2 ${
                        isSelected
                          ? "text-primary-300 font-medium"
                          : "text-dark-300"
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
