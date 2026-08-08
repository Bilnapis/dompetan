-- =============================================
-- Migration: Add User Settings (Siklus Bulan)
-- Jalankan skrip ini di Supabase SQL Editor
-- =============================================

-- 1. Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start_date  INTEGER NOT NULL DEFAULT 1 CHECK (month_start_date BETWEEN 1 AND 31),
  weekend_behavior  TEXT NOT NULL DEFAULT 'none' CHECK (weekend_behavior IN ('none', 'previous_friday', 'next_monday')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Update the trigger function to include default user_settings
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Buat Pengaturan Default
  INSERT INTO user_settings (user_id, month_start_date, weekend_behavior) VALUES (NEW.id, 1, 'none');

  -- Buat Dompet/Account Default
  INSERT INTO accounts (user_id, name) VALUES (NEW.id, 'Tunai') RETURNING id INTO new_account_id;

  -- Kategori Pemasukan Default
  INSERT INTO categories (user_id, name, type) VALUES
    (NEW.id, 'Gaji', 'income'),
    (NEW.id, 'Freelance', 'income'),
    (NEW.id, 'Investasi', 'income'),
    (NEW.id, 'Lainnya', 'income');

  -- Kategori Pengeluaran Default
  INSERT INTO categories (user_id, name, type) VALUES
    (NEW.id, 'Makanan & Minuman', 'expense'),
    (NEW.id, 'Transportasi', 'expense'),
    (NEW.id, 'Belanja', 'expense'),
    (NEW.id, 'Tagihan & Utilitas', 'expense'),
    (NEW.id, 'Hiburan', 'expense'),
    (NEW.id, 'Kesehatan', 'expense'),
    (NEW.id, 'Pendidikan', 'expense'),
    (NEW.id, 'Lainnya', 'expense');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Insert default settings for existing users who don't have them yet
INSERT INTO user_settings (user_id, month_start_date, weekend_behavior)
SELECT id, 1, 'none' FROM auth.users 
WHERE NOT EXISTS (SELECT 1 FROM user_settings WHERE user_settings.user_id = auth.users.id);
