import { BillingCycle, Currency } from "@/types"

export const CURRENCIES: { code: Currency; symbol: string; label: string }[] = [
  { code: "BRL", symbol: "R$",  label: "Real Brasileiro"   },
  { code: "USD", symbol: "US$", label: "Dólar Americano"   },
  { code: "EUR", symbol: "€",   label: "Euro"              },
  { code: "GBP", symbol: "£",   label: "Libra Esterlina"   },
  { code: "ARS", symbol: "$",   label: "Peso Argentino"    },
]

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BRL: "R$",
  USD: "US$",
  EUR: "€",
  GBP: "£",
  ARS: "$",
}

export const BILLING_CYCLES: { value: BillingCycle; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "semiannual", label: "Semestral" },
  { value: "annual", label: "Anual" },
]

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
  annual: "Anual",
}

export const DEFAULT_COLORS = [
  "#E8770A",
  "#E50914",
  "#0078D4",
  "#6E40C9",
  "#00A86B",
  "#1DB954",
  "#FF6B35",
  "#F4A300",
  "#DC143C",
  "#4A90D9",
]
