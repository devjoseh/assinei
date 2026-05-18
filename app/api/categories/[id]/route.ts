import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { updateCategorySchema } from "@/lib/validations"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await req.json()
    const parsed = updateCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const userId = new ObjectId(session.user.id)
    const db = await getDb()

    // Check name uniqueness (case-insensitive) if name is being changed
    if (parsed.data.name) {
      const duplicate = await db.collection("categories").findOne({
        userId,
        name: { $regex: `^${parsed.data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
        _id: { $ne: new ObjectId(id) },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: "Já existe uma categoria com este nome" },
          { status: 409 }
        )
      }
    }

    const { icon, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest, updatedAt: new Date() }

    const updateOp: Record<string, unknown> = { $set: updateData }
    if (icon === null) {
      updateOp.$unset = { icon: "" }
    } else if (icon !== undefined) {
      ;(updateOp.$set as Record<string, unknown>).icon = icon
    }

    const result = await db.collection("categories").findOneAndUpdate(
      { _id: new ObjectId(id), userId },
      updateOp,
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      ...result,
      _id: result._id.toString(),
      userId: result.userId.toString(),
    })
  } catch (e) {
    console.error("PATCH /api/categories/[id] error:", e)
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const userId = new ObjectId(session.user.id)
    const db = await getDb()

    const category = await db.collection("categories").findOne({
      _id: new ObjectId(id),
      userId,
    })

    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: "Categorias padrão não podem ser excluídas" },
        { status: 403 }
      )
    }

    // Move subscriptions using this category to "Outros"
    const updatedSubs = await db.collection("subscriptions").updateMany(
      { userId, category: category.name },
      { $set: { category: "Outros", updatedAt: new Date() } }
    )

    await db.collection("categories").deleteOne({ _id: new ObjectId(id), userId })

    return NextResponse.json({
      success: true,
      movedSubscriptions: updatedSubs.modifiedCount,
    })
  } catch (e) {
    console.error("DELETE /api/categories/[id] error:", e)
    return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 })
  }
}
