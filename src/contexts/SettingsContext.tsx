import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import type { UserSetting, UserSettingUpdate } from '../types/database'

interface SettingsContextType {
  settings: UserSetting | null
  loading: boolean
  updateSettings: (data: UserSettingUpdate) => Promise<{ error: string | null }>
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  updateSettings: async () => ({ error: 'Not initialized' }),
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<UserSetting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSettings() {
      // While auth is still resolving, keep loading=true and wait
      if (authLoading) {
        setLoading(true)
        return
      }

      if (!user) {
        setSettings(null)
        setLoading(false)
        return
      }

      // Reset loading when starting a new fetch
      setLoading(true)

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setSettings(data)
      }
      setLoading(false)
    }

    fetchSettings()
  }, [user, authLoading])

  const updateSettings = async (data: UserSettingUpdate) => {
    if (!user) return { error: 'Not authenticated' }

    // If no settings exist yet, we insert them
    if (!settings) {
      const { data: newData, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, month_start_date: 1, weekend_behavior: 'none', ...data } as never)
        .select()
        .single()
        
      if (insertError) return { error: insertError.message }
      setSettings(newData)
      return { error: null }
    }

    const { data: updatedData, error } = await supabase
      .from('user_settings')
      .update({ ...data, updated_at: new Date().toISOString() } as never)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) return { error: error.message }
    setSettings(updatedData)
    return { error: null }
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
