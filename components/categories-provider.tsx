"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type CategoryData = {
  _id: string
  name: string
  color: string
  icon?: string
  isDefault: boolean
  isHidden: boolean
}

type CategoriesContextValue = {
  categories: CategoryData[]
  allCategories: CategoryData[]
  getColor: (name: string) => string
  loading: boolean
}

const CategoriesContext = createContext<CategoriesContextValue>({
  categories: [],
  allCategories: [],
  getColor: () => "#8C8C8C",
  loading: true,
})

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [allCategories, setAllCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setAllCategories(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const categories = allCategories.filter((c) => !c.isHidden)

  function getColor(name: string): string {
    const cat = allCategories.find((c) => c.name === name)
    return cat?.color ?? "#8C8C8C"
  }

  return (
    <CategoriesContext.Provider value={{ categories, allCategories, getColor, loading }}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  return useContext(CategoriesContext)
}
