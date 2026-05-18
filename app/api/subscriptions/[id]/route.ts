import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { upsertTagsHistory } from "@/lib/tags"
import { updateSubscriptionSchema } from "@/lib/validations"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const db = await getDb()
    const sub = await db.collection("subscriptions").findOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.user.id),
    })

    if (!sub) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    return NextResponse.json({ ...sub, _id: sub._id.toString(), userId: sub.userId.toString() })
  } catch (e) {
    console.error("GET /api/subscriptions/[id] error:", e)
    return NextResponse.json({ error: "Erro ao buscar assinatura" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const body = await req.json()
    const parsed = updateSubscriptionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() }
    if (parsed.data.nextPaymentDate) {
      updateData.nextPaymentDate = new Date(parsed.data.nextPaymentDate)
    }

    const db = await getDb()
    const filter = { _id: new ObjectId(id), userId: new ObjectId(session.user.id) }
    const before = await db.collection("subscriptions").findOneAndUpdate(
      filter,
      { $set: updateData },
      { returnDocument: "before" }
    )

    if (!before) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

    if (parsed.data.tags !== undefined) {
      const oldTags: string[] = (before.tags as string[]) ?? []
      const newTags = parsed.data.tags.filter((t) => !oldTags.includes(t))
      if (newTags.length) {
        await upsertTagsHistory(db, new ObjectId(session.user.id), newTags)
      }
    }

    const result = await db.collection("subscriptions").findOne(filter)
    if (!result) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

    return NextResponse.json({ ...result, _id: result._id.toString(), userId: result.userId.toString() })
  } catch (e) {
    console.error("PATCH /api/subscriptions/[id] error:", e)
    return NextResponse.json({ error: "Erro ao atualizar assinatura" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const db = await getDb()
    const result = await db.collection("subscriptions").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.user.id),
    })

    if (result.deletedCount === 0) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("DELETE /api/subscriptions/[id] error:", e)
    return NextResponse.json({ error: "Erro ao excluir assinatura" }, { status: 500 })
  }
}
