import { BillingCycle } from "@/types"

export const CATEGORIES = [
  "Streaming",
  "SaaS",
  "Jogos",
  "Educação",
  "Música",
  "Notícias",
  "Produtividade",
  "Segurança",
  "Armazenamento",
  "Outros",
] as const

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

export const CATEGORY_COLORS: Record<string, string> = {
  Streaming: "#E50914",
  SaaS: "#0078D4",
  Jogos: "#6E40C9",
  Educação: "#00A86B",
  Música: "#1DB954",
  Notícias: "#FF6B35",
  Produtividade: "#F4A300",
  Segurança: "#DC143C",
  Armazenamento: "#4A90D9",
  Outros: "#8C8C8C",
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
