import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { reorderCategoriesSchema } from "@/lib/validations"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = reorderCategoriesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const userId = new ObjectId(session.user.id)
    const db = await getDb()
    const now = new Date()

    await Promise.all(
      parsed.data.ids.map((id, index) =>
        db.collection("categories").updateOne(
          { _id: new ObjectId(id), userId },
          { $set: { order: index, updatedAt: now } }
        )
      )
    )

    const categories = await db
      .collection("categories")
      .find({ userId })
      .sort({ order: 1 })
      .toArray()

    return NextResponse.json(
      categories.map((c) => ({
        ...c,
        _id: c._id.toString(),
        userId: c.userId.toString(),
      }))
    )
  } catch (e) {
    console.error("POST /api/categories/reorder error:", e)
    return NextResponse.json({ error: "Erro ao reordenar categorias" }, { status: 500 })
  }
}
