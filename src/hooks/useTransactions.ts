import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { TransactionInsert, TransactionUpdate, TransactionWithDetails, CategoryType } from '../types/database'

interface UseTransactionsOptions {
  type?: CategoryType | 'all'
  startDate?: string
  endDate?: string
}

const TRANSACTIONS_PAGE_SIZE = 1000

export function useTransactions(options?: UseTransactionsOptions) {
  const { user } = useAuth()
  const hasOptions = options !== undefined
  const optionType = options?.type
  const optionStartDate = options?.startDate
  const optionEndDate = options?.endDate
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!user) return

    // Skip fetch if no options provided (waiting for settings to load)
    if (!hasOptions) {
      setLoading(true)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const allTransactions: TransactionWithDetails[] = []
      let page = 0
      let hasMore = true

      while (hasMore) {
        const from = page * TRANSACTIONS_PAGE_SIZE
        const to = from + TRANSACTIONS_PAGE_SIZE - 1

        let query = supabase
          .from('transactions')
          .select('*, category:categories(*), account:accounts(*)')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })
          .range(from, to)

        // Apply type filter
        if (optionType && optionType !== 'all') {
          query = query.eq('type', optionType)
        }

        // Apply date range filter
        if (optionStartDate) {
          query = query.gte('transaction_date', optionStartDate)
        }
        if (optionEndDate) {
          query = query.lte('transaction_date', optionEndDate)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError

        const pageTransactions = (data as unknown as TransactionWithDetails[]) || []
        allTransactions.push(...pageTransactions)
        hasMore = pageTransactions.length === TRANSACTIONS_PAGE_SIZE
        page += 1
      }

      setTransactions(allTransactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat transaksi')
    } finally {
      setLoading(false)
    }
  }, [user, hasOptions, optionType, optionStartDate, optionEndDate])

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

  const addTransfer = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    transaction_date: string,
    note?: string
  ) => {
    if (!user) return { error: 'Not authenticated' }

    const expenseTx = {
      user_id: user.id,
      account_id: fromAccountId,
      type: 'expense',
      amount,
      transaction_date,
      note: note ? `Transfer Keluar: ${note}` : 'Transfer Keluar'
    }

    const incomeTx = {
      user_id: user.id,
      account_id: toAccountId,
      type: 'income',
      amount,
      transaction_date,
      note: note ? `Transfer Masuk: ${note}` : 'Transfer Masuk'
    }

    const { error } = await supabase
      .from('transactions')
      .insert([expenseTx, incomeTx] as never)

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
      .filter((t) => t.type === 'income' && t.category_id !== null)
      .reduce((sum, t) => sum + Number(t.amount), 0),
    totalExpense: transactions
      .filter((t) => t.type === 'expense' && t.category_id !== null)
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
    addTransfer,
    updateTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  }
}
