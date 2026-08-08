-- =============================================
-- Migration: Add Accounts (Pos Keuangan/Dompet)
-- Jalankan skrip ini di Supabase SQL Editor
-- =============================================

-- 1. Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add index for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- 3. Enable RLS on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- 4. Add RLS Policies for accounts
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- 5. Add account_id to transactions
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- 6. Update the trigger function to include a default account "Tunai"
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id UUID;
BEGIN
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
