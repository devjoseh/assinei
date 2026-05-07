import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { normalizeToMonthly } from "@/lib/utils"
import { CURRENCY_SYMBOLS } from "@/lib/constants"
import { BillingCycle, Currency } from "@/types"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const subs = await db
      .collection("subscriptions")
      .find({ userId: new ObjectId(session.user.id), isActive: true })
      .toArray()

    // Group by currency, defaulting to BRL for documents without the field
    const currencyGroups = new Map<string, typeof subs>()
    for (const s of subs) {
      const currency = (s.currency as string) || "BRL"
      if (!currencyGroups.has(currency)) currencyGroups.set(currency, [])
      currencyGroups.get(currency)!.push(s)
    }

    const totals = Array.from(currencyGroups.entries()).map(([currency, group]) => {
      const totalMonthly = group.reduce(
        (sum, s) => sum + normalizeToMonthly(s.price, s.billingCycle as BillingCycle),
        0
      )

      const mostExpensive = group.reduce<typeof group[0] | null>((max, s) => {
        const monthly = normalizeToMonthly(s.price, s.billingCycle as BillingCycle)
        if (!max) return s
        return monthly > normalizeToMonthly(max.price, max.billingCycle as BillingCycle) ? s : max
      }, null)

      return {
        currency,
        symbol: CURRENCY_SYMBOLS[currency as Currency] ?? "$",
        totalMonthly,
        totalAnnual: totalMonthly * 12,
        totalSemiannual: totalMonthly * 6,
        mostExpensive: mostExpensive
          ? { name: mostExpensive.name, price: mostExpensive.price, billingCycle: mostExpensive.billingCycle }
          : null,
        totalActive: group.length,
      }
    })

    // Global: next payment and upcoming payments (cross-currency)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const upcomingPayments = subs
      .map((s) => {
        const raw: Date | string = s.nextPaymentDate
        const iso = raw instanceof Date ? raw.toISOString() : String(raw)
        const datePart = iso.split("T")[0]
        const [y, m, d] = datePart.split("-").map(Number)
        const date = new Date(y, m - 1, d)
        date.setHours(0, 0, 0, 0)
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { name: s.name, date: datePart, daysUntil, price: s.price, currency: (s.currency as string) || "BRL" }
      })
      .filter((s) => s.daysUntil >= 0 && s.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)

    const nextPayment = upcomingPayments[0] ?? null

    // Category breakdown with currency
    const categoryDocs = await db
      .collection("categories")
      .find({ userId: new ObjectId(session.user.id) })
      .project({ name: 1, color: 1, icon: 1 })
      .toArray()
    const categoryMeta = new Map(categoryDocs.map((c) => [c.name, { color: c.color, icon: c.icon }]))

    const breakdownKey = (cat: string, cur: string) => `${cat}|||${cur}`
    const categoryMap = new Map<string, { category: string; currency: string; total: number; count: number; color: string; icon?: string }>()
    for (const s of subs) {
      const currency = (s.currency as string) || "BRL"
      const monthly = normalizeToMonthly(s.price, s.billingCycle as BillingCycle)
      const meta = categoryMeta.get(s.category)
      const key = breakdownKey(s.category, currency)
      const existing = categoryMap.get(key)
      if (existing) {
        existing.total += monthly
        existing.count++
      } else {
        categoryMap.set(key, {
          category: s.category,
          currency,
          total: monthly,
          count: 1,
          color: meta?.color ?? "#8C8C8C",
          icon: meta?.icon,
        })
      }
    }

    const categoryBreakdown = Array.from(categoryMap.values())

    return NextResponse.json({
      totals,
      nextPayment,
      upcomingPayments,
      categoryBreakdown,
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
