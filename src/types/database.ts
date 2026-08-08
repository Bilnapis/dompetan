/* ========================================
   Dompetan - Database Type Definitions
   ======================================== */

// ── Enum Types ──────────────────────────

export type CategoryType = 'income' | 'expense' | "transfer"
export type WeekendBehavior = 'none' | 'previous_friday' | 'next_monday'

// ── Row Types (data from database) ─────

export interface UserSetting {
  user_id: string
  month_start_date: number
  weekend_behavior: WeekendBehavior
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  created_at: string
  balance?: number
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
  account_id: string | null
  category_id: string | null
  note: string | null
  transaction_date: string
  created_at: string
}

// ── Insert Types (for creating new records) ─

export type UserSettingInsert = Omit<UserSetting, 'created_at' | 'updated_at'>

export type AccountInsert = Omit<Account, 'id' | 'created_at' | 'user_id'>

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'user_id'>

export interface TransactionInsert {
  amount: number
  type: CategoryType
  account_id?: string | null
  category_id?: string | null
  note?: string | null
  transaction_date?: string // Defaults to today
  user_id?: string
}

// ── Update Types (partial for editing) ──

export type UserSettingUpdate = Partial<UserSettingInsert>

export type AccountUpdate = Partial<AccountInsert>

export type CategoryUpdate = Partial<CategoryInsert>

export interface TransactionUpdate {
  amount?: number
  type?: CategoryType
  account_id?: string | null
  category_id?: string | null
  note?: string | null
  transaction_date?: string
}

// ── Joined / View Types ─────────────────

export interface TransactionWithDetails extends Transaction {
  category: Category | null
  account: Account | null
}

// ── Supabase Database Type ──────────────

export interface Database {
  public: {
    Tables: {
      user_settings: {
        Row: UserSetting
        Insert: UserSettingInsert
        Update: UserSettingUpdate
      }
      accounts: {
        Row: Account
        Insert: AccountInsert & { user_id: string }
        Update: AccountUpdate
      }
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
