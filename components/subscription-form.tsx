"use client"

import { useState, useEffect, useRef } from "react"
import { Subscription } from "@/types"
import { CATEGORIES, BILLING_CYCLES, DEFAULT_COLORS } from "@/lib/constants"
import { subscriptionSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageHistoryPicker } from "@/components/image-history-picker"
import { TagInput } from "@/components/tag-input"
import { Loader2, Pipette } from "lucide-react"
import { format } from "date-fns"
import { cn, parseDate } from "@/lib/utils"

interface SubscriptionFormProps {
  open: boolean
  subscription?: Subscription | null
  onClose: () => void
  onSave: (data: Partial<Subscription>) => Promise<void>
}

const EMPTY_FORM = {
  name: "",
  description: "",
  priceStr: "",
  billingCycle: "monthly" as Subscription["billingCycle"],
  nextPaymentDate: format(new Date(), "yyyy-MM-dd"),
  category: "",
  imageUrl: "",
  color: DEFAULT_COLORS[0],
  notes: "",
  tags: [] as string[],
}

export function SubscriptionForm({ open, subscription, onClose, onSave }: SubscriptionFormProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const colorInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (subscription) {
      const dateStr = subscription.nextPaymentDate
        ? format(parseDate(subscription.nextPaymentDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd")
      setForm({
        name: subscription.name || "",
        description: subscription.description || "",
        priceStr: (subscription.price / 100).toFixed(2),
        billingCycle: subscription.billingCycle || "monthly",
        nextPaymentDate: dateStr,
        category: subscription.category || "",
        imageUrl: subscription.imageUrl || "",
        color: subscription.color || DEFAULT_COLORS[0],
        notes: subscription.notes || "",
        tags: subscription.tags || [],
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [subscription, open])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const priceInCents = Math.round(parseFloat(form.priceStr.replace(",", ".")) * 100)
    const payload = {
      name: form.name,
      description: form.description,
      price: isNaN(priceInCents) ? 0 : priceInCents,
      billingCycle: form.billingCycle,
      nextPaymentDate: form.nextPaymentDate,
      category: form.category,
      imageUrl: form.imageUrl || undefined,
      color: form.color,
      notes: form.notes,
      tags: form.tags,
      isActive: subscription?.isActive ?? true,
    }

    const parsed = subscriptionSchema.safeParse(payload)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const [field, messages] of Object.entries(parsed.error.flatten().fieldErrors)) {
        fieldErrors[field] = messages?.[0] || "Inválido"
      }
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      await onSave(payload)
      const originalImageUrl = subscription?.imageUrl || ""
      if (form.imageUrl && form.imageUrl !== originalImageUrl) {
        fetch("/api/image-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: form.imageUrl, label: form.name }),
        }).catch(() => {})
      }
      onClose()
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : "Erro ao salvar" })
    } finally {
      setLoading(false)
    }
  }

  const isCustomColor = !DEFAULT_COLORS.includes(form.color)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="flex flex-col gap-0 p-0"
        style={{ width: "100%", maxWidth: "28rem", maxHeight: "100dvh" }}
      >
        {/* Header — fixed */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold">
            {subscription ? "Editar assinatura" : "Nova assinatura"}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {subscription
              ? "Atualize os dados da assinatura."
              : "Preencha os dados da nova assinatura."}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable body */}
        <form
          id="sub-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
        >
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ex: Netflix"
              autoFocus
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Preço + Ciclo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-sm font-medium">
                Preço (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={form.priceStr}
                onChange={(e) => set("priceStr", e.target.value)}
                placeholder="0,00"
              />
              {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Ciclo <span className="text-destructive">*</span>
              </Label>
              <Select value={form.billingCycle} onValueChange={(v) => v && set("billingCycle", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {BILLING_CYCLES.find((c) => c.value === form.billingCycle)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nextPaymentDate" className="text-sm font-medium">
                Próximo pagamento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nextPaymentDate"
                type="date"
                value={form.nextPaymentDate}
                onChange={(e) => set("nextPaymentDate", e.target.value)}
                className="[color-scheme:light] dark:[color-scheme:dark]"
              />
              {errors.nextPaymentDate && (
                <p className="text-xs text-destructive mt-1">{errors.nextPaymentDate}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Categoria <span className="text-destructive">*</span>
              </Label>
              <Select value={form.category} onValueChange={(v) => v && set("category", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {form.category || <span className="text-muted-foreground">Selecionar...</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* Imagem */}
          <ImageHistoryPicker value={form.imageUrl} onChange={(v) => set("imageUrl", v)} />

          {/* Cor do avatar */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cor do avatar</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color", c)}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all shrink-0",
                    form.color === c
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-110 opacity-80 hover:opacity-100"
                  )}
                  style={{
                    backgroundColor: c,
                    ...(form.color === c ? { ringColor: c } : {}),
                  }}
                  aria-label={c}
                />
              ))}

              {/* Custom color picker button */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => colorInputRef.current?.click()}
                  className={cn(
                    "w-7 h-7 rounded-full transition-all flex items-center justify-center border-2 border-dashed",
                    isCustomColor
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110 border-transparent"
                      : "border-muted-foreground/40 hover:border-muted-foreground hover:scale-110"
                  )}
                  style={isCustomColor ? { backgroundColor: form.color } : {}}
                  title="Cor personalizada"
                >
                  {!isCustomColor && <Pipette className="h-3 w-3 text-muted-foreground" />}
                </button>
                <input
                  ref={colorInputRef}
                  type="color"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="sr-only"
                  tabIndex={-1}
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Opcional"
            />
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas
            </Label>
            <textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Observações..."
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none transition-colors"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Tags{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <TagInput
              value={form.tags}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
          </div>

          {errors.submit && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
              {errors.submit}
            </p>
          )}
        </form>

        {/* Footer — fixed at bottom */}
        <div className="shrink-0 px-5 py-4 border-t border-border bg-background flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" form="sub-form" disabled={loading} className="flex-1">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
