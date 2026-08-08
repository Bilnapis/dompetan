import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { CategoryBudget } from '../types/database'

export function useCategoryBudgets(categoryId?: string, year?: string) {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<CategoryBudget[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBudgets = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('category_budgets')
        .select('*')
        .order('month', { ascending: false })

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
      if (year) {
        query = query.like('month', `${year}-%`)
      }

      const { data, error } = await query
      if (error) throw error
      setBudgets(data || [])
    } catch (err: any) {
      console.error('Error fetching category budgets:', err.message)
    } finally {
      setLoading(false)
    }
  }, [user, categoryId, year])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const setCategoryBudget = async (categoryId: string, month: string, amount: number) => {
    if (!user) return false
    
    try {
      // Upsert the budget for the specific month
      const { error } = await supabase
        .from('category_budgets')
        .upsert([{
          user_id: user.id,
          category_id: categoryId,
          month,
          amount,
        }] as any, {
          onConflict: 'user_id,category_id,month'
        })
        
      if (error) throw error
      
      // Refresh the local state
      await fetchBudgets()
      return true
    } catch (err: any) {
      console.error('Error setting category budget:', err.message)
      return false
    }
  }

  return {
    budgets,
    loading,
    setCategoryBudget,
    refreshBudgets: fetchBudgets
  }
}
