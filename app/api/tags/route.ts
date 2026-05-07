import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const tags = await db
      .collection("tags_history")
      .find({ userId: new ObjectId(session.user.id) })
      .sort({ usageCount: -1 })
      .toArray()

    return NextResponse.json(
      tags.map((t) => ({
        ...t,
        _id: t._id.toString(),
        userId: t.userId.toString(),
      }))
    )
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
