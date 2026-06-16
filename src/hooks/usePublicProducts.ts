"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  categories as fallbackCategories,
  products as fallbackProducts,
  type Product,
} from "@/data/products"

type PublicProductsResponse = {
  ok?: boolean
  products?: unknown
  categories?: unknown
  fallback?: boolean
  source?: string
  warning?: string
  error?: string
  generatedAt?: string
  updatedAt?: string
}

type PublicProductsSnapshot = {
  type?: string
  products?: unknown
  categories?: unknown
  fallback?: boolean
  source?: string
  warning?: string
  updatedAt?: string
}

type LoadPublicProductsOptions = {
  force?: boolean
  silent?: boolean
}

export type PublicProductsState = {
  products: Product[]
  categories: string[]
  isLoading: boolean
  error: string | null
  warning: string | null
  fallback: boolean
  source: string
  updatedAt: string | null
  reload: () => Promise<void>
}

const PUBLIC_PRODUCTS_RELOAD_GUARD_MS = 700
const PUBLIC_PRODUCTS_BURST_GUARD_MS = 600
const PUBLIC_MENU_UPDATED_STORAGE_KEY = "la_bambucha_menu_updated_at"
const PUBLIC_MENU_SNAPSHOT_STORAGE_KEY = "la_bambucha_public_menu_snapshot_v1"
const PUBLIC_MENU_UPDATED_EVENT = "la-bambucha-menu-updated"
const PUBLIC_MENU_BROADCAST_CHANNEL = "la-bambucha-public-menu"
const PUBLIC_MENU_LOCAL_SNAPSHOT_MAX_AGE_MS = 30 * 60 * 1000

function normalizePaymentMode(value: unknown): Product["paymentMode"] {
  return value === "divisa" ? "divisa" : "mixto"
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value

  const normalized = String(value || "").trim().toLowerCase()

  if (["true", "1", "si", "sí", "activo", "activa", "yes"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "inactivo", "inactiva", "normal"].includes(normalized)) {
    return false
  }

  return fallback
}

function normalizePublicProduct(value: unknown): Product | null {
  const source = (value || {}) as Partial<Product>
  const id = Number(source.id || 0)
  const price = Number(source.price || 0)

  if (!Number.isFinite(id) || id <= 0 || !source.name) {
    return null
  }

  return {
    id: Math.round(id),
    name: String(source.name || "").trim(),
    category: String(source.category || "Otros").trim() || "Otros",
    description: String(source.description || "").trim(),
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    image: String(source.image || "").trim() || "/logo-bambucha.png",
    paymentMode: normalizePaymentMode(source.paymentMode),
    isActive: normalizeBoolean(source.isActive, true),
    isFeatured: normalizeBoolean(source.isFeatured, false),
    sortOrder: Number(source.sortOrder || 9999),
  }
}

function sortProducts(products: Product[]) {
  return [...products].sort((a, b) => {
    const orderA = Number(a.sortOrder || 9999)
    const orderB = Number(b.sortOrder || 9999)

    if (orderA !== orderB) return orderA - orderB

    return a.name.localeCompare(b.name, "es")
  })
}

function normalizePublicProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) return fallbackProducts

  const cleanProducts = sortProducts(
    value
      .map(normalizePublicProduct)
      .filter((product): product is Product => Boolean(product))
      .filter((product) => product.isActive !== false)
  )

  return cleanProducts.length ? cleanProducts : fallbackProducts
}

function normalizeCategories(value: unknown, products: Product[]) {
  const apiCategories = Array.isArray(value)
    ? value.map((category) => String(category || "").trim()).filter(Boolean)
    : []

  const merged = [
    "Todos",
    ...fallbackCategories.filter((category) => category !== "Todos"),
    ...apiCategories.filter((category) => category !== "Todos"),
    ...products.map((product) => product.category).filter(Boolean),
  ]

  return Array.from(new Set(merged)).filter(Boolean)
}

function normalizeTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  const text = String(value || "").trim()

  if (!text) {
    return 0
  }

  const numericValue = Number(text)

  if (Number.isFinite(numericValue) && numericValue > 0) {
    return numericValue
  }

  const parsedValue = Date.parse(text)

  return Number.isFinite(parsedValue) ? parsedValue : 0
}

function isFreshLocalSnapshot(snapshot: PublicProductsSnapshot) {
  const snapshotTime = normalizeTimestamp(snapshot.updatedAt)

  if (!snapshotTime) {
    return false
  }

  return Date.now() - snapshotTime <= PUBLIC_MENU_LOCAL_SNAPSHOT_MAX_AGE_MS
}

function readLocalSnapshot() {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(PUBLIC_MENU_SNAPSHOT_STORAGE_KEY)

    if (!rawValue) {
      return null
    }

    const parsedValue = JSON.parse(rawValue) as PublicProductsSnapshot

    return parsedValue && typeof parsedValue === "object" ? parsedValue : null
  } catch {
    return null
  }
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError"
}

export function usePublicProducts(): PublicProductsState {
  const [products, setProducts] = useState<Product[]>(fallbackProducts)
  const [categories, setCategories] = useState<string[]>(fallbackCategories)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [fallback, setFallback] = useState(true)
  const [source, setSource] = useState("Menú base local")
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  const isMountedRef = useRef(false)
  const lastReloadAtRef = useRef(0)
  const lastBurstAtRef = useRef(0)
  const latestAppliedRequestAtRef = useRef(0)
  const activeControllersRef = useRef<Set<AbortController>>(new Set())
  const refreshTimersRef = useRef<number[]>([])

  const clearScheduledRefreshes = useCallback(() => {
    refreshTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
    refreshTimersRef.current = []
  }, [])

  const applyLocalSnapshot = useCallback((snapshotInput?: unknown) => {
    const directSnapshot =
      snapshotInput && typeof snapshotInput === "object"
        ? (snapshotInput as PublicProductsSnapshot)
        : null
    const snapshot = directSnapshot?.products ? directSnapshot : readLocalSnapshot()

    if (!snapshot || !Array.isArray(snapshot.products) || !isFreshLocalSnapshot(snapshot)) {
      return false
    }

    const snapshotAppliedAt = Date.now()
    const nextProducts = normalizePublicProducts(snapshot.products)
    const nextCategories = normalizeCategories(snapshot.categories, nextProducts)
    const snapshotUpdatedAt =
      String(snapshot.updatedAt || snapshotAppliedAt).trim() ||
      String(snapshotAppliedAt)

    latestAppliedRequestAtRef.current = snapshotAppliedAt

    setProducts(nextProducts)
    setCategories(nextCategories)
    setFallback(Boolean(snapshot.fallback))
    setSource(String(snapshot.source || "Actualización local del panel"))
    setWarning(snapshot.warning || null)
    setUpdatedAt(snapshotUpdatedAt)
    setError(null)

    return true
  }, [])

  const loadProducts = useCallback(
    async ({ force = false, silent = false }: LoadPublicProductsOptions = {}) => {
      const now = Date.now()

      if (!force && now - lastReloadAtRef.current < PUBLIC_PRODUCTS_RELOAD_GUARD_MS) {
        return
      }

      lastReloadAtRef.current = now

      const requestStartedAt = now
      const controller = new AbortController()
      activeControllersRef.current.add(controller)

      if (!silent) {
        setIsLoading(true)
      }

      setError(null)

      try {
        const response = await fetch(`/api/public/products?t=${requestStartedAt}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          signal: controller.signal,
        })

        const data = (await response.json()) as PublicProductsResponse

        if (!response.ok || data.error) {
          throw new Error(data.error || "No se pudo cargar el menú editable.")
        }

        const nextProducts = normalizePublicProducts(data.products)
        const nextCategories = normalizeCategories(data.categories, nextProducts)

        if (!isMountedRef.current || controller.signal.aborted) {
          return
        }

        if (requestStartedAt < latestAppliedRequestAtRef.current) {
          return
        }

        latestAppliedRequestAtRef.current = requestStartedAt

        setProducts(nextProducts)
        setCategories(nextCategories)
        setWarning(data.warning || null)
        setFallback(Boolean(data.fallback))
        setSource(String(data.source || "Google Sheets - Productos Menú"))
        setUpdatedAt(String(data.updatedAt || data.generatedAt || "").trim() || null)
      } catch (loadError) {
        if (isAbortError(loadError)) {
          return
        }

        if (!isMountedRef.current || controller.signal.aborted) {
          return
        }

        const message =
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar el menú editable."

        if (requestStartedAt < latestAppliedRequestAtRef.current) {
          return
        }

        setError(message)

        if (silent) {
          setWarning((currentWarning) => currentWarning)
          return
        }

        latestAppliedRequestAtRef.current = requestStartedAt
        setProducts(fallbackProducts)
        setCategories(normalizeCategories(fallbackCategories, fallbackProducts))
        setFallback(true)
        setSource("Menú base local")
        setWarning(null)
        setUpdatedAt(null)
      } finally {
        activeControllersRef.current.delete(controller)

        if (isMountedRef.current && !silent) {
          setIsLoading(false)
        }
      }
    },
    []
  )

  const scheduleRefreshBurst = useCallback(
    (forceBurst = false) => {
      const now = Date.now()

      if (!forceBurst && now - lastBurstAtRef.current < PUBLIC_PRODUCTS_BURST_GUARD_MS) {
        return
      }

      lastBurstAtRef.current = now
      clearScheduledRefreshes()

      void loadProducts({ force: true, silent: true })

      refreshTimersRef.current = [
        window.setTimeout(() => {
          void loadProducts({ force: true, silent: true })
        }, 1500),
        window.setTimeout(() => {
          void loadProducts({ force: true, silent: true })
        }, 4000),
      ]
    },
    [clearScheduledRefreshes, loadProducts]
  )

  const handleLocalMenuUpdate = useCallback(
    (snapshotInput?: unknown) => {
      applyLocalSnapshot(snapshotInput)
      scheduleRefreshBurst(true)
    },
    [applyLocalSnapshot, scheduleRefreshBurst]
  )

  const reload = useCallback(() => {
    clearScheduledRefreshes()
    return loadProducts({ force: true })
  }, [clearScheduledRefreshes, loadProducts])

  useEffect(() => {
    isMountedRef.current = true
    applyLocalSnapshot()
    void loadProducts({ force: true })

    return () => {
      isMountedRef.current = false
      clearScheduledRefreshes()
      activeControllersRef.current.forEach((controller) => controller.abort())
      activeControllersRef.current.clear()
    }
  }, [applyLocalSnapshot, clearScheduledRefreshes, loadProducts])

  useEffect(() => {
    const broadcastChannel =
      typeof window !== "undefined" && "BroadcastChannel" in window
        ? new BroadcastChannel(PUBLIC_MENU_BROADCAST_CHANNEL)
        : null

    function reloadWhenVisible() {
      if (document.visibilityState === "visible") {
        scheduleRefreshBurst()
      }
    }

    function reloadWhenFocused() {
      if (document.visibilityState === "visible") {
        scheduleRefreshBurst()
      }
    }

    function reloadWhenPageShows() {
      if (document.visibilityState === "visible") {
        applyLocalSnapshot()
        scheduleRefreshBurst()
      }
    }

    function reloadWhenStorageChanges(event: StorageEvent) {
      if (
        event.key === PUBLIC_MENU_UPDATED_STORAGE_KEY ||
        event.key === PUBLIC_MENU_SNAPSHOT_STORAGE_KEY
      ) {
        handleLocalMenuUpdate()
      }
    }

    function reloadWhenMenuUpdated(event: Event) {
      const customEvent = event as CustomEvent<PublicProductsSnapshot>
      handleLocalMenuUpdate(customEvent.detail)
    }

    document.addEventListener("visibilitychange", reloadWhenVisible)
    window.addEventListener("focus", reloadWhenFocused)
    window.addEventListener("pageshow", reloadWhenPageShows)
    window.addEventListener("storage", reloadWhenStorageChanges)
    window.addEventListener(PUBLIC_MENU_UPDATED_EVENT, reloadWhenMenuUpdated)

    if (broadcastChannel) {
      broadcastChannel.onmessage = (event: MessageEvent<PublicProductsSnapshot>) => {
        handleLocalMenuUpdate(event.data)
      }
    }

    return () => {
      document.removeEventListener("visibilitychange", reloadWhenVisible)
      window.removeEventListener("focus", reloadWhenFocused)
      window.removeEventListener("pageshow", reloadWhenPageShows)
      window.removeEventListener("storage", reloadWhenStorageChanges)
      window.removeEventListener(PUBLIC_MENU_UPDATED_EVENT, reloadWhenMenuUpdated)
      broadcastChannel?.close()
    }
  }, [applyLocalSnapshot, handleLocalMenuUpdate, scheduleRefreshBurst])

  return {
    products,
    categories,
    isLoading,
    error,
    warning,
    fallback,
    source,
    updatedAt,
    reload,
  }
}
