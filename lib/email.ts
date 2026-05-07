'server-only'

import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export type AlertSubscription = {
  name: string
  price: number        // centavos
  billingCycle: string
  nextPaymentDate: Date
  daysUntil: number
  imageUrl?: string
}

export type AlertSettings = {
  featureEnabled: boolean
  enabled: boolean
  daysBefore: number
  recipients: string[]
  fromName: string
  fromUser: string
  fromDomain: string
}

const CYCLE_LABELS: Record<string, string> = {
  weekly: "semanal",
  monthly: "mensal",
  quarterly: "trimestral",
  semiannual: "semestral",
  annual: "anual",
}

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100)
}

function urgencyBadge(daysUntil: number): string {
  const bg = daysUntil <= 1 ? "#DC2626" : daysUntil <= 3 ? "#D97706" : "#16A34A"
  const text = daysUntil === 0 ? "Vence hoje" : daysUntil === 1 ? "Vence amanhã" : `Vence em ${daysUntil} dias`
  return `<span style="display:inline-block;background:${bg};color:#ffffff;font-size:12px;font-weight:600;padding:3px 10px;border-radius:999px;">${text}</span>`
}

function buildEmailHtml(subscriptions: AlertSubscription[], daysBefore: number): string {
  const items = subscriptions
    .map((sub) => {
      const dateStr = format(sub.nextPaymentDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
      const cycle = CYCLE_LABELS[sub.billingCycle] || sub.billingCycle
      return `
        <tr>
          <td style="padding:0 0 16px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E2E0DA;border-radius:12px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 4px 0;font-size:18px;font-weight:700;color:#1A1A1A;">${sub.name}</p>
                  <p style="margin:0 0 4px 0;font-size:14px;color:#6B7280;">${formatBRL(sub.price)} · ${cycle}</p>
                  <p style="margin:0 0 12px 0;font-size:14px;color:#6B7280;">Vencimento: ${dateStr}</p>
                  ${urgencyBadge(sub.daysUntil)}
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    })
    .join("")

  const intro =
    subscriptions.length === 1
      ? `Você tem <strong>1 assinatura</strong> vencendo nos próximos <strong>${daysBefore} dias</strong>:`
      : `Você tem <strong>${subscriptions.length} assinaturas</strong> vencendo nos próximos <strong>${daysBefore} dias</strong>:`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Assinei</title></head>
<body style="margin:0;padding:0;background:#F5F4F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F4F0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding:0 0 24px 0;">
              <p style="margin:0;font-size:24px;font-weight:700;color:#E8770A;">Assinei</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 20px 0;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">
                Bom dia,<br><br>${intro}
              </p>
            </td>
          </tr>
          ${items}
          <tr>
            <td style="padding:24px 0 0 0;border-top:1px solid #E2E0DA;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;text-align:center;">
                Enviado pelo Assinei · Suas assinaturas, sob controle.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function callcallResend(
  settings: AlertSettings,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { success: false, error: "RESEND_API_KEY não configurada" }

  const from = `${settings.fromUser}@${settings.fromDomain}`

  const { data, error } = await resend.emails.send({
    from,
    to: settings.recipients,
    subject,
    html,
  });

  if (error) {
    return { success: false, error: `callResend ${error}` }
  }

  return { success: true }
}

export async function sendPaymentAlertEmail(
  subscriptions: AlertSubscription[],
  settings: AlertSettings
): Promise<{ success: boolean; error?: string }> {
  const n = subscriptions.length
  const subject = `Assinei — ${n} vencimento${n !== 1 ? "s" : ""} nos próximos ${settings.daysBefore} dias`
  return callcallResend(settings, subject, buildEmailHtml(subscriptions, settings.daysBefore))
}

export async function sendTestEmail(
  settings: AlertSettings
): Promise<{ success: boolean; error?: string }> {
  const testSub: AlertSubscription = {
    name: "Netflix",
    price: 4490,
    billingCycle: "monthly",
    nextPaymentDate: addDays(new Date(), 2),
    daysUntil: 2,
  }
  return callcallResend(settings, "Assinei — email de teste", buildEmailHtml([testSub], settings.daysBefore))
}
