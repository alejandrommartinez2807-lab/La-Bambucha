import { NextRequest, NextResponse } from "next/server"
import {
  clearDayClosesInAppsScript,
  getBusinessConfigFromAppsScript,
  getDayClosesFromAppsScript,
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

async function checkHistoryModule() {
  const businessConfig = await getBusinessConfigFromAppsScript()
  const historyAccess = getModulePlanAccess(
    businessConfig as unknown as Record<string, unknown>,
    "history"
  )

  if (!historyAccess.includedInPlan) {
    return {
      ok: false as const,
      response: forbiddenResponse(
        "Historial de cierres no está incluido en el plan activo. Solicita activación o sube el plan para revisar cierres guardados."
      ),
      historyAccess,
    }
  }

  if (!historyAccess.effectiveEnabled) {
    return {
      ok: false as const,
      response: forbiddenResponse(
        "Historial de cierres está desactivado desde Configuración del negocio."
      ),
      historyAccess,
    }
  }

  return {
    ok: true as const,
    response: null,
    historyAccess,
  }
}

export async function GET(request: NextRequest) {
  try {
    const access = checkRole(request, ["owner", "manager"])

    if (!access.ok) {
      return access.response
    }

    const historyModule = await checkHistoryModule()

    if (!historyModule.ok) {
      return historyModule.response
    }

    const dayCloses = await getDayClosesFromAppsScript()

    return NextResponse.json({
      dayCloses,
      access: {
        role: access.role,
      },
      moduleAccess: {
        history: {
          includedInPlan: historyModule.historyAccess.includedInPlan,
          enabledByOwner: historyModule.historyAccess.enabledByOwner,
          effectiveEnabled: historyModule.historyAccess.effectiveEnabled,
          planLabel: historyModule.historyAccess.planLabel,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los cierres guardados",
      },
      {
        status: 500,
      }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const access = checkRole(request, ["owner"])

    if (!access.ok) {
      return access.response
    }

    const historyModule = await checkHistoryModule()

    if (!historyModule.ok) {
      return historyModule.response
    }

    const result = await clearDayClosesInAppsScript()

    return NextResponse.json({
      ok: true,
      ...result,
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
            : "No se pudo borrar el historial de cierres",
      },
      {
        status: 500,
      }
    )
  }
}
