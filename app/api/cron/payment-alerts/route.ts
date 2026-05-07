import { getDb } from "@/lib/mongodb"
import { sendPaymentAlertEmail, type AlertSettings, type AlertSubscription } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"

function daysUntil(date: Date): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const db = await getDb()

    const settingsDoc = await db.collection("alert_settings").findOne({})

    if (!settingsDoc) {
      return NextResponse.json({ sent: false, reason: "no alert settings configured" })
    }

    const settings: AlertSettings = {
      featureEnabled: settingsDoc.featureEnabled ?? false,
      enabled: settingsDoc.enabled ?? true,
      daysBefore: settingsDoc.daysBefore ?? 3,
      recipients: settingsDoc.recipients ?? [],
      fromName: settingsDoc.fromName ?? "Assinei",
      fromUser: settingsDoc.fromUser ?? "",
      fromDomain: settingsDoc.fromDomain ?? "",
    }

    if (!settings.featureEnabled) {
      return NextResponse.json({ sent: false, reason: "feature disabled" })
    }

    if (
      !settings.enabled ||
      settings.recipients.length === 0 ||
      !settings.fromUser ||
      !settings.fromDomain
    ) {
      return NextResponse.json({ sent: false, reason: "alerts disabled or misconfigured" })
    }

    const subsQuery: Record<string, unknown> = { isActive: true }
    if (settingsDoc.userId) subsQuery.userId = settingsDoc.userId

    const subs = await db.collection("subscriptions").find(subsQuery).toArray()

    const upcoming: AlertSubscription[] = []
    for (const sub of subs) {
      if (!sub.nextPaymentDate) continue
      const days = daysUntil(sub.nextPaymentDate as Date)
      if (days >= 0 && days <= settings.daysBefore) {
        upcoming.push({
          name: sub.name as string,
          price: sub.price as number,
          billingCycle: sub.billingCycle as string,
          nextPaymentDate: sub.nextPaymentDate as Date,
          daysUntil: days,
          imageUrl: sub.imageUrl as string | undefined,
        })
      }
    }

    if (upcoming.length === 0) {
      return NextResponse.json({ sent: false, reason: "no upcoming payments" })
    }

    const result = await sendPaymentAlertEmail(upcoming, settings)

    if (!result.success) {
      console.error("[cron/payment-alerts] send failed:", result.error)
      return NextResponse.json({ sent: false, reason: result.error }, { status: 500 })
    }

    console.log(`[cron/payment-alerts] sent ${upcoming.length} alert(s)`)
    return NextResponse.json({ sent: true, count: upcoming.length })
  } catch (err) {
    console.error("[cron/payment-alerts] error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
