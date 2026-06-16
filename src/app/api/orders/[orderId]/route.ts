import { NextRequest, NextResponse } from "next/server"
import {
  deleteOrderInAppsScript,
  getBusinessConfigFromAppsScript,
  updateOrderDeliveryReportInAppsScript,
  updateOrderStatusInAppsScript,
  type OrderStatus,
} from "@/lib/appsScriptOrders"
import { getLocalAccessFromPassword, type LocalModuleKey, type LocalRole } from "@/lib/localAccess"
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

function isValidStatus(value: unknown): value is OrderStatus {
  return (
    value === "Nuevo" ||
    value === "Preparando" ||
    value === "Listo" ||
    value === "Entregado" ||
    value === "Cancelado"
  )
}

function canRoleUpdateStatus(role: LocalRole, status: OrderStatus) {
  if (role === "owner" || role === "manager") {
    return true
  }

  if (role === "cashier") {
    return (
      status === "Nuevo" ||
      status === "Preparando" ||
      status === "Entregado" ||
      status === "Cancelado"
    )
  }

  if (role === "kitchen") {
    return status === "Preparando" || status === "Listo"
  }

  return false
}

function getStatusModuleForRole(role: LocalRole): LocalModuleKey {
  if (role === "cashier") return "cashier"
  if (role === "kitchen") return "kitchen"

  return "mainPanel"
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const access = getAccess(request)

    if (!access.ok) {
      return unauthorizedResponse()
    }

    const { orderId } = await context.params
    const body = await request.json()

    if (body.action === "reportDelivery") {
      if (!["owner", "manager", "delivery"].includes(access.role)) {
        return forbiddenResponse("Esta clave no puede reportar entregas de delivery")
      }

      const moduleCheck = await checkModuleAvailability("delivery", "Delivery")

      if (!moduleCheck.ok) {
        return moduleCheck.response
      }

      const order = await updateOrderDeliveryReportInAppsScript(orderId)

      return NextResponse.json({
        order,
        access: {
          role: access.role,
          moduleKey: "delivery",
        },
      })
    }

    const status = body.status

    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          error: "Estado inválido",
        },
        {
          status: 400,
        }
      )
    }

    if (!canRoleUpdateStatus(access.role, status)) {
      return forbiddenResponse("Esta clave no puede cambiar el pedido a ese estado")
    }

    const moduleKey = getStatusModuleForRole(access.role)
    const moduleCheck = await checkModuleAvailability(
      moduleKey,
      moduleKey === "cashier"
        ? "Caja"
        : moduleKey === "kitchen"
          ? "Cocina"
          : "El panel de pedidos"
    )

    if (!moduleCheck.ok) {
      return moduleCheck.response
    }

    const order = await updateOrderStatusInAppsScript(orderId, status)

    return NextResponse.json({
      order,
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
            : "No se pudo actualizar el pedido",
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const access = checkRole(request, ["owner"])

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

    const { orderId } = await context.params

    await deleteOrderInAppsScript(orderId)

    return NextResponse.json({
      ok: true,
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
            : "No se pudo eliminar el pedido",
      },
      {
        status: 500,
      }
    )
  }
}
