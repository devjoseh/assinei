"use client"

import { useState, useEffect } from "react"
import { ImageHistory } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Settings } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ConfiguracoesPage() {
  const [history, setHistory] = useState<ImageHistory[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchHistory() {
    setLoading(true)
    const res = await fetch("/api/image-history")
    const data = await res.json()
    setHistory(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  async function handleDelete(id: string) {
    setHistory((prev) => prev.filter((h) => h._id !== id))
    try {
      const res = await fetch(`/api/image-history/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Imagem removida do histórico")
    } catch {
      toast.error("Erro ao remover imagem")
      fetchHistory()
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas preferências</p>
        </div>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Histórico de imagens
          </CardTitle>
          <CardDescription>
            URLs de imagens usadas anteriormente. Clique na lixeira para remover.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma imagem no histórico ainda.
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {history.map((item) => (
                <div key={item._id} className="group relative aspect-square">
                  <div className="w-full h-full rounded-xl overflow-hidden border border-border bg-white">
                    <img
                      src={item.url}
                      alt={item.label}
                      className="w-full h-full object-contain p-1"
                      title={item.label || item.url}
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.opacity = "0.3"
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                  {item.usageCount > 1 && (
                    <span className="absolute bottom-0.5 right-0.5 text-[9px] bg-background/80 rounded px-0.5">
                      {item.usageCount}x
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
