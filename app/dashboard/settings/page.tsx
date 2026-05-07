"use client"

import { useState, useEffect } from "react"
import { ImageHistory, Subscription } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Settings, Tag, Bell } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AlertSettingsForm } from "@/components/alert-settings-form"

type TagEntry = { _id: string; tag: string; usageCount: number }

export default function SettingsPage() {
  const [history, setHistory] = useState<ImageHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [tags, setTags] = useState<TagEntry[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)

  async function fetchHistory() {
    setLoading(true)
    const res = await fetch("/api/image-history")
    const data = await res.json()
    setHistory(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function fetchTags() {
    setTagsLoading(true)
    const [tagsRes, subsRes] = await Promise.all([
      fetch("/api/tags"),
      fetch("/api/subscriptions"),
    ])
    const tagsData = await tagsRes.json()
    const subsData = await subsRes.json()
    setTags(Array.isArray(tagsData) ? tagsData : [])
    setSubscriptions(Array.isArray(subsData) ? subsData : [])
    setTagsLoading(false)
  }

  useEffect(() => {
    fetchHistory()
    fetchTags()
  }, [])

  async function handleDeleteTag(tag: string) {
    setTags((prev) => prev.filter((t) => t.tag !== tag))
    try {
      const res = await fetch(`/api/tags/${encodeURIComponent(tag)}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Tag removida do histórico")
    } catch {
      toast.error("Erro ao remover tag")
      fetchTags()
    }
  }

  function activeSubCount(tag: string) {
    return subscriptions.filter((s) => s.isActive && s.tags?.includes(tag)).length
  }

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

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alertas por Email
          </CardTitle>
          <CardDescription>
            Configure o envio automático de alertas quando uma assinatura estiver próxima do vencimento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertSettingsForm />
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Gerenciar Tags
          </CardTitle>
          <CardDescription>
            Tags usadas anteriormente. Remover do histórico não afeta as assinaturas existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tagsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded-lg" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma tag no histórico ainda.
            </p>
          ) : (
            <div className="space-y-1">
              {tags.map((entry) => {
                const count = activeSubCount(entry.tag)
                return (
                  <div
                    key={entry._id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{entry.tag}</span>
                      <span className="text-xs text-muted-foreground">
                        {count} assinatura{count !== 1 ? "s" : ""} ativa{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteTag(entry.tag)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
