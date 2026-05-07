export type BillingCycle = "weekly" | "monthly" | "quarterly" | "semiannual" | "annual"

export type Currency = "BRL" | "USD" | "EUR" | "GBP" | "ARS"

export interface Category {
  _id: string
  userId: string
  name: string
  color: string
  icon?: string
  isDefault: boolean
  isHidden: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  _id: string
  userId: string
  name: string
  description?: string
  price: number
  billingCycle: BillingCycle
  nextPaymentDate: string
  category: string
  currency?: Currency
  imageUrl?: string
  color?: string
  isActive: boolean
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface Stats {
  totals: Array<{
    currency: string
    symbol: string
    totalMonthly: number
    totalAnnual: number
    totalSemiannual: number
    mostExpensive: { name: string; price: number; billingCycle: BillingCycle } | null
    totalActive: number
  }>
  nextPayment: { name: string; date: string; daysUntil: number; currency?: string } | null
  upcomingPayments: Array<{ name: string; date: string; daysUntil: number; price: number; currency?: string }>
  categoryBreakdown: Array<{ category: string; currency: string; total: number; count: number; color: string; icon?: string }>
}

export interface ImageHistory {
  _id: string
  userId: string
  url: string
  label?: string
  usageCount: number
  lastUsedAt: string
  createdAt: string
}
