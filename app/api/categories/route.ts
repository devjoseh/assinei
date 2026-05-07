import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { categorySchema } from "@/lib/validations"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const categories = await db
      .collection("categories")
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ order: 1 })
      .toArray()

    return NextResponse.json(
      categories.map((c) => ({
        ...c,
        _id: c._id.toString(),
        userId: c.userId.toString(),
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
    const parsed = categorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const db = await getDb()
    const userId = new ObjectId(session.user.id)

    // Check max 30 categories
    const count = await db.collection("categories").countDocuments({ userId })
    if (count >= 30) {
      return NextResponse.json(
        { error: "Máximo de 30 categorias atingido" },
        { status: 400 }
      )
    }

    // Check name uniqueness (case-insensitive)
    const existing = await db.collection("categories").findOne({
      userId,
      name: { $regex: `^${parsed.data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    })
    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma categoria com este nome" },
        { status: 409 }
      )
    }

    const maxOrder = await db
      .collection("categories")
      .find({ userId })
      .sort({ order: -1 })
      .limit(1)
      .toArray()

    const now = new Date()
    const doc = {
      ...parsed.data,
      icon: parsed.data.icon || undefined,
      userId,
      isDefault: false,
      isHidden: false,
      order: maxOrder.length > 0 ? maxOrder[0].order + 1 : 0,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("categories").insertOne(doc)

    return NextResponse.json(
      { ...doc, _id: result.insertedId.toString(), userId: session.user.id },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
