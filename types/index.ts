export type BillingCycle = "weekly" | "monthly" | "quarterly" | "semiannual" | "annual"

export interface Subscription {
  _id: string
  userId: string
  name: string
  description?: string
  price: number
  billingCycle: BillingCycle
  nextPaymentDate: string
  category: string
  imageUrl?: string
  color?: string
  isActive: boolean
  notes?: string
  tags?: string[]
  createdAt: string
  updatedAt: string
}

export interface Stats {
  totalMonthly: number
  totalAnnual: number
  totalSemiannual: number
  mostExpensive: { name: string; price: number; billingCycle: BillingCycle } | null
  nextPayment: { name: string; date: string; daysUntil: number } | null
  upcomingPayments: Array<{ name: string; date: string; daysUntil: number; price: number }>
  totalActive: number
  categoryBreakdown: Array<{ category: string; total: number; count: number }>
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
