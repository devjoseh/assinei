"use client"

import { useState, useEffect, useCallback } from "react"
import { Subscription } from "@/types"

interface Filters {
  categories?: string[]
  sort?: string
  search?: string
}

export function useSubscriptions(filters: Filters = {}) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.sort) params.set("sort", filters.sort)
      if (filters.categories?.length === 1) params.set("category", filters.categories[0])

      const res = await fetch(`/api/subscriptions?${params}`)
      if (!res.ok) throw new Error("Erro ao carregar assinaturas")
      const data = await res.json()
      setSubscriptions(data)
    } catch {
      setError("Erro ao carregar assinaturas")
    } finally {
      setLoading(false)
    }
  }, [filters.sort, filters.categories?.join(",")])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  async function createSubscription(data: Partial<Subscription>) {
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Erro ao criar assinatura")
    }
    const created = await res.json()
    setSubscriptions((prev) => [created, ...prev])
    return created
  }

  async function updateSubscription(id: string, data: Partial<Subscription>) {
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Erro ao atualizar assinatura")
    }
    const updated = await res.json()
    setSubscriptions((prev) => prev.map((s) => (s._id === id ? updated : s)))
    return updated
  }

  async function deleteSubscription(id: string) {
    setSubscriptions((prev) => prev.filter((s) => s._id !== id))
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
    } catch {
      await fetchSubscriptions()
      throw new Error("Erro ao excluir assinatura")
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    return updateSubscription(id, { isActive })
  }

  let filtered = subscriptions
  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
    )
  }
  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter((s) => filters.categories!.includes(s.category))
  }

  return {
    subscriptions: filtered,
    allSubscriptions: subscriptions,
    loading,
    error,
    refetch: fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    toggleActive,
  }
}
