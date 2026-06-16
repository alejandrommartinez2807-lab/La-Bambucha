import { NextRequest, NextResponse } from "next/server"
import {
  deleteMenuProductInAppsScript,
  getBusinessConfigFromAppsScript,
  getMenuProductsFromAppsScript,
  saveBusinessConfigInAppsScript,
  saveMenuProductInAppsScript,
  type MenuProduct,
  type ProductPaymentMode,
  type SaveMenuProductInput,
} from "@/lib/appsScriptOrders"
import { getLocalAccessFromPassword, type LocalRole } from "@/lib/localAccess"
import { products as baseProducts } from "@/data/products"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type BusinessConfigWithFeaturedProducts = {
  featuredProductIds?: unknown
}

type SyncBaseProductsResult = {
  imported: number
  skipped: number
  existing: number
  products: MenuProduct[]
}

function getRequestPassword(request: NextRequest) {
  return (
    request.headers.get("x-local-password") ||
    request.headers.get("x-admin-password") ||
    ""
  )
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 })
}

function forbiddenResponse(
  message = "Esta clave no tiene permiso para administrar el menú"
) {
  return NextResponse.json({ error: message }, { status: 403 })
}

function checkRole(request: NextRequest, allowedRoles: LocalRole[]) {
  const access = getLocalAccessFromPassword(getRequestPassword(request))

  if (!access.ok) {
    return {
      ok: false as const,
      response: unauthorizedResponse(),
      role: null,
    }
  }

  if (!allowedRoles.includes(access.role)) {
    return {
      ok: false as const,
      response: forbiddenResponse(),
      role: access.role,
    }
  }

  return {
    ok: true as const,
    response: null,
    role: access.role,
  }
}

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

function normalizePrice(value: unknown) {
  const price = Number(value)

  if (!Number.isFinite(price) || price < 0) {
    return 0
  }

  return Math.round((price + Number.EPSILON) * 100) / 100
}

function normalizeId(value: unknown) {
  const id = Number(value)

  if (!Number.isFinite(id) || id <= 0) {
    return 0
  }

  return Math.round(id)
}

function normalizePaymentMode(value: unknown): ProductPaymentMode {
  return value === "divisa" ? "divisa" : "mixto"
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value

  const normalized = String(value || "").trim().toLowerCase()

  if (["true", "1", "si", "sí", "activo", "activa", "yes"].includes(normalized)) {
    return true
  }

  if (
    ["false", "0", "no", "inactivo", "inactiva", "normal", "none"].includes(
      normalized
    )
  ) {
    return false
  }

  return fallback
}

function normalizeSortOrder(value: unknown, fallback = 999) {
  const order = Number(value)

  if (!Number.isFinite(order) || order <= 0) {
    return fallback
  }

  return Math.round(order)
}

function normalizeMenuProductPayload(value: unknown): SaveMenuProductInput {
  const source = (value || {}) as Partial<MenuProduct>

  const id = normalizeId(source.id)
  const name = normalizeText(source.name)
  const category = normalizeText(source.category) || "Combos"

  if (!name) {
    throw new Error("El nombre del producto es obligatorio.")
  }

  return {
    id,
    name,
    category,
    description: normalizeText(source.description),
    price: normalizePrice(source.price),
    image: normalizeText(source.image) || "/logo-bambucha.png",
    paymentMode: normalizePaymentMode(source.paymentMode),
    isActive: normalizeBoolean(source.isActive, true),
    isFeatured: normalizeBoolean(source.isFeatured, false),
    sortOrder: normalizeSortOrder(source.sortOrder, id || 999),
  }
}

function normalizeNumberList(value: unknown) {
  const rawList = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          const clean = value.trim()

          if (!clean) return []

          try {
            const parsed = JSON.parse(clean)

            return Array.isArray(parsed) ? parsed : clean.split(/[;,|]/g)
          } catch {
            return clean.split(/[;,|]/g)
          }
        })()
      : []

  const seen = new Set<number>()

  return rawList
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
    .map((item) => Math.round(item))
    .filter((item) => {
      if (seen.has(item)) return false
      seen.add(item)
      return true
    })
}

function applyFeaturedProductIds(products: MenuProduct[], featuredProductIds: number[]) {
  if (!featuredProductIds.length) return products

  const featuredSet = new Set(featuredProductIds)

  return products.map((product) => ({
    ...product,
    isFeatured: product.isFeatured === true || featuredSet.has(product.id),
  }))
}

async function getFeaturedProductIdsFromConfig() {
  try {
    const businessConfig =
      (await getBusinessConfigFromAppsScript()) as BusinessConfigWithFeaturedProducts

    return normalizeNumberList(businessConfig.featuredProductIds)
  } catch {
    return []
  }
}

async function syncFeaturedProductIdInConfig(productId: number, isFeatured: boolean) {
  try {
    const businessConfig =
      (await getBusinessConfigFromAppsScript()) as BusinessConfigWithFeaturedProducts

    const currentIds = normalizeNumberList(businessConfig.featuredProductIds)
    const currentSet = new Set(currentIds)

    if (isFeatured) {
      currentSet.add(productId)
    } else {
      currentSet.delete(productId)
    }

    const nextIds = Array.from(currentSet).sort((a, b) => a - b)

    await saveBusinessConfigInAppsScript({
      ...businessConfig,
      featuredProductIds: nextIds,
    })
  } catch {
    // No bloqueamos el guardado del producto si falla la sincronización de destacados.
  }
}

function productIdentityKey(product: Pick<MenuProduct, "name" | "category">) {
  return `${normalizeText(product.name).toLowerCase()}::${normalizeText(
    product.category
  ).toLowerCase()}`
}

function normalizeBaseProductForSheet(product: (typeof baseProducts)[number]) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    image: product.image || "/logo-bambucha.png",
    paymentMode: "mixto" as ProductPaymentMode,
    isActive: product.isActive !== false,
    isFeatured: product.isFeatured === true,
    sortOrder: product.sortOrder || product.id,
  } satisfies SaveMenuProductInput
}

async function syncBaseProductsWithSheets(): Promise<SyncBaseProductsResult> {
  const currentProducts = await getMenuProductsFromAppsScript()

  const existingIds = new Set(
    currentProducts
      .map((product) => Number(product.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  )

  const existingNames = new Set(
    currentProducts.map((product) => productIdentityKey(product))
  )

  let imported = 0
  let skipped = 0

  for (const baseProduct of baseProducts) {
    const normalizedBaseProduct = normalizeBaseProductForSheet(baseProduct)
    const identityKey = productIdentityKey(normalizedBaseProduct)

    if (existingIds.has(normalizedBaseProduct.id) || existingNames.has(identityKey)) {
      skipped += 1
      continue
    }

    await saveMenuProductInAppsScript(normalizedBaseProduct)

    imported += 1
    existingIds.add(normalizedBaseProduct.id)
    existingNames.add(identityKey)
  }

  const nextProducts = await getMenuProductsFromAppsScript()

  return {
    imported,
    skipped,
    existing: currentProducts.length,
    products: nextProducts,
  }
}

function unwrapSavedProductResponse(
  response: Awaited<ReturnType<typeof saveMenuProductInAppsScript>>,
  fallback: SaveMenuProductInput
): Partial<MenuProduct> {
  const source = response as Partial<MenuProduct> & {
    product?: Partial<MenuProduct>
    menuProduct?: Partial<MenuProduct>
  }

  return source.product || source.menuProduct || source || fallback
}

export async function GET(request: NextRequest) {
  try {
    const roleCheck = checkRole(request, ["owner", "manager", "support"])

    if (!roleCheck.ok) {
      return roleCheck.response
    }

    const products = await getMenuProductsFromAppsScript()
    const featuredProductIds = await getFeaturedProductIdsFromConfig()
    const productsWithFeatured = applyFeaturedProductIds(products, featuredProductIds)

    return NextResponse.json(
      {
        ok: true,
        products: productsWithFeatured,
        menuProducts: productsWithFeatured,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los productos del menú",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const roleCheck = checkRole(request, ["owner", "manager", "support"])

    if (!roleCheck.ok) {
      return roleCheck.response
    }

    const body = await request.json()
    const action = normalizeText((body || {}).action)

    if (action === "syncBaseProducts") {
      const result = await syncBaseProductsWithSheets()
      const featuredProductIds = await getFeaturedProductIdsFromConfig()
      const productsWithFeatured = applyFeaturedProductIds(
        result.products,
        featuredProductIds
      )

      return NextResponse.json(
        {
          ok: true,
          action: "syncBaseProducts",
          imported: result.imported,
          skipped: result.skipped,
          existing: result.existing,
          products: productsWithFeatured,
          menuProducts: productsWithFeatured,
          message:
            result.imported > 0
              ? `Se sincronizaron ${result.imported} producto(s) base con Google Sheets.`
              : "El menú base ya estaba sincronizado. No se agregaron productos nuevos.",
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      )
    }

    const payloadSource = body.product || body.menuProduct || body
    const input = normalizeMenuProductPayload(payloadSource)
    const savedProductResponse = await saveMenuProductInAppsScript(input)
    const savedProduct = unwrapSavedProductResponse(savedProductResponse, input)
    const fallbackSortOrder = input.sortOrder ?? input.id ?? 999

    const normalizedSavedProduct: MenuProduct = {
      id: normalizeId(savedProduct.id || input.id),
      name: normalizeText(savedProduct.name || input.name),
      category: normalizeText(savedProduct.category || input.category),
      description: normalizeText(savedProduct.description ?? input.description),
      price: normalizePrice(savedProduct.price ?? input.price),
      image: normalizeText(savedProduct.image || input.image),
      paymentMode: normalizePaymentMode(savedProduct.paymentMode || input.paymentMode),
      isActive: normalizeBoolean(savedProduct.isActive, input.isActive),
      isFeatured: normalizeBoolean(savedProduct.isFeatured, input.isFeatured),
      sortOrder: normalizeSortOrder(savedProduct.sortOrder, fallbackSortOrder),
      createdAt: normalizeText(savedProduct.createdAt) || new Date().toISOString(),
      updatedAt: normalizeText(savedProduct.updatedAt) || new Date().toISOString(),
    }

    await syncFeaturedProductIdInConfig(
      normalizedSavedProduct.id,
      normalizedSavedProduct.isFeatured
    )

    return NextResponse.json(
      {
        ok: true,
        product: normalizedSavedProduct,
        menuProduct: normalizedSavedProduct,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el producto del menú",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const roleCheck = checkRole(request, ["owner", "manager", "support"])

    if (!roleCheck.ok) {
      return roleCheck.response
    }

    const url = new URL(request.url)
    let productId = normalizeId(url.searchParams.get("id"))

    if (!productId) {
      try {
        const body = await request.json()
        productId = normalizeId(body.id || body.productId)
      } catch {
        productId = 0
      }
    }

    if (!productId) {
      return NextResponse.json(
        { error: "No se recibió el ID del producto." },
        { status: 400 }
      )
    }

    const deletedProduct = await deleteMenuProductInAppsScript(productId)

    await syncFeaturedProductIdInConfig(productId, false)

    return NextResponse.json(
      {
        ok: true,
        product: deletedProduct,
        menuProduct: deletedProduct,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo desactivar el producto del menú",
      },
      { status: 500 }
    )
  }
}
