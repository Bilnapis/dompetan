-- =============================================
-- KeuanganKu - Database Schema
-- Jalankan skrip ini di Supabase SQL Editor
-- =============================================

-- ── 1. Create Custom Enum Type ──────────

CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- ── 2. Create Tables ────────────────────

-- Tabel Kategori
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        transaction_type NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel Transaksi
CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount            DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  type              transaction_type NOT NULL,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  note              TEXT,
  transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Create Indexes ───────────────────

-- Index untuk query per user
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Index untuk query transaksi berdasarkan tanggal
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);

-- Index untuk filter transaksi per user + tanggal (composite)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);

-- Index untuk filter berdasarkan tipe transaksi
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);

-- ── 4. Enable Row Level Security ────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS Policies - Categories ────────

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

-- ── 6. RLS Policies - Transactions ──────

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

-- ── 7. Default Categories (Optional) ───
-- Fungsi untuk membuat kategori default saat user baru mendaftar

CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
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
