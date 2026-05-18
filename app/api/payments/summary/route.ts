import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const now = new Date()
    const { searchParams } = new URL(req.url)
    const currencyFilter = searchParams.get("currency")

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1, total: 0 }
    })

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const userId = new ObjectId(session.user.id)

    // Build the match stage
    const matchStage: Record<string, unknown> = {
      userId,
      paidAt: { $gte: sixMonthsAgo },
    }

    // If currency filter provided, resolve matching subscription IDs
    if (currencyFilter && currencyFilter !== "all") {
      const currencyQuery: Record<string, unknown> = { userId }
      if (currencyFilter === "BRL") {
        currencyQuery.$or = [{ currency: currencyFilter }, { currency: { $exists: false } }]
      } else {
        currencyQuery.currency = currencyFilter
      }
      const subs = await db
        .collection("subscriptions")
        .find(currencyQuery)
        .project({ _id: 1 })
        .toArray()
      const ids = subs.map((s) => s._id)
      if (ids.length === 0) {
        return NextResponse.json({ months })
      }
      matchStage.subscriptionId = { $in: ids }
    }

    const results = await db
      .collection("payments")
      .aggregate([
        { $match: matchStage },
        { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$amount" } } },
      ])
      .toArray()

    for (const r of results) {
      const entry = months.find((m) => m.year === r._id.year && m.month === r._id.month)
      if (entry) entry.total = r.total
    }

    return NextResponse.json({ months })
  } catch (e) {
    console.error("GET /api/payments/summary error:", e)
    return NextResponse.json({ error: "Erro ao carregar resumo" }, { status: 500 })
  }
}
