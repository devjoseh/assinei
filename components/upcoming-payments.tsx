"use client"

import { Stats } from "@/types"
import { formatCurrency, getUrgencyBg, parseDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarClock } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface UpcomingPaymentsProps {
  stats: Stats | null
  loading: boolean
}

export function UpcomingPayments({ stats, loading }: UpcomingPaymentsProps) {
  if (loading) {
    return (
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!stats?.upcomingPayments.length) return null

  return (
    <Card className="border border-border shadow-sm" size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          Próximos pagamentos (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {stats.upcomingPayments.map((payment, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-1.5">
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{payment.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(parseDate(payment.date), "d 'de' MMM. 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-medium">{formatCurrency(payment.price)}</span>
                <Badge
                  variant="secondary"
                  className={cn("text-xs", getUrgencyBg(payment.daysUntil))}
                >
                  {payment.daysUntil === 0 ? "hoje" : `${payment.daysUntil}d`}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
