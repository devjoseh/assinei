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
import { CURRENCY_SYMBOLS } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Currency } from "@/types"

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

function CustomTooltip({ active, payload }: TooltipProps<number, string> & { payload?: { payload: MonthData }[] }) {
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

interface MonthlyChartProps {
  currencies?: string[]
}

export function MonthlyChart({ currencies }: MonthlyChartProps) {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState("all")
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("chart-collapsed") === "true"
  })

  useEffect(() => {
    setLoading(true)
    const params = selectedCurrency !== "all" ? `?currency=${selectedCurrency}` : ""
    fetch(`/api/payments/summary${params}`)
      .then((r) => r.json())
      .then((json) => setData(json.months ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedCurrency])

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("chart-collapsed", String(next))
      return next
    })
  }

  const showCurrencySelector = currencies && currencies.length > 1
  const allZero = data.every((d) => d.total === 0)

  // Set default to most-used currency on first load
  useEffect(() => {
    if (currencies && currencies.length > 0 && selectedCurrency === "all") {
      const mainCurrency = currencies[0]
      if (mainCurrency !== "BRL" && currencies.includes("BRL")) {
        // Keep "all" if BRL is present
      } else if (currencies.length === 1) {
        setSelectedCurrency(currencies[0])
      }
    }
  }, [currencies])

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Evolução de Gastos</h2>
          <p className="text-xs text-muted-foreground">
            Últimos 6 meses · baseado em pagamentos registrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showCurrencySelector && (
            <Select value={selectedCurrency} onValueChange={(v) => v && setSelectedCurrency(v)}>
              <SelectTrigger className="h-7 text-xs w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CURRENCY_SYMBOLS[c as Currency] ?? c} {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 -mt-0.5" onClick={toggle}>
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
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
