import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { normalizeToMonthly } from "@/lib/utils"
import { BillingCycle } from "@/types"
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

    const totalActive = subs.length

    const totalMonthly = subs.reduce(
      (sum, s) => sum + normalizeToMonthly(s.price, s.billingCycle as BillingCycle),
      0
    )
    const totalAnnual = totalMonthly * 12
    const totalSemiannual = totalMonthly * 6

    const mostExpensive = subs.reduce<typeof subs[0] | null>((max, s) => {
      const monthly = normalizeToMonthly(s.price, s.billingCycle as BillingCycle)
      if (!max) return s
      return monthly > normalizeToMonthly(max.price, max.billingCycle as BillingCycle) ? s : max
    }, null)

    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const in30Days = new Date(now)
    in30Days.setDate(in30Days.getDate() + 30)

    const upcomingPayments = subs
      .map((s) => {
        const raw: Date | string = s.nextPaymentDate
        const iso = raw instanceof Date ? raw.toISOString() : String(raw)
        const datePart = iso.split("T")[0]
        const [y, m, d] = datePart.split("-").map(Number)
        const date = new Date(y, m - 1, d)
        date.setHours(0, 0, 0, 0)
        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return { name: s.name, date: datePart, daysUntil, price: s.price }
      })
      .filter((s) => s.daysUntil >= 0 && s.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil)

    const nextPayment = upcomingPayments[0] ?? null

    const categoryMap = new Map<string, { total: number; count: number }>()
    for (const s of subs) {
      const monthly = normalizeToMonthly(s.price, s.billingCycle as BillingCycle)
      const existing = categoryMap.get(s.category)
      if (existing) {
        existing.total += monthly
        existing.count++
      } else {
        categoryMap.set(s.category, { total: monthly, count: 1 })
      }
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      ...data,
    }))

    return NextResponse.json({
      totalMonthly,
      totalAnnual,
      totalSemiannual,
      mostExpensive: mostExpensive
        ? { name: mostExpensive.name, price: mostExpensive.price, billingCycle: mostExpensive.billingCycle }
        : null,
      nextPayment,
      upcomingPayments,
      totalActive,
      categoryBreakdown,
    })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
