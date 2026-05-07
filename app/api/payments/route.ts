import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { paymentSchema } from "@/lib/validations"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const { searchParams } = new URL(req.url)
    const subscriptionId = searchParams.get("subscriptionId")
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const query: Record<string, unknown> = { userId: new ObjectId(session.user.id) }

    if (subscriptionId && ObjectId.isValid(subscriptionId)) {
      query.subscriptionId = new ObjectId(subscriptionId)
    }

    if (month && year) {
      const y = parseInt(year)
      const m = parseInt(month)
      query.paidAt = { $gte: new Date(y, m - 1, 1), $lt: new Date(y, m, 1) }
    } else if (year) {
      const y = parseInt(year)
      query.paidAt = { $gte: new Date(y, 0, 1), $lt: new Date(y + 1, 0, 1) }
    }

    const payments = await db.collection("payments").find(query).sort({ paidAt: -1 }).toArray()

    return NextResponse.json(
      payments.map((p) => ({
        ...p,
        _id: p._id.toString(),
        userId: p.userId.toString(),
        subscriptionId: p.subscriptionId.toString(),
      }))
    )
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { subscriptionId, paidAt, notes } = parsed.data

    if (!ObjectId.isValid(subscriptionId)) {
      return NextResponse.json({ error: "ID de assinatura inválido" }, { status: 400 })
    }

    const db = await getDb()
    const sub = await db.collection("subscriptions").findOne({
      _id: new ObjectId(subscriptionId),
      userId: new ObjectId(session.user.id),
    })

    if (!sub) {
      return NextResponse.json({ error: "Assinatura não encontrada" }, { status: 404 })
    }

    const now = new Date()
    const doc = {
      userId: new ObjectId(session.user.id),
      subscriptionId: new ObjectId(subscriptionId),
      subscriptionName: sub.name as string,
      amount: sub.price as number,
      billingCycle: sub.billingCycle as string,
      paidAt: new Date(paidAt),
      ...(notes ? { notes } : {}),
      createdAt: now,
    }

    const result = await db.collection("payments").insertOne(doc)
    return NextResponse.json(
      {
        ...doc,
        _id: result.insertedId.toString(),
        userId: doc.userId.toString(),
        subscriptionId: doc.subscriptionId.toString(),
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
