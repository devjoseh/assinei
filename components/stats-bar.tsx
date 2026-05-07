"use client"

import { useState, useEffect } from "react"
import { Stats, Currency } from "@/types"
import { formatCurrency, getUrgencyBg, parseDate } from "@/lib/utils"
import { CURRENCY_SYMBOLS } from "@/lib/constants"
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

function useExchangeRates(hasForeignCurrency: boolean) {
  const [rates, setRates] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    if (!hasForeignCurrency) return
    fetch("/api/exchange-rates")
      .then((r) => r.json())
      .then((data) => { if (data.rates) setRates(data.rates) })
      .catch(() => {})
  }, [hasForeignCurrency])

  return rates
}

function convertToBRL(amount: number, currency: string, rates: Record<string, number> | null): number {
  if (currency === "BRL" || !rates) return amount
  const rate = rates[currency]
  if (!rate) return 0
  return amount * rate
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  const currencies = stats?.totals?.map((t) => t.currency) ?? []
  const hasMultiCurrency = currencies.length > 1
  const hasForeign = currencies.some((c) => c !== "BRL")
  const rates = useExchangeRates(hasForeign)

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

  // Aggregate across all currencies
  const totalActive = stats.totals.reduce((sum, t) => sum + t.totalActive, 0)

  // Convert all currencies to BRL for aggregate totals
  const brlTotalMonthly = stats.totals.reduce(
    (sum, t) => sum + convertToBRL(t.totalMonthly, t.currency, rates),
    0
  )
  const brlTotalAnnual = stats.totals.reduce(
    (sum, t) => sum + convertToBRL(t.totalAnnual, t.currency, rates),
    0
  )
  const brlTotalSemiannual = stats.totals.reduce(
    (sum, t) => sum + convertToBRL(t.totalSemiannual, t.currency, rates),
    0
  )

  // Most expensive by monthly price across all currencies
  const mostExpensive = stats.totals.reduce<{
    name: string
    price: number
    billingCycle: string
    currency: string
  } | null>((best, t) => {
    if (!t.mostExpensive) return best
    if (!best) return { ...t.mostExpensive, currency: t.currency }
    const tMonthly = convertToBRL(t.mostExpensive.price, t.currency, rates)
    const bestMonthly = convertToBRL(best.price, best.currency, rates)
    return tMonthly > bestMonthly ? { ...t.mostExpensive, currency: t.currency } : best
  }, null)

  // --- Gasto mensal card: single vs multi currency ---
  const monthlyContent = hasMultiCurrency ? (
    <div className="space-y-0.5">
      {stats.totals.map((t) => (
        <div key={t.currency} className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold whitespace-nowrap">
            {formatCurrency(Math.round(t.totalMonthly), t.currency as Currency)}
          </span>
          {t.currency !== "BRL" && rates?.[t.currency] && (
            <span className="text-[11px] text-muted-foreground">
              ≈ {formatCurrency(Math.round(convertToBRL(t.totalMonthly, t.currency, rates)))}
            </span>
          )}
        </div>
      ))}
      {hasForeign && rates && (
        <div className="pt-1 mt-1 border-t border-border flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">Total em BRL</span>
          <span className="text-xs font-semibold">{formatCurrency(Math.round(brlTotalMonthly))}</span>
        </div>
      )}
    </div>
  ) : (
    <>
      <div className="font-semibold text-sm md:text-base text-foreground truncate leading-tight">
        {formatCurrency(Math.round(stats.totals[0]?.totalMonthly ?? 0))}
      </div>
      <div className="text-xs mt-0.5 text-muted-foreground">por mês</div>
    </>
  )

  const items = [
    {
      icon: TrendingUp,
      label: "Gasto mensal",
      content: monthlyContent,
      fullWidth: hasMultiCurrency,
    },
    {
      icon: Calendar,
      label: "Próximo",
      content: (
        <>
          <div className="font-semibold text-sm md:text-base text-foreground truncate leading-tight">
            {stats.nextPayment ? stats.nextPayment.name : "—"}
          </div>
          <div
            className={cn(
              "text-xs mt-0.5 truncate",
              stats.nextPayment
                ? getUrgencyBg(stats.nextPayment.daysUntil).split(" ").slice(1).join(" ")
                : "text-muted-foreground"
            )}
          >
            {stats.nextPayment
              ? `${nextDate} · ${stats.nextPayment.daysUntil === 0 ? "hoje" : `${stats.nextPayment.daysUntil}d`}`
              : "Nenhum"}
          </div>
        </>
      ),
    },
    {
      icon: CalendarDays,
      label: "Anual",
      content: (
        <>
          <div className="font-semibold text-sm md:text-base text-foreground truncate leading-tight">
            {formatCurrency(Math.round(brlTotalAnnual))}
          </div>
          <div className="text-xs mt-0.5 text-muted-foreground">por ano</div>
        </>
      ),
    },
    {
      icon: CalendarDays,
      label: "Semestral",
      content: (
        <>
          <div className="font-semibold text-sm md:text-base text-foreground truncate leading-tight">
            {formatCurrency(Math.round(brlTotalSemiannual))}
          </div>
          <div className="text-xs mt-0.5 text-muted-foreground">por semestre</div>
        </>
      ),
    },
    {
      icon: Trophy,
      label: "Mais cara",
      content: (
        <>
          <div className="font-semibold text-sm md:text-base text-foreground truncate leading-tight">
            {mostExpensive ? mostExpensive.name : "—"}
          </div>
          <div className="text-xs mt-0.5 text-muted-foreground truncate">
            {mostExpensive
              ? `${formatCurrency(mostExpensive.price, mostExpensive.currency as Currency)}${mostExpensive.currency !== "BRL" ? ` (${mostExpensive.currency})` : ""}`
              : "—"}
          </div>
        </>
      ),
    },
    {
      icon: Hash,
      label: "Ativas",
      content: (
        <>
          <div className="font-semibold text-sm md:text-base text-foreground truncate leading-tight">
            {totalActive.toString()}
          </div>
          <div className="text-xs mt-0.5 text-muted-foreground">
            {totalActive === 1 ? "assinatura" : "assinaturas"}
          </div>
        </>
      ),
    },
  ]

  if (hasMultiCurrency) {
    // Single card spanning full width for multi-currency monthly breakdown,
    // then 5 regular cards in the same row on XL
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Gasto mensal takes 1 col on mobile/tablet, 1 on XL too but with richer content */}
        <Card className="border border-border shadow-sm xl:col-span-2">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
              <TrendingUp className="h-3 w-3 shrink-0" />
              <span className="text-[11px] font-medium uppercase tracking-wide leading-none">
                Gasto mensal
              </span>
            </div>
            {monthlyContent}
          </CardContent>
        </Card>

        {items.slice(1).map((item, i) => (
          <Card key={i} className="border border-border shadow-sm">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1.5">
                <item.icon className="h-3 w-3 shrink-0" />
                <span className="text-[11px] font-medium uppercase tracking-wide leading-none">
                  {item.label}
                </span>
              </div>
              {item.content}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

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
            {item.content}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
