import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { imageHistorySchema } from "@/lib/validations"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const history = await db
      .collection("image_history")
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ usageCount: -1, lastUsedAt: -1 })
      .limit(50)
      .toArray()

    return NextResponse.json(
      history.map((h) => ({ ...h, _id: h._id.toString(), userId: h.userId.toString() }))
    )
  } catch (e) {
    console.error("GET /api/image-history error:", e)
    return NextResponse.json({ error: "Erro ao buscar histórico de imagens" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = imageHistorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date()
    const result = await db.collection("image_history").findOneAndUpdate(
      { userId: new ObjectId(session.user.id), url: parsed.data.url },
      {
        $inc: { usageCount: 1 },
        $set: { lastUsedAt: now, ...(parsed.data.label ? { label: parsed.data.label } : {}) },
        $setOnInsert: {
          userId: new ObjectId(session.user.id),
          url: parsed.data.url,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    )

    if (result) {
      return NextResponse.json({ ...result, _id: result._id.toString(), userId: result.userId.toString() })
    }
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e) {
    console.error("POST /api/image-history error:", e)
    return NextResponse.json({ error: "Erro ao salvar imagem" }, { status: 500 })
  }
}
