import { NextRequest, NextResponse } from "next/server"
import {
  getBusinessConfigFromAppsScript,
  saveDayCloseInAppsScript,
  type SaveDayCloseInput,
} from "@/lib/appsScriptOrders"
import { getLocalAccessFromPassword, type LocalRole } from "@/lib/localAccess"
import { getModulePlanAccess } from "@/lib/localPlans"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SaveDayCloseInputWithDeliveryAudit = SaveDayCloseInput & {
  deliveryTotalRegisteredUSD?: number
  deliveryWithPaymentMethodUSD?: number
  deliveryWithoutPaymentMethodUSD?: number
}

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

function forbiddenResponse(message = "Esta clave no tiene permiso para guardar el cierre del día") {
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

function toNumber(value: unknown) {
  const numberValue = Number(value || 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function normalizeSummaryItems(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.map((item) => ({
    label: String(item?.label || "").trim() || "Sin nombre",
    count: toNumber(item?.count),
    totalUSD: toNumber(item?.totalUSD),
    totalVES: toNumber(item?.totalVES),
    totalCombosUSD: toNumber(item?.totalCombosUSD),
    totalRegularUSD: toNumber(item?.totalRegularUSD),
    totalRegularVES: toNumber(item?.totalRegularVES),
    deliveryCostUSD: toNumber(item?.deliveryCostUSD),
  }))
}

function normalizeProductsSold(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.map((item) => ({
    name: String(item?.name || "").trim() || "Producto",
    quantity: toNumber(item?.quantity),
    totalUSD: toNumber(item?.totalUSD),
    totalVES: toNumber(item?.totalVES),
    onlyCurrency: Boolean(item?.onlyCurrency),
  }))
}

function normalizeExpenses(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.map((item) => ({
    id: String(item?.id || "").trim(),
    dateLabel: String(item?.dateLabel || "").trim(),
    dateValue: String(item?.dateValue || "").trim(),
    concept: String(item?.concept || "").trim() || "Gasto",
    category: String(item?.category || "Otros").trim() || "Otros",
    amountUSD: toNumber(item?.amountUSD),
    amountVES: toNumber(item?.amountVES),
    equivalentUSD: toNumber(item?.equivalentUSD),
    method: String(item?.method || "Sin registrar").trim() || "Sin registrar",
    note: String(item?.note || "").trim(),
    createdAt: String(item?.createdAt || "").trim(),
  }))
}

export async function POST(request: NextRequest) {
  try {
    const access = checkRole(request, ["owner", "manager"])

    if (!access.ok) {
      return access.response
    }

    const businessConfig = await getBusinessConfigFromAppsScript()
    const businessConfigRecord =
      businessConfig as unknown as Record<string, unknown>

    const historyAccess = getModulePlanAccess(businessConfigRecord, "history")

    if (!historyAccess.includedInPlan) {
      return forbiddenResponse(
        "Historial de cierres no está incluido en el plan activo. Solicita activación o sube el plan para guardar cierres."
      )
    }

    if (!historyAccess.effectiveEnabled) {
      return forbiddenResponse(
        "Historial de cierres está desactivado desde Configuración del negocio."
      )
    }

    const cashierAccess = getModulePlanAccess(businessConfigRecord, "cashier")
    const deliveryAccess = getModulePlanAccess(businessConfigRecord, "delivery")
    const expensesAccess = getModulePlanAccess(businessConfigRecord, "expenses")

    const canIncludeCashierAudit = cashierAccess.effectiveEnabled
    const canIncludeDeliveryAudit = deliveryAccess.effectiveEnabled
    const canIncludeExpensesAudit = expensesAccess.effectiveEnabled

    const body = await request.json()
    const rawDayClose = body.dayClose || body.closeSummary || body

    const summaryText = String(rawDayClose.summaryText || "").trim()

    if (!summaryText) {
      return NextResponse.json(
        {
          error: "Falta el resumen del cierre",
        },
        {
          status: 400,
        }
      )
    }

    const dayClose: SaveDayCloseInputWithDeliveryAudit = {
      id: String(rawDayClose.id || "").trim() || undefined,
      createdAt: String(rawDayClose.createdAt || "").trim() || undefined,
      dateLabel: String(rawDayClose.dateLabel || "").trim(),
      summaryText,

      ordersRegistered: toNumber(rawDayClose.ordersRegistered),
      activeOrders: toNumber(rawDayClose.activeOrders),
      deliveredOrders: toNumber(rawDayClose.deliveredOrders),
      canceledOrders: toNumber(rawDayClose.canceledOrders),
      deliveryRegistered: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryRegistered)
        : 0,
      deliveryDelivered: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryDelivered)
        : 0,
      deliveryActive: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryActive)
        : 0,

      totalConfirmedUSD: toNumber(rawDayClose.totalConfirmedUSD),
      productSalesUSD: toNumber(rawDayClose.productSalesUSD),
      combosUSD: toNumber(rawDayClose.combosUSD),
      regularUSD: toNumber(rawDayClose.regularUSD),
      regularVES: toNumber(rawDayClose.regularVES),
      deliveryCollectedUSD: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryCollectedUSD)
        : 0,

      pendingTotalUSD: toNumber(rawDayClose.pendingTotalUSD),
      pendingCombosUSD: toNumber(rawDayClose.pendingCombosUSD),
      pendingRegularUSD: toNumber(rawDayClose.pendingRegularUSD),
      pendingRegularVES: toNumber(rawDayClose.pendingRegularVES),
      pendingDeliveryUSD: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.pendingDeliveryUSD)
        : 0,

      totalSoldUSD: canIncludeCashierAudit
        ? toNumber(rawDayClose.totalSoldUSD)
        : 0,
      realCollectedUSD: canIncludeCashierAudit
        ? toNumber(rawDayClose.realCollectedUSD)
        : 0,
      realCashUSD: canIncludeCashierAudit
        ? toNumber(rawDayClose.realCashUSD)
        : 0,
      realVES: canIncludeCashierAudit
        ? toNumber(rawDayClose.realVES)
        : 0,
      realVESEquivalentUSD: canIncludeCashierAudit
        ? toNumber(rawDayClose.realVESEquivalentUSD)
        : 0,
      realPendingUSD: canIncludeCashierAudit
        ? toNumber(rawDayClose.realPendingUSD)
        : 0,
      paidOrders: canIncludeCashierAudit
        ? toNumber(rawDayClose.paidOrders)
        : 0,
      partialPaymentOrders: canIncludeCashierAudit
        ? toNumber(rawDayClose.partialPaymentOrders)
        : 0,
      pendingPaymentOrders: canIncludeCashierAudit
        ? toNumber(rawDayClose.pendingPaymentOrders)
        : 0,

      deliveryTotalRegisteredUSD: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryTotalRegisteredUSD)
        : 0,
      deliveryWithPaymentMethodUSD: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryWithPaymentMethodUSD)
        : 0,
      deliveryWithoutPaymentMethodUSD: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryWithoutPaymentMethodUSD)
        : 0,
      deliveryPaidInUSD: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryPaidInUSD)
        : 0,
      deliveryPaidInVES: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryPaidInVES)
        : 0,
      deliveryPaidInVESEquivalentUSD: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryPaidInVESEquivalentUSD)
        : 0,
      deliveryPaidMixedUSD: canIncludeDeliveryAudit
        ? toNumber(rawDayClose.deliveryPaidMixedUSD)
        : 0,

      expensesCount: canIncludeExpensesAudit
        ? toNumber(rawDayClose.expensesCount)
        : 0,
      expensesTotalUSD: canIncludeExpensesAudit
        ? toNumber(rawDayClose.expensesTotalUSD)
        : 0,
      expensesCashUSD: canIncludeExpensesAudit
        ? toNumber(rawDayClose.expensesCashUSD)
        : 0,
      expensesVES: canIncludeExpensesAudit
        ? toNumber(rawDayClose.expensesVES)
        : 0,
      expensesVESEquivalentUSD: canIncludeExpensesAudit
        ? toNumber(rawDayClose.expensesVESEquivalentUSD)
        : 0,
      netEstimatedUSD: canIncludeExpensesAudit
        ? toNumber(rawDayClose.netEstimatedUSD)
        : canIncludeCashierAudit
          ? toNumber(rawDayClose.realCollectedUSD)
          : 0,
      expenses: canIncludeExpensesAudit
        ? normalizeExpenses(rawDayClose.expenses)
        : [],

      salesByType: normalizeSummaryItems(rawDayClose.salesByType),
      deliveryByPayment: canIncludeDeliveryAudit
        ? normalizeSummaryItems(rawDayClose.deliveryByPayment)
        : [],
      deliveryByZone: canIncludeDeliveryAudit
        ? normalizeSummaryItems(rawDayClose.deliveryByZone)
        : [],
      paymentByStatus: canIncludeCashierAudit
        ? normalizeSummaryItems(rawDayClose.paymentByStatus)
        : [],
      paymentByUSDMethod: canIncludeCashierAudit
        ? normalizeSummaryItems(rawDayClose.paymentByUSDMethod)
        : [],
      paymentByVESMethod: canIncludeCashierAudit
        ? normalizeSummaryItems(rawDayClose.paymentByVESMethod)
        : [],
      deliveryByPaymentIn: canIncludeDeliveryAudit
        ? normalizeSummaryItems(rawDayClose.deliveryByPaymentIn)
        : [],
      productsSold: normalizeProductsSold(rawDayClose.productsSold),
    }

    const savedDayClose = await saveDayCloseInAppsScript(dayClose)

    return NextResponse.json({
      ok: true,
      dayClose: savedDayClose,
      message: "Cierre guardado correctamente.",
      access: {
        role: access.role,
        moduleKey: "history",
      },
      modules: {
        cashierAuditIncluded: canIncludeCashierAudit,
        deliveryAuditIncluded: canIncludeDeliveryAudit,
        expensesAuditIncluded: canIncludeExpensesAudit,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el cierre del día",
      },
      {
        status: 500,
      }
    )
  }
}
