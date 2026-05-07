"use client"

import { useState, useMemo, useRef } from "react"
import { useSubscriptions } from "@/hooks/use-subscriptions"
import { useStats } from "@/hooks/use-stats"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { useCategories } from "@/components/categories-provider"
import { Subscription } from "@/types"
import { StatsBar } from "@/components/stats-bar"
import { SubscriptionCard } from "@/components/subscription-card"
import { SubscriptionForm } from "@/components/subscription-form"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { PaymentRegisterModal } from "@/components/payment-register-modal"
import { PaymentHistoryDrawer } from "@/components/payment-history-drawer"
import { SubscriptionDetailModal } from "@/components/subscription-detail-modal"
import { CategoryFilter } from "@/components/category-filter"
import { UpcomingPayments } from "@/components/upcoming-payments"
import { MonthlyChart } from "@/components/monthly-chart"
import { CategoryBreakdown } from "@/components/category-breakdown"
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal"
import { PwaInstallBanner } from "@/components/pwa-install-banner"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

const SORT_OPTIONS = [
  { value: "name", label: "Nome (A–Z)" },
  { value: "price", label: "Preço (maior)" },
  { value: "price_asc", label: "Preço (menor)" },
  { value: "nextPaymentDate", label: "Próximo pagamento" },
]

const PAGE_SIZE = 12

export default function DashboardPage() {
  const [search, setSearch] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sort, setSort] = useState("name")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editSub, setEditSub] = useState<Subscription | null>(null)
  const [deleteSub, setDeleteSub] = useState<Subscription | null>(null)
  const [paymentSub, setPaymentSub] = useState<Subscription | null>(null)
  const [historySub, setHistorySub] = useState<Subscription | null>(null)
  const [detailSub, setDetailSub] = useState<Subscription | null>(null)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const { categories: allCategories } = useCategories()

  const { subscriptions, allSubscriptions, loading, createSubscription, updateSubscription, deleteSubscription, toggleActive } =
    useSubscriptions({ search, categories, tags: selectedTags, sort })
  const { stats, loading: statsLoading, refetch: refetchStats } = useStats()

  const anyModalOpen = formOpen || !!deleteSub || !!paymentSub || !!historySub || !!detailSub || shortcutsModalOpen

  useKeyboardShortcuts({
    searchInputRef,
    categories: allCategories.map((c) => c.name),
    onSelectCategory: (index) => {
      if (index === -1) {
        setCategories([])
      } else {
        const name = allCategories[index]?.name
        if (name) setCategories([name])
      }
      resetPage()
    },
    onToggleView: () => setViewMode((v) => (v === "grid" ? "list" : "grid")),
    onNewSubscription: openAdd,
    onOpenShortcuts: () => setShortcutsModalOpen(true),
    disabled: anyModalOpen,
  })

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    allSubscriptions.filter((s) => s.isActive).forEach((s) => s.tags?.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [allSubscriptions])

  const totalPages = Math.max(1, Math.ceil(subscriptions.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = useMemo(
    () => subscriptions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [subscriptions, safePage]
  )

  function resetPage() { setPage(1) }

  function openAdd() {
    setEditSub(null)
    setFormOpen(true)
  }

  function openEdit(sub: Subscription) {
    setEditSub(sub)
    setFormOpen(true)
  }

  async function handleSave(data: Partial<Subscription>) {
    if (editSub) {
      await updateSubscription(editSub._id, data)
      toast.success("Assinatura atualizada!")
    } else {
      await createSubscription(data)
      toast.success("Assinatura criada!")
    }
    refetchStats()
  }

  async function handleDelete() {
    if (!deleteSub) return
    try {
      await deleteSubscription(deleteSub._id)
      toast.success("Assinatura excluída!")
      refetchStats()
    } catch {
      toast.error("Erro ao excluir assinatura.")
    } finally {
      setDeleteSub(null)
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      await toggleActive(id, isActive)
      refetchStats()
    } catch {
      toast.error("Erro ao atualizar status.")
    }
  }

  const gridClass = viewMode === "grid"
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    : "flex flex-col gap-2"

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <PwaInstallBanner />

      <StatsBar stats={stats} loading={statsLoading} />

      <UpcomingPayments stats={stats} loading={statsLoading} />

      <MonthlyChart currencies={stats?.totals?.map((t) => t.currency)} />

      <CategoryBreakdown stats={stats} loading={statsLoading} />

      <div className="space-y-4">
        {/* Search + Sort + View toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar assinaturas..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage() }}
              className="pl-9"
            />
          </div>
          <Select value={sort} onValueChange={(v) => { if (v) { setSort(v); resetPage() } }}>
            <SelectTrigger className="w-44 shrink-0 hidden sm:flex">
              <SelectValue>
                {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
            title={viewMode === "grid" ? "Ver lista" : "Ver grade"}
            className="shrink-0"
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sort — mobile only (full row) */}
        <div className="sm:hidden">
          <Select value={sort} onValueChange={(v) => { if (v) { setSort(v); resetPage() } }}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? sort}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CategoryFilter selected={categories} onChange={(c) => { setCategories(c); resetPage() }} breakdown={stats?.categoryBreakdown} />

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags((prev) =>
                      active ? prev.filter((t) => t !== tag) : [...prev, tag]
                    )
                    resetPage()
                  }}
                  className={`h-7 px-3 text-xs rounded-full border transition-all font-medium ${
                    active
                      ? "border-transparent text-white"
                      : "border-border text-muted-foreground hover:border-current hover:text-foreground bg-background"
                  }`}
                  style={active ? { backgroundColor: "#E8770A", borderColor: "#E8770A" } : {}}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className={gridClass}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className={viewMode === "grid" ? "h-44 rounded-xl" : "h-16 rounded-xl"} />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {search || categories.length > 0 ? "Nenhuma assinatura encontrada" : "Nenhuma assinatura ainda"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || categories.length > 0
                  ? "Tente mudar os filtros de busca."
                  : "Clique no botão + para adicionar sua primeira assinatura."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {paginated.map((sub) => (
                <SubscriptionCard
                  key={sub._id}
                  subscription={sub}
                  viewMode={viewMode}
                  onEdit={openEdit}
                  onDelete={setDeleteSub}
                  onToggleActive={handleToggle}
                  onPayment={setPaymentSub}
                  onHistory={setHistorySub}
                  onDetail={setDetailSub}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  {subscriptions.length} assinatura{subscriptions.length !== 1 ? "s" : ""} ·{" "}
                  página {safePage} de {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "…")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…")
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === "…" ? (
                        <span key={`e${i}`} className="px-1 text-muted-foreground text-sm">…</span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === safePage ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 text-sm"
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={safePage === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      <p className="hidden md:block text-center text-xs text-muted-foreground">
        Pressione <kbd className="inline-block rounded border border-border bg-muted px-1 py-0.5 font-mono text-[11px] text-foreground">?</kbd> para ver os atalhos de teclado
      </p>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center z-40"
        title="Nova assinatura"
        aria-label="Adicionar assinatura"
      >
        <Plus className="h-6 w-6" />
      </button>

      <SubscriptionForm
        open={formOpen}
        subscription={editSub}
        onClose={() => { setFormOpen(false); setEditSub(null) }}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        subscription={deleteSub}
        onConfirm={handleDelete}
        onCancel={() => setDeleteSub(null)}
      />

      <PaymentRegisterModal
        subscription={paymentSub}
        onClose={() => setPaymentSub(null)}
      />

      <PaymentHistoryDrawer
        subscription={historySub}
        onClose={() => setHistorySub(null)}
      />

      <SubscriptionDetailModal
        subscription={detailSub}
        onClose={() => setDetailSub(null)}
        onEdit={(sub) => { setDetailSub(null); openEdit(sub) }}
        onDelete={(sub) => { setDetailSub(null); setDeleteSub(sub) }}
        onPayment={(sub) => { setDetailSub(null); setPaymentSub(sub) }}
        onHistory={(sub) => { setDetailSub(null); setHistorySub(sub) }}
        onToggleActive={(id, isActive) => { setDetailSub(null); handleToggle(id, isActive) }}
      />

      <KeyboardShortcutsModal
        open={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  )
}
