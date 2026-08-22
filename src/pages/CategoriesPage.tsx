import { useState, useEffect } from "react";
import { Plus, Tag } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useCategories } from "../hooks/useCategories";
import { CategoryForm } from "../components/CategoryForm";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { SortableCategoryRow } from "../components/SortableCategoryRow";
import type {
  Category,
  CategoryInsert,
  CategoryUpdate,
  CategoryType,
} from "../types/database";
import { CategoryListSkeleton } from "../components/ui/Skeleton";

export function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
  } = useCategories(activeTab);

  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Local state untuk optimistic update saat drag
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  // Sync local state saat categories dari server berubah
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localCategories.findIndex((c) => c.id === active.id);
    const newIndex = localCategories.findIndex((c) => c.id === over.id);

    const newItems = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(newItems);

    reorderCategories(
      newItems.map((item, index) => ({ id: item.id, sort_order: index }))
    );
  };

  const handleSubmit = async (data: CategoryInsert | CategoryUpdate) => {
    if (editingCat) {
      return await updateCategory(editingCat.id, data as CategoryUpdate);
    }
    return await addCategory(data as CategoryInsert);
  };

  const handleEdit = (cat: Category) => {
    setEditingCat(cat);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Hapus kategori ini? Transaksi dengan kategori ini tidak akan dihapus."
      )
    ) {
      await deleteCategory(id);
    }
  };

  const tabs: { value: CategoryType; label: string }[] = [
    { value: "expense", label: "Pengeluaran" },
    { value: "income", label: "Pemasukan" },
  ];

  return (
    <div className="max-w-lg mx-auto lg:max-w-none px-4 lg:px-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-dark-100">Kategori</h1>
        <Button
          size="sm"
          onClick={() => {
            setEditingCat(null);
            setShowForm(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Tambah
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-dark-700 mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`
              flex-1 py-2.5 text-sm font-medium transition-all duration-200
              ${
                activeTab === tab.value
                  ? tab.value === "income"
                    ? "bg-income/15 text-income"
                    : "bg-expense/15 text-expense"
                  : "bg-dark-800/50 text-dark-400 hover:text-dark-200"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Category List */}
      {loading ? (
        <CategoryListSkeleton count={5} />
      ) : localCategories.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-8 h-8 text-dark-500" />}
          title="Belum ada kategori"
          description={`Tambahkan kategori ${activeTab === "income" ? "pemasukan" : "pengeluaran"} baru`}
          actionLabel="Tambah Kategori"
          onAction={() => {
            setEditingCat(null);
            setShowForm(true);
          }}
        />
      ) : (
        <div className="lg:glass lg:rounded-2xl lg:overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-dark-700/50 lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-3">
              {localCategories.map((cat) => (
                <SortableCategoryRow
                  key={cat.id}
                  category={cat}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingCat(null);
        }}
        onSubmit={handleSubmit}
        editData={editingCat}
        defaultType={activeTab}
      />
    </div>
  );
}
