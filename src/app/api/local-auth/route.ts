import { NextRequest, NextResponse } from "next/server"
import { getBusinessConfigFromAppsScript } from "@/lib/appsScriptOrders"
import {
  canLocalRoleAccessModule,
  getLocalAccessFromPassword,
  isKnownLocalModuleKey,
  type LocalModuleKey,
} from "@/lib/localAccess"
import { getModulePlanAccess } from "@/lib/localPlans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value > 0

  const normalized = String(value || "").trim().toLowerCase()

  if (
    [
      "true",
      "1",
      "si",
      "sí",
      "activo",
      "activa",
      "activado",
      "activada",
      "visible",
      "habilitado",
      "habilitada",
      "enabled",
      "on",
    ].includes(normalized)
  ) {
    return true
  }

  if (
    [
      "false",
      "0",
      "no",
      "inactivo",
      "inactiva",
      "desactivado",
      "desactivada",
      "oculto",
      "oculta",
      "hidden",
      "disabled",
      "off",
    ].includes(normalized)
  ) {
    return false
  }

  return fallback
}

function readPassword(request: NextRequest) {
  return (
    request.headers.get("x-local-password") ||
    request.headers.get("x-admin-password") ||
    ""
  )
}

function readModuleKey(request: NextRequest): LocalModuleKey {
  const rawModuleKey = request.nextUrl.searchParams.get("moduleKey") || "mainPanel"

  if (isKnownLocalModuleKey(rawModuleKey)) {
    return rawModuleKey
  }

  return "mainPanel"
}

function isModuleEnabled(config: Record<string, unknown>, moduleKey: LocalModuleKey) {
  if (moduleKey === "mainPanel") {
    return true
  }

  if (moduleKey === "settings") {
    return true
  }

  if (moduleKey === "support") {
    return true
  }

  if (moduleKey === "ownerDashboard") {
    return normalizeBoolean(config.ownerDashboardModuleEnabled, true)
  }

  if (moduleKey === "cashier") {
    return normalizeBoolean(config.cashierModuleEnabled, true)
  }

  if (moduleKey === "kitchen") {
    return normalizeBoolean(config.kitchenModuleEnabled, true)
  }

  if (moduleKey === "delivery") {
    return (
      normalizeBoolean(config.deliveryEnabled, true) &&
      normalizeBoolean(config.deliveryModuleEnabled, true)
    )
  }

  if (moduleKey === "history") {
    return normalizeBoolean(config.historyModuleEnabled, true)
  }

  if (moduleKey === "expenses") {
    return normalizeBoolean(config.expensesModuleEnabled, true)
  }

  if (moduleKey === "sounds") {
    return normalizeBoolean(config.soundEnabled, true)
  }

  return true
}

async function handleLocalAuth(request: NextRequest) {
  try {
    const password = readPassword(request)
    const moduleKey = readModuleKey(request)
    const localAccess = getLocalAccessFromPassword(password)

    if (!localAccess.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "Clave no autorizada",
          access: {
            role: null,
            roleLabel: "",
            moduleKey,
            canAccessRole: false,
            moduleEnabled: false,
            includedInPlan: false,
            allowed: false,
          },
        },
        {
          status: 401,
        }
      )
    }

    const businessConfig = await getBusinessConfigFromAppsScript()
    const businessConfigRecord = businessConfig as unknown as Record<string, unknown>

    const planAccess = getModulePlanAccess(businessConfigRecord, moduleKey)
    const includedInPlan = planAccess.includedInPlan
    const moduleEnabled = isModuleEnabled(businessConfigRecord, moduleKey)
    const canAccessRole = canLocalRoleAccessModule(localAccess.role, moduleKey)
    const allowed = includedInPlan && moduleEnabled && canAccessRole

    return NextResponse.json(
      {
        ok: allowed,
        error: allowed
          ? ""
          : !includedInPlan
            ? "Este módulo no está incluido en el plan activo"
            : !moduleEnabled
              ? "Módulo desactivado desde configuración"
              : "Esta clave no tiene acceso a este módulo",
        access: {
          role: localAccess.role,
          roleLabel: localAccess.roleLabel,
          moduleKey,
          canAccessRole,
          moduleEnabled,
          includedInPlan,
          allowed,
          plan: planAccess.plan,
          planLabel: planAccess.planLabel,
          planMode: planAccess.planMode,
          minimumPlan: planAccess.minimumPlan,
          minimumPlanLabel: planAccess.minimumPlanLabel,
        },
        businessConfig: {
          businessName: businessConfig.businessName,
        },
      },
      {
        status: allowed ? 200 : 403,
      }
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo validar el acceso privado",
      },
      {
        status: 500,
      }
    )
  }
}

export async function GET(request: NextRequest) {
  return handleLocalAuth(request)
}

export async function POST(request: NextRequest) {
  return handleLocalAuth(request)
}
