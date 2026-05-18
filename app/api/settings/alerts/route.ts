import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { updateAlertSettingsSchema } from "@/lib/validations"
import { ObjectId } from "mongodb"
import { NextRequest, NextResponse } from "next/server"

const DEFAULTS = {
  featureEnabled: false,
  enabled: true,
  daysBefore: 3,
  recipients: [] as string[],
  fromName: "Assinei",
  fromUser: "",
  fromDomain: "",
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const doc = await db
      .collection("alert_settings")
      .findOne({ userId: new ObjectId(session.user.id) })

    if (!doc) return NextResponse.json(DEFAULTS)

    return NextResponse.json({
      ...doc,
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
    })
  } catch (e) {
    console.error("GET /api/settings/alerts error:", e)
    return NextResponse.json({ error: "Erro ao buscar configurações de alerta" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = updateAlertSettingsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date()
    const userId = new ObjectId(session.user.id)

    const result = await db.collection("alert_settings").findOneAndUpdate(
      { userId },
      {
        $set: { ...parsed.data, updatedAt: now },
        $setOnInsert: { userId, createdAt: now },
      },
      { upsert: true, returnDocument: "after" }
    )

    if (!result) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 })
    return NextResponse.json({
      ...result,
      _id: result._id.toString(),
      userId: result.userId.toString(),
    })
  } catch (e) {
    console.error("PATCH /api/settings/alerts error:", e)
    return NextResponse.json({ error: "Erro ao salvar configurações de alerta" }, { status: 500 })
  }
}
