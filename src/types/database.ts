/* ========================================
   KeuanganKu - Database Type Definitions
   ======================================== */

// ── Enum Types ──────────────────────────

export type CategoryType = 'income' | 'expense'

// ── Row Types (data from database) ─────

export interface User {
  id: string
  email: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: CategoryType
  category_id: string | null
  note: string | null
  transaction_date: string
  created_at: string
}

// ── Insert Types (for creating new records) ─

export interface CategoryInsert {
  name: string
  type: CategoryType
  user_id?: string // Will be set by RLS/trigger
}

export interface TransactionInsert {
  amount: number
  type: CategoryType
  category_id?: string | null
  note?: string | null
  transaction_date?: string // Defaults to today
  user_id?: string
}

// ── Update Types (partial for editing) ──

export interface CategoryUpdate {
  name?: string
  type?: CategoryType
}

export interface TransactionUpdate {
  amount?: number
  type?: CategoryType
  category_id?: string | null
  note?: string | null
  transaction_date?: string
}

// ── Joined / View Types ─────────────────

export interface TransactionWithCategory extends Transaction {
  category: Category | null
}

// ── Supabase Database Type ──────────────

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category
        Insert: CategoryInsert & { user_id: string }
        Update: CategoryUpdate
      }
      transactions: {
        Row: Transaction
        Insert: TransactionInsert & { user_id: string }
        Update: TransactionUpdate
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      transaction_type: CategoryType
    }
  }
}

// ── Utility Types ───────────────────────

/** Summary statistics for dashboard */
export interface FinancialSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

/** Monthly breakdown for charts */
export interface MonthlyData {
  month: string // Format: YYYY-MM
  income: number
  expense: number
}
