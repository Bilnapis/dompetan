-- =============================================
-- Dompetan - Database Schema
-- Jalankan skrip ini di Supabase SQL Editor
-- =============================================

-- ── 1. Create Custom Enum Type ──────────

CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- ── 2. Create Tables ────────────────────

-- Tabel Pengaturan Pengguna
CREATE TABLE user_settings (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  month_start_date  INTEGER NOT NULL DEFAULT 1 CHECK (month_start_date BETWEEN 1 AND 31),
  weekend_behavior  TEXT NOT NULL DEFAULT 'none' CHECK (weekend_behavior IN ('none', 'previous_friday', 'next_monday')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel Pos Keuangan / Dompet
CREATE TABLE accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel Kategori
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        transaction_type NOT NULL,
  budget_limit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel Transaksi
CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount            DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  type              transaction_type NOT NULL,
  account_id        UUID REFERENCES accounts(id) ON DELETE SET NULL,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  note              TEXT,
  transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel Budget per Kategori (Per Bulan)
CREATE TABLE category_budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month       TEXT NOT NULL, -- Format: 'YYYY-MM'
  amount      DECIMAL(15, 2) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month)
);

-- ── 3. Create Indexes ───────────────────

-- Index untuk query per user
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Index untuk query transaksi berdasarkan tanggal
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);

-- Index untuk filter transaksi per user + tanggal (composite)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);

-- Index untuk filter berdasarkan tipe transaksi
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);

-- ── 4. Enable Row Level Security ────────

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_budgets ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS Policies - Settings ──────────

CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 6. RLS Policies - Accounts ──────────

-- User hanya bisa melihat akun miliknya
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT USING (auth.uid() = user_id);

-- User hanya bisa membuat akun untuk dirinya sendiri
CREATE POLICY "Users can create own accounts"
  ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User hanya bisa mengubah akun miliknya
CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User hanya bisa menghapus akun miliknya
CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE USING (auth.uid() = user_id);

-- ── 7. RLS Policies - Categories ────────

-- User hanya bisa melihat kategori miliknya
CREATE POLICY "Users can view own categories"
  ON categories
  FOR SELECT
  USING (auth.uid() = user_id);

-- User hanya bisa membuat kategori untuk dirinya sendiri
CREATE POLICY "Users can create own categories"
  ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User hanya bisa mengubah kategori miliknya
CREATE POLICY "Users can update own categories"
  ON categories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User hanya bisa menghapus kategori miliknya
CREATE POLICY "Users can delete own categories"
  ON categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- ── 8. RLS Policies - Transactions ──────

-- User hanya bisa melihat transaksi miliknya
CREATE POLICY "Users can view own transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- User hanya bisa membuat transaksi untuk dirinya sendiri
CREATE POLICY "Users can create own transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User hanya bisa mengubah transaksi miliknya
CREATE POLICY "Users can update own transactions"
  ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User hanya bisa menghapus transaksi miliknya
CREATE POLICY "Users can delete own transactions"
  ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ── 9. RLS Policies - Category Budgets ──

CREATE POLICY "Users can manage their own category budgets"
  ON category_budgets
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 9. Default Categories & Account (Optional) ───
-- Fungsi untuk membuat kategori dan dompet default saat user baru mendaftar

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

-- Trigger: jalankan saat user baru mendaftar
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_categories();
