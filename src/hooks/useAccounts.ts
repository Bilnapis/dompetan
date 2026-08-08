import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Account, AccountInsert, AccountUpdate } from '../types/database'

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('accounts_with_balance')
      .select('*')
      .order('name')

    if (!error && data) {
      setAccounts(data)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const addAccount = async (data: AccountInsert): Promise<{ data: Account | null; error: string | null }> => {
    if (!user) return { data: null, error: 'Not authenticated' }

    const { data: newData, error } = await supabase
      .from('accounts')
      .insert({ ...data, user_id: user.id } as never)
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    await fetchAccounts()
    return { data: newData as Account, error: null }
  }

  const adjustBalance = async (accountId: string, difference: number) => {
    if (!user) return { error: 'Not authenticated' }
    if (difference === 0) return { error: null }

    const type = difference > 0 ? 'income' : 'expense'
    const amount = Math.abs(difference)

    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id: accountId,
        type,
        amount,
        note: 'Penyesuaian Saldo',
        transaction_date: new Date().toISOString(),
      } as never)

    if (error) return { error: error.message }

    await fetchAccounts()
    return { error: null }
  }

  const updateAccount = async (id: string, data: AccountUpdate) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('accounts')
      .update(data as never)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    await fetchAccounts()
    return { error: null }
  }

  const deleteAccount = async (id: string) => {
    if (!user) return { error: 'Not authenticated' }

    // Check if this is the only account
    if (accounts.length <= 1) {
      return { error: 'Anda harus memiliki setidaknya satu dompet/pos keuangan.' }
    }

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    await fetchAccounts()
    return { error: null }
  }

  return {
    accounts,
    loading,
    addAccount,
    updateAccount,
    deleteAccount,
    adjustBalance,
    refreshAccounts: fetchAccounts,
  }
}
