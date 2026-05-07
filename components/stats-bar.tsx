"use client"

import { Stats } from "@/types"
import { formatCurrency, getUrgencyBg, parseDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Calendar, CalendarDays, Trophy, Hash } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface StatsBarProps {
  stats: Stats | null
  loading: boolean
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-3 md:p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const nextDate = stats.nextPayment
    ? format(parseDate(stats.nextPayment.date), "d MMM", { locale: ptBR })
    : null

  const items = [
    {
      icon: TrendingUp,
      label: "Gasto mensal",
      value: formatCurrency(Math.round(stats.totalMonthly)),
      sub: "por mês",
    },
    {
      icon: Calendar,
      label: "Próximo",
      value: stats.nextPayment ? stats.nextPayment.name : "—",
      sub: stats.nextPayment
        ? `${nextDate} · ${stats.nextPayment.daysUntil === 0 ? "hoje" : `${stats.nextPayment.daysUntil}d`}`
        : "Nenhum",
      urgency: stats.nextPayment?.daysUntil,
    },
    {
      icon: CalendarDays,
      label: "Anual",
      value: formatCurrency(Math.round(stats.totalAnnual)),
      sub: "por ano",
    },
    {
      icon: CalendarDays,
      label: "Semestral",
      value: formatCurrency(Math.round(stats.totalSemiannual)),
      sub: "por semestre",
    },
    {
      icon: Trophy,
      label: "Mais cara",
      value: stats.mostExpensive ? stats.mostExpensive.name : "—",
      sub: stats.mostExpensive ? formatCurrency(stats.mostExpensive.price) : "—",
    },
    {
      icon: Hash,
      label: "Ativas",
      value: stats.totalActive.toString(),
      sub: stats.totalActive === 1 ? "assinatura" : "assinaturas",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {items.map((item, i) => (
        <Card key={i} className="border border-border shadow-sm">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              <item.icon className="h-3 w-3 shrink-0" />
              <span className="text-[11px] font-medium uppercase tracking-wide leading-none">
                {item.label}
              </span>
            </div>
            <div className="font-semibold text-sm md:text-base text-foreground truncate leading-tight" title={item.value}>
              {item.value}
            </div>
            {item.sub && (
              <div
                className={cn(
                  "text-xs mt-0.5 truncate",
                  item.urgency !== undefined
                    ? getUrgencyBg(item.urgency).split(" ").slice(1).join(" ")
                    : "text-muted-foreground"
                )}
              >
                {item.sub}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
