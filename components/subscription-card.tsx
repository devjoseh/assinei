"use client"

import { Subscription } from "@/types"
import { formatCurrency, normalizeToMonthly, getDaysUntil, getUrgencyBg, getInitials, parseDate } from "@/lib/utils"
import { BILLING_CYCLE_LABELS, CATEGORY_COLORS } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Trash2, Copy, Power } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface SubscriptionCardProps {
  subscription: Subscription
  viewMode?: "grid" | "list"
  onEdit: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

function Logo({ sub, size = "md" }: { sub: Subscription; size?: "sm" | "md" }) {
  const [imgError, setImgError] = useState(false)
  const categoryColor = CATEGORY_COLORS[sub.category] || "#8C8C8C"
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"

  if (sub.imageUrl && !imgError) {
    return (
      <img
        src={sub.imageUrl}
        alt={sub.name}
        className={cn(dim, "rounded-xl object-contain bg-white border border-border shrink-0")}
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div
      className={cn(dim, "rounded-xl flex items-center justify-center text-white font-bold shrink-0")}
      style={{ backgroundColor: sub.color || categoryColor }}
    >
      {getInitials(sub.name)}
    </div>
  )
}

export function SubscriptionCard({
  subscription: sub,
  viewMode = "grid",
  onEdit,
  onDelete,
  onToggleActive,
}: SubscriptionCardProps) {
  const monthlyPrice = normalizeToMonthly(sub.price, sub.billingCycle)
  const daysUntil = getDaysUntil(sub.nextPaymentDate)
  const urgencyClass = getUrgencyBg(daysUntil)
  const categoryColor = CATEGORY_COLORS[sub.category] || "#8C8C8C"
  const formattedDate = format(parseDate(sub.nextPaymentDate), "d 'de' MMM. yyyy", { locale: ptBR })

  function handleCopy() {
    navigator.clipboard.writeText(
      `${sub.name} — ${formatCurrency(sub.price)} (${BILLING_CYCLE_LABELS[sub.billingCycle]})`
    )
    toast.success("Copiado!")
  }

  const urgencyPill = (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", urgencyClass)}>
      {daysUntil === 0 ? "hoje" : daysUntil < 0 ? "vencido" : `${daysUntil}d`}
    </span>
  )

  const actionButtons = (
    <div className="flex items-center gap-0.5 shrink-0">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy} title="Copiar">
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onToggleActive(sub._id, !sub.isActive)}
        title={sub.isActive ? "Pausar" : "Ativar"}
      >
        <Power className={cn("h-3.5 w-3.5", sub.isActive ? "text-green-500" : "text-muted-foreground")} />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(sub)} title="Editar">
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => onDelete(sub)}
        title="Excluir"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )

  /* ── LIST VIEW ── */
  if (viewMode === "list") {
    return (
      <Card className={cn("group border border-border shadow-sm transition-all hover:shadow-md", !sub.isActive && "opacity-50")}>
        <CardContent className="px-3 py-2.5 flex items-center gap-3">
          <Logo sub={sub} size="sm" />

          {/* Name + date */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{sub.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 shrink-0"
                style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
              >
                {sub.category}
              </Badge>
              <span className="text-[11px] text-muted-foreground truncate">{formattedDate}</span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            <p className="font-semibold text-sm whitespace-nowrap">
              {formatCurrency(Math.round(monthlyPrice))}
              <span className="text-xs font-normal text-muted-foreground">/mês</span>
            </p>
            {sub.price !== Math.round(monthlyPrice) && (
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                {formatCurrency(sub.price)}
              </p>
            )}
          </div>

          {/* Urgency */}
          {urgencyPill}

          {/* Actions — desktop only (hidden on mobile to prevent layout breakage) */}
          <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {actionButtons}
          </div>
        </CardContent>
      </Card>
    )
  }

  /* ── GRID VIEW ── */
  return (
    <Card
      className={cn(
        "group border border-border shadow-sm transition-all hover:shadow-md overflow-hidden",
        !sub.isActive && "opacity-50"
      )}
    >
      <CardContent className="p-4">
        {/* Top: logo + name + actions */}
        <div className="flex items-start gap-3">
          <Logo sub={sub} />
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-semibold text-sm text-foreground truncate leading-tight">{sub.name}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{sub.category}</p>
          </div>
          {/* Actions: always visible on mobile, hover on desktop */}
          <div className="flex flex-col gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(sub)} title="Editar">
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => onDelete(sub)}
              title="Excluir"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Price */}
        <div className="mt-3">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-base text-foreground">{formatCurrency(Math.round(monthlyPrice))}</span>
            <span className="text-xs text-muted-foreground">/ mês</span>
          </div>
          {sub.price !== Math.round(monthlyPrice) && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {formatCurrency(sub.price)} · {BILLING_CYCLE_LABELS[sub.billingCycle].toLowerCase()}
            </p>
          )}
        </div>

        {/* Footer: category + days + date */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0.5 h-5 shrink-0"
              style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
            >
              {sub.category}
            </Badge>
            {urgencyPill}
          </div>
          <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
        </div>

        {/* Extra actions row: copy + toggle (subtler) */}
        <div className="mt-2 flex gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title="Copiar">
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onToggleActive(sub._id, !sub.isActive)}
            title={sub.isActive ? "Pausar" : "Ativar"}
          >
            <Power className={cn("h-3 w-3", sub.isActive ? "text-green-500" : "text-muted-foreground")} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
