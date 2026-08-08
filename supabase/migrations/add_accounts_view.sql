-- =============================================
-- Migration: Add Accounts View with Balance
-- Jalankan skrip ini di Supabase SQL Editor
-- =============================================

CREATE OR REPLACE VIEW accounts_with_balance WITH (security_invoker = true) AS
SELECT 
  a.id, 
  a.user_id, 
  a.name, 
  a.created_at,
  COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount WHEN t.type = 'expense' THEN -t.amount ELSE 0 END), 0) as balance
FROM accounts a
LEFT JOIN transactions t ON a.id = t.account_id
GROUP BY a.id, a.user_id, a.name, a.created_at;
