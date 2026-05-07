"use client"

import { useEffect, useRef, useState } from "react"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Minus, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AlertSettings = {
  featureEnabled: boolean
  enabled: boolean
  daysBefore: number
  recipients: string[]
  fromName: string
  fromUser: string
  fromDomain: string
}

const DEFAULTS: AlertSettings = {
  featureEnabled: false,
  enabled: true,
  daysBefore: 3,
  recipients: [],
  fromName: "Assinei",
  fromUser: "",
  fromDomain: "",
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </div>
  )
}

export function AlertSettingsForm() {
  const [settings, setSettings] = useState<AlertSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [emailInput, setEmailInput] = useState("")
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/settings/alerts")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          featureEnabled: data.featureEnabled ?? DEFAULTS.featureEnabled,
          enabled: data.enabled ?? DEFAULTS.enabled,
          daysBefore: data.daysBefore ?? DEFAULTS.daysBefore,
          recipients: data.recipients ?? DEFAULTS.recipients,
          fromName: data.fromName ?? DEFAULTS.fromName,
          fromUser: data.fromUser ?? DEFAULTS.fromUser,
          fromDomain: data.fromDomain ?? DEFAULTS.fromDomain,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof AlertSettings>(key: K, value: AlertSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: "" }))
  }

  function addRecipient(raw: string) {
    const email = raw.trim().toLowerCase()
    if (!email) return
    if (!isValidEmail(email)) {
      setErrors((prev) => ({ ...prev, emailInput: "Email inválido" }))
      return
    }
    if (settings.recipients.includes(email)) return
    if (settings.recipients.length >= 10) return
    set("recipients", [...settings.recipients, email])
    setEmailInput("")
    setErrors((prev) => ({ ...prev, emailInput: "", recipients: "" }))
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (val.includes(",")) {
      const [before, ...rest] = val.split(",")
      if (before.trim()) addRecipient(before)
      setEmailInput(rest.join(",").trimStart())
    } else {
      setEmailInput(val)
      setErrors((prev) => ({ ...prev, emailInput: "" }))
    }
  }

  function handleEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      if (emailInput.trim()) addRecipient(emailInput)
    } else if (e.key === "Backspace" && !emailInput && settings.recipients.length > 0) {
      set("recipients", settings.recipients.slice(0, -1))
    }
  }

  const exampleVencimento = addDays(new Date(), 30)
  const exampleAlert = addDays(exampleVencimento, -settings.daysBefore)
  const previewText = `Se uma assinatura vence em ${format(exampleVencimento, "dd/MM", { locale: ptBR })}, o email será enviado em ${format(exampleAlert, "dd/MM", { locale: ptBR })}.`

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (settings.enabled && settings.recipients.length === 0) {
      newErrors.recipients = "Adicione ao menos um destinatário antes de ativar os alertas."
    }
    if (settings.enabled && (!settings.fromUser || !settings.fromDomain)) {
      newErrors.fromSender = "Informe o endereço remetente completo."
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await fetch("/api/settings/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      toast.success("Configurações salvas!")
    } catch {
      toast.error("Erro ao salvar configurações.")
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true)
    try {
      const res = await fetch("/api/settings/alerts/test", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(`Email de teste enviado para ${data.recipientCount} destinatário(s)!`)
      } else {
        toast.error(data.error || "Erro ao enviar email de teste.")
      }
    } catch {
      toast.error("Erro ao enviar email de teste.")
    } finally {
      setTesting(false)
    }
  }

  const canTest = !!settings.fromUser && !!settings.fromDomain && settings.recipients.length > 0

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Feature toggle */}
      <Toggle
        checked={settings.featureEnabled}
        onChange={(v) => set("featureEnabled", v)}
        label="Ativar integração com Unosend"
      />

      {!settings.featureEnabled && (
        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
          A integração com Unosend está desativada. Configure e ative para começar a receber alertas por email.
        </p>
      )}

      {settings.featureEnabled && (
        <div className="space-y-6">
          {/* Alerts toggle */}
          <div className={cn("space-y-6", !settings.enabled && "opacity-60")}>
            <Toggle
              checked={settings.enabled}
              onChange={(v) => set("enabled", v)}
              label="Ativar alertas de vencimento por email"
            />

            {/* Days before */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Avisar com antecedência de</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => set("daysBefore", Math.max(1, settings.daysBefore - 1))}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={settings.daysBefore}
                  onChange={(e) => {
                    const v = parseInt(e.target.value)
                    if (!isNaN(v) && v >= 1 && v <= 30) set("daysBefore", v)
                  }}
                  className="w-16 text-center"
                  min={1}
                  max={30}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => set("daysBefore", Math.min(30, settings.daysBefore + 1))}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <span className="text-sm text-muted-foreground">dias antes do vencimento</span>
              </div>
              <p className="text-xs text-muted-foreground">{previewText}</p>
            </div>

            {/* Sender */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Remetente</Label>
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fromName" className="text-xs text-muted-foreground">
                    Nome do remetente
                  </Label>
                  <Input
                    id="fromName"
                    value={settings.fromName}
                    onChange={(e) => set("fromName", e.target.value.slice(0, 50))}
                    placeholder="Assinei"
                    maxLength={50}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Endereço remetente</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1">
                    <Input
                      value={settings.fromUser}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[@\s]/g, "").slice(0, 64)
                        set("fromUser", v)
                      }}
                      placeholder="no-reply"
                      className="sm:flex-1 min-w-0"
                    />
                    <span className="text-sm text-muted-foreground px-1 shrink-0 hidden sm:block">@</span>
                    <Input
                      value={settings.fromDomain}
                      onChange={(e) => set("fromDomain", e.target.value.slice(0, 253))}
                      placeholder="seudominio.com.br"
                      className="sm:flex-1 min-w-0"
                      title="Use um domínio já verificado na sua conta Unosend."
                    />
                  </div>
                </div>
                {(settings.fromName || settings.fromUser || settings.fromDomain) && (
                  <p className="text-xs text-muted-foreground">
                    De:{" "}
                    <span className="text-foreground font-medium">
                      {settings.fromName || "—"}{" "}
                      &lt;{settings.fromUser || "…"}@{settings.fromDomain || "…"}&gt;
                    </span>
                  </p>
                )}
                {errors.fromSender && (
                  <p className="text-xs text-destructive">{errors.fromSender}</p>
                )}
              </div>
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Destinatários</Label>
              <div
                className={cn(
                  "flex flex-wrap gap-1.5 min-h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-text",
                  "focus-within:ring-2 focus-within:ring-ring transition-shadow"
                )}
                onClick={() => emailRef.current?.focus()}
              >
                {settings.recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs font-medium shrink-0"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); set("recipients", settings.recipients.filter((r) => r !== email)) }}
                      className="text-muted-foreground hover:text-foreground leading-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {settings.recipients.length < 10 && (
                  <input
                    ref={emailRef}
                    value={emailInput}
                    onChange={handleEmailChange}
                    onKeyDown={handleEmailKeyDown}
                    placeholder={settings.recipients.length === 0 ? "email@exemplo.com" : ""}
                    className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground text-sm"
                  />
                )}
              </div>
              {errors.emailInput && (
                <p className="text-xs text-destructive">{errors.emailInput}</p>
              )}
              {errors.recipients && (
                <p className="text-xs text-destructive">{errors.recipients}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Todos esses endereços receberão o alerta quando uma assinatura estiver próxima do vencimento.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Salvando..." : "Salvar configurações"}
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || !canTest}
              className="flex-1"
              title={!canTest ? "Preencha o remetente e ao menos um destinatário" : undefined}
            >
              {testing ? "Enviando..." : "Enviar email de teste agora"}
            </Button>
          </div>
        </div>
      )}

      {/* Save when featureEnabled is off */}
      {!settings.featureEnabled && (
        <Button onClick={handleSave} disabled={saving} variant="outline" className="w-full">
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      )}
    </div>
  )
}
