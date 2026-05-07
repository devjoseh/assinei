"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { TooltipProps } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

type MonthData = {
  label: string
  year: number
  month: number
  total: number
}

const FULL_MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as MonthData
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-foreground">
        {FULL_MONTHS[d.month - 1]} {d.year}
      </p>
      <p className="text-muted-foreground mt-0.5">{formatCurrency(d.total)}</p>
    </div>
  )
}

export function MonthlyChart() {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("chart-collapsed") === "true"
  })

  useEffect(() => {
    fetch("/api/payments/summary")
      .then((r) => r.json())
      .then((json) => setData(json.months ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("chart-collapsed", String(next))
      return next
    })
  }

  const allZero = data.every((d) => d.total === 0)

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Evolução de Gastos</h2>
          <p className="text-xs text-muted-foreground">
            Últimos 6 meses · baseado em pagamentos registrados
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 -mt-0.5" onClick={toggle}>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed && (
        loading ? (
          <Skeleton className="h-[220px] rounded-xl" />
        ) : allZero ? (
          <div className="flex items-center justify-center h-[220px] rounded-xl border border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">Nenhum pagamento registrado ainda.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  strokeOpacity={0.08}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) =>
                    `R$ ${Math.round(v / 100).toLocaleString("pt-BR")}`
                  }
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  tickLine={false}
                  axisLine={false}
                  width={76}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#E8770A"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#E8770A", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#E8770A", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      )}
    </div>
  )
}
