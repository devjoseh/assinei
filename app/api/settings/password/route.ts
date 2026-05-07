import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { changePasswordSchema } from "@/lib/validations"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(
      parsed.error.issues.map((i) => [i.path.join("."), i.message])
    )
    return NextResponse.json({ error: "Dados inválidos", fieldErrors }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  try {
    const db = await getDb()
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) })
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    const newHash = await bcrypt.hash(newPassword, 12)
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { passwordHash: newHash, updatedAt: new Date() } }
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
