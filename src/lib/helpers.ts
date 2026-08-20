import type { WeekendBehavior } from '../types/database'

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
export function toDateInputValue(date?: string | Date): string {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
 * Konvensi: siklus "bulan X" dimulai pada tanggal startDay bulan X
 * dan berakhir satu hari sebelum startDay bulan X+1.
 *
 * Contoh: startDay = 15, bulan = November
 *   → siklus = 15 November s/d 14 Desember (labeled "November")
 *
 * Jika startDay = 1 → siklus = 1 Nov s/d 30 Nov (kalender biasa)
 */
export function getCycleDateRange(
  targetYear: number,
  targetMonth: number, // 0-indexed (0 = January)
  startDay: number,
  weekendBehavior: WeekendBehavior
): { start: string; end: string } {
  // Jika startDay = 1, siklus kalender biasa
  if (startDay === 1) {
    const start = new Date(targetYear, targetMonth, 1)
    const end = new Date(targetYear, targetMonth + 1, 0)
    return {
      start: toDateInputValue(start),
      end: toDateInputValue(end),
    }
  }

  // Start date = targetMonth tanggal startDay
  let rawStartDate = new Date(targetYear, targetMonth, startDay)
  // Tangani kasus bulan tidak memiliki tanggal startDay (misal Feb tidak punya tgl 31)
  if (rawStartDate.getMonth() !== targetMonth) {
    rawStartDate = new Date(targetYear, targetMonth + 1, 0) // Hari terakhir targetMonth
  }
  const startDate = adjustForWeekend(rawStartDate, weekendBehavior)

  // End date = satu hari sebelum startDay bulan berikutnya
  let rawNextStartDate = new Date(targetYear, targetMonth + 1, startDay)
  if (rawNextStartDate.getMonth() !== (targetMonth + 1) % 12) {
    rawNextStartDate = new Date(targetYear, targetMonth + 2, 0)
  }
  const nextStartDate = adjustForWeekend(rawNextStartDate, weekendBehavior)

  const endDate = new Date(nextStartDate)
  endDate.setDate(endDate.getDate() - 1)

  return {
    start: toDateInputValue(startDate),
    end: toDateInputValue(endDate),
  }
}

/**
 * Get current cycle range (for Dashboard)
 *
 * Konvensi baru: siklus "bulan X" = startDay bulan X s/d (startDay-1) bulan X+1.
 * Jika hari ini sudah >= startDay bulan ini → siklus bulan ini.
 * Jika hari ini < startDay bulan ini → siklus bulan lalu.
 */
export function getCurrentCycleRange(
  startDay: number = 1,
  weekendBehavior: WeekendBehavior = 'none'
): { start: string; end: string } {
  const now = new Date()
  let targetMonth = now.getMonth()
  let targetYear = now.getFullYear()

  if (startDay > 1) {
    let rawThisCycleStart = new Date(targetYear, targetMonth, startDay)
    if (rawThisCycleStart.getMonth() !== targetMonth) {
      rawThisCycleStart = new Date(targetYear, targetMonth + 1, 0)
    }
    const thisCycleStart = adjustForWeekend(rawThisCycleStart, weekendBehavior)

    // Jika hari ini belum mencapai startDay bulan ini → masih di siklus bulan lalu
    if (now < thisCycleStart) {
      targetMonth -= 1
      if (targetMonth < 0) {
        targetMonth = 11
        targetYear -= 1
      }
    }
    // Jika now >= thisCycleStart → tetap di bulan ini (siklus bulan ini sudah berjalan)
  }

  return getCycleDateRange(targetYear, targetMonth, startDay, weekendBehavior)
}

/**
 * Get the YYYY-MM string for the current billing cycle month.
 * Uses the same logic as getCurrentCycleRange to determine the correct target month.
 */
export function getCurrentCycleMonth(
  startDay: number = 1,
  weekendBehavior: WeekendBehavior = 'none'
): string {
  const now = new Date()
  let targetMonth = now.getMonth()
  let targetYear = now.getFullYear()

  if (startDay > 1) {
    let rawThisCycleStart = new Date(targetYear, targetMonth, startDay)
    if (rawThisCycleStart.getMonth() !== targetMonth) {
      rawThisCycleStart = new Date(targetYear, targetMonth + 1, 0)
    }
    const thisCycleStart = adjustForWeekend(rawThisCycleStart, weekendBehavior)

    // Jika hari ini belum mencapai startDay bulan ini → masih di siklus bulan lalu
    if (now < thisCycleStart) {
      targetMonth -= 1
      if (targetMonth < 0) {
        targetMonth = 11
        targetYear -= 1
      }
    }
  }

  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`
}
