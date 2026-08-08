import type { WeekendBehavior } from './types/database'

/**
 * Dompetan - Helper Utilities
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
 * Menghitung tanggal yang disesuaikan berdasarkan behavior weekend.
 */
function adjustForWeekend(date: Date, behavior: WeekendBehavior): Date {
  const day = date.getDay()
  const adjusted = new Date(date)
  
  if (behavior === 'previous_friday') {
    if (day === 0) adjusted.setDate(date.getDate() - 2) // Sunday -> Friday
    else if (day === 6) adjusted.setDate(date.getDate() - 1) // Saturday -> Friday
  } else if (behavior === 'next_monday') {
    if (day === 0) adjusted.setDate(date.getDate() + 1) // Sunday -> Monday
    else if (day === 6) adjusted.setDate(date.getDate() + 2) // Saturday -> Monday
  }
  
  return adjusted
}

/**
 * Mendapatkan rentang tanggal untuk suatu siklus bulan.
 * Jika bulan filter adalah Agustus 2026 dan tanggal mulai adalah 25,
 * maka siklus = 25 Juli 2026 s/d 24 Agustus 2026.
 */
export function getCycleDateRange(
  targetYear: number,
  targetMonth: number, // 0-indexed (0 = January)
  startDay: number,
  weekendBehavior: WeekendBehavior
): { start: string; end: string } {
  // Jika startDay = 1, siklus = 1 Agustus s/d 31 Agustus
  if (startDay === 1) {
    const start = new Date(targetYear, targetMonth, 1)
    const end = new Date(targetYear, targetMonth + 1, 0)
    return {
      start: toDateInputValue(start.toISOString()),
      end: toDateInputValue(end.toISOString()),
    }
  }

  // Jika startDay > 1, siklus dimulai pada bulan SEBELUMNYA
  // Start date = (targetMonth - 1) tanggal startDay
  let rawStartDate = new Date(targetYear, targetMonth - 1, startDay)
  
  // Tangani kasus di mana bulan sebelumnya tidak memiliki tanggal startDay (misal: 31 Feb)
  if (rawStartDate.getMonth() !== (targetMonth - 1 + 12) % 12) {
    rawStartDate = new Date(targetYear, targetMonth, 0) // Hari terakhir bulan sebelumnya
  }
  const startDate = adjustForWeekend(rawStartDate, weekendBehavior)

  // End date = targetMonth tanggal (startDay - 1)
  // Tetapi harus menghitung rawNextStartDate dulu lalu dikurangi 1 hari
  let rawNextStartDate = new Date(targetYear, targetMonth, startDay)
  if (rawNextStartDate.getMonth() !== targetMonth) {
    rawNextStartDate = new Date(targetYear, targetMonth + 1, 0)
  }
  const nextStartDate = adjustForWeekend(rawNextStartDate, weekendBehavior)
  
  const endDate = new Date(nextStartDate)
  endDate.setDate(endDate.getDate() - 1)

  return {
    start: toDateInputValue(startDate.toISOString()),
    end: toDateInputValue(endDate.toISOString()),
  }
}

/**
 * Get current cycle range (for Dashboard)
 */
export function getCurrentCycleRange(
  startDay: number = 1,
  weekendBehavior: WeekendBehavior = 'none'
): { start: string; end: string } {
  const now = new Date()
  let targetMonth = now.getMonth()
  let targetYear = now.getFullYear()

  // Jika hari ini belum melewati startDay, berarti masih ikut siklus bulan ini.
  // Jika sudah melewati startDay, jika startDay != 1, itu dihitung sebagai siklus bulan depan.
  // Misalnya: Tgl mulai = 25. Hari ini = 26 Agustus. Maka masuk ke siklus September (25 Ags - 24 Sep).
  // Hari ini = 10 Agustus. Masuk siklus Agustus (25 Jul - 24 Ags).
  if (startDay > 1) {
    let rawThisCycleStart = new Date(targetYear, targetMonth, startDay)
    if (rawThisCycleStart.getMonth() !== targetMonth) {
      rawThisCycleStart = new Date(targetYear, targetMonth + 1, 0)
    }
    const thisCycleStart = adjustForWeekend(rawThisCycleStart, weekendBehavior)

    if (now >= thisCycleStart) {
      // Masuk ke target bulan depan
      targetMonth += 1
      if (targetMonth > 11) {
        targetMonth = 0
        targetYear += 1
      }
    }
  }

  return getCycleDateRange(targetYear, targetMonth, startDay, weekendBehavior)
}
