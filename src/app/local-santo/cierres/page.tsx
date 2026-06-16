"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LogIn,
  Printer,
  RefreshCw,
  Search,
  X,
} from "lucide-react"
import { formatUSD, formatVES } from "@/utils/formatCurrency"
import ModuleAccessGuard from "@/components/ModuleAccessGuard"

const ADMIN_STORAGE_KEY = "la_bambucha_premium_owner_session"
const VIEW_MODE_STORAGE_KEY = "la_bambucha_premium_closes_view_mode"

type SummaryItem = {
  label: string
  count: number
  totalUSD: number
  totalVES?: number
  deliveryCostUSD?: number
  totalCombosUSD?: number
  totalRegularUSD?: number
  totalRegularVES?: number
}

type ProductSold = {
  name: string
  quantity: number
  totalUSD: number
  totalVES: number
  onlyCurrency: boolean
}

type DayCloseExpense = {
  id?: string
  dateLabel?: string
  dateValue?: string
  concept: string
  category: string
  amountUSD: number
  amountVES: number
  equivalentUSD: number
  method: string
  note?: string
  createdAt?: string

  provider?: string
  expenseType?: string
  inventoryLinked?: boolean
  inventoryItemId?: string
  inventoryItemName?: string
  inventoryQuantity?: number
  inventoryUnit?: string
}

type SavedDayClose = {
  id: string
  createdAt: string
  dateLabel: string
  summaryText: string

  ordersRegistered: number
  activeOrders: number
  deliveredOrders: number
  canceledOrders: number
  deliveryRegistered: number
  deliveryDelivered: number
  deliveryActive: number

  totalConfirmedUSD: number
  productSalesUSD: number
  combosUSD: number
  regularUSD: number
  regularVES: number
  deliveryCollectedUSD: number

  pendingTotalUSD: number
  pendingCombosUSD: number
  pendingRegularUSD: number
  pendingRegularVES: number
  pendingDeliveryUSD: number

  totalSoldUSD: number
  realCollectedUSD: number
  realCashUSD: number
  realVES: number
  realVESEquivalentUSD: number
  realPendingUSD: number
  paidOrders: number
  partialPaymentOrders: number
  pendingPaymentOrders: number
  deliveryPaidInUSD: number
  deliveryPaidInVES: number
  deliveryPaidInVESEquivalentUSD: number
  deliveryPaidMixedUSD: number

  expensesCount: number
  expensesTotalUSD: number
  expensesCashUSD: number
  expensesVES: number
  expensesVESEquivalentUSD: number
  netEstimatedUSD: number
  expenses: DayCloseExpense[]

  salesByType: SummaryItem[]
  deliveryByPayment: SummaryItem[]
  deliveryByZone: SummaryItem[]
  paymentByStatus: SummaryItem[]
  paymentByUSDMethod: SummaryItem[]
  paymentByVESMethod: SummaryItem[]
  deliveryByPaymentIn: SummaryItem[]
  productsSold: ProductSold[]
}

type LoginBoxProps = {
  passwordInput: string
  setPasswordInput: (value: string) => void
  showPassword: boolean
  setShowPassword: (value: boolean) => void
  handleLogin: () => void
  errorMessage: string | null
}

type PaymentFilter =
  | "Todos"
  | "Con cobro completo"
  | "Con pendiente"
  | "Con pago parcial"
  | "Sin cobros"

const PAYMENT_FILTERS: PaymentFilter[] = [
  "Todos",
  "Con cobro completo",
  "Con pendiente",
  "Con pago parcial",
  "Sin cobros",
]

type ReportViewMode = "Simple" | "Negocio" | "Avanzado"

const REPORT_VIEW_MODES: {
  mode: ReportViewMode
  label: string
  description: string
}[] = [
  {
    mode: "Simple",
    label: "Simple",
    description: "Solo números clave, ranking principal y lista de cierres.",
  },
  {
    mode: "Negocio",
    label: "Negocio",
    description: "Agrega alertas y gráficas útiles para revisar el local.",
  },
  {
    mode: "Avanzado",
    label: "Avanzado",
    description: "Muestra auditoría completa, métodos, productos, zonas y texto guardado.",
  },
]

function isReportViewMode(value: unknown): value is ReportViewMode {
  return value === "Simple" || value === "Negocio" || value === "Avanzado"
}

type SmartAlertTone = "danger" | "warning" | "good" | "info"

type SmartAlert = {
  title: string
  description: string
  tone: SmartAlertTone
  value?: string
}

function readApiResponse(response: Response) {
  return response.text().then((text) => {
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(
        "El servidor respondió con una página HTML en vez de datos. Revisa que la API de cierres y el Apps Script estén funcionando correctamente."
      )
    }
  })
}

function toNumber(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue)) {
    return 0
  }

  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function toText(value: unknown) {
  return String(value || "")
}

function toBoolean(value: unknown) {
  if (typeof value === "boolean") return value

  const normalized = toText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()

  return (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "si" ||
    normalized === "sí" ||
    normalized === "activo" ||
    normalized === "activa"
  )
}

function normalizeSummaryItem(value: unknown): SummaryItem | null {
  if (!value || typeof value !== "object") return null

  const item = value as Record<string, unknown>
  const label = toText(item.label || item.name || "Sin dato")

  return {
    label: label.trim() || "Sin dato",
    count: toNumber(item.count),
    totalUSD: toNumber(item.totalUSD),
    totalVES: toNumber(item.totalVES),
    deliveryCostUSD: toNumber(item.deliveryCostUSD),
    totalCombosUSD: toNumber(item.totalCombosUSD),
    totalRegularUSD: toNumber(item.totalRegularUSD),
    totalRegularVES: toNumber(item.totalRegularVES),
  }
}

function normalizeSummaryArray(value: unknown): SummaryItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizeSummaryItem)
    .filter((item): item is SummaryItem => Boolean(item))
}

function normalizeProductSold(value: unknown): ProductSold | null {
  if (!value || typeof value !== "object") return null

  const product = value as Record<string, unknown>
  const name = toText(product.name || "Producto")

  return {
    name: name.trim() || "Producto",
    quantity: toNumber(product.quantity),
    totalUSD: toNumber(product.totalUSD),
    totalVES: toNumber(product.totalVES),
    onlyCurrency: Boolean(product.onlyCurrency),
  }
}

function normalizeProductsSold(value: unknown): ProductSold[] {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizeProductSold)
    .filter((product): product is ProductSold => Boolean(product))
}

function normalizeDayCloseExpense(value: unknown): DayCloseExpense | null {
  if (!value || typeof value !== "object") return null

  const expense = value as Record<string, unknown>
  const concept = toText(expense.concept || expense.name || "Gasto")
  const category = toText(expense.category || "Sin categoría")
  const method = toText(expense.method || "Sin método")

  return {
    id: toText(expense.id),
    dateLabel: toText(expense.dateLabel),
    dateValue: toText(expense.dateValue),
    concept: concept.trim() || "Gasto",
    category: category.trim() || "Sin categoría",
    amountUSD: toNumber(expense.amountUSD),
    amountVES: toNumber(expense.amountVES),
    equivalentUSD: toNumber(expense.equivalentUSD),
    method: method.trim() || "Sin método",
    note: toText(expense.note),
    createdAt: toText(expense.createdAt),

    provider: toText(expense.provider || expense.supplier).trim(),
    expenseType:
      toText(expense.expenseType || expense.type).trim() || "Gasto operativo",
    inventoryLinked:
      toBoolean(expense.inventoryLinked) ||
      toBoolean(expense.relatedInventory) ||
      Boolean(
        toText(expense.inventoryItemId).trim() ||
          toText(expense.inventoryItemName).trim() ||
          toNumber(expense.inventoryQuantity) > 0
      ),
    inventoryItemId: toText(expense.inventoryItemId).trim(),
    inventoryItemName: toText(expense.inventoryItemName).trim(),
    inventoryQuantity: toNumber(expense.inventoryQuantity),
    inventoryUnit: toText(expense.inventoryUnit).trim() || "unidades",
  }
}

function normalizeDayCloseExpenses(value: unknown): DayCloseExpense[] {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizeDayCloseExpense)
    .filter((expense): expense is DayCloseExpense => Boolean(expense))
}

function normalizeDayClose(value: unknown): SavedDayClose | null {
  if (!value || typeof value !== "object") return null

  const close = value as Record<string, unknown>
  const id = toText(close.id || close.closeId || "").trim()

  if (!id) return null

  return {
    id,
    createdAt: toText(close.createdAt),
    dateLabel: toText(close.dateLabel),
    summaryText: toText(close.summaryText),

    ordersRegistered: toNumber(close.ordersRegistered),
    activeOrders: toNumber(close.activeOrders),
    deliveredOrders: toNumber(close.deliveredOrders),
    canceledOrders: toNumber(close.canceledOrders),
    deliveryRegistered: toNumber(close.deliveryRegistered),
    deliveryDelivered: toNumber(close.deliveryDelivered),
    deliveryActive: toNumber(close.deliveryActive),

    totalConfirmedUSD: toNumber(close.totalConfirmedUSD),
    productSalesUSD: toNumber(close.productSalesUSD),
    combosUSD: toNumber(close.combosUSD),
    regularUSD: toNumber(close.regularUSD),
    regularVES: toNumber(close.regularVES),
    deliveryCollectedUSD: toNumber(close.deliveryCollectedUSD),

    pendingTotalUSD: toNumber(close.pendingTotalUSD),
    pendingCombosUSD: toNumber(close.pendingCombosUSD),
    pendingRegularUSD: toNumber(close.pendingRegularUSD),
    pendingRegularVES: toNumber(close.pendingRegularVES),
    pendingDeliveryUSD: toNumber(close.pendingDeliveryUSD),

    totalSoldUSD: toNumber(close.totalSoldUSD),
    realCollectedUSD: toNumber(close.realCollectedUSD),
    realCashUSD: toNumber(close.realCashUSD),
    realVES: toNumber(close.realVES),
    realVESEquivalentUSD: toNumber(close.realVESEquivalentUSD),
    realPendingUSD: toNumber(close.realPendingUSD),
    paidOrders: toNumber(close.paidOrders),
    partialPaymentOrders: toNumber(close.partialPaymentOrders),
    pendingPaymentOrders: toNumber(close.pendingPaymentOrders),
    deliveryPaidInUSD: toNumber(close.deliveryPaidInUSD),
    deliveryPaidInVES: toNumber(close.deliveryPaidInVES),
    deliveryPaidInVESEquivalentUSD: toNumber(close.deliveryPaidInVESEquivalentUSD),
    deliveryPaidMixedUSD: toNumber(close.deliveryPaidMixedUSD),

    expensesCount: toNumber(close.expensesCount),
    expensesTotalUSD: toNumber(close.expensesTotalUSD),
    expensesCashUSD: toNumber(close.expensesCashUSD),
    expensesVES: toNumber(close.expensesVES),
    expensesVESEquivalentUSD: toNumber(close.expensesVESEquivalentUSD),
    netEstimatedUSD: toNumber(close.netEstimatedUSD),
    expenses: normalizeDayCloseExpenses(close.expenses),

    salesByType: normalizeSummaryArray(close.salesByType),
    deliveryByPayment: normalizeSummaryArray(close.deliveryByPayment),
    deliveryByZone: normalizeSummaryArray(close.deliveryByZone),
    paymentByStatus: normalizeSummaryArray(close.paymentByStatus),
    paymentByUSDMethod: normalizeSummaryArray(close.paymentByUSDMethod),
    paymentByVESMethod: normalizeSummaryArray(close.paymentByVESMethod),
    deliveryByPaymentIn: normalizeSummaryArray(close.deliveryByPaymentIn),
    productsSold: normalizeProductsSold(close.productsSold),
  }
}

function normalizeDayCloses(value: unknown): SavedDayClose[] {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizeDayClose)
    .filter((close): close is SavedDayClose => Boolean(close))
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()

      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
      if (Number.isNaN(aTime)) return 1
      if (Number.isNaN(bTime)) return -1

      return bTime - aTime
    })
}

function formatDate(value: string) {
  if (!value) return "Sin fecha guardada"

  try {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    return new Intl.DateTimeFormat("es-VE", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Caracas",
    }).format(date)
  } catch {
    return value
  }
}

function getCloseTitle(close: SavedDayClose) {
  return close.dateLabel || formatDate(close.createdAt) || close.id
}

function getCloseNetEstimatedUSD(close: SavedDayClose) {
  const calculatedNet = close.realCollectedUSD - close.expensesTotalUSD

  if (close.expensesTotalUSD <= 0 && close.netEstimatedUSD <= 0) {
    return calculatedNet
  }

  return close.netEstimatedUSD || calculatedNet
}

function getClosePaymentState(close: SavedDayClose) {
  const hasSoldAmount = close.totalSoldUSD > 0
  const hasCollectedAmount = close.realCollectedUSD > 0
  const hasPendingAmount = close.realPendingUSD > 0

  if (!hasSoldAmount && !hasCollectedAmount && !hasPendingAmount) {
    return {
      label: "Sin cobros",
      className: "border-[#a00000]/25 bg-white text-[#3a0000]/70",
    }
  }

  if (!hasCollectedAmount && hasPendingAmount) {
    return {
      label: "Sin cobro",
      className: "border-red-500 bg-red-50 text-red-700",
    }
  }

  if (close.partialPaymentOrders > 0) {
    return {
      label: "Pago parcial",
      className: "border-yellow-400 bg-yellow-100 text-[#8a5a00]",
    }
  }

  if (hasPendingAmount) {
    return {
      label: "Con pendiente",
      className: "border-yellow-400 bg-yellow-100 text-[#8a5a00]",
    }
  }

  if (hasSoldAmount && hasCollectedAmount) {
    return {
      label: "Cobro completo",
      className: "border-green-500 bg-green-50 text-green-700",
    }
  }

  return {
    label: "Sin cobros",
    className: "border-[#a00000]/25 bg-white text-[#3a0000]/70",
  }
}

function matchesPaymentFilter(close: SavedDayClose, filter: PaymentFilter) {
  if (filter === "Todos") return true

  if (filter === "Con cobro completo") {
    return close.realPendingUSD <= 0 && close.realCollectedUSD > 0
  }

  if (filter === "Con pendiente") {
    return close.realPendingUSD > 0
  }

  if (filter === "Con pago parcial") {
    return close.partialPaymentOrders > 0
  }

  if (filter === "Sin cobros") {
    return close.realCollectedUSD <= 0
  }

  return true
}

function getDayCloseTotals(dayCloses: SavedDayClose[]) {
  return dayCloses.reduce(
    (totals, close) => {
      totals.cierres += 1
      totals.totalSoldUSD += close.totalSoldUSD
      totals.realCollectedUSD += close.realCollectedUSD
      totals.realPendingUSD += close.realPendingUSD
      totals.realCashUSD += close.realCashUSD
      totals.realVES += close.realVES
      totals.realVESEquivalentUSD += close.realVESEquivalentUSD
      totals.deliveryCollectedUSD += close.deliveryCollectedUSD
      totals.expensesCount += close.expensesCount
      totals.expensesTotalUSD += close.expensesTotalUSD
      totals.expensesCashUSD += close.expensesCashUSD
      totals.expensesVES += close.expensesVES
      totals.expensesVESEquivalentUSD += close.expensesVESEquivalentUSD
      totals.netEstimatedUSD += getCloseNetEstimatedUSD(close)
      totals.paidOrders += close.paidOrders
      totals.partialPaymentOrders += close.partialPaymentOrders
      totals.pendingPaymentOrders += close.pendingPaymentOrders

      return totals
    },
    {
      cierres: 0,
      totalSoldUSD: 0,
      realCollectedUSD: 0,
      realPendingUSD: 0,
      realCashUSD: 0,
      realVES: 0,
      realVESEquivalentUSD: 0,
      deliveryCollectedUSD: 0,
      expensesCount: 0,
      expensesTotalUSD: 0,
      expensesCashUSD: 0,
      expensesVES: 0,
      expensesVESEquivalentUSD: 0,
      netEstimatedUSD: 0,
      paidOrders: 0,
      partialPaymentOrders: 0,
      pendingPaymentOrders: 0,
    }
  )
}

function getDateKeyInCaracas(value: string) {
  if (!value) return ""

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ""

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)

  const year = parts.find((part) => part.type === "year")?.value || "0000"
  const month = parts.find((part) => part.type === "month")?.value || "00"
  const day = parts.find((part) => part.type === "day")?.value || "00"

  return `${year}-${month}-${day}`
}

function isCloseInsideDateRange(close: SavedDayClose, startDate: string, endDate: string) {
  if (!startDate && !endDate) return true

  const closeDateKey = getDateKeyInCaracas(close.createdAt)

  if (!closeDateKey) return false
  if (startDate && closeDateKey < startDate) return false
  if (endDate && closeDateKey > endDate) return false

  return true
}

function getTodayDateInputValue() {
  return getDateKeyInCaracas(new Date().toISOString())
}

function getDateInputValueDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)

  return getDateKeyInCaracas(date.toISOString())
}

function combineSummaryItems(items: SummaryItem[]) {
  const summaryMap = new Map<string, SummaryItem>()

  items.forEach((item) => {
    const label = item.label.trim() || "Sin dato"
    const current = summaryMap.get(label) || {
      label,
      count: 0,
      totalUSD: 0,
      totalVES: 0,
      deliveryCostUSD: 0,
      totalCombosUSD: 0,
      totalRegularUSD: 0,
      totalRegularVES: 0,
    }

    current.count += toNumber(item.count)
    current.totalUSD += toNumber(item.totalUSD)
    current.totalVES = toNumber(current.totalVES) + toNumber(item.totalVES)
    current.deliveryCostUSD =
      toNumber(current.deliveryCostUSD) + toNumber(item.deliveryCostUSD)
    current.totalCombosUSD =
      toNumber(current.totalCombosUSD) + toNumber(item.totalCombosUSD)
    current.totalRegularUSD =
      toNumber(current.totalRegularUSD) + toNumber(item.totalRegularUSD)
    current.totalRegularVES =
      toNumber(current.totalRegularVES) + toNumber(item.totalRegularVES)

    summaryMap.set(label, current)
  })

  return Array.from(summaryMap.values())
    .map((item) => ({
      ...item,
      count: toNumber(item.count),
      totalUSD: toNumber(item.totalUSD),
      totalVES: toNumber(item.totalVES),
      deliveryCostUSD: toNumber(item.deliveryCostUSD),
      totalCombosUSD: toNumber(item.totalCombosUSD),
      totalRegularUSD: toNumber(item.totalRegularUSD),
      totalRegularVES: toNumber(item.totalRegularVES),
    }))
    .sort((a, b) => {
      if (b.totalUSD !== a.totalUSD) return b.totalUSD - a.totalUSD
      return b.count - a.count
    })
}

function combineProductsSold(products: ProductSold[]) {
  const productMap = new Map<string, ProductSold>()

  products.forEach((product) => {
    const name = product.name.trim() || "Producto"
    const current = productMap.get(name) || {
      name,
      quantity: 0,
      totalUSD: 0,
      totalVES: 0,
      onlyCurrency: true,
    }

    current.quantity += toNumber(product.quantity)
    current.totalUSD += toNumber(product.totalUSD)
    current.totalVES += toNumber(product.totalVES)
    current.onlyCurrency = current.onlyCurrency && Boolean(product.onlyCurrency)

    productMap.set(name, current)
  })

  return Array.from(productMap.values())
    .map((product) => ({
      ...product,
      quantity: toNumber(product.quantity),
      totalUSD: toNumber(product.totalUSD),
      totalVES: toNumber(product.totalVES),
    }))
    .sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity
      return b.totalUSD - a.totalUSD
    })
}

function combineExpensesByField(
  expenses: DayCloseExpense[],
  field: "category" | "method" | "provider" | "expenseType"
) {
  const summaryMap = new Map<string, SummaryItem>()

  expenses.forEach((expense) => {
    const fallbackLabel =
      field === "provider"
        ? "Sin proveedor"
        : field === "expenseType"
          ? "Sin tipo"
          : "Sin dato"
    const label = (expense[field] || fallbackLabel).trim() || fallbackLabel
    const current = summaryMap.get(label) || {
      label,
      count: 0,
      totalUSD: 0,
      totalVES: 0,
      deliveryCostUSD: 0,
      totalCombosUSD: 0,
      totalRegularUSD: 0,
      totalRegularVES: 0,
    }

    current.count += 1
    current.totalUSD += toNumber(expense.equivalentUSD)
    current.totalVES = toNumber(current.totalVES) + toNumber(expense.amountVES)

    summaryMap.set(label, current)
  })

  return Array.from(summaryMap.values())
    .map((item) => ({
      ...item,
      count: toNumber(item.count),
      totalUSD: toNumber(item.totalUSD),
      totalVES: toNumber(item.totalVES),
    }))
    .sort((a, b) => {
      if (b.totalUSD !== a.totalUSD) return b.totalUSD - a.totalUSD
      return b.count - a.count
    })
}

function getInventoryExpenseTotals(expenses: DayCloseExpense[]) {
  return expenses.reduce(
    (totals, expense) => {
      const isInventoryLinked =
        Boolean(expense.inventoryLinked) ||
        Boolean(expense.inventoryItemId) ||
        Boolean(expense.inventoryItemName) ||
        toNumber(expense.inventoryQuantity) > 0

      if (!isInventoryLinked) {
        return totals
      }

      totals.count += 1
      totals.totalUSD += toNumber(expense.equivalentUSD)
      totals.totalVES += toNumber(expense.amountVES)

      return totals
    },
    {
      count: 0,
      totalUSD: 0,
      totalVES: 0,
    }
  )
}

function getRangeReport(dayCloses: SavedDayClose[]) {
  const allProducts = combineProductsSold(
    dayCloses.flatMap((close) => close.productsSold)
  )
  const deliveryByZone = combineSummaryItems(
    dayCloses.flatMap((close) => close.deliveryByZone)
  )
  const paymentByUSDMethod = combineSummaryItems(
    dayCloses.flatMap((close) => close.paymentByUSDMethod)
  )
  const paymentByVESMethod = combineSummaryItems(
    dayCloses.flatMap((close) => close.paymentByVESMethod)
  )
  const paymentByStatus = combineSummaryItems(
    dayCloses.flatMap((close) => close.paymentByStatus)
  )
  const deliveryByPaymentIn = combineSummaryItems(
    dayCloses.flatMap((close) => close.deliveryByPaymentIn)
  )
  const salesByType = combineSummaryItems(
    dayCloses.flatMap((close) => close.salesByType)
  )
  const allExpenses = dayCloses.flatMap((close) => close.expenses)
  const expensesByCategory = combineExpensesByField(allExpenses, "category")
  const expensesByMethod = combineExpensesByField(allExpenses, "method")
  const expensesByProvider = combineExpensesByField(allExpenses, "provider")
  const expensesByType = combineExpensesByField(allExpenses, "expenseType")
  const inventoryExpenses = getInventoryExpenseTotals(allExpenses)

  const operationalTotals = dayCloses.reduce(
    (totals, close) => {
      totals.ordersRegistered += close.ordersRegistered
      totals.deliveredOrders += close.deliveredOrders
      totals.activeOrders += close.activeOrders
      totals.canceledOrders += close.canceledOrders
      totals.deliveryRegistered += close.deliveryRegistered
      totals.deliveryDelivered += close.deliveryDelivered
      totals.deliveryActive += close.deliveryActive
      totals.totalConfirmedUSD += close.totalConfirmedUSD
      totals.productSalesUSD += close.productSalesUSD
      totals.combosUSD += close.combosUSD
      totals.regularUSD += close.regularUSD
      totals.regularVES += close.regularVES
      totals.deliveryCollectedUSD += close.deliveryCollectedUSD
      totals.pendingTotalUSD += close.pendingTotalUSD
      totals.pendingCombosUSD += close.pendingCombosUSD
      totals.pendingRegularUSD += close.pendingRegularUSD
      totals.pendingRegularVES += close.pendingRegularVES
      totals.pendingDeliveryUSD += close.pendingDeliveryUSD

      return totals
    },
    {
      ordersRegistered: 0,
      deliveredOrders: 0,
      activeOrders: 0,
      canceledOrders: 0,
      deliveryRegistered: 0,
      deliveryDelivered: 0,
      deliveryActive: 0,
      totalConfirmedUSD: 0,
      productSalesUSD: 0,
      combosUSD: 0,
      regularUSD: 0,
      regularVES: 0,
      deliveryCollectedUSD: 0,
      pendingTotalUSD: 0,
      pendingCombosUSD: 0,
      pendingRegularUSD: 0,
      pendingRegularVES: 0,
      pendingDeliveryUSD: 0,
    }
  )

  return {
    allProducts,
    topProduct: allProducts[0],
    deliveryByZone,
    topDeliveryZone: deliveryByZone[0],
    paymentByUSDMethod,
    topUSDMethod: paymentByUSDMethod[0],
    paymentByVESMethod,
    topVESMethod: paymentByVESMethod[0],
    paymentByStatus,
    deliveryByPaymentIn,
    topDeliveryPaymentIn: deliveryByPaymentIn[0],
    salesByType,
    allExpenses,
    expensesByCategory,
    topExpenseCategory: expensesByCategory[0],
    expensesByMethod,
    topExpenseMethod: expensesByMethod[0],
    expensesByProvider,
    topExpenseProvider: expensesByProvider[0],
    expensesByType,
    topExpenseType: expensesByType[0],
    inventoryExpenses: {
      count: toNumber(inventoryExpenses.count),
      totalUSD: toNumber(inventoryExpenses.totalUSD),
      totalVES: toNumber(inventoryExpenses.totalVES),
    },
    operationalTotals,
  }
}

function normalizeAlertText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function findSummaryItemByLabel(items: SummaryItem[], keywords: string[]) {
  return items.find((item) => {
    const label = normalizeAlertText(item.label)

    return keywords.some((keyword) => label.includes(normalizeAlertText(keyword)))
  })
}

function getRangeAlerts(
  dayCloses: SavedDayClose[],
  totals: ReturnType<typeof getDayCloseTotals>,
  report: ReturnType<typeof getRangeReport>
): SmartAlert[] {
  if (!dayCloses.length) {
    return [
      {
        title: "Sin cierres en pantalla",
        description:
          "Ajusta los filtros o carga cierres nuevos para que el sistema pueda analizar el rango.",
        tone: "info",
      },
    ]
  }

  const alerts: SmartAlert[] = []
  const collectionRate =
    totals.totalSoldUSD > 0
      ? Math.round((totals.realCollectedUSD / totals.totalSoldUSD) * 100)
      : 0
  const pendingRate =
    totals.totalSoldUSD > 0
      ? Math.round((totals.realPendingUSD / totals.totalSoldUSD) * 100)
      : 0

  if (totals.totalSoldUSD > 0 && pendingRate >= 60) {
    alerts.push({
      title: "Pendiente de cobro muy alto",
      description:
        "Más de la mitad de lo vendido en este rango sigue pendiente. Conviene revisar caja antes de cerrar la operación.",
      tone: "danger",
      value: `${pendingRate}% pendiente`,
    })
  } else if (totals.totalSoldUSD > 0 && pendingRate >= 25) {
    alerts.push({
      title: "Pendiente de cobro importante",
      description:
        "Hay una parte relevante de las ventas todavía sin cobrar. Revisa los pedidos pendientes o parciales.",
      tone: "warning",
      value: `${pendingRate}% pendiente`,
    })
  }

  if (totals.totalSoldUSD > 0 && totals.realPendingUSD <= 0.01 && totals.realCollectedUSD > 0) {
    alerts.push({
      title: "Cobro completo en el rango",
      description:
        "Todo lo vendido en los cierres filtrados aparece cubierto como cobrado real.",
      tone: "good",
      value: `${collectionRate}% cobrado`,
    })
  }

  if (totals.pendingPaymentOrders > 0) {
    alerts.push({
      title: "Pedidos pendientes de pago",
      description:
        "Existen pedidos registrados como pendientes. Esta es la primera revisión que debería hacer caja.",
      tone: "warning",
      value: `${totals.pendingPaymentOrders} pedido(s)`,
    })
  }

  if (totals.partialPaymentOrders > 0) {
    alerts.push({
      title: "Pagos parciales detectados",
      description:
        "Hay pedidos con abono parcial. Conviene confirmar si fueron completados antes del cierre definitivo.",
      tone: "warning",
      value: `${totals.partialPaymentOrders} pedido(s)`,
    })
  }

  const closesWithSalesButNoDelivered = dayCloses.filter(
    (close) => close.totalSoldUSD > 0 && close.deliveredOrders <= 0
  )

  if (closesWithSalesButNoDelivered.length > 0) {
    alerts.push({
      title: "Ventas con pedidos no entregados",
      description:
        "Hay cierres con venta registrada, pero sin pedidos entregados. Puede ser normal si eran pedidos activos, pero vale la pena revisarlo.",
      tone: "info",
      value: `${closesWithSalesButNoDelivered.length} cierre(s)`,
    })
  }

  if (report.operationalTotals.pendingDeliveryUSD > 0.01) {
    alerts.push({
      title: "Delivery pendiente",
      description:
        "El rango tiene costos de delivery pendientes. Revisa si esos pedidos siguen activos o si falta marcar la forma de cobro.",
      tone: "warning",
      value: formatUSD(report.operationalTotals.pendingDeliveryUSD),
    })
  }

  if (totals.expensesTotalUSD > 0) {
    alerts.push({
      title: "Gastos registrados en el rango",
      description:
        "Estos cierres ya incluyen salidas de caja. Revisa el neto estimado para entender cuánto quedó después de gastos.",
      tone: totals.netEstimatedUSD < 0 ? "warning" : "info",
      value: `${formatUSD(totals.expensesTotalUSD)} · Neto ${formatUSD(totals.netEstimatedUSD)}`,
    })
  }

  if (totals.expensesTotalUSD > totals.realCollectedUSD && totals.expensesTotalUSD > 0) {
    alerts.push({
      title: "Gastos por encima de lo cobrado",
      description:
        "El rango muestra más gastos que cobro real. Puede ser normal si se registraron compras sin ventas, pero conviene revisarlo.",
      tone: "warning",
      value: `Neto ${formatUSD(totals.netEstimatedUSD)}`,
    })
  }

  const usdWithoutMethod = findSummaryItemByLabel(report.paymentByUSDMethod, [
    "sin metodo",
    "sin método",
  ])

  if (usdWithoutMethod && usdWithoutMethod.totalUSD > 0) {
    alerts.push({
      title: "Divisas sin método registrado",
      description:
        "Hay cobros en divisas sin método claro. Para auditoría, conviene marcar si fue efectivo, Zelle, Binance, USDT u otro.",
      tone: "warning",
      value: formatUSD(usdWithoutMethod.totalUSD),
    })
  }

  const vesWithoutMethod = findSummaryItemByLabel(report.paymentByVESMethod, [
    "sin metodo",
    "sin método",
  ])

  if (vesWithoutMethod && (vesWithoutMethod.totalVES || vesWithoutMethod.totalUSD) > 0) {
    alerts.push({
      title: "Bolívares sin método registrado",
      description:
        "Hay cobros en bolívares sin método claro. Para control interno, conviene registrar si fue pago móvil, punto, transferencia o efectivo.",
      tone: "warning",
      value: `Bs ${formatVES(vesWithoutMethod.totalVES || 0)}`,
    })
  }

  const unregisteredDeliveryPayment = findSummaryItemByLabel(
    report.deliveryByPaymentIn,
    ["sin registrar", "sin dato"]
  )

  if (
    unregisteredDeliveryPayment &&
    (unregisteredDeliveryPayment.totalUSD > 0 ||
      (unregisteredDeliveryPayment.deliveryCostUSD || 0) > 0)
  ) {
    alerts.push({
      title: "Delivery sin forma de cobro",
      description:
        "Hay delivery cobrado o registrado sin forma de cobro clara. Revisa si fue divisas, bolívares o mixto.",
      tone: "warning",
      value: formatUSD(
        unregisteredDeliveryPayment.deliveryCostUSD ||
          unregisteredDeliveryPayment.totalUSD
      ),
    })
  }

  if (report.topProduct && report.topProduct.quantity > 0) {
    alerts.push({
      title: "Producto fuerte del rango",
      description:
        "Este producto lidera por unidades vendidas dentro de los cierres filtrados.",
      tone: "good",
      value: `${report.topProduct.name} · ${report.topProduct.quantity} unidad(es)`,
    })
  }

  if (report.topDeliveryZone && report.topDeliveryZone.count > 0) {
    alerts.push({
      title: "Zona delivery con más movimiento",
      description:
        "Esta zona concentra la mayor actividad de delivery dentro del rango filtrado.",
      tone: "info",
      value: `${report.topDeliveryZone.label} · ${report.topDeliveryZone.count} registro(s)`,
    })
  }

  const hasRiskAlert = alerts.some(
    (alert) => alert.tone === "danger" || alert.tone === "warning"
  )

  if (!hasRiskAlert && totals.totalSoldUSD > 0) {
    alerts.unshift({
      title: "Sin alertas críticas",
      description:
        "No se detectaron pendientes altos, pagos parciales ni métodos faltantes en el rango actual.",
      tone: "good",
      value: `${collectionRate}% cobrado`,
    })
  }

  return alerts.slice(0, 8)
}

function getSingleCloseAlerts(close: SavedDayClose) {
  const closes = [close]

  return getRangeAlerts(closes, getDayCloseTotals(closes), getRangeReport(closes))
}

function createSafeFileName(value: string) {
  const cleanValue = value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()

  return cleanValue || "cierre-la-bambucha"
}

function downloadTextFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function encodeUtf16LeWithBom(text: string) {
  const buffer = new Uint8Array(text.length * 2 + 2)

  buffer[0] = 0xff
  buffer[1] = 0xfe

  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index)

    buffer[index * 2 + 2] = code & 0xff
    buffer[index * 2 + 3] = code >> 8
  }

  return buffer
}

function downloadExcelFriendlyCsv(fileName: string, content: string) {
  const encodedContent = encodeUtf16LeWithBom(content)
  const blob = new Blob([encodedContent], {
    type: "text/csv;charset=utf-16le",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function escapeCsvValue(value: unknown) {
  const text = String(value ?? "")

  if (/[;"\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function buildDayClosesCsv(dayCloses: SavedDayClose[]) {
  const headers = [
    "ID cierre",
    "Fecha guardado",
    "Fecha cierre",
    "Estado visual",
    "Pedidos registrados",
    "Pedidos entregados",
    "Pedidos activos",
    "Pedidos cancelados",
    "Total vendido USD",
    "Total cobrado real USD",
    "Divisas recibidas USD",
    "Bolívares recibidos Bs",
    "Equiv. Bs USD",
    "Pendiente cobro USD",
    "Delivery cobrado USD",
    "Gastos registrados",
    "Gastos total USD",
    "Gastos divisas USD",
    "Gastos bolívares Bs",
    "Gastos bolívares equiv USD",
    "Neto estimado USD",
    "Proveedor principal",
    "Tipo gasto principal",
    "Compras inventario USD",
    "Compras inventario registros",
    "Pedidos pagados",
    "Pedidos pago parcial",
    "Pedidos pendientes",
  ]

  const rows = dayCloses.map((close) => {
    const topExpenseProvider = combineExpensesByField(close.expenses, "provider")[0]
    const topExpenseType = combineExpensesByField(close.expenses, "expenseType")[0]
    const inventoryExpenses = getInventoryExpenseTotals(close.expenses)

    return [
    close.id,
    formatDate(close.createdAt),
    getCloseTitle(close),
    getClosePaymentState(close).label,
    close.ordersRegistered,
    close.deliveredOrders,
    close.activeOrders,
    close.canceledOrders,
    close.totalSoldUSD,
    close.realCollectedUSD,
    close.realCashUSD,
    close.realVES,
    close.realVESEquivalentUSD,
    close.realPendingUSD,
    close.deliveryCollectedUSD,
    close.expensesCount,
    close.expensesTotalUSD,
    close.expensesCashUSD,
    close.expensesVES,
    close.expensesVESEquivalentUSD,
    getCloseNetEstimatedUSD(close),
    topExpenseProvider?.label || "",
    topExpenseType?.label || "",
    toNumber(inventoryExpenses.totalUSD),
    toNumber(inventoryExpenses.count),
    close.paidOrders,
    close.partialPaymentOrders,
    close.pendingPaymentOrders,
  ]
  })

  const csvRows = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(";"))
    .join("\r\n")

  return `sep=;\r\n${csvRows}`
}

function downloadDayClosesCsv(dayCloses: SavedDayClose[], fileNameBase: string) {
  const csv = buildDayClosesCsv(dayCloses)
  const fileName = `${createSafeFileName(fileNameBase)}.csv`

  downloadExcelFriendlyCsv(fileName, csv)
}

function downloadCloseSummary(close: SavedDayClose) {
  const title = createSafeFileName(`${close.id}-${getCloseTitle(close)}`)

  downloadTextFile(
    `${title}.txt`,
    close.summaryText || "Sin resumen guardado.",
    "text/plain;charset=utf-8"
  )
}

function downloadSingleCloseCsv(close: SavedDayClose) {
  downloadDayClosesCsv([close], `${close.id}-${getCloseTitle(close)}`)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function printCloseSummary(close: SavedDayClose) {
  const printWindow = window.open("", "_blank", "width=900,height=700")

  if (!printWindow) {
    window.alert("No se pudo abrir la ventana de impresión. Revisa si el navegador bloqueó ventanas emergentes.")
    return
  }

  const title = `Cierre La Bambucha - ${getCloseTitle(close)}`
  const summary = close.summaryText || "Sin resumen guardado."

  printWindow.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 32px;
      color: #220000;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    h1 {
      margin: 0 0 8px;
      color: #a00000;
      font-size: 28px;
      text-transform: uppercase;
    }
    p {
      margin: 0 0 20px;
      font-weight: 700;
      color: #5a2525;
    }
    pre {
      white-space: pre-wrap;
      border: 2px solid #a00000;
      border-radius: 18px;
      padding: 18px;
      background: #fff7e8;
      font: 700 14px/1.55 Arial, Helvetica, sans-serif;
    }
    @media print {
      body { margin: 18mm; }
      pre { border-color: #999; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>ID: ${escapeHtml(close.id)} · Guardado: ${escapeHtml(formatDate(close.createdAt))}</p>
  <pre>${escapeHtml(summary)}</pre>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`)
  printWindow.document.close()
}

export default function DayClosesPage() {
  return (
    <ModuleAccessGuard moduleKey="history" moduleName="Historial de cierres">
      <DayClosesPageContent />
    </ModuleAccessGuard>
  )
}

function DayClosesPageContent() {
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [dayCloses, setDayCloses] = useState<SavedDayClose[]>([])
  const [selectedClose, setSelectedClose] = useState<SavedDayClose | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false)
  const [clearHistoryConfirmation, setClearHistoryConfirmation] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [searchText, setSearchText] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("Todos")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [areFiltersVisible, setAreFiltersVisible] = useState(true)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [reportViewMode, setReportViewMode] =
    useState<ReportViewMode>("Simple")

  const isLoggedIn = adminPassword.length > 0

  async function loadDayCloses(password = adminPassword) {
    if (!password) return

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const response = await fetch("/api/day-closes", {
        method: "GET",
        headers: {
          "x-admin-password": password,
        },
        cache: "no-store",
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar los cierres")
      }

      setDayCloses(normalizeDayCloses(data.dayCloses))
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los cierres"
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function clearDayClosesHistory() {
    if (!adminPassword || clearHistoryConfirmation.trim() !== "BORRAR HISTORIAL") {
      return
    }

    try {
      setIsClearingHistory(true)
      setErrorMessage(null)
      setCopyMessage(null)

      const response = await fetch("/api/day-closes", {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
        cache: "no-store",
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo borrar el historial")
      }

      setDayCloses([])
      setSelectedClose(null)
      setIsClearHistoryModalOpen(false)
      setClearHistoryConfirmation("")
      setCopyMessage(data.message || "Historial de cierres borrado correctamente.")

      window.setTimeout(() => {
        setCopyMessage(null)
      }, 3500)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo borrar el historial de cierres"
      )
    } finally {
      setIsClearingHistory(false)
    }
  }

  function handleLogin() {
    const password = passwordInput.trim()

    if (!password) return

    window.sessionStorage.setItem(ADMIN_STORAGE_KEY, password)
    setAdminPassword(password)
    loadDayCloses(password)
  }

  async function copySummary(close: SavedDayClose) {
    try {
      await navigator.clipboard.writeText(close.summaryText || "")
      setCopyMessage("Resumen copiado correctamente.")
    } catch {
      setCopyMessage("No se pudo copiar automáticamente.")
    }

    window.setTimeout(() => {
      setCopyMessage(null)
    }, 3000)
  }

  useEffect(() => {
    const savedPassword = window.sessionStorage.getItem(ADMIN_STORAGE_KEY)

    if (savedPassword) {
      setAdminPassword(savedPassword)
      setPasswordInput(savedPassword)
      loadDayCloses(savedPassword)
    }
  }, [])

  useEffect(() => {
    try {
      const savedMode = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)

      if (isReportViewMode(savedMode)) {
        setReportViewMode(savedMode)
      }
    } catch {
      setReportViewMode("Simple")
    }
  }, [])

  const filteredDayCloses = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return dayCloses.filter((close) => {
      if (!matchesPaymentFilter(close, paymentFilter)) return false
      if (!isCloseInsideDateRange(close, startDate, endDate)) return false

      if (!query) return true

      const searchableText = [
        close.id,
        close.createdAt,
        close.dateLabel,
        close.summaryText,
        getClosePaymentState(close).label,
      ]
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [dayCloses, endDate, paymentFilter, searchText, startDate])

  const totals = useMemo(() => getDayCloseTotals(dayCloses), [dayCloses])
  const filteredTotals = useMemo(
    () => getDayCloseTotals(filteredDayCloses),
    [filteredDayCloses]
  )
  const rangeReport = useMemo(
    () => getRangeReport(filteredDayCloses),
    [filteredDayCloses]
  )

  const todayRangeValue = getTodayDateInputValue()
  const lastSevenDaysStartValue = getDateInputValueDaysAgo(6)
  const isTodayRangeActive =
    startDate === todayRangeValue && endDate === todayRangeValue
  const isLastSevenDaysRangeActive =
    startDate === lastSevenDaysStartValue && endDate === todayRangeValue
  const isAllRangeActive = !startDate && !endDate

  function exportFilteredDayCloses() {
    if (!filteredDayCloses.length) return

    const rangeLabel = startDate || endDate ? `${startDate || "inicio"}-${endDate || "hoy"}` : "todos"
    const fileLabel = searchText.trim()
      ? `cierres-la-bambucha-filtrados-${searchText.trim()}-${rangeLabel}`
      : `cierres-la-bambucha-${paymentFilter}-${rangeLabel}`

    downloadDayClosesCsv(filteredDayCloses, fileLabel)
  }

  function applyTodayRange() {
    const today = getTodayDateInputValue()

    setStartDate(today)
    setEndDate(today)
  }

  function applyLastSevenDaysRange() {
    setStartDate(getDateInputValueDaysAgo(6))
    setEndDate(getTodayDateInputValue())
  }

  function clearRangeFilters() {
    setStartDate("")
    setEndDate("")
  }

  function changeReportViewMode(mode: ReportViewMode) {
    setReportViewMode(mode)

    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    } catch {
      // Si el navegador bloquea localStorage, el modo funciona solo durante la sesión.
    }
  }

  if (!isLoggedIn) {
    return (
      <LoginBox
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        handleLogin={handleLogin}
        errorMessage={errorMessage}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#fff7e8] px-3 py-4 text-[#220000] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[1.6rem] border-4 border-[#a00000] bg-white shadow-[0_10px_0_rgba(160,0,0,0.12)]">
          <div className="h-5 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#fff7e8]" />

          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/local-santo"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-200"
                  >
                    <ArrowLeft size={16} />
                    Volver al panel
                  </a>

                  <button
                    type="button"
                    onClick={() => loadDayCloses()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Actualizar
                  </button>

                  <button
                    type="button"
                    onClick={exportFilteredDayCloses}
                    disabled={!filteredDayCloses.length}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-200 disabled:opacity-50"
                  >
                    <Download size={16} />
                    Exportar CSV
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsGuideOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-200"
                  >
                    <FileText size={16} />
                    Cómo leer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setClearHistoryConfirmation("")
                      setIsClearHistoryModalOpen(true)
                    }}
                    disabled={!dayCloses.length || isLoading || isClearingHistory}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-red-600 bg-red-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <AlertTriangle size={16} />
                    Borrar historial
                  </button>
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.32em] text-[#a00000]">
                  La Bambucha
                </p>

                <h1 className="mt-1 text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)] sm:text-5xl">
                  Historial de cierres
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#3a0000]/70">
                  Consulta los cierres guardados del local sin abrir Google Sheets. Cada cierre conserva su resumen completo, cobros reales, pendientes, delivery y productos vendidos.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:w-[620px]">
                <MetricCard label="Cierres" value={totals.cierres} />
                <MetricCard
                  label="Cobrado total"
                  value={formatUSD(totals.realCollectedUSD)}
                />
                <MetricCard
                  label="Gastos total"
                  value={formatUSD(totals.expensesTotalUSD)}
                  tone="yellow"
                />
                <MetricCard
                  label="Neto estimado"
                  value={formatUSD(totals.netEstimatedUSD)}
                  tone={totals.netEstimatedUSD < 0 ? "yellow" : "soft"}
                />
                <MetricCard
                  label="Pendiente total"
                  value={formatUSD(totals.realPendingUSD)}
                  tone="yellow"
                />
                <MetricCard
                  label="Bolívares recibidos"
                  value={`Bs ${formatVES(totals.realVES)}`}
                  tone="soft"
                />
              </div>
            </div>
          </div>
        </header>

        <section className="sticky top-0 z-30 mt-4 rounded-[1.4rem] border-2 border-[#a00000] bg-white p-3 shadow-[0_8px_0_rgba(160,0,0,0.10)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#a00000]">
                Controles del historial
              </p>
              <p className="mt-1 text-xs font-bold text-[#3a0000]/65">
                {filteredDayCloses.length} cierre(s) en pantalla · Cobrado {formatUSD(filteredTotals.realCollectedUSD)} · Gastos {formatUSD(filteredTotals.expensesTotalUSD)} · Neto {formatUSD(filteredTotals.netEstimatedUSD)} · Pendiente {formatUSD(filteredTotals.realPendingUSD)} · Modo {reportViewMode}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setAreFiltersVisible((currentValue) => !currentValue)}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
            >
              {areFiltersVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              {areFiltersVisible ? "Ocultar controles" : "Mostrar controles"}
            </button>
          </div>

          {areFiltersVisible && (
            <>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a00000]"
                  />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Buscar por fecha, ID, estado o texto del cierre"
                    className="w-full rounded-full border-2 border-[#a00000]/25 bg-[#fff7e8] px-11 py-3 text-sm font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#a00000]"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {PAYMENT_FILTERS.map((filter) => {
                    const isActive = paymentFilter === filter

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setPaymentFilter(filter)}
                        className={`shrink-0 rounded-full border-2 px-4 py-3 text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${
                          isActive
                            ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
                            : "border-[#a00000]/35 bg-white text-[#a00000] hover:bg-yellow-200"
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-3 grid gap-3 rounded-[1.2rem] border border-[#a00000]/20 bg-[#fff7e8] p-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                <DateFilterInput
                  label="Desde"
                  value={startDate}
                  onChange={setStartDate}
                />
                <DateFilterInput
                  label="Hasta"
                  value={endDate}
                  onChange={setEndDate}
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyTodayRange}
                    className={`rounded-full border-2 px-4 py-3 text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${
                      isTodayRangeActive
                        ? "border-[#a00000] bg-yellow-300 text-[#4a0000] hover:bg-yellow-200"
                        : "border-[#a00000]/35 bg-white text-[#a00000] hover:bg-yellow-200"
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={applyLastSevenDaysRange}
                    className={`rounded-full border-2 px-4 py-3 text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${
                      isLastSevenDaysRangeActive
                        ? "border-[#a00000] bg-yellow-300 text-[#4a0000] hover:bg-yellow-200"
                        : "border-[#a00000]/35 bg-white text-[#a00000] hover:bg-yellow-200"
                    }`}
                  >
                    7 días
                  </button>
                  <button
                    type="button"
                    onClick={clearRangeFilters}
                    className={`rounded-full border-2 px-4 py-3 text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${
                      isAllRangeActive
                        ? "border-[#a00000] bg-yellow-300 text-[#4a0000] hover:bg-yellow-200"
                        : "border-[#a00000]/35 bg-white text-[#a00000] hover:bg-yellow-200"
                    }`}
                  >
                    Todo
                  </button>
                </div>
              </div>

              <ModeSelector
                value={reportViewMode}
                onChange={changeReportViewMode}
              />

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <MiniMetric label="Mostrando" value={filteredDayCloses.length} />
                <MiniMetric
                  label="Cobrado mostrado"
                  value={formatUSD(filteredTotals.realCollectedUSD)}
                />
                <MiniMetric
                  label="Pendiente mostrado"
                  value={formatUSD(filteredTotals.realPendingUSD)}
                />
                <MiniMetric
                  label="Divisas mostradas"
                  value={formatUSD(filteredTotals.realCashUSD)}
                />
                <MiniMetric
                  label="Delivery mostrado"
                  value={formatUSD(filteredTotals.deliveryCollectedUSD)}
                />
                <MiniMetric
                  label="Gastos mostrados"
                  value={formatUSD(filteredTotals.expensesTotalUSD)}
                />
                <MiniMetric
                  label="Neto mostrado"
                  value={formatUSD(filteredTotals.netEstimatedUSD)}
                />
              </div>
            </>
          )}

          {errorMessage && (
            <div className="mt-3 rounded-2xl border-2 border-red-500/35 bg-red-100 px-4 py-3">
              <p className="text-sm font-bold leading-6 text-red-800">
                {errorMessage}
              </p>
            </div>
          )}

          {copyMessage && (
            <div className="mt-3 rounded-2xl border-2 border-green-500/35 bg-green-50 px-4 py-3">
              <p className="text-sm font-black text-green-700">
                {copyMessage}
              </p>
            </div>
          )}
        </section>

        {filteredDayCloses.length > 0 && (
          <RangeReport
            dayCloses={filteredDayCloses}
            totals={filteredTotals}
            report={rangeReport}
            startDate={startDate}
            endDate={endDate}
            viewMode={reportViewMode}
          />
        )}

        {isLoading && dayCloses.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border-2 border-[#a00000] bg-white px-6 py-14 text-center shadow-[0_8px_0_rgba(160,0,0,0.12)]">
            <Loader2 className="mx-auto animate-spin text-[#a00000]" size={42} />
            <h2 className="mt-5 text-3xl font-black uppercase text-[#a00000]">
              Cargando cierres
            </h2>
          </section>
        ) : filteredDayCloses.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border-2 border-[#a00000] bg-white px-6 py-14 text-center shadow-[0_8px_0_rgba(160,0,0,0.12)]">
            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="mx-auto h-28 w-28 object-contain"
            />

            <h2 className="mt-5 text-3xl font-black uppercase text-[#a00000]">
              Sin cierres para mostrar
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-[#3a0000]/70">
              Ajusta la búsqueda o cambia el filtro de cobro. Si todavía no hay cierres guardados, aparecerán aquí cuando cierres y reinicies el día desde el panel.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 xl:grid-cols-2">
            {filteredDayCloses.map((close) => (
              <CloseCard
                key={close.id}
                close={close}
                onOpen={() => setSelectedClose(close)}
                onCopy={() => copySummary(close)}
              />
            ))}
          </section>
        )}
      </div>

      {selectedClose && (
        <CloseDetailModal
          close={selectedClose}
          onClose={() => setSelectedClose(null)}
          onCopy={() => copySummary(selectedClose)}
          viewMode={reportViewMode}
        />
      )}

      {isGuideOpen && (
        <ReportGuideModal
          viewMode={reportViewMode}
          onClose={() => setIsGuideOpen(false)}
        />
      )}

      {isClearHistoryModalOpen && (
        <ClearHistoryModal
          confirmationText={clearHistoryConfirmation}
          isClearing={isClearingHistory}
          closesCount={dayCloses.length}
          onChangeConfirmation={setClearHistoryConfirmation}
          onConfirm={clearDayClosesHistory}
          onClose={() => {
            if (isClearingHistory) return
            setIsClearHistoryModalOpen(false)
            setClearHistoryConfirmation("")
          }}
        />
      )}
    </main>
  )
}

function ClearHistoryModal({
  confirmationText,
  isClearing,
  closesCount,
  onChangeConfirmation,
  onConfirm,
  onClose,
}: {
  confirmationText: string
  isClearing: boolean
  closesCount: number
  onChangeConfirmation: (value: string) => void
  onConfirm: () => void
  onClose: () => void
}) {
  const canConfirm = confirmationText.trim() === "BORRAR HISTORIAL" && !isClearing

  return (
    <ModalShell
      title="Borrar historial"
      onClose={onClose}
      footer={
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
          >
            <X size={17} />
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="flex items-center justify-center gap-3 rounded-full border-2 border-red-700 bg-red-600 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#220000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isClearing ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <AlertTriangle size={17} />
            )}
            Borrar definitivamente
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[1.4rem] border-2 border-red-500 bg-red-50 p-4 text-red-800">
          <p className="text-sm font-black uppercase tracking-[0.16em]">
            Acción delicada
          </p>
          <p className="mt-2 text-sm font-bold leading-6">
            Esto borrará todos los cierres guardados del historial. No borra pedidos activos, gastos, configuración, zonas delivery ni productos. Esta acción está pensada para limpiar pruebas o reiniciar el historial antes de entregar el sistema.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoBox label="Cierres actuales" value={String(closesCount)} />
          <InfoBox label="Se borrará" value="Solo historial de cierres" />
        </div>

        <label className="block rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
          <span className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
            Escribe BORRAR HISTORIAL para confirmar
          </span>
          <input
            value={confirmationText}
            onChange={(event) => onChangeConfirmation(event.target.value)}
            disabled={isClearing}
            placeholder="BORRAR HISTORIAL"
            className="mt-3 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-base font-black uppercase text-[#4a0000] outline-none placeholder:text-[#4a0000]/35 focus:border-[#a00000] disabled:opacity-50"
          />
        </label>
      </div>
    </ModalShell>
  )
}

function LoginBox({
  passwordInput,
  setPasswordInput,
  showPassword,
  setShowPassword,
  handleLogin,
  errorMessage,
}: LoginBoxProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff7e8] px-4 py-8 text-[#220000]">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-[#a00000] bg-white shadow-[0_12px_0_rgba(160,0,0,0.14)]">
        <div className="h-6 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#fff7e8]" />

        <div className="px-6 py-6">
          <a
            href="/local-santo"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#a00000]"
          >
            <ArrowLeft size={16} />
            Volver
          </a>

          <img
            src="/logo-bambucha.png"
            alt="La Bambucha Grill Burger"
            className="mx-auto mt-6 h-28 w-28 object-contain"
          />

          <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.28em] text-[#a00000]">
            Acceso privado
          </p>

          <h1 className="mt-2 text-center text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
            Historial de cierres
          </h1>

          <p className="mt-3 text-center text-sm font-bold leading-6 text-[#3a0000]/75">
            Ingresa la clave autorizada para consultar los cierres guardados del local.
          </p>
        </div>

        <div className="space-y-4 px-6 pb-6">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
              Clave de acceso
            </label>

            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleLogin()
                }}
                placeholder="Ingresa la clave del local"
                className="w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 pr-12 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#a00000]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#a00000]/10 text-[#4a0000]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-2xl border-2 border-red-500/35 bg-red-100 px-4 py-3">
              <p className="text-sm font-bold leading-6 text-red-800">
                {errorMessage}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] shadow-[0_6px_0_rgba(160,0,0,0.18)] transition hover:scale-[1.02]"
          >
            <LogIn size={21} />
            Entrar al historial
          </button>
        </div>
      </div>
    </main>
  )
}

function CloseCard({
  close,
  onOpen,
  onCopy,
}: {
  close: SavedDayClose
  onOpen: () => void
  onCopy: () => void
}) {
  const paymentState = getClosePaymentState(close)

  return (
    <article className="overflow-hidden rounded-[1.6rem] border-2 border-[#a00000] bg-white shadow-[0_8px_0_rgba(160,0,0,0.12)]">
      <div className="border-b-2 border-[#a00000] bg-[#fff7e8] px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                <CalendarDays size={16} />
                {formatDate(close.createdAt)}
              </p>

              <span
                className={`inline-flex rounded-full border-2 px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] ${paymentState.className}`}
              >
                {paymentState.label}
              </span>
            </div>

            <h2 className="mt-2 text-3xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
              {getCloseTitle(close)}
            </h2>
            <p className="mt-2 text-xs font-bold text-[#3a0000]/60">
              ID: {close.id}
            </p>
          </div>

          <div className="rounded-2xl border-2 border-[#a00000] bg-white px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a00000]">
              Cobrado real
            </p>
            <p className="mt-1 text-2xl font-black text-[#220000]">
              {formatUSD(close.realCollectedUSD)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <InfoBox label="Registrados" value={String(close.ordersRegistered)} />
          <InfoBox label="Entregados" value={String(close.deliveredOrders)} />
          <InfoBox label="Activos" value={String(close.activeOrders)} />
          <InfoBox label="Cancelados" value={String(close.canceledOrders)} />
          <InfoBox label="Total vendido" value={formatUSD(close.totalSoldUSD)} />
          <InfoBox label="Pendiente" value={formatUSD(close.realPendingUSD)} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <InfoBox label="Divisas" value={formatUSD(close.realCashUSD)} />
          <InfoBox label="Bolívares" value={`Bs ${formatVES(close.realVES)}`} />
          <InfoBox label="Delivery cobrado" value={formatUSD(close.deliveryCollectedUSD)} />
          <InfoBox label="Gastos" value={formatUSD(close.expensesTotalUSD)} />
          <InfoBox label="Neto estimado" value={formatUSD(getCloseNetEstimatedUSD(close))} />
          <InfoBox label="Pagados" value={String(close.paidOrders)} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
          >
            <FileText size={17} />
            Ver detalle
          </button>

          <button
            type="button"
            onClick={onCopy}
            disabled={!close.summaryText}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-200 disabled:opacity-50"
          >
            <Clipboard size={17} />
            Copiar resumen
          </button>
        </div>
      </div>
    </article>
  )
}

function CloseDetailModal({
  close,
  onClose,
  onCopy,
  viewMode,
}: {
  close: SavedDayClose
  onClose: () => void
  onCopy: () => void
  viewMode: ReportViewMode
}) {
  const paymentState = getClosePaymentState(close)
  const closeAlerts = getSingleCloseAlerts(close)
  const closeInventoryExpenses = getInventoryExpenseTotals(close.expenses)
  const closeExpensesByProvider = combineExpensesByField(close.expenses, "provider")
  const closeExpensesByType = combineExpensesByField(close.expenses, "expenseType")
  const closeExpensesByCategory = combineExpensesByField(close.expenses, "category")
  const closeExpensesByMethod = combineExpensesByField(close.expenses, "method")
  const hasRiskAlert = closeAlerts.some(
    (alert) => alert.tone === "danger" || alert.tone === "warning"
  )
  const showBusinessSections = viewMode !== "Simple"
  const showAdvancedSections = viewMode === "Avanzado"

  return (
    <ModalShell
      onClose={onClose}
      title="Detalle del cierre"
      footer={
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <button
            type="button"
            onClick={onCopy}
            disabled={!close.summaryText}
            className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] outline-none transition hover:bg-yellow-200 focus-visible:ring-4 focus-visible:ring-yellow-300/70 disabled:opacity-50"
          >
            <Clipboard size={17} />
            Copiar
          </button>

          <button
            type="button"
            onClick={() => downloadCloseSummary(close)}
            disabled={!close.summaryText}
            className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] outline-none transition hover:bg-yellow-200 focus-visible:ring-4 focus-visible:ring-yellow-300/70 disabled:opacity-50"
          >
            <Download size={17} />
            TXT
          </button>

          <button
            type="button"
            onClick={() => downloadSingleCloseCsv(close)}
            className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] outline-none transition hover:bg-yellow-200 focus-visible:ring-4 focus-visible:ring-yellow-300/70"
          >
            <FileText size={17} />
            CSV
          </button>

          <button
            type="button"
            onClick={() => printCloseSummary(close)}
            disabled={!close.summaryText}
            className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] outline-none transition hover:bg-yellow-200 focus-visible:ring-4 focus-visible:ring-yellow-300/70 disabled:opacity-50"
          >
            <Printer size={17} />
            Imprimir
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] outline-none transition hover:bg-yellow-200 focus-visible:ring-4 focus-visible:ring-yellow-300/70 xl:col-auto"
          >
            <X size={17} />
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[1.4rem] border-2 border-[#a00000] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                {close.id}
              </p>
              <h3 className="mt-2 text-2xl font-black uppercase text-[#220000]">
                {getCloseTitle(close)}
              </h3>
              <p className="mt-1 text-sm font-bold text-[#3a0000]/65">
                Guardado: {formatDate(close.createdAt)}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${paymentState.className}`}
            >
              {paymentState.label}
            </span>
          </div>
        </div>

        <div className="rounded-[1.2rem] border border-[#a00000]/20 bg-white px-4 py-3 text-xs font-bold leading-5 text-[#3a0000]/70">
          Vista actual: <strong>{viewMode}</strong>. El historial ahora muestra cada cierre con secciones desplegables para revisar solo lo que haga falta.
        </div>

        {showBusinessSections && (
          <DetailToggleSection
            title="Alertas del cierre"
            description="Revisión rápida de pendientes, pagos parciales, gastos, delivery o métodos faltantes."
            defaultOpen={hasRiskAlert}
            badge={`${closeAlerts.length} alerta(s)`}
          >
            <SmartAlerts
              title="Alertas del cierre"
              description="Revisión rápida de este cierre guardado."
              alerts={closeAlerts}
              compact
            />
          </DetailToggleSection>
        )}

        <DetailToggleSection
          title="Resumen general"
          description="Pedidos, estado operativo y fecha del cierre guardado."
          defaultOpen
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBox label="Pedidos registrados" value={String(close.ordersRegistered)} />
            <InfoBox label="Pedidos activos" value={String(close.activeOrders)} />
            <InfoBox label="Pedidos entregados" value={String(close.deliveredOrders)} />
            <InfoBox label="Pedidos cancelados" value={String(close.canceledOrders)} />
            <InfoBox label="Delivery registrados" value={String(close.deliveryRegistered)} />
            <InfoBox label="Delivery entregados" value={String(close.deliveryDelivered)} />
          </div>
        </DetailToggleSection>

        <DetailToggleSection
          title="Cobros reales"
          description="Divisas, bolívares, equivalentes, pendientes y métodos de pago guardados."
          defaultOpen={close.realPendingUSD > 0 || close.partialPaymentOrders > 0}
          badge={formatUSD(close.realCollectedUSD)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox label="Total vendido registrado" value={formatUSD(close.totalSoldUSD)} />
            <InfoBox label="Total cobrado real" value={formatUSD(close.realCollectedUSD)} />
            <InfoBox label="Divisas recibidas" value={formatUSD(close.realCashUSD)} />
            <InfoBox label="Bolívares recibidos" value={`Bs ${formatVES(close.realVES)}`} />
            <InfoBox label="Equiv. Bs en USD" value={formatUSD(close.realVESEquivalentUSD)} />
            <InfoBox label="Pendiente de cobro" value={formatUSD(close.realPendingUSD)} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <InfoBox label="Pagados" value={String(close.paidOrders)} />
            <InfoBox label="Pago parcial" value={String(close.partialPaymentOrders)} />
            <InfoBox label="Pendientes" value={String(close.pendingPaymentOrders)} />
          </div>

          {showBusinessSections && (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <SummaryList
                title="Cobros por estado"
                emptyText="Sin cobros por estado guardados."
                items={close.paymentByStatus}
              />
              <SummaryList
                title="Cobros por método en divisas"
                emptyText="Sin cobros en divisas guardados."
                items={close.paymentByUSDMethod}
              />
              <SummaryList
                title="Cobros por método en bolívares"
                emptyText="Sin cobros en bolívares guardados."
                items={close.paymentByVESMethod}
                showVES
              />
            </div>
          )}
        </DetailToggleSection>

        <DetailToggleSection
          title="Pedidos y productos vendidos"
          description="Venta confirmada por entrega, productos, combos y ranking de productos."
          defaultOpen={close.productsSold.length > 0}
          badge={`${close.productsSold.length} producto(s)`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox label="Total confirmado" value={formatUSD(close.totalConfirmedUSD)} />
            <InfoBox label="Venta de productos" value={formatUSD(close.productSalesUSD)} />
            <InfoBox label="Combos" value={formatUSD(close.combosUSD)} />
            <InfoBox label="Productos" value={formatUSD(close.regularUSD)} />
            <InfoBox label="Referencia en Bs" value={`Bs ${formatVES(close.regularVES)}`} />
            <InfoBox label="Delivery cobrado" value={formatUSD(close.deliveryCollectedUSD)} />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <SummaryList
              title="Ventas por tipo"
              emptyText="Sin ventas por tipo guardadas."
              items={close.salesByType}
            />
            <ProductsSoldList products={close.productsSold} />
          </div>
        </DetailToggleSection>

        <DetailToggleSection
          title="Delivery"
          description="Pedidos a domicilio, zonas, métodos indicados y forma real de cobro del delivery."
          defaultOpen={close.deliveryRegistered > 0 || close.pendingDeliveryUSD > 0}
          badge={`${close.deliveryRegistered} delivery`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox label="Delivery registrado" value={String(close.deliveryRegistered)} />
            <InfoBox label="Delivery entregado" value={String(close.deliveryDelivered)} />
            <InfoBox label="Delivery activo" value={String(close.deliveryActive)} />
            <InfoBox label="Delivery cobrado por entrega" value={formatUSD(close.deliveryCollectedUSD)} />
            <InfoBox label="Delivery en divisas" value={formatUSD(close.deliveryPaidInUSD)} />
            <InfoBox label="Delivery en bolívares" value={`Bs ${formatVES(close.deliveryPaidInVES)}`} />
            <InfoBox label="Equiv. Bs en USD" value={formatUSD(close.deliveryPaidInVESEquivalentUSD)} />
            <InfoBox label="Delivery mixto" value={formatUSD(close.deliveryPaidMixedUSD)} />
            <InfoBox label="Delivery pendiente" value={formatUSD(close.pendingDeliveryUSD)} />
          </div>

          {showBusinessSections && (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <SummaryList
                title="Delivery por forma de cobro real"
                emptyText="Sin delivery por forma de cobro real guardado."
                items={close.deliveryByPaymentIn}
                showVES
                showDelivery
              />
              <SummaryList
                title="Delivery por método indicado"
                emptyText="Sin delivery por método indicado guardado."
                items={close.deliveryByPayment}
                showDelivery
              />
              <SummaryList
                title="Delivery por zona"
                emptyText="Sin delivery por zona guardado."
                items={close.deliveryByZone}
                showDelivery
              />
            </div>
          )}
        </DetailToggleSection>

        <DetailToggleSection
          title="Gastos, proveedores y neto"
          description="Salidas de caja, compras de inventario, proveedores, categorías y métodos de gasto."
          defaultOpen={close.expensesTotalUSD > 0}
          badge={formatUSD(close.expensesTotalUSD)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoBox label="Gastos registrados" value={String(close.expensesCount)} />
            <InfoBox label="Total gastos" value={formatUSD(close.expensesTotalUSD)} />
            <InfoBox label="Gastos en divisas" value={formatUSD(close.expensesCashUSD)} />
            <InfoBox label="Gastos en bolívares" value={`Bs ${formatVES(close.expensesVES)}`} />
            <InfoBox label="Equiv. Bs en USD" value={formatUSD(close.expensesVESEquivalentUSD)} />
            <InfoBox label="Neto estimado" value={formatUSD(getCloseNetEstimatedUSD(close))} />
            <InfoBox
              label="Compras inventario"
              value={`${closeInventoryExpenses.count} registro(s) · ${formatUSD(closeInventoryExpenses.totalUSD)}`}
            />
          </div>

          {showBusinessSections && (
            <div className="mt-4 space-y-4">
              <ExpensesList expenses={close.expenses} />
              <div className="grid gap-4 xl:grid-cols-2">
                <SummaryList
                  title="Gastos por proveedor"
                  emptyText="Sin proveedores guardados en este cierre."
                  items={closeExpensesByProvider}
                  showVES
                />
                <SummaryList
                  title="Gastos por tipo"
                  emptyText="Sin tipos de gasto guardados en este cierre."
                  items={closeExpensesByType}
                  showVES
                />
                <SummaryList
                  title="Gastos por categoría"
                  emptyText="Sin categorías de gasto guardadas en este cierre."
                  items={closeExpensesByCategory}
                  showVES
                />
                <SummaryList
                  title="Gastos por método"
                  emptyText="Sin métodos de gasto guardados en este cierre."
                  items={closeExpensesByMethod}
                  showVES
                />
              </div>
            </div>
          )}
        </DetailToggleSection>

        <DetailToggleSection
          title="Inventario y recetas"
          description="Compras que sumaron inventario y revisión de movimientos relacionados con este cierre."
          defaultOpen={closeInventoryExpenses.count > 0}
          badge={`${closeInventoryExpenses.count} compra(s)`}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBox
              label="Compras con inventario"
              value={String(closeInventoryExpenses.count)}
            />
            <InfoBox
              label="Total inventario USD"
              value={formatUSD(closeInventoryExpenses.totalUSD)}
            />
            <InfoBox
              label="Total inventario Bs"
              value={`Bs ${formatVES(closeInventoryExpenses.totalVES)}`}
            />
          </div>

          <p className="mt-4 rounded-2xl border-2 border-[#a00000]/20 bg-white px-4 py-3 text-sm font-bold leading-6 text-[#3a0000]/70">
            Este bloque resume las compras relacionadas con inventario que quedaron dentro del cierre. Los descuentos por receta se ejecutan cuando los pedidos se marcan como entregados y se revisan mejor desde el módulo de inventario.
          </p>
        </DetailToggleSection>

        <DetailToggleSection
          title="Resumen para copiar"
          description="Texto completo guardado con el cierre para enviar, imprimir o revisar fuera del sistema."
          defaultOpen={showAdvancedSections}
        >
          <pre className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-2xl border-2 border-[#a00000]/20 bg-white p-4 text-sm font-bold leading-6 text-[#3a0000]">
            {close.summaryText || "Sin resumen guardado."}
          </pre>
        </DetailToggleSection>
      </div>
    </ModalShell>
  )
}

function DetailToggleSection({
  title,
  description,
  badge,
  defaultOpen,
  children,
}: {
  title: string
  description: string
  badge?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(Boolean(defaultOpen))

  return (
    <section className="overflow-hidden rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex w-full flex-col gap-3 px-4 py-4 text-left outline-none transition hover:bg-yellow-100 focus-visible:ring-4 focus-visible:ring-yellow-300/70 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
            {title}
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/65">
            {description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {badge && (
            <span className="rounded-full border-2 border-[#a00000]/25 bg-[#fff7e8] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-[#4a0000]">
              {badge}
            </span>
          )}
          <span className="rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#a00000]">
            {isOpen ? "Ocultar" : "Mostrar"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t-2 border-[#a00000]/15 bg-[#fff7e8] p-4">
          {children}
        </div>
      )}
    </section>
  )
}

function SmartAlerts({
  title,
  description,
  alerts,
  compact,
}: {
  title: string
  description: string
  alerts: SmartAlert[]
  compact?: boolean
}) {
  return (
    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
            {title}
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/65">
            {description}
          </p>
        </div>
        <span className="w-fit rounded-full border-2 border-[#a00000] bg-yellow-300 px-3 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#4a0000]">
          {alerts.length} alerta(s)
        </span>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-2"}`}>
        {alerts.map((alert, index) => (
          <SmartAlertCard key={`${alert.title}-${index}`} alert={alert} />
        ))}
      </div>
    </div>
  )
}

function SmartAlertCard({ alert }: { alert: SmartAlert }) {
  const toneStyle =
    alert.tone === "danger"
      ? "border-red-500 bg-red-50 text-red-800"
      : alert.tone === "warning"
        ? "border-yellow-400 bg-yellow-100 text-[#8a5a00]"
        : alert.tone === "good"
          ? "border-green-500 bg-green-50 text-green-700"
          : "border-[#a00000]/25 bg-[#fff7e8] text-[#3a0000]"

  const iconStyle =
    alert.tone === "good"
      ? "bg-green-500 text-[#220000]"
      : alert.tone === "danger"
        ? "bg-red-600 text-[#220000]"
        : alert.tone === "warning"
          ? "bg-yellow-300 text-[#4a0000]"
          : "bg-white text-[#a00000]"

  return (
    <div className={`rounded-2xl border-2 p-4 ${toneStyle}`}>
      <div className="flex gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-current ${iconStyle}`}>
          {alert.tone === "good" ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm font-black uppercase leading-5">
              {alert.title}
            </p>
            {alert.value && (
              <p className="shrink-0 text-sm font-black text-[#a00000]">
                {alert.value}
              </p>
            )}
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/70">
            {alert.description}
          </p>
        </div>
      </div>
    </div>
  )
}

function ModeSelector({
  value,
  onChange,
}: {
  value: ReportViewMode
  onChange: (value: ReportViewMode) => void
}) {
  const activeMode =
    REPORT_VIEW_MODES.find((item) => item.mode === value) ||
    REPORT_VIEW_MODES[0]

  return (
    <div className="mt-3 rounded-[1.2rem] border border-[#a00000]/20 bg-white p-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#a00000]">
            Modo de vista
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/65">
            {activeMode.description}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {REPORT_VIEW_MODES.map((item) => {
            const isActive = value === item.mode

            return (
              <button
                key={item.mode}
                type="button"
                onClick={() => onChange(item.mode)}
                className={`shrink-0 rounded-full border-2 px-4 py-3 text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${
                  isActive
                    ? "border-[#a00000] bg-yellow-300 text-[#4a0000] hover:bg-yellow-200"
                    : "border-[#a00000]/35 bg-white text-[#a00000] hover:bg-yellow-200"
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ReportGuideModal({
  viewMode,
  onClose,
}: {
  viewMode: ReportViewMode
  onClose: () => void
}) {
  const activeMode =
    REPORT_VIEW_MODES.find((item) => item.mode === viewMode) ||
    REPORT_VIEW_MODES[0]

  return (
    <ModalShell
      onClose={onClose}
      title="Cómo leer el reporte"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000]"
        >
          <X size={17} />
          Cerrar guía
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[1.4rem] border-2 border-[#a00000] bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
            Vista actual: {activeMode.label}
          </p>
          <h3 className="mt-2 text-2xl font-black uppercase text-[#220000]">
            Lee primero lo simple y abre lo avanzado solo cuando haga falta
          </h3>
          <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
            El historial está pensado para que el dueño vea rápido cuánto vendió,
            cuánto cobró, qué queda pendiente y qué productos o zonas se movieron más.
          </p>
        </div>

        <SectionTitle>Modos de vista</SectionTitle>
        <div className="grid gap-3 lg:grid-cols-3">
          <GuideCard
            title="Simple"
            text="Para revisar rápido: números principales, líderes del rango y lista de cierres. Ideal para un dueño que solo quiere saber cómo va el negocio."
          />
          <GuideCard
            title="Negocio"
            text="Agrega alertas y gráficas. Sirve para detectar pendientes, productos fuertes, zonas con movimiento y métodos de cobro importantes."
          />
          <GuideCard
            title="Avanzado"
            text="Muestra auditoría completa: métodos, productos, zonas, gráficos, alertas y texto completo. Útil para revisar caja con más detalle."
          />
        </div>

        <SectionTitle>Qué mirar primero</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <GuideCard
            title="Total vendido"
            text="Es todo lo que el sistema registró como venta dentro del rango filtrado. No significa necesariamente que ya todo fue cobrado."
          />
          <GuideCard
            title="Total cobrado"
            text="Es el dinero real registrado en caja, sumando divisas y bolívares convertidos a su equivalente."
          />
          <GuideCard
            title="Pendiente total"
            text="Es lo que falta por cobrar o terminar de marcar como cobrado. Si está alto, hay que revisar pedidos pendientes o parciales."
          />
          <GuideCard
            title="Efectividad de cobro"
            text="Compara lo cobrado contra lo vendido. Mientras más cerca de 100%, más limpia está la caja."
          />
          <GuideCard
            title="Gastos del día"
            text="Son las salidas de caja guardadas antes de cerrar: compras, pagos, servicios o materia prima. Se restan del cobro real para calcular el neto."
          />
          <GuideCard
            title="Neto estimado"
            text="Es el cobro real menos los gastos guardados en el cierre. Si sale negativo, ese cierre tuvo más gastos que cobros registrados."
          />
        </div>

        <SectionTitle>Cómo entender las barras</SectionTitle>
        <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
          <p className="text-sm font-bold leading-6 text-[#3a0000]/75">
            Las barras amarillas son comparación visual: mientras más larga está la barra,
            más peso tiene ese dato dentro del rango. El monto exacto siempre aparece escrito
            al lado. Úsalas para comparar rápido vendido contra cobrado, productos entre sí,
            zonas de delivery y métodos de pago.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <GuideCard
            title="Cobro contra pendiente"
            text="Compara vendido, cobrado, pendiente, divisas, bolívares equivalentes y delivery. Si pendiente se ve grande, hay dinero por revisar."
          />
          <GuideCard
            title="Evolución por cierre"
            text="Muestra los últimos cierres del rango. Ayuda a ver qué cierre vendió más y cuál dejó más pendiente."
          />
          <GuideCard
            title="Productos más vendidos"
            text="Ordena por unidades vendidas. Sirve para saber qué productos conviene destacar o convertir en promoción."
          />
          <GuideCard
            title="Delivery por zona"
            text="Muestra las zonas con más movimiento. Ayuda a planificar rutas, costos y promociones por zona."
          />
        </div>

        <SectionTitle>Alertas inteligentes</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <GuideCard
            title="Amarillo"
            text="Atención operativa: pendiente, pagos parciales, delivery pendiente o cobros sin método. Conviene revisar, pero no siempre es un error."
          />
          <GuideCard
            title="Rojo"
            text="Revisión importante: ventas registradas sin entregas, pendientes fuertes o datos que pueden confundir caja."
          />
          <GuideCard
            title="Verde"
            text="Dato positivo: producto fuerte, buen cierre o algo que ayuda al dueño a tomar decisiones comerciales."
          />
          <GuideCard
            title="Sin método"
            text="Significa que hubo dinero registrado, pero no quedó claro si fue efectivo, Zelle, pago móvil, punto u otro. Es útil para auditoría."
          />
        </div>
      </div>
    </ModalShell>
  )
}

function GuideCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.2rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
      <p className="text-sm font-black uppercase text-[#220000]">{title}</p>
      <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/70">
        {text}
      </p>
    </div>
  )
}


function DateFilterInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#a00000]">
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-3 text-sm font-black text-[#4a0000] outline-none focus:border-[#a00000]"
      />
    </label>
  )
}

function RangeReport({
  dayCloses,
  totals,
  report,
  startDate,
  endDate,
  viewMode,
}: {
  dayCloses: SavedDayClose[]
  totals: ReturnType<typeof getDayCloseTotals>
  report: ReturnType<typeof getRangeReport>
  startDate: string
  endDate: string
  viewMode: ReportViewMode
}) {
  const rangeLabel =
    startDate || endDate
      ? `${startDate || "primer cierre"} → ${endDate || "último cierre"}`
      : "Todos los cierres cargados"

  const averageCollected =
    dayCloses.length > 0 ? totals.realCollectedUSD / dayCloses.length : 0
  const collectionRate =
    totals.totalSoldUSD > 0
      ? Math.round((totals.realCollectedUSD / totals.totalSoldUSD) * 100)
      : 0
  const deliveryShare =
    totals.realCollectedUSD > 0
      ? Math.round((totals.deliveryCollectedUSD / totals.realCollectedUSD) * 100)
      : 0
  const smartAlerts = getRangeAlerts(dayCloses, totals, report)
  const showBusinessSections = viewMode !== "Simple"
  const showAdvancedSections = viewMode === "Avanzado"

  return (
    <section className="mt-5 overflow-hidden rounded-[1.6rem] border-2 border-[#a00000] bg-white shadow-[0_8px_0_rgba(160,0,0,0.12)]">
      <div className="border-b-2 border-[#a00000] bg-[#fff7e8] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#a00000]">
              Reporte del rango filtrado
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
              Resumen del negocio
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
              {rangeLabel}. Vista {viewMode}. Este reporte se calcula solo con los cierres que estás viendo en pantalla.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-[#a00000] bg-white px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a00000]">
              Promedio cobrado
            </p>
            <p className="mt-1 text-2xl font-black text-[#220000]">
              {formatUSD(averageCollected)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <InfoBox label="Total vendido" value={formatUSD(totals.totalSoldUSD)} />
          <InfoBox label="Total cobrado" value={formatUSD(totals.realCollectedUSD)} />
          <InfoBox label="Total gastos" value={formatUSD(totals.expensesTotalUSD)} />
          <InfoBox label="Neto estimado" value={formatUSD(totals.netEstimatedUSD)} />
          <InfoBox label="Pendiente total" value={formatUSD(totals.realPendingUSD)} />
          <InfoBox label="Efectividad de cobro" value={`${collectionRate}%`} />
          <InfoBox label="Divisas recibidas" value={formatUSD(totals.realCashUSD)} />
          <InfoBox label="Bolívares recibidos" value={`Bs ${formatVES(totals.realVES)}`} />
          <InfoBox label="Delivery cobrado" value={formatUSD(totals.deliveryCollectedUSD)} />
          <InfoBox label="Peso del delivery" value={`${deliveryShare}%`} />
          <InfoBox label="Gastos en divisas" value={formatUSD(totals.expensesCashUSD)} />
          <InfoBox label="Gastos en Bs" value={`Bs ${formatVES(totals.expensesVES)}`} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <InfoBox label="Pedidos registrados" value={String(report.operationalTotals.ordersRegistered)} />
          <InfoBox label="Pedidos entregados" value={String(report.operationalTotals.deliveredOrders)} />
          <InfoBox label="Pedidos activos" value={String(report.operationalTotals.activeOrders)} />
          <InfoBox label="Pedidos cancelados" value={String(report.operationalTotals.canceledOrders)} />
          <InfoBox label="Pedidos pagados" value={String(totals.paidOrders)} />
          <InfoBox label="Pedidos pendientes" value={String(totals.pendingPaymentOrders)} />
        </div>

        <div className="grid gap-3 xl:grid-cols-4">
          <HighlightBox
            title="Producto más vendido"
            main={report.topProduct?.name || "Sin productos"}
            detail={
              report.topProduct
                ? `${report.topProduct.quantity} unidad(es) · ${formatUSD(report.topProduct.totalUSD)}`
                : "Todavía no hay productos entregados en este rango."
            }
          />
          <HighlightBox
            title="Zona delivery líder"
            main={report.topDeliveryZone?.label || "Sin delivery"}
            detail={
              report.topDeliveryZone
                ? `${report.topDeliveryZone.count} registro(s) · ${formatUSD(report.topDeliveryZone.totalUSD)}`
                : "Todavía no hay delivery entregado en este rango."
            }
          />
          <HighlightBox
            title="Método divisas líder"
            main={report.topUSDMethod?.label || "Sin divisas"}
            detail={
              report.topUSDMethod
                ? `${report.topUSDMethod.count} pago(s) · ${formatUSD(report.topUSDMethod.totalUSD)}`
                : "Todavía no hay cobros en divisas."
            }
          />
          <HighlightBox
            title="Método Bs líder"
            main={report.topVESMethod?.label || "Sin bolívares"}
            detail={
              report.topVESMethod
                ? `${report.topVESMethod.count} pago(s) · Bs ${formatVES(report.topVESMethod.totalVES || 0)}`
                : "Todavía no hay cobros en bolívares."
            }
          />
          <HighlightBox
            title="Categoría de gasto líder"
            main={report.topExpenseCategory?.label || "Sin gastos"}
            detail={
              report.topExpenseCategory
                ? `${report.topExpenseCategory.count} gasto(s) · ${formatUSD(report.topExpenseCategory.totalUSD)}`
                : "Todavía no hay gastos guardados en este rango."
            }
          />
          <HighlightBox
            title="Método de gasto líder"
            main={report.topExpenseMethod?.label || "Sin método"}
            detail={
              report.topExpenseMethod
                ? `${report.topExpenseMethod.count} gasto(s) · ${formatUSD(report.topExpenseMethod.totalUSD)}`
                : "Todavía no hay métodos de gasto guardados."
            }
          />
          <HighlightBox
            title="Proveedor principal"
            main={report.topExpenseProvider?.label || "Sin proveedor"}
            detail={
              report.topExpenseProvider
                ? `${report.topExpenseProvider.count} gasto(s) · ${formatUSD(report.topExpenseProvider.totalUSD)}`
                : "Todavía no hay proveedor guardado en este rango."
            }
          />
          <HighlightBox
            title="Tipo de gasto líder"
            main={report.topExpenseType?.label || "Sin tipo"}
            detail={
              report.topExpenseType
                ? `${report.topExpenseType.count} gasto(s) · ${formatUSD(report.topExpenseType.totalUSD)}`
                : "Todavía no hay tipos de gasto guardados."
            }
          />
          <HighlightBox
            title="Compras de inventario"
            main={formatUSD(report.inventoryExpenses.totalUSD)}
            detail={`${report.inventoryExpenses.count} registro(s) relacionados con inventario.`}
          />
        </div>

        {showBusinessSections && (
          <>
            <SmartAlerts
              title="Alertas inteligentes del rango"
              description="El sistema revisa los cierres filtrados y marca puntos que conviene revisar antes de tomar decisiones."
              alerts={smartAlerts}
            />

            <RangeCharts dayCloses={dayCloses} totals={totals} report={report} />
          </>
        )}

        {showAdvancedSections && (
          <div className="grid gap-4 xl:grid-cols-2">
            <SummaryList
              title="Cobros acumulados por estado"
              emptyText="Sin cobros por estado en este rango."
              items={report.paymentByStatus}
            />
            <SummaryList
              title="Cobros acumulados en divisas"
              emptyText="Sin cobros en divisas en este rango."
              items={report.paymentByUSDMethod}
            />
            <SummaryList
              title="Cobros acumulados en bolívares"
              emptyText="Sin cobros en bolívares en este rango."
              items={report.paymentByVESMethod}
              showVES
            />
            <SummaryList
              title="Delivery por forma de cobro"
              emptyText="Sin delivery cobrado en este rango."
              items={report.deliveryByPaymentIn}
              showDelivery
              showVES
            />
            <SummaryList
              title="Delivery acumulado por zona"
              emptyText="Sin delivery por zona en este rango."
              items={report.deliveryByZone}
              showDelivery
            />
            <SummaryList
              title="Gastos por categoría"
              emptyText="Sin gastos por categoría en este rango."
              items={report.expensesByCategory}
              showVES
            />
            <SummaryList
              title="Gastos por método"
              emptyText="Sin gastos por método en este rango."
              items={report.expensesByMethod}
              showVES
            />
            <SummaryList
              title="Gastos por proveedor"
              emptyText="Sin proveedores guardados en este rango."
              items={report.expensesByProvider}
              showVES
            />
            <SummaryList
              title="Gastos por tipo"
              emptyText="Sin tipos de gasto guardados en este rango."
              items={report.expensesByType}
              showVES
            />
            <ProductsSoldList products={report.allProducts.slice(0, 8)} />
          </div>
        )}
      </div>
    </section>
  )
}

function getChartPercent(value: number, maxValue: number) {
  if (!Number.isFinite(value) || !Number.isFinite(maxValue) || maxValue <= 0) {
    return "0%"
  }

  const percent = Math.max(0, Math.min(100, (value / maxValue) * 100))

  return `${percent}%`
}

function RangeCharts({
  dayCloses,
  totals,
  report,
}: {
  dayCloses: SavedDayClose[]
  totals: ReturnType<typeof getDayCloseTotals>
  report: ReturnType<typeof getRangeReport>
}) {
  const chronologicalCloses = [...dayCloses]
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()

      return dateA - dateB
    })
    .slice(-8)

  const maxCloseValue = Math.max(
    1,
    ...chronologicalCloses.map((close) =>
      Math.max(close.realCollectedUSD, close.realPendingUSD, close.totalSoldUSD)
    )
  )

  const topProducts = report.allProducts.slice(0, 6)
  const topZones = report.deliveryByZone.slice(0, 6)
  const topUSDMethods = report.paymentByUSDMethod.slice(0, 6)
  const topVESMethods = report.paymentByVESMethod.slice(0, 6)

  const maxProductQuantity = Math.max(
    1,
    ...topProducts.map((product) => product.quantity)
  )
  const maxZoneValue = Math.max(
    1,
    ...topZones.map((item) => Math.max(item.totalUSD, item.deliveryCostUSD || 0))
  )
  const maxUSDMethodValue = Math.max(
    1,
    ...topUSDMethods.map((item) => item.totalUSD)
  )
  const maxVESMethodValue = Math.max(
    1,
    ...topVESMethods.map((item) => Math.max(item.totalVES || 0, item.totalUSD))
  )
  const maxMoneySummaryValue = Math.max(
    1,
    totals.totalSoldUSD,
    totals.realCollectedUSD,
    totals.realPendingUSD,
    totals.realCashUSD,
    totals.realVESEquivalentUSD,
    totals.deliveryCollectedUSD
  )

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartPanel
        title="Cobro contra pendiente"
        description="Compara lo vendido, lo cobrado y lo pendiente dentro del rango filtrado."
      >
        <MoneyChartBar
          label="Total vendido"
          value={totals.totalSoldUSD}
          maxValue={maxMoneySummaryValue}
        />
        <MoneyChartBar
          label="Total cobrado"
          value={totals.realCollectedUSD}
          maxValue={maxMoneySummaryValue}
        />
        <MoneyChartBar
          label="Pendiente"
          value={totals.realPendingUSD}
          maxValue={maxMoneySummaryValue}
        />
        <MoneyChartBar
          label="Divisas"
          value={totals.realCashUSD}
          maxValue={maxMoneySummaryValue}
        />
        <MoneyChartBar
          label="Bs equiv. USD"
          value={totals.realVESEquivalentUSD}
          maxValue={maxMoneySummaryValue}
        />
        <MoneyChartBar
          label="Delivery"
          value={totals.deliveryCollectedUSD}
          maxValue={maxMoneySummaryValue}
        />
      </ChartPanel>

      <ChartPanel
        title="Evolución por cierre"
        description="Últimos cierres del rango, ordenados del más antiguo al más reciente."
      >
        {chronologicalCloses.length === 0 ? (
          <EmptyChartText text="Sin cierres para graficar." />
        ) : (
          chronologicalCloses.map((close) => (
            <MoneyChartBar
              key={close.id}
              label={getCloseTitle(close)}
              value={close.realCollectedUSD}
              maxValue={maxCloseValue}
              detail={`Pendiente ${formatUSD(close.realPendingUSD)} · Vendido ${formatUSD(close.totalSoldUSD)}`}
            />
          ))
        )}
      </ChartPanel>

      <ChartPanel
        title="Productos más vendidos"
        description="Ranking por unidades vendidas dentro de los cierres entregados."
      >
        {topProducts.length === 0 ? (
          <EmptyChartText text="Sin productos vendidos en este rango." />
        ) : (
          topProducts.map((product) => (
            <QuantityChartBar
              key={product.name}
              label={product.name}
              quantity={product.quantity}
              maxQuantity={maxProductQuantity}
              detail={`${formatUSD(product.totalUSD)}${
                product.totalVES > 0 ? ` · Bs ${formatVES(product.totalVES)}` : " · Bs según tasa del día"
              }`}
            />
          ))
        )}
      </ChartPanel>

      <ChartPanel
        title="Delivery por zona"
        description="Zonas con más movimiento dentro del rango filtrado."
      >
        {topZones.length === 0 ? (
          <EmptyChartText text="Sin zonas delivery en este rango." />
        ) : (
          topZones.map((item) => (
            <MoneyChartBar
              key={item.label}
              label={item.label}
              value={item.totalUSD}
              maxValue={maxZoneValue}
              detail={`${item.count} registro(s) · Delivery ${formatUSD(item.deliveryCostUSD || 0)}`}
            />
          ))
        )}
      </ChartPanel>

      <ChartPanel
        title="Métodos en divisas"
        description="Distribución de cobros reales recibidos en divisas."
      >
        {topUSDMethods.length === 0 ? (
          <EmptyChartText text="Sin cobros en divisas." />
        ) : (
          topUSDMethods.map((item) => (
            <MoneyChartBar
              key={item.label}
              label={item.label}
              value={item.totalUSD}
              maxValue={maxUSDMethodValue}
              detail={`${item.count} pago(s)`}
            />
          ))
        )}
      </ChartPanel>

      <ChartPanel
        title="Métodos en bolívares"
        description="Distribución de cobros reales recibidos en bolívares."
      >
        {topVESMethods.length === 0 ? (
          <EmptyChartText text="Sin cobros en bolívares." />
        ) : (
          topVESMethods.map((item) => (
            <VESChartBar
              key={item.label}
              label={item.label}
              valueVES={item.totalVES || 0}
              valueUSD={item.totalUSD}
              maxValue={maxVESMethodValue}
              detail={`${item.count} pago(s) · Equiv. ${formatUSD(item.totalUSD)}`}
            />
          ))
        )}
      </ChartPanel>

      <ChartPanel
        title="Gastos por categoría"
        description="Salidas de caja agrupadas por categoría dentro del rango filtrado."
      >
        {report.expensesByCategory.length === 0 ? (
          <EmptyChartText text="Sin gastos por categoría en este rango." />
        ) : (
          report.expensesByCategory.slice(0, 6).map((item) => (
            <MoneyChartBar
              key={item.label}
              label={item.label}
              value={item.totalUSD}
              maxValue={Math.max(1, ...report.expensesByCategory.map((expense) => expense.totalUSD))}
              detail={`${item.count} gasto(s) · Bs ${formatVES(item.totalVES || 0)}`}
            />
          ))
        )}
      </ChartPanel>

      <ChartPanel
        title="Gastos por método"
        description="Cómo salieron los gastos: divisas, bolívares, Binance/USDT, Zelle u otros métodos."
      >
        {report.expensesByMethod.length === 0 ? (
          <EmptyChartText text="Sin gastos por método en este rango." />
        ) : (
          report.expensesByMethod.slice(0, 6).map((item) => (
            <MoneyChartBar
              key={item.label}
              label={item.label}
              value={item.totalUSD}
              maxValue={Math.max(1, ...report.expensesByMethod.map((expense) => expense.totalUSD))}
              detail={`${item.count} gasto(s) · Bs ${formatVES(item.totalVES || 0)}`}
            />
          ))
        )}
      </ChartPanel>

      <ChartPanel
        title="Gastos por proveedor"
        description="Proveedores o comercios que más peso tienen en las compras y gastos."
      >
        {report.expensesByProvider.length === 0 ? (
          <EmptyChartText text="Sin proveedores guardados en este rango." />
        ) : (
          report.expensesByProvider.slice(0, 6).map((item) => (
            <MoneyChartBar
              key={item.label}
              label={item.label}
              value={item.totalUSD}
              maxValue={Math.max(1, ...report.expensesByProvider.map((expense) => expense.totalUSD))}
              detail={`${item.count} gasto(s) · Bs ${formatVES(item.totalVES || 0)}`}
            />
          ))
        )}
      </ChartPanel>

      <ChartPanel
        title="Gastos por tipo"
        description="Diferencia compras de inventario, pagos, servicios, mantenimiento y otros gastos."
      >
        {report.expensesByType.length === 0 ? (
          <EmptyChartText text="Sin tipos de gasto guardados en este rango." />
        ) : (
          report.expensesByType.slice(0, 6).map((item) => (
            <MoneyChartBar
              key={item.label}
              label={item.label}
              value={item.totalUSD}
              maxValue={Math.max(1, ...report.expensesByType.map((expense) => expense.totalUSD))}
              detail={`${item.count} gasto(s) · Bs ${formatVES(item.totalVES || 0)}`}
            />
          ))
        )}
      </ChartPanel>
    </div>
  )
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
        {title}
      </p>
      <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/65">
        {description}
      </p>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  )
}

function MoneyChartBar({
  label,
  value,
  maxValue,
  detail,
}: {
  label: string
  value: number
  maxValue: number
  detail?: string
}) {
  return (
    <ChartBar
      label={label}
      value={formatUSD(value)}
      percent={getChartPercent(value, maxValue)}
      detail={detail}
    />
  )
}

function VESChartBar({
  label,
  valueVES,
  valueUSD,
  maxValue,
  detail,
}: {
  label: string
  valueVES: number
  valueUSD: number
  maxValue: number
  detail?: string
}) {
  return (
    <ChartBar
      label={label}
      value={`Bs ${formatVES(valueVES)}`}
      percent={getChartPercent(Math.max(valueVES, valueUSD), maxValue)}
      detail={detail}
    />
  )
}

function QuantityChartBar({
  label,
  quantity,
  maxQuantity,
  detail,
}: {
  label: string
  quantity: number
  maxQuantity: number
  detail?: string
}) {
  return (
    <ChartBar
      label={label}
      value={`${quantity} unidad(es)`}
      percent={getChartPercent(quantity, maxQuantity)}
      detail={detail}
    />
  )
}

function ChartBar({
  label,
  value,
  percent,
  detail,
}: {
  label: string
  value: string
  percent: string
  detail?: string
}) {
  return (
    <div className="rounded-2xl border border-[#a00000]/15 bg-[#fff7e8] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black uppercase text-[#220000]">
            {label}
          </p>
          {detail && (
            <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/60">
              {detail}
            </p>
          )}
        </div>
        <p className="shrink-0 text-sm font-black text-[#a00000]">{value}</p>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full border border-[#a00000]/20 bg-white">
        <div
          className="h-full rounded-full bg-yellow-300 shadow-[inset_0_0_0_1px_rgba(160,0,0,0.2)]"
          style={{ width: percent }}
        />
      </div>
    </div>
  )
}

function EmptyChartText({ text }: { text: string }) {
  return (
    <p className="rounded-2xl bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/70">
      {text}
    </p>
  )
}

function HighlightBox({
  title,
  main,
  detail,
}: {
  title: string
  main: string
  detail: string
}) {
  return (
    <div className="rounded-[1.2rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#a00000]">
        {title}
      </p>
      <p className="mt-2 text-xl font-black uppercase leading-tight text-[#220000]">
        {main}
      </p>
      <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/65">
        {detail}
      </p>
    </div>
  )
}

function MetricCard({
  label,
  value,
  tone = "red",
}: {
  label: string
  value: string | number
  tone?: "red" | "yellow" | "soft"
}) {
  const style =
    tone === "yellow"
      ? "border-yellow-400 bg-yellow-100 text-[#8a5a00]"
      : tone === "soft"
        ? "border-[#a00000]/25 bg-white text-[#3a0000]"
        : "border-[#a00000] bg-[#fff7e8] text-[#a00000]"

  return (
    <div className={`rounded-[1.2rem] border-2 p-3 ${style}`}>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 break-words text-2xl font-black">{value}</p>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#a00000]/20 bg-[#fff7e8] px-3 py-2">
      <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#a00000]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#220000]">
        {value}
      </p>
    </div>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-3">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#a00000]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#220000]">
        {value || "—"}
      </p>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
      {children}
    </p>
  )
}

function SummaryList({
  title,
  emptyText,
  items,
  showVES,
  showDelivery,
}: {
  title: string
  emptyText: string
  items: SummaryItem[]
  showVES?: boolean
  showDelivery?: boolean
}) {
  return (
    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
        {title}
      </p>

      {items.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/70">
          {emptyText}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="rounded-2xl border border-[#a00000]/15 bg-[#fff7e8] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase text-[#220000]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                    {item.count} registro(s)
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-black text-[#a00000]">
                    {formatUSD(item.totalUSD)}
                  </p>
                  {showVES && item.totalVES && item.totalVES > 0 && (
                    <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                      Bs {formatVES(item.totalVES)}
                    </p>
                  )}
                  {showDelivery && item.deliveryCostUSD && item.deliveryCostUSD > 0 && (
                    <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                      Delivery {formatUSD(item.deliveryCostUSD)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpensesList({ expenses }: { expenses: DayCloseExpense[] }) {
  return (
    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
        Gastos del cierre
      </p>

      {expenses.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/70">
          Sin gastos guardados en este cierre.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {expenses.map((expense, index) => (
            <div
              key={`${expense.id || expense.concept}-${index}`}
              className="rounded-2xl border border-[#a00000]/15 bg-[#fff7e8] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase text-[#220000]">
                    {expense.concept}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[#a00000]">
                    {expense.expenseType || "Gasto operativo"} · {expense.category} · {expense.method}
                  </p>
                  {expense.provider && (
                    <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/70">
                      Proveedor: {expense.provider}
                    </p>
                  )}
                  {(expense.inventoryLinked || expense.inventoryItemName) && (
                    <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/70">
                      Inventario: {expense.inventoryItemName || "Insumo"} +{expense.inventoryQuantity || 0} {expense.inventoryUnit || "unidades"}
                    </p>
                  )}
                  {expense.note && (
                    <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/60">
                      {expense.note}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-base font-black text-[#a00000]">
                    {formatUSD(expense.equivalentUSD)}
                  </p>
                  {expense.amountUSD > 0 && (
                    <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                      Divisas {formatUSD(expense.amountUSD)}
                    </p>
                  )}
                  {expense.amountVES > 0 && (
                    <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                      Bs {formatVES(expense.amountVES)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductsSoldList({ products }: { products: ProductSold[] }) {
  return (
    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
        Productos vendidos
      </p>

      {products.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/70">
          Sin productos vendidos guardados.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {products.map((product, index) => (
            <div
              key={`${product.name}-${index}`}
              className="rounded-2xl border border-[#a00000]/15 bg-[#fff7e8] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase text-[#220000]">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                    {product.quantity} unidad(es)
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-black text-[#a00000]">
                    {formatUSD(product.totalUSD)}
                  </p>
                  {product.totalVES > 0 && (
                    <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                      Bs {formatVES(product.totalVES)}
                    </p>
                  )}
                  {product.totalVES <= 0 && product.totalUSD > 0 && (
                    <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                      Bs según tasa del día
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ModalShell({
  title,
  children,
  onClose,
  footer,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#220000]/60 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4 sm:py-4">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border-4 border-[#a00000] bg-[#fff7e8] text-[#220000] shadow-2xl shadow-black/45">
        <div className="h-5 shrink-0 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#fff7e8]" />

        <div className="flex shrink-0 items-start justify-between gap-4 border-b-2 border-[#a00000] bg-white px-4 py-4 sm:px-6 sm:py-5">
          <h2 className="text-2xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)] sm:text-3xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#a00000] bg-yellow-300 text-[#4a0000]"
          >
            <X size={24} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t-2 border-[#a00000] bg-white px-4 py-3 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
