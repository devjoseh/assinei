import { auth } from "@/lib/auth"
import { getDb } from "@/lib/mongodb"
import { sendTestEmail, type AlertSettings } from "@/lib/email"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"

const DEFAULTS: AlertSettings = {
  featureEnabled: false,
  enabled: true,
  daysBefore: 3,
  recipients: [],
  fromName: "Assinei",
  fromUser: "",
  fromDomain: "",
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()
    const doc = await db
      .collection("alert_settings")
      .findOne({ userId: new ObjectId(session.user.id) })

    const settings: AlertSettings = doc
      ? {
          featureEnabled: doc.featureEnabled ?? DEFAULTS.featureEnabled,
          enabled: doc.enabled ?? DEFAULTS.enabled,
          daysBefore: doc.daysBefore ?? DEFAULTS.daysBefore,
          recipients: doc.recipients ?? DEFAULTS.recipients,
          fromName: doc.fromName ?? DEFAULTS.fromName,
          fromUser: doc.fromUser ?? DEFAULTS.fromUser,
          fromDomain: doc.fromDomain ?? DEFAULTS.fromDomain,
        }
      : DEFAULTS

    if (!settings.fromUser || !settings.fromDomain) {
      return NextResponse.json({ success: false, error: "Remetente não configurado" })
    }
    if (settings.recipients.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhum destinatário configurado" })
    }

    const result = await sendTestEmail(settings)
    return NextResponse.json({ ...result, recipientCount: settings.recipients.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[settings/alerts/test]", err)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
