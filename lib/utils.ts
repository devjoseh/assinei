import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BillingCycle, Currency } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_LOCALES: Record<Currency, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  ARS: "es-AR",
}

export function formatCurrency(cents: number, currency: Currency = "BRL"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? "pt-BR", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

export function normalizeToMonthly(price: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly":
      return price * 4.33
    case "monthly":
      return price
    case "quarterly":
      return price / 3
    case "semiannual":
      return price / 6
    case "annual":
      return price / 12
  }
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

/** Parse a date string (ISO or YYYY-MM-DD) as a local calendar date, ignoring timezone offset. */
export function parseDate(dateStr: string): Date {
  const datePart = dateStr.split("T")[0]
  const [year, month, day] = datePart.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function addBillingCycle(date: Date, cycle: BillingCycle): Date {
  const d = new Date(date)
  switch (cycle) {
    case "weekly":
      d.setDate(d.getDate() + 7)
      break
    case "monthly":
      d.setMonth(d.getMonth() + 1)
      break
    case "quarterly":
      d.setMonth(d.getMonth() + 3)
      break
    case "semiannual":
      d.setMonth(d.getMonth() + 6)
      break
    case "annual":
      d.setFullYear(d.getFullYear() + 1)
      break
  }
  return d
}

export function getDaysUntil(dateStr: string): number {
  const target = parseDate(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function getUrgencyColor(daysUntil: number): string {
  if (daysUntil <= 3) return "text-red-500"
  if (daysUntil <= 7) return "text-yellow-500"
  return "text-green-500"
}

export function getUrgencyBg(daysUntil: number): string {
  if (daysUntil <= 3) return "bg-red-500/10 text-red-600 dark:text-red-400"
  if (daysUntil <= 7) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
  return "bg-green-500/10 text-green-600 dark:text-green-400"
}
