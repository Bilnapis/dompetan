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

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
