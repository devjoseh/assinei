"use client"

import { Subscription } from "@/types"
import { formatCurrency, normalizeToMonthly, getDaysUntil, getUrgencyBg, getInitials, parseDate } from "@/lib/utils"
import { BILLING_CYCLE_LABELS, CATEGORY_COLORS } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface SubscriptionCardProps {
  subscription: Subscription
  viewMode?: "grid" | "list"
  onEdit: (sub: Subscription) => void
  onDelete: (sub: Subscription) => void
  onToggleActive: (id: string, isActive: boolean) => void
  onPayment: (sub: Subscription) => void
  onHistory: (sub: Subscription) => void
  onDetail: (sub: Subscription) => void
}

function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null
  const visible = tags.slice(0, 3)
  const hidden = tags.slice(3)
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {visible.map((tag) => (
        <span
          key={tag}
          className="text-[10px] px-1.5 leading-5 rounded-md border border-border text-muted-foreground"
        >
          {tag}
        </span>
      ))}
      {hidden.length > 0 && (
        <span
          className="text-[10px] px-1.5 leading-5 rounded-md border border-border text-muted-foreground cursor-default"
          title={hidden.join(", ")}
        >
          +{hidden.length}
        </span>
      )}
    </div>
  )
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
  onPayment,
  onHistory,
  onDetail,
}: SubscriptionCardProps) {
  const monthlyPrice = normalizeToMonthly(sub.price, sub.billingCycle)
  const daysUntil = getDaysUntil(sub.nextPaymentDate)
  const urgencyClass = getUrgencyBg(daysUntil)
  const categoryColor = CATEGORY_COLORS[sub.category] || "#8C8C8C"
  const formattedDate = format(parseDate(sub.nextPaymentDate), "d 'de' MMM. yyyy", { locale: ptBR })

  const urgencyPill = (
    <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full shrink-0", urgencyClass)}>
      {daysUntil === 0 ? "hoje" : daysUntil < 0 ? "vencido" : `${daysUntil}d`}
    </span>
  )

  /* ── LIST VIEW ── */
  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "group border border-border shadow-sm transition-all hover:shadow-md cursor-pointer",
          !sub.isActive && "opacity-50"
        )}
        onClick={() => onDetail(sub)}
      >
        <CardContent className="px-3 py-2.5 flex items-center gap-3">
          <Logo sub={sub} size="sm" />

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
            <TagChips tags={sub.tags} />
          </div>

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

          {urgencyPill}

          <div
            className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
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
        </CardContent>
      </Card>
    )
  }

  /* ── GRID VIEW ── */
  return (
    <Card
      className={cn(
        "group border border-border shadow-sm transition-all hover:shadow-md overflow-hidden cursor-pointer",
        !sub.isActive && "opacity-50"
      )}
      onClick={() => onDetail(sub)}
    >
      <CardContent className="p-3">
        {/* Top: logo + name + edit/delete */}
        <div className="flex items-start gap-3">
          <Logo sub={sub} />
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-semibold text-sm text-foreground truncate leading-tight">{sub.name}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{sub.category}</p>
            <TagChips tags={sub.tags} />
          </div>
          <div
            className="flex flex-col gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div className="mt-2">
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
        <div className="mt-2 space-y-1">
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
      </CardContent>
    </Card>
  )
}
