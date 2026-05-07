import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

let cache: { rates: Record<string, number>; timestamp: number } | null = null

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const now = Date.now()
    if (cache && now - cache.timestamp < CACHE_TTL) {
      return NextResponse.json({ rates: cache.rates, cached: true })
    }

    const currencies = ["USD-BRL", "EUR-BRL", "GBP-BRL", "ARS-BRL"]
    const res = await fetch(
      `https://economia.awesomeapi.com.br/json/last/${currencies.join(",")}`
    )
    if (!res.ok) {
      // Return stale cache if available
      if (cache) return NextResponse.json({ rates: cache.rates, cached: true, stale: true })
      return NextResponse.json({ error: "Falha ao buscar cotações" }, { status: 502 })
    }

    const data = await res.json()
    const rates: Record<string, number> = {}

    for (const [key, value] of Object.entries(data)) {
      const item = value as { bid: string }
      const code = key.replace("BRL", "")
      rates[code] = parseFloat(item.bid)
    }

    cache = { rates, timestamp: now }

    return NextResponse.json({ rates })
  } catch {
    if (cache) return NextResponse.json({ rates: cache.rates, cached: true, stale: true })
    return NextResponse.json({ error: "Erro ao buscar cotações" }, { status: 502 })
  }
}
