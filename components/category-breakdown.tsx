"use client"

import { Stats } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { CURRENCY_SYMBOLS } from "@/lib/constants"
import type { Currency } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface CategoryBreakdownProps {
  stats: Stats | null
  loading: boolean
}

export function CategoryBreakdown({ stats, loading }: CategoryBreakdownProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("breakdown-collapsed") === "true"
  })

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("breakdown-collapsed", String(next))
      return next
    })
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3 w-48 mt-1" />
          </div>
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
        <Skeleton className="h-[180px] rounded-xl" />
      </div>
    )
  }

  if (!stats?.categoryBreakdown.length || stats.categoryBreakdown.length < 2) return null

  const breakdown = [...stats.categoryBreakdown].sort((a, b) => b.total - a.total)

  // Compute total per currency for percentage bars
  const totalByCurrency = new Map<string, number>()
  for (const entry of breakdown) {
    totalByCurrency.set(entry.currency, (totalByCurrency.get(entry.currency) ?? 0) + entry.total)
  }

  // Overall max for visual reference
  const grandTotal = Array.from(totalByCurrency.values()).reduce((sum, v) => sum + v, 0)
  const maxTotal = Math.max(...Array.from(totalByCurrency.values()), 0)

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Gastos por Categoria</h2>
          <p className="text-xs text-muted-foreground">Valores mensais normalizados</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 -mt-0.5" onClick={toggle}>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          {breakdown.map((entry) => {
            const currencyTotal = totalByCurrency.get(entry.currency) ?? entry.total
            const pct = currencyTotal > 0 ? Math.round((entry.total / currencyTotal) * 100) : 0
            const barWidth = maxTotal > 0 ? Math.round((entry.total / maxTotal) * 100) : 0
            const currency = (entry.currency || "BRL") as Currency

            return (
              <div key={`${entry.category}|||${entry.currency}`} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.icon && <span className="text-sm shrink-0">{entry.icon}</span>}
                    <span className="font-medium text-foreground truncate">{entry.category}</span>
                    {currency !== "BRL" && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase shrink-0">
                        {currency}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm tabular-nums">{formatCurrency(entry.total, currency)}</span>
                    <span className="text-xs text-muted-foreground w-9 text-right tabular-nums">{pct}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0 w-20 text-right">
                    {entry.count} assinatura{entry.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Totals footer */}
          <div className="pt-3 border-t border-border space-y-1">
            {Array.from(totalByCurrency.entries())
              .sort(([, a], [, b]) => b - a)
              .map(([cur, total]) => (
                <div key={cur} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total {cur !== "BRL" ? `${CURRENCY_SYMBOLS[cur as Currency] ?? cur} ` : ""}
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">
                    {formatCurrency(total, cur as Currency)}
                    <span className="text-xs font-normal text-muted-foreground"> /mês</span>
                  </span>
                </div>
              ))}
            {totalByCurrency.size > 1 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                <span>{breakdown.length} linhas em {totalByCurrency.size} moedas</span>
                <span>{grandTotal > 0 ? formatCurrency(grandTotal) : "—"}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
