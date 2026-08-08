import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { TransactionInsert, TransactionUpdate, TransactionWithCategory, CategoryType } from '../types/database'

interface UseTransactionsOptions {
  type?: CategoryType | 'all'
  startDate?: string
  endDate?: string
}

export function useTransactions(options?: UseTransactionsOptions) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      // Apply type filter
      if (options?.type && options.type !== 'all') {
        query = query.eq('type', options.type)
      }

      // Apply date range filter
      if (options?.startDate) {
        query = query.gte('transaction_date', options.startDate)
      }
      if (options?.endDate) {
        query = query.lte('transaction_date', options.endDate)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setTransactions((data as unknown as TransactionWithCategory[]) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transaksi')
    } finally {
      setLoading(false)
    }
  }, [user, options?.type, options?.startDate, options?.endDate])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const addTransaction = async (data: TransactionInsert) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('transactions')
      .insert({ ...data, user_id: user.id } as never)

    if (error) return { error: error.message }

    await fetchTransactions()
    return { error: null }
  }

  const updateTransaction = async (id: string, data: TransactionUpdate) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('transactions')
      .update(data as never)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    await fetchTransactions()
    return { error: null }
  }

  const deleteTransaction = async (id: string) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    await fetchTransactions()
    return { error: null }
  }

  // Calculate summary
  const summary = {
    totalIncome: transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    totalExpense: transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0),
    get balance() {
      return this.totalIncome - this.totalExpense
    },
    transactionCount: transactions.length,
  }

  return {
    transactions,
    loading,
    error,
    summary,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  }
}
