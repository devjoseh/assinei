import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const now = new Date()

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      return { label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1, total: 0 }
    })

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const results = await db
      .collection("payments")
      .aggregate([
        { $match: { userId: new ObjectId(session.user.id), paidAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } }, total: { $sum: "$amount" } } },
      ])
      .toArray()

    for (const r of results) {
      const entry = months.find((m) => m.year === r._id.year && m.month === r._id.month)
      if (entry) entry.total = r.total
    }

    return NextResponse.json({ months })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
