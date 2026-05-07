import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

type Params = { params: Promise<{ tag: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const { tag } = await params
    const db = await getDb()
    await db.collection("tags_history").deleteOne({
      userId: new ObjectId(session.user.id),
      tag: decodeURIComponent(tag),
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
