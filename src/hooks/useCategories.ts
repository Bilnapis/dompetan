import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Category, CategoryInsert, CategoryUpdate, CategoryType } from '../types/database'

export function useCategories(filterType?: CategoryType) {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (filterType) {
        query = query.eq('type', filterType)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setCategories(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }, [user, filterType])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const addCategory = async (data: CategoryInsert) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('categories')
      .insert({ ...data, user_id: user.id } as never)

    if (error) return { error: error.message }

    await fetchCategories()
    return { error: null }
  }

  const updateCategory = async (id: string, data: CategoryUpdate) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('categories')
      .update(data as never)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    await fetchCategories()
    return { error: null }
  }

  const deleteCategory = async (id: string) => {
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }

    await fetchCategories()
    return { error: null }
  }

  const reorderCategories = async (updates: { id: string; sort_order: number }[]) => {
    if (!user) return { error: 'Not authenticated' }

    // Supabase JS doesn't have a built-in bulk update for different rows with different values.
    // We update them one by one. For better performance, we run them concurrently.
    const promises = updates.map((update) =>
      supabase
        .from('categories')
        .update({ sort_order: update.sort_order } as never)
        .eq('id', update.id)
        .eq('user_id', user.id)
    )

    const results = await Promise.all(promises)
    const error = results.find((r) => r.error)?.error

    if (error) return { error: error.message }

    await fetchCategories()
    return { error: null }
  }

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refetch: fetchCategories,
  }
}
