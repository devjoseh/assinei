import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { subscriptionSchema } from "@/lib/validations"
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
    const category = searchParams.get("category")
    const sort = searchParams.get("sort") || "name"

    const query: Record<string, unknown> = { userId: new ObjectId(session.user.id) }
    if (category) query.category = category

    let sortQuery: Record<string, 1 | -1> = { name: 1 }
    if (sort === "price") sortQuery = { price: -1 }
    else if (sort === "price_asc") sortQuery = { price: 1 }
    else if (sort === "nextPaymentDate") sortQuery = { nextPaymentDate: 1 }

    const subscriptions = await db
      .collection("subscriptions")
      .find(query)
      .sort(sortQuery)
      .toArray()

    return NextResponse.json(
      subscriptions.map((s) => ({ ...s, _id: s._id.toString(), userId: s.userId.toString() }))
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
    const parsed = subscriptionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date()
    const doc = {
      ...parsed.data,
      userId: new ObjectId(session.user.id),
      nextPaymentDate: new Date(parsed.data.nextPaymentDate),
      imageUrl: parsed.data.imageUrl || undefined,
      isActive: parsed.data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("subscriptions").insertOne(doc)
    return NextResponse.json(
      { ...doc, _id: result.insertedId.toString(), userId: doc.userId.toString() },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
