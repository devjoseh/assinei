"use client"

import { useState } from "react"
import { Subscription } from "@/types"
import {
  formatCurrency,
  normalizeToMonthly,
  getDaysUntil,
  getUrgencyBg,
  getInitials,
  parseDate,
} from "@/lib/utils"
import { BILLING_CYCLE_LABELS } from "@/lib/constants"
import { useCategories } from "@/components/categories-provider"
import type { Currency } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Copy, Power, CircleDollarSign, Clock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface SubscriptionDetailModalProps {
  subscription: Subscription | null
  onClose: () => void
  onEdit: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
  onPayment: (sub: Subscription) => void
  onHistory: (sub: Subscription) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

function Logo({ sub }: { sub: Subscription }) {
  const [imgError, setImgError] = useState(false)
  const { getColor } = useCategories()
  const categoryColor = getColor(sub.category)

  if (sub.imageUrl && !imgError) {
    return (
      <img
        src={sub.imageUrl}
        alt={sub.name}
        className="w-14 h-14 rounded-xl object-contain bg-white border border-border shrink-0"
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div
      className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
      style={{ backgroundColor: sub.color || categoryColor }}
    >
      {getInitials(sub.name)}
    </div>
  )
}

export function SubscriptionDetailModal({
  subscription,
  onClose,
  onEdit,
  onDelete,
  onPayment,
  onHistory,
  onToggleActive,
}: SubscriptionDetailModalProps) {
  return (
    <Dialog open={!!subscription} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[95dvh] overflow-y-auto">
        {subscription && (
          <ModalContent
            sub={subscription}
            onClose={onClose}
            onEdit={onEdit}
            onDelete={onDelete}
            onPayment={onPayment}
            onHistory={onHistory}
            onToggleActive={onToggleActive}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ModalContent({
  sub,
  onClose,
  onEdit,
  onDelete,
  onPayment,
  onHistory,
  onToggleActive,
}: {
  sub: Subscription
  onClose: () => void
  onEdit: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
  onPayment: (sub: Subscription) => void
  onHistory: (sub: Subscription) => void
  onToggleActive: (id: string, isActive: boolean) => void
}) {
  const monthlyPrice = normalizeToMonthly(sub.price, sub.billingCycle)
  const daysUntil = getDaysUntil(sub.nextPaymentDate)
  const urgencyClass = getUrgencyBg(daysUntil)
  const { getColor } = useCategories()
  const categoryColor = getColor(sub.category)
  const currency = (sub.currency || "BRL") as Currency
  const formattedDate = format(parseDate(sub.nextPaymentDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const cycleDiffers = sub.price !== Math.round(monthlyPrice)

  function handleCopy() {
    navigator.clipboard.writeText(
      `${sub.name} — ${formatCurrency(sub.price, currency)} (${BILLING_CYCLE_LABELS[sub.billingCycle]})`
    )
    toast.success("Copiado!")
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-4 pr-6">
          <Logo sub={sub} />
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base leading-snug">{sub.name}</DialogTitle>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge
                variant="secondary"
                className="text-xs px-2"
                style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
              >
                {sub.category}
              </Badge>
              {!sub.isActive && (
                <Badge variant="secondary" className="text-xs px-2 text-muted-foreground">
                  Pausada
                </Badge>
              )}
            </div>
            {sub.tags && sub.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sub.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-1.5 py-0.5 rounded-md border border-border text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        {/* Price + next payment */}
        <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Valor</p>
            <p className="font-bold text-xl leading-none">{formatCurrency(sub.price, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {BILLING_CYCLE_LABELS[sub.billingCycle].toLowerCase()}
              {cycleDiffers && ` · ${formatCurrency(Math.round(monthlyPrice), currency)}/mês`}
              {currency !== "BRL" && (
                <span className="ml-1 text-[10px] font-medium px-1 py-0.5 rounded bg-muted uppercase">{currency}</span>
              )}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground mb-0.5">Próximo pagamento</p>
            <p className="text-sm font-medium">{formattedDate}</p>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1", urgencyClass)}>
              {daysUntil === 0 ? "Hoje" : daysUntil < 0 ? "Vencido" : `Em ${daysUntil} dia${daysUntil !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* Description */}
        {sub.description && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Descrição</p>
            <p className="text-sm text-foreground">{sub.description}</p>
          </div>
        )}

        {/* Notes */}
        {sub.notes && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Notas</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{sub.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { onEdit(sub); onClose() }}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { onHistory(sub); onClose() }}
          >
            <Clock className="h-3.5 w-3.5" />
            Histórico
          </Button>
          {sub.isActive && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-green-600 hover:text-green-600"
              onClick={() => { onPayment(sub); onClose() }}
            >
              <CircleDollarSign className="h-3.5 w-3.5" />
              Pagamento
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleCopy}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { onToggleActive(sub._id, !sub.isActive); onClose() }}
          >
            <Power className={cn("h-3.5 w-3.5", sub.isActive ? "text-amber-500" : "text-green-500")} />
            {sub.isActive ? "Pausar" : "Ativar"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive sm:ml-auto"
            onClick={() => { onDelete(sub); onClose() }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
      </div>
    </>
  )
}
