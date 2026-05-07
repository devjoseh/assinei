"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CategoryForm } from "@/components/category-form"
import { GripVertical, Pencil, Trash2, Eye, EyeOff, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Category = {
  _id: string
  name: string
  color: string
  icon?: string
  isDefault: boolean
  isHidden: boolean
  order: number
  subscriptionCount?: number
}

function SortableCategoryCard({
  category,
  onEdit,
  onToggleHidden,
  onDelete,
}: {
  category: Category
  onEdit: (c: Category) => void
  onToggleHidden: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card transition-colors",
        isDragging && "opacity-50 z-50 shadow-lg",
        category.isHidden && "opacity-60"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div
        className="size-4 rounded-full shrink-0 ring-1 ring-inset ring-black/10"
        style={{ backgroundColor: category.color }}
      />

      <span className="text-sm font-medium flex-1 truncate">
        {category.icon && <span className="mr-1.5">{category.icon}</span>}
        {category.name}
      </span>

      {category.isDefault && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
          Padrão
        </span>
      )}

      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(category)}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => onToggleHidden(category)}
          title={category.isHidden ? "Exibir" : "Ocultar"}
        >
          {category.isHidden ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(category)}
          disabled={category.isDefault}
          title={category.isDefault ? "Categorias padrão não podem ser excluídas" : "Excluir"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleteSubCount, setDeleteSubCount] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function fetchCategories() {
    const res = await fetch("/api/categories")
    const data = await res.json()
    setCategories(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  // Fetch on mount
  useEffect(() => { fetchCategories() }, [])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = categories.findIndex((c) => c._id === active.id)
    const newIndex = categories.findIndex((c) => c._id === over.id)
    const reordered = [...categories]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    setCategories(reordered)

    try {
      const res = await fetch("/api/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map((c) => c._id) }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Erro ao reordenar categorias")
      fetchCategories()
    }
  }

  async function handleToggleHidden(category: Category) {
    const newState = !category.isHidden
    setCategories((prev) =>
      prev.map((c) => (c._id === category._id ? { ...c, isHidden: newState } : c))
    )
    try {
      const res = await fetch(`/api/categories/${category._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHidden: newState }),
      })
      if (!res.ok) throw new Error()
    } catch {
      toast.error("Erro ao atualizar categoria")
      fetchCategories()
    }
  }

  function handleEdit(category: Category) {
    setEditingCategory(category)
    setFormOpen(true)
  }

  function handleNew() {
    setEditingCategory(null)
    setFormOpen(true)
  }

  function handleFormSaved() {
    fetchCategories()
  }

  async function handleDeleteClick(category: Category) {
    // Check how many subscriptions use this category
    try {
      const res = await fetch(`/api/subscriptions?category=${encodeURIComponent(category.name)}`)
      const data = await res.json()
      setDeleteSubCount(Array.isArray(data) ? data.filter((s: { isActive: boolean }) => s.isActive).length : 0)
    } catch {
      setDeleteSubCount(0)
    }
    setDeleteTarget(category)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/categories/${deleteTarget._id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Erro ao excluir categoria")
        return
      }
      toast.success("Categoria excluída")
      setDeleteTarget(null)
      fetchCategories()
    } catch {
      toast.error("Erro ao excluir categoria")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNew}
          disabled={categories.length >= 30}
          className="w-full"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nova categoria
        </Button>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma categoria encontrada. Execute o seed de categorias.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {categories.map((cat) => (
                  <SortableCategoryCard
                    key={cat._id}
                    category={cat}
                    onEdit={handleEdit}
                    onToggleHidden={handleToggleHidden}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <CategoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
        onSaved={handleFormSaved}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSubCount > 0
                ? `Esta categoria está sendo usada por ${deleteSubCount} assinatura(s) ativa(s). Ao deletar, elas serão movidas automaticamente para "Outros". Deseja continuar?`
                : `Tem certeza que deseja excluir a categoria "${deleteTarget?.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
