import { NextRequest, NextResponse } from "next/server"
import {
  clearOrdersInAppsScript,
  createOrderInAppsScript,
  getBusinessConfigFromAppsScript,
  getDeliveryZonesFromAppsScript,
  getOrdersFromAppsScript,
  type OrderItem,
} from "@/lib/appsScriptOrders"
import { getLocalAccessFromPassword, type LocalRole } from "@/lib/localAccess"
import { getModulePlanAccess, type LocalModuleKey } from "@/lib/localPlans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteOrderType = "Comer aquí" | "Para llevar" | "Delivery"

function getRequestPassword(request: NextRequest) {
  return (
    request.headers.get("x-local-password") ||
    request.headers.get("x-admin-password") ||
    ""
  )
}

function getAccess(request: NextRequest) {
  return getLocalAccessFromPassword(getRequestPassword(request))
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

function forbiddenResponse(message = "Esta clave no tiene permiso para esta acción") {
  return NextResponse.json(
    {
      error: message,
    },
    {
      status: 403,
    }
  )
}

function checkRole(request: NextRequest, allowedRoles: LocalRole[]) {
  const access = getAccess(request)

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

function getModuleUnavailableMessage(moduleLabel: string, reason: "plan" | "owner") {
  if (reason === "plan") {
    return `${moduleLabel} no está incluido en el plan activo. Solicita activación o sube el plan para usar esta función.`
  }

  return `${moduleLabel} está desactivado desde Configuración del negocio.`
}

async function checkModuleAvailability(moduleKey: LocalModuleKey, moduleLabel: string) {
  const businessConfig = await getBusinessConfigFromAppsScript()
  const moduleAccess = getModulePlanAccess(
    businessConfig as unknown as Record<string, unknown>,
    moduleKey
  )

  if (!moduleAccess.includedInPlan) {
    return {
      ok: false as const,
      response: forbiddenResponse(getModuleUnavailableMessage(moduleLabel, "plan")),
      moduleAccess,
    }
  }

  if (!moduleAccess.effectiveEnabled) {
    return {
      ok: false as const,
      response: forbiddenResponse(getModuleUnavailableMessage(moduleLabel, "owner")),
      moduleAccess,
    }
  }

  return {
    ok: true as const,
    response: null,
    moduleAccess,
  }
}

function getReadModuleForRole(role: LocalRole): LocalModuleKey {
  if (role === "cashier") return "cashier"
  if (role === "kitchen") return "kitchen"
  if (role === "delivery") return "delivery"

  return "mainPanel"
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function getDeliveryZoneOption(
  value: string,
  deliveryZones: Array<{ name: string; costUSD: number; isActive?: boolean }>
) {
  const comparableValue = normalizeComparableText(value)

  return deliveryZones.find(
    (zone) =>
      zone.isActive !== false &&
      normalizeComparableText(zone.name) === comparableValue
  )
}

function cleanText(value: unknown) {
  return String(value || "").trim()
}

function cleanNumber(value: unknown) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function isValidOrderType(value: unknown): value is RouteOrderType {
  return value === "Comer aquí" || value === "Para llevar" || value === "Delivery"
}

function normalizeItems(value: unknown): OrderItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const category = cleanText(item?.category)
      const paymentMode =
        item?.paymentMode === "divisa" || category === "Combos"
          ? "divisa"
          : "mixto"

      return {
        id: cleanNumber(item?.id),
        name: cleanText(item?.name),
        category,
        price: cleanNumber(item?.price),
        image: cleanText(item?.image),
        quantity: cleanNumber(item?.quantity),
        note: cleanText(item?.note),
        noteEnabled: Boolean(item?.noteEnabled),
        paymentMode,
      } satisfies OrderItem
    })
    .filter((item) => item.name && item.quantity > 0 && item.price >= 0)
}

function isComboItem(item: OrderItem) {
  return item.paymentMode === "divisa" || item.category === "Combos"
}

function calculateTotals(
  items: OrderItem[],
  exchangeRate: number,
  deliveryCostUSD: number
) {
  const totals = items.reduce(
    (currentTotals, item) => {
      const subtotal = Number(item.price || 0) * Number(item.quantity || 0)

      if (isComboItem(item)) {
        currentTotals.totalCombosUSD += subtotal
      } else {
        currentTotals.totalRegularUSD += subtotal
      }

      return currentTotals
    },
    {
      totalCombosUSD: 0,
      totalRegularUSD: 0,
    }
  )

  const totalBeforeDeliveryUSD = totals.totalCombosUSD + totals.totalRegularUSD
  const totalRegularVES = totals.totalRegularUSD * exchangeRate
  const totalUSD = totalBeforeDeliveryUSD + deliveryCostUSD

  return {
    totalUSD,
    totalCombosUSD: totals.totalCombosUSD,
    totalRegularUSD: totals.totalRegularUSD,
    totalRegularVES,
    totalBeforeDeliveryUSD,
  }
}

export async function GET(request: NextRequest) {
  try {
    const access = checkRole(request, [
      "owner",
      "manager",
      "cashier",
      "kitchen",
      "delivery",
    ])

    if (!access.ok) {
      return access.response
    }

    const moduleKey = getReadModuleForRole(access.role)
    const moduleCheck = await checkModuleAvailability(moduleKey, "El acceso a pedidos")

    if (!moduleCheck.ok) {
      return moduleCheck.response
    }

    const orders = await getOrdersFromAppsScript()

    return NextResponse.json({
      orders,
      access: {
        role: access.role,
        moduleKey,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los pedidos",
      },
      {
        status: 500,
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const rawOrderType = cleanText(body.orderType)
    const rawTableNumber = cleanText(body.tableNumber)
    const customerName = cleanText(body.customerName) || "Cliente"
    const customerPhone = cleanText(body.customerPhone)
    const deliveryAddress = cleanText(body.deliveryAddress)
    const deliveryReference = cleanText(body.deliveryReference)
    const rawDeliveryZone = cleanText(body.deliveryZone)
    const paymentMethod = cleanText(body.paymentMethod)

    const hasDeliveryData =
      rawOrderType === "Delivery" ||
      rawTableNumber.toLowerCase().startsWith("delivery") ||
      Boolean(customerPhone || deliveryAddress || deliveryReference || rawDeliveryZone)

    const orderType: RouteOrderType = hasDeliveryData
      ? "Delivery"
      : isValidOrderType(rawOrderType)
        ? rawOrderType
        : "Comer aquí"

    const isDeliveryOrder = orderType === "Delivery"

    if (isDeliveryOrder) {
      const deliveryModuleCheck = await checkModuleAvailability(
        "delivery",
        "Delivery"
      )

      if (!deliveryModuleCheck.ok) {
        return deliveryModuleCheck.response
      }
    }

    const deliveryZones = isDeliveryOrder
      ? await getDeliveryZonesFromAppsScript()
      : []

    const selectedDeliveryZone = getDeliveryZoneOption(rawDeliveryZone, deliveryZones)
    const deliveryZone = selectedDeliveryZone?.name || rawDeliveryZone
    const deliveryCostUSD = isDeliveryOrder
      ? Number(selectedDeliveryZone?.costUSD || 0)
      : 0

    const tableNumber = isDeliveryOrder
      ? `Delivery${deliveryZone ? ` - ${deliveryZone}` : ""}`
      : rawTableNumber

    const customerNote = cleanText(body.customerNote)
    const items = normalizeItems(body.items)
    const exchangeRate = cleanNumber(body.exchangeRate)
    const exchangeSource = cleanText(body.exchangeSource)
    const exchangeValueDate = cleanText(body.exchangeValueDate)

    if (!customerName) {
      return NextResponse.json(
        {
          error: "Falta el nombre del cliente",
        },
        {
          status: 400,
        }
      )
    }

    if (!items.length) {
      return NextResponse.json(
        {
          error: "El pedido no tiene productos",
        },
        {
          status: 400,
        }
      )
    }

    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      return NextResponse.json(
        {
          error: "La tasa no es válida",
        },
        {
          status: 400,
        }
      )
    }

    if (!isDeliveryOrder && !tableNumber) {
      return NextResponse.json(
        {
          error: "Falta la mesa o ubicación",
        },
        {
          status: 400,
        }
      )
    }

    if (isDeliveryOrder) {
      if (!customerName || customerName === "Cliente") {
        return NextResponse.json(
          {
            error: "Falta el nombre del cliente para delivery",
          },
          {
            status: 400,
          }
        )
      }

      if (!customerPhone) {
        return NextResponse.json(
          {
            error: "Falta el teléfono para delivery",
          },
          {
            status: 400,
          }
        )
      }

      if (!deliveryAddress) {
        return NextResponse.json(
          {
            error: "Falta la dirección para delivery",
          },
          {
            status: 400,
          }
        )
      }

      if (!deliveryReference) {
        return NextResponse.json(
          {
            error: "Falta el punto de referencia",
          },
          {
            status: 400,
          }
        )
      }

      if (!deliveryZone) {
        return NextResponse.json(
          {
            error: "Falta la zona de delivery",
          },
          {
            status: 400,
          }
        )
      }

      if (!selectedDeliveryZone) {
        return NextResponse.json(
          {
            error: "Selecciona una zona de delivery válida",
          },
          {
            status: 400,
          }
        )
      }

      if (!paymentMethod) {
        return NextResponse.json(
          {
            error: "Falta el método de pago",
          },
          {
            status: 400,
          }
        )
      }

      if (!Number.isFinite(deliveryCostUSD) || deliveryCostUSD < 0) {
        return NextResponse.json(
          {
            error: "El costo de delivery no es válido",
          },
          {
            status: 400,
          }
        )
      }
    }

    const totals = calculateTotals(items, exchangeRate, deliveryCostUSD)

    const orderPayload = {
      customerName,
      customerPhone,
      tableNumber,
      orderType,
      customerNote,
      deliveryAddress,
      deliveryReference,
      deliveryZone,
      paymentMethod,
      deliveryCostUSD,
      totalBeforeDeliveryUSD: totals.totalBeforeDeliveryUSD,
      items,
      exchangeRate,
      exchangeSource,
      exchangeValueDate,
      totalUSD: totals.totalUSD,
      totalCombosUSD: totals.totalCombosUSD,
      totalRegularUSD: totals.totalRegularUSD,
      totalRegularVES: totals.totalRegularVES,
    }

    const order = await createOrderInAppsScript(
      orderPayload as unknown as Parameters<typeof createOrderInAppsScript>[0]
    )

    return NextResponse.json({
      order,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo registrar el pedido",
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = checkRole(request, ["owner", "manager"])

    if (!access.ok) {
      return access.response
    }

    const moduleCheck = await checkModuleAvailability(
      "mainPanel",
      "El panel de pedidos"
    )

    if (!moduleCheck.ok) {
      return moduleCheck.response
    }

    const data = await clearOrdersInAppsScript()

    return NextResponse.json({
      ok: true,
      deleted: data.deleted || 0,
      message: data.message || "Pedidos reiniciados correctamente.",
      access: {
        role: access.role,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron reiniciar los pedidos",
      },
      {
        status: 500,
      }
    )
  }
}
