import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const db = await getDb()
    const result = await db.collection("image_history").deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(session.user.id),
    })

    if (result.deletedCount === 0) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("DELETE /api/image-history/[id] error:", e)
    return NextResponse.json({ error: "Erro ao excluir imagem" }, { status: 500 })
  }
}
