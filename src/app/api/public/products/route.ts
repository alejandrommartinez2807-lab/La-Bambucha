import { NextResponse } from "next/server"
import {
  categories as fallbackCategories,
  products as fallbackProducts,
  type Product,
  type ProductPaymentMode,
} from "@/data/products"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 0

type PublicProduct = Product & {
  isActive?: boolean
  isFeatured?: boolean
  sortOrder?: number
}

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
}

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

function normalizeNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return fallback
  }

  return numberValue
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value

  const normalized = String(value || "").trim().toLowerCase()

  if (["true", "1", "si", "sí", "activo", "activa", "yes"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "inactivo", "inactiva", "normal", "none"].includes(normalized)) {
    return false
  }

  return fallback
}

function normalizePaymentMode(value: unknown): ProductPaymentMode {
  return value === "divisa" ? "divisa" : "mixto"
}

function buildCategories(products: PublicProduct[]) {
  return Array.from(
    new Set([
      "Todos",
      ...fallbackCategories.filter((category) => category !== "Todos"),
      ...products.map((product) => product.category).filter(Boolean),
    ])
  ).filter(Boolean)
}

function normalizePublicProduct(product: Partial<PublicProduct>): PublicProduct | null {
  const id = Math.round(normalizeNumber(product.id, 0))
  const name = normalizeText(product.name)

  if (!id || !name) {
    return null
  }

  const price = normalizeNumber(product.price, 0)

  return {
    id,
    name,
    category: normalizeText(product.category) || "Combos",
    description: normalizeText(product.description),
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    image: normalizeText(product.image) || "/logo-bambucha.png",
    paymentMode: normalizePaymentMode(product.paymentMode),
    isActive: normalizeBoolean(product.isActive, true),
    isFeatured: normalizeBoolean(product.isFeatured, false),
    sortOrder: Math.round(normalizeNumber(product.sortOrder, id || 999)),
  }
}

function sortProducts(products: PublicProduct[]) {
  return [...products].sort((a, b) => {
    const orderA = Number(a.sortOrder || 999)
    const orderB = Number(b.sortOrder || 999)

    if (orderA !== orderB) return orderA - orderB

    return a.name.localeCompare(b.name, "es")
  })
}

function normalizeFallbackProducts() {
  return sortProducts(
    fallbackProducts
      .map((product) =>
        normalizePublicProduct({
          ...product,
          isActive: product.isActive !== false,
          isFeatured: product.isFeatured === true,
          sortOrder: product.sortOrder || product.id,
        })
      )
      .filter((product): product is PublicProduct => Boolean(product))
  )
}

function publicProductsResponse(payload: Record<string, unknown>) {
  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      ...payload,
    },
    {
      headers: NO_STORE_HEADERS,
    }
  )
}

export async function GET() {
  try {
    const { getMenuProductsFromAppsScript } = await import(
      "@/lib/appsScriptOrders"
    )

    const menuProducts = await getMenuProductsFromAppsScript()

    const activeProducts = sortProducts(
      menuProducts
        .map((product) => normalizePublicProduct(product))
        .filter((product): product is PublicProduct => Boolean(product))
        .filter((product) => product.isActive !== false)
    )

    if (activeProducts.length > 0) {
      return publicProductsResponse({
        ok: true,
        products: activeProducts,
        categories: buildCategories(activeProducts),
        fallback: false,
        source: "Google Sheets - Productos Menú",
        warning: undefined,
      })
    }

    const fallbackProductsList = normalizeFallbackProducts()

    return publicProductsResponse({
      ok: true,
      products: fallbackProductsList,
      categories: buildCategories(fallbackProductsList),
      fallback: true,
      source: "Menú base local",
      warning:
        "El menú editable todavía no tiene productos activos. Se está mostrando el menú base de La Bambucha.",
    })
  } catch (error) {
    const fallbackProductsList = normalizeFallbackProducts()

    return publicProductsResponse({
      ok: true,
      products: fallbackProductsList,
      categories: buildCategories(fallbackProductsList),
      fallback: true,
      source: "Menú base local",
      warning:
        error instanceof Error
          ? `No se pudo cargar el menú editable. Se está mostrando el menú base de La Bambucha. Detalle: ${error.message}`
          : "No se pudo cargar el menú editable. Se está mostrando el menú base de La Bambucha.",
    })
  }
}
