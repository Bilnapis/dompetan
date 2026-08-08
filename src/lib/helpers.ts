/**
 * KeuanganKu - Helper Utilities
 */

/**
 * Format angka ke format mata uang Rupiah
 * @example formatCurrency(1500000) → "Rp 1.500.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format tanggal ke format panjang Indonesia
 * @example formatDate('2026-08-08') → "8 Agustus 2026"
 */
export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Format tanggal ke format pendek
 * @example formatDateShort('2026-08-08') → "8 Agu"
 */
export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
}

/**
 * Format tanggal untuk grouping (Hari ini, Kemarin, atau tanggal)
 */
export function formatDateGroup(date: string): string {
  const today = new Date()
  const d = new Date(date)

  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  return formatDate(date)
}

/**
 * Greeting berdasarkan waktu
 */
export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

/**
 * Format tanggal ke YYYY-MM-DD untuk input date
 */
export function toDateInputValue(date?: string): string {
  const d = date ? new Date(date) : new Date()
  return d.toISOString().split('T')[0]
}

/**
 * Get current month range (for filtering)
 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}
