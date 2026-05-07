"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

type Category = {
  _id: string
  name: string
  color: string
  icon?: string
  isDefault: boolean
  isHidden: boolean
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSaved: () => void
}

export function CategoryForm({ open, onOpenChange, category, onSaved }: Props) {
  const isEditing = !!category
  const [name, setName] = useState(category?.name ?? "")
  const [color, setColor] = useState(category?.color ?? "#E8770A")
  const [icon, setIcon] = useState(category?.icon ?? "")
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState("")

  useEffect(() => {
    if (open) {
      setName(category?.name ?? "")
      setColor(category?.color ?? "#E8770A")
      setIcon(category?.icon ?? "")
      setNameError("")
    }
  }, [open, category])

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed || trimmed.length > 30) {
      setNameError("Nome deve ter entre 1 e 30 caracteres")
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = { name: trimmed, color }
      if (isEditing) {
        body.icon = icon.trim() || null
      } else if (icon.trim()) {
        body.icon = icon.trim()
      }
      const url = isEditing ? `/api/categories/${category!._id}` : "/api/categories"
      const method = isEditing ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Erro ao salvar categoria")
        return
      }

      toast.success(isEditing ? "Categoria atualizada" : "Categoria criada")
      onOpenChange(false)
      onSaved()
    } catch {
      toast.error("Erro ao salvar categoria")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere o nome, ícone ou cor da categoria."
              : "Crie uma categoria personalizada para organizar suas assinaturas."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setNameError("")
              }}
              maxLength={30}
              placeholder="Ex: Finanças"
              disabled={saving}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Ícone</Label>
              <Input
                id="cat-icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                maxLength={2}
                placeholder="Emoji"
                className="text-center text-lg"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">Um emoji (opcional)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-color">Cor</Label>
              <div className="flex items-center gap-2">
                <div
                  className="size-9 rounded-md border border-border shrink-0"
                  style={{ backgroundColor: color }}
                />
                <input
                  id="cat-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-9 cursor-pointer rounded border border-input bg-background px-1"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-2">Pré-visualização:</p>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: color }}
            >
              {icon.trim() && <span>{icon.trim()}</span>}
              {name.trim() || "Minha Categoria"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
