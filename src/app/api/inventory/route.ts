import { NextRequest, NextResponse } from "next/server"
import {
  deleteInventoryItemInAppsScript,
  getBusinessConfigFromAppsScript,
  getInventoryFromAppsScript,
  getInventoryMovementsFromAppsScript,
  saveInventoryItemInAppsScript,
  type SaveInventoryItemInput,
} from "@/lib/appsScriptOrders"
import { getLocalAccessFromPassword, type LocalRole } from "@/lib/localAccess"
import { getModulePlanAccess } from "@/lib/localPlans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getRequestPassword(request: NextRequest) {
  return (
    request.headers.get("x-local-password") ||
    request.headers.get("x-admin-password") ||
    ""
  )
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: "No autorizado",
    },
    {
      status: 401,
    }
  )
}

function forbiddenResponse(message = "Esta clave no tiene permiso para usar inventario") {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status: 403,
    }
  )
}

function normalizeNumber(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return 0
  }

  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function normalizeBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value

  const normalized = String(value || "")
    .trim()
    .toLowerCase()

  if (["true", "1", "si", "sí", "activo", "activa", "enabled", "on"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "inactivo", "inactiva", "disabled", "off"].includes(normalized)) {
    return false
  }

  return fallback
}

function normalizeInventoryPayload(source: Record<string, unknown>): SaveInventoryItemInput {
  return {
    id: String(source.id || "").trim() || undefined,
    name: String(source.name || "").trim(),
    category: String(source.category || "General").trim() || "General",
    quantity: normalizeNumber(source.quantity),
    unit: String(source.unit || "unidades").trim() || "unidades",
    minimumStock: normalizeNumber(source.minimumStock),
    costUSD: normalizeNumber(source.costUSD),
    costVES: normalizeNumber(source.costVES),
    equivalentCostUSD: normalizeNumber(source.equivalentCostUSD),
    note: String(source.note || "").trim(),
    isActive: normalizeBoolean(source.isActive, true),
    movementType: String(source.movementType || "").trim() || undefined,
    movementReason: String(source.movementReason || "").trim() || undefined,
    movementNote: String(source.movementNote || "").trim() || undefined,
    relatedExpense: normalizeBoolean(source.relatedExpense, false),
    expenseId: String(source.expenseId || "").trim() || undefined,
  }
}

async function checkInventoryAccess(request: NextRequest, allowedRoles: LocalRole[]) {
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

  const businessConfig = await getBusinessConfigFromAppsScript()
  const inventoryAccess = getModulePlanAccess(businessConfig, "inventory")

  if (!inventoryAccess.includedInPlan) {
    return {
      ok: false as const,
      response: forbiddenResponse(
        `Inventario básico está disponible desde ${inventoryAccess.minimumPlanLabel}.`
      ),
      role: access.role,
    }
  }

  if (!inventoryAccess.effectiveEnabled) {
    return {
      ok: false as const,
      response: forbiddenResponse("Inventario básico está desactivado para este negocio."),
      role: access.role,
    }
  }

  return {
    ok: true as const,
    response: null,
    role: access.role,
    businessConfig,
  }
}

export async function GET(request: NextRequest) {
  try {
    const access = await checkInventoryAccess(request, ["owner", "support"])

    if (!access.ok) {
      return access.response
    }

    const [inventory, inventoryMovements] = await Promise.all([
      getInventoryFromAppsScript(),
      getInventoryMovementsFromAppsScript(),
    ])

    return NextResponse.json({
      ok: true,
      inventory,
      inventoryMovements,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el inventario",
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await checkInventoryAccess(request, ["owner", "support"])

    if (!access.ok) {
      return access.response
    }

    const body = await request.json()
    const rawItem = (body.inventoryItem || body.item || body || {}) as Record<string, unknown>
    const inventoryItemInput = normalizeInventoryPayload(rawItem)

    if (!inventoryItemInput.name) {
      return NextResponse.json(
        {
          error: "Escribe el nombre del producto de inventario",
        },
        {
          status: 400,
        }
      )
    }

    const result = await saveInventoryItemInAppsScript(inventoryItemInput)

    return NextResponse.json({
      ok: true,
      inventoryItem: result.inventoryItem,
      inventoryMovement: result.inventoryMovement,
      message: "Producto de inventario guardado correctamente.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el producto de inventario",
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = await checkInventoryAccess(request, ["owner", "support"])

    if (!access.ok) {
      return access.response
    }

    const itemId = request.nextUrl.searchParams.get("id") || ""

    if (!itemId.trim()) {
      return NextResponse.json(
        {
          error: "Falta el ID del producto de inventario",
        },
        {
          status: 400,
        }
      )
    }

    const result = await deleteInventoryItemInAppsScript(itemId)

    return NextResponse.json({
      ok: true,
      message: result.message,
      inventoryMovement: result.inventoryMovement,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo eliminar el producto de inventario",
      },
      {
        status: 500,
      }
    )
  }
}
