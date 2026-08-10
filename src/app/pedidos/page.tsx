"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useVisiblePolling } from "@/hooks/useVisiblePolling"
import {
  AlertTriangle,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Clock,
  CookingPot,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MapPin,
  MessageCircle,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Truck,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from "lucide-react"
import { formatUSD, formatVES } from "@/utils/formatCurrency"
import { useVisiblePolling } from "@/hooks/useVisiblePolling"
import {
  getModulePlanAccess,
  getShortPlanLabel,
  normalizeLocalModuleList,
  normalizeLocalPlanKey,
  normalizeLocalPlanMode,
  type LocalModuleKey,
  type LocalPlanKey,
  type LocalPlanMode,
} from "@/lib/localPlans"

type ProductPaymentMode = "divisa" | "mixto"

type CartItem = {
  id: number
  name: string
  category: string
  price: number
  image: string
  quantity: number
  note?: string
  noteEnabled?: boolean
  paymentMode?: ProductPaymentMode
}

type OrderStatus = "Nuevo" | "Preparando" | "Listo" | "Entregado" | "Cancelado"
type PaymentStatus = "Pendiente" | "Pago parcial" | "Pagado"
type DeliveryPaymentIn = "Divisas" | "Bolívares" | "Mixto" | "Sin registrar"
type StatusFilter = OrderStatus | "Activos" | "Todos"
type PanelPaymentFilter = "Todos los cobros" | "Pendiente de pago" | "Pago parcial" | "Pagado"
type PanelOrderScopeFilter = "Todos los tipos" | "Delivery" | "Local / llevar"
type OrderType = "Comer aquí" | "Para llevar" | "Delivery"

type OrderPayment = {
  status: PaymentStatus
  amountReceivedUSD: number
  amountReceivedVES: number
  paymentMethodUSD: string
  paymentMethodVES: string
  deliveryPaymentIn: DeliveryPaymentIn
  paymentNote: string
  totalOrderUSD: number
  receivedEquivalentUSD: number
  pendingUSD: number
  updatedAt?: string
}

type PaymentForm = {
  amountReceivedUSD: string
  amountReceivedVES: string
  paymentMethodUSD: string
  paymentMethodVES: string
  deliveryPaymentIn: DeliveryPaymentIn
  paymentNote: string
}

type LocalOrder = {
  rowNumber?: number
  id: string
  createdAt: string
  customerName: string
  customerPhone?: string
  tableNumber: string
  orderType: OrderType
  customerNote: string
  deliveryAddress?: string
  deliveryReference?: string
  deliveryZone?: string
  paymentMethod?: string
  deliveryCostUSD?: number
  totalBeforeDeliveryUSD?: number
  items: CartItem[]
  itemsText: string
  totalPrice: number
  totalVES: number
  totalUSD?: number
  totalCombosUSD?: number
  totalRegularUSD?: number
  totalRegularVES?: number
  exchangeRate: number
  exchangeSource?: string
  exchangeValueDate?: string
  status: OrderStatus

  payment?: OrderPayment
  paymentStatus?: PaymentStatus
  amountReceivedUSD?: number
  amountReceivedVES?: number
  paymentMethodUSD?: string
  paymentMethodVES?: string
  deliveryPaymentIn?: DeliveryPaymentIn
  paymentNote?: string
  paymentTotalOrderUSD?: number
  paymentReceivedEquivalentUSD?: number
  paymentPendingUSD?: number
  paymentUpdatedAt?: string
}

type ProductSold = {
  name: string
  quantity: number
  totalUSD: number
  totalVES: number
  onlyCurrency: boolean
}

type NewOrderToast = {
  id: string
  number: string
  customerName: string
  tableNumber: string
  totalUSD: number
  orderType: OrderType
}

type DeliveryZone = {
  name: string
  costUSD: number
  isActive?: boolean
}

type DaySummaryTotals = {
  count: number
  totalUSD: number
  totalCombosUSD: number
  totalRegularUSD: number
  totalRegularVES: number
  deliveryCostUSD: number
}

type DaySummaryItem = DaySummaryTotals & {
  label: string
}

type PaymentSummaryItem = {
  label: string
  count: number
  totalUSD: number
  totalVES?: number
  deliveryCostUSD?: number
}

type PaymentSummaryTotals = {
  count: number
  totalUSD: number
  totalVES: number
  deliveryCostUSD: number
}

type ExpenseSummaryItem = {
  label: string
  count: number
  totalUSD: number
  amountUSD: number
  amountVES: number
}

type CloseReviewTone = "danger" | "warning" | "success" | "info"

type CloseReviewItem = {
  title: string
  description: string
  value: string
  tone: CloseReviewTone
}

type DayExpense = {
  id: string
  dateLabel: string
  dateValue: string
  concept: string
  category: string
  amountUSD: number
  amountVES: number
  equivalentUSD: number
  method: string
  note: string
  createdAt: string
  provider?: string
  expenseType?: string
  inventoryLinked?: boolean
  inventoryItemId?: string
  inventoryItemName?: string
  inventoryQuantity?: number
  inventoryUnit?: string
}

type ExpenseForm = {
  concept: string
  category: string
  provider: string
  expenseType: string
  amountUSD: string
  amountVES: string
  equivalentUSD: string
  method: string
  note: string
}

type InventoryItemForExpense = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minimumStock: number
  costUSD: number
  costVES?: number
  equivalentCostUSD?: number
  note: string
  isActive: boolean
  updatedAt: string
}

type ExpenseInventoryForm = {
  mode: "existing" | "new"
  itemId: string
  name: string
  category: string
  quantity: string
  unit: string
  minimumStock: string
  note: string
}

type ExpenseQuickConcept = {
  id: string
  name: string
  category: string
  unit: string
  relatedInventory: boolean
}

type BusinessViewMode = "simple" | "negocio" | "avanzado"
type ExchangeRateMode = "automatic" | "manual"
type PanelSoundKind =
  | "new-order"
  | "sent-kitchen"
  | "ready"
  | "delivery"
  | "success"
  | "warning"

type LocalAccessRole = "owner" | "manager" | "cashier" | "kitchen" | "delivery"

type LocalAccessData = {
  ok?: boolean
  error?: string
  access?: {
    role?: LocalAccessRole | null
    roleLabel?: string
    allowed?: boolean
    canAccessRole?: boolean
    moduleEnabled?: boolean
  }
  businessConfig?: {
    businessName?: string
  }
}

const LOCAL_ROLE_HOME_PATHS: Record<LocalAccessRole, string> = {
  owner: "/local-santo",
  manager: "/local-santo",
  cashier: "/local-santo/caja",
  kitchen: "/local-santo/cocina",
  delivery: "/local-santo/delivery",
}

const LOCAL_ROLE_LABELS: Record<LocalAccessRole, string> = {
  owner: "Dueño",
  manager: "Encargado",
  cashier: "Caja",
  kitchen: "Cocina",
  delivery: "Delivery",
}

function isWorkerOnlyRole(role: LocalAccessRole | null) {
  return role === "cashier" || role === "kitchen" || role === "delivery"
}

type BusinessConfig = {
  businessName: string
  businessShortDescription: string
  mainWhatsapp: string
  deliveryWhatsapp: string
  exchangeRateMode: ExchangeRateMode
  manualExchangeRate: number
  membershipPlan: LocalPlanKey
  membershipPlanMode: LocalPlanMode
  customIncludedModules: LocalModuleKey[]
  customBlockedModules: LocalModuleKey[]
  deliveryEnabled: boolean
  ownerDashboardModuleEnabled: boolean
  cashierModuleEnabled: boolean
  kitchenModuleEnabled: boolean
  deliveryModuleEnabled: boolean
  historyModuleEnabled: boolean
  expensesModuleEnabled: boolean
  menuProductsModuleEnabled: boolean
  featuredProductsModuleEnabled: boolean
  customersModuleEnabled: boolean
  inventoryModuleEnabled: boolean
  defaultViewMode: BusinessViewMode
  soundEnabled: boolean
  filtersOpenByDefault: boolean
  allowCloseWithPendingOrders: boolean
  allowCloseWithPendingPayments: boolean
  updatedAt?: string
}

const ADMIN_STORAGE_KEY = "la_bambucha_premium_owner_session"
const LOCATIONS_STORAGE_KEY = "la_bambucha_premium_order_locations"
const SOUND_STORAGE_KEY = "la_bambucha_premium_panel_sound_enabled"
const EXPENSE_CONCEPTS_STORAGE_KEY = "la_bambucha_premium_expense_concepts_v1"
const CUSTOM_EXPENSE_CONCEPT_ID = "__custom_expense_concept__"

const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  businessName: "La Bambucha",
  businessShortDescription: "Menú, pedidos y operación",
  mainWhatsapp: "",
  deliveryWhatsapp: "",
  exchangeRateMode: "automatic",
  manualExchangeRate: 0,
  membershipPlan: "complete",
  membershipPlanMode: "plan",
  customIncludedModules: [],
  customBlockedModules: [],
  deliveryEnabled: true,
  ownerDashboardModuleEnabled: true,
  cashierModuleEnabled: true,
  kitchenModuleEnabled: true,
  deliveryModuleEnabled: true,
  historyModuleEnabled: true,
  expensesModuleEnabled: true,
  menuProductsModuleEnabled: true,
  featuredProductsModuleEnabled: true,
  customersModuleEnabled: true,
  inventoryModuleEnabled: true,
  defaultViewMode: "negocio",
  soundEnabled: true,
  filtersOpenByDefault: false,
  allowCloseWithPendingOrders: true,
  allowCloseWithPendingPayments: true,
}

const DEFAULT_ORDER_LOCATIONS = [
  "Mesa 1",
  "Mesa 2",
  "Mesa 3",
  "Mesa 4",
  "Barra",
  "Afuera",
]

const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { name: "La Trigaleña", costUSD: 2, isActive: true },
  { name: "Centro", costUSD: 1, isActive: true },
  { name: "Prebo", costUSD: 2.5, isActive: true },
  { name: "Naguanagua", costUSD: 3, isActive: true },
  { name: "Los Samanes", costUSD: 3, isActive: true },
  { name: "San Diego", costUSD: 4, isActive: true },
]

const DELIVERY_PAYMENT_OPTIONS: DeliveryPaymentIn[] = [
  "Sin registrar",
  "Divisas",
  "Bolívares",
  "Mixto",
]

const PAYMENT_METHOD_USD_OPTIONS = [
  "",
  "Efectivo divisas",
  "Zelle",
  "Binance / USDT",
  "Transferencia internacional",
  "Otro",
]

const PAYMENT_METHOD_VES_OPTIONS = [
  "",
  "Pago móvil",
  "Punto",
  "Transferencia",
  "Efectivo Bs",
  "Biopago",
  "Otro",
]

const EMPTY_PAYMENT_FORM: PaymentForm = {
  amountReceivedUSD: "",
  amountReceivedVES: "",
  paymentMethodUSD: "",
  paymentMethodVES: "",
  deliveryPaymentIn: "Sin registrar",
  paymentNote: "",
}

const filterOptions: StatusFilter[] = [
  "Activos",
  "Nuevo",
  "Preparando",
  "Listo",
  "Entregado",
  "Cancelado",
  "Todos",
]

const panelPaymentFilterOptions: PanelPaymentFilter[] = [
  "Todos los cobros",
  "Pendiente de pago",
  "Pago parcial",
  "Pagado",
]

const panelOrderScopeFilterOptions: PanelOrderScopeFilter[] = [
  "Todos los tipos",
  "Delivery",
  "Local / llevar",
]

const EXPENSE_CATEGORIES = [
  "Materia prima",
  "Compra de productos",
  "Pago motorizado",
  "Pago empleado",
  "Servicios",
  "Transporte",
  "Mantenimiento",
  "Otros",
]

const EXPENSE_TYPES = [
  "Compra de inventario",
  "Gasto operativo",
  "Pago trabajador",
  "Pago delivery",
  "Servicio",
  "Mantenimiento",
  "Otro",
]

const EXPENSE_METHODS = [
  "Sin registrar",
  "Efectivo divisas",
  "Zelle",
  "Binance / USDT",
  "Pago móvil",
  "Punto",
  "Transferencia",
  "Efectivo Bs",
  "Mixto",
  "Otro",
]

const EMPTY_EXPENSE_FORM: ExpenseForm = {
  concept: "",
  category: "Materia prima",
  provider: "",
  expenseType: "Compra de inventario",
  amountUSD: "",
  amountVES: "",
  equivalentUSD: "",
  method: "Sin registrar",
  note: "",
}

const EMPTY_EXPENSE_INVENTORY_FORM: ExpenseInventoryForm = {
  mode: "new",
  itemId: "",
  name: "",
  category: "Materia prima",
  quantity: "",
  unit: "unidades",
  minimumStock: "",
  note: "",
}

const EXPENSE_INVENTORY_UNIT_OPTIONS = [
  "unidades",
  "paquetes",
  "cajas",
  "latas",
  "botellas",
  "kg",
  "gramos",
  "litros",
  "ml",
  "bolsas",
  "porciones",
]

const DEFAULT_EXPENSE_QUICK_CONCEPTS: ExpenseQuickConcept[] = [
  {
    id: "pan-hamburguesa",
    name: "Pan de hamburguesa",
    category: "Materia prima",
    unit: "paquetes",
    relatedInventory: true,
  },
  {
    id: "carne-hamburguesa",
    name: "Carne de hamburguesa",
    category: "Materia prima",
    unit: "kg",
    relatedInventory: true,
  },
  {
    id: "pollo",
    name: "Pollo",
    category: "Materia prima",
    unit: "kg",
    relatedInventory: true,
  },
  {
    id: "carne-parrilla",
    name: "Carne para parrilla",
    category: "Materia prima",
    unit: "kg",
    relatedInventory: true,
  },
  {
    id: "pan-pepito",
    name: "Pan de pepito",
    category: "Materia prima",
    unit: "paquetes",
    relatedInventory: true,
  },
  {
    id: "pan-perro",
    name: "Pan de perro",
    category: "Materia prima",
    unit: "paquetes",
    relatedInventory: true,
  },
  {
    id: "salchichas",
    name: "Salchichas",
    category: "Materia prima",
    unit: "paquetes",
    relatedInventory: true,
  },
  {
    id: "papas",
    name: "Papas",
    category: "Materia prima",
    unit: "kg",
    relatedInventory: true,
  },
  {
    id: "queso",
    name: "Queso",
    category: "Materia prima",
    unit: "paquetes",
    relatedInventory: true,
  },
  {
    id: "tocineta",
    name: "Tocineta",
    category: "Materia prima",
    unit: "paquetes",
    relatedInventory: true,
  },
  {
    id: "salsas",
    name: "Salsas",
    category: "Materia prima",
    unit: "unidades",
    relatedInventory: true,
  },
  {
    id: "maiz",
    name: "Maíz",
    category: "Materia prima",
    unit: "latas",
    relatedInventory: true,
  },
  {
    id: "vegetales",
    name: "Vegetales y ensalada",
    category: "Materia prima",
    unit: "porciones",
    relatedInventory: true,
  },
  {
    id: "refrescos",
    name: "Refrescos",
    category: "Compra de productos",
    unit: "unidades",
    relatedInventory: true,
  },
  {
    id: "agua",
    name: "Agua",
    category: "Compra de productos",
    unit: "unidades",
    relatedInventory: true,
  },
  {
    id: "jugos-y-te",
    name: "Jugos y té frío",
    category: "Compra de productos",
    unit: "unidades",
    relatedInventory: true,
  },
  {
    id: "empaques",
    name: "Empaques",
    category: "Compra de productos",
    unit: "unidades",
    relatedInventory: true,
  },
  {
    id: "bolsas",
    name: "Bolsas",
    category: "Compra de productos",
    unit: "paquetes",
    relatedInventory: true,
  },
  {
    id: "servilletas",
    name: "Servilletas",
    category: "Compra de productos",
    unit: "paquetes",
    relatedInventory: true,
  },
  {
    id: "pago-motorizado",
    name: "Pago motorizado",
    category: "Pago motorizado",
    unit: "unidades",
    relatedInventory: false,
  },
  {
    id: "pago-empleado",
    name: "Pago empleado",
    category: "Pago empleado",
    unit: "unidades",
    relatedInventory: false,
  },
  {
    id: "servicios",
    name: "Servicios",
    category: "Servicios",
    unit: "unidades",
    relatedInventory: false,
  },
  {
    id: "mantenimiento",
    name: "Mantenimiento",
    category: "Mantenimiento",
    unit: "unidades",
    relatedInventory: false,
  },
]
function isComboItem(_item: CartItem) {
  // En La Bambucha todos los productos y combos pueden pagarse en divisas, bolívares o mixto.
  return false
}

function isDeliveryOrder(order: LocalOrder) {
  const orderType = String(order.orderType || "").trim().toLowerCase()
  const tableNumber = String(order.tableNumber || "").trim().toLowerCase()
  const deliveryCostUSD = Number(order.deliveryCostUSD || 0)

  return (
    orderType === "delivery" ||
    tableNumber.startsWith("delivery") ||
    Boolean(
      order.deliveryAddress ||
        order.deliveryReference ||
        order.deliveryZone ||
        deliveryCostUSD > 0
    )
  )
}

function getDisplayOrderType(order: LocalOrder): OrderType {
  if (isDeliveryOrder(order)) return "Delivery"
  if (order.orderType === "Para llevar") return "Para llevar"
  return "Comer aquí"
}

function cleanDeliveryLocation(value: string) {
  return value
    .replace(/^delivery\s*-\s*/i, "")
    .trim()
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
}


function getDefaultExpenseTypeFromCategory(category: string, relatedInventory = false) {
  const normalizedCategory = normalizeComparableText(category)

  if (relatedInventory || normalizedCategory === "materia prima" || normalizedCategory === "compra de productos") {
    return "Compra de inventario"
  }

  if (normalizedCategory === "pago motorizado") return "Pago delivery"
  if (normalizedCategory === "pago empleado") return "Pago trabajador"
  if (normalizedCategory === "servicios") return "Servicio"
  if (normalizedCategory === "mantenimiento") return "Mantenimiento"

  return "Gasto operativo"
}

function createExpenseQuickConceptId(name: string) {
  const base = normalizeComparableText(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return `${base || "concepto"}-${Date.now()}`
}

function normalizeExpenseQuickConcept(value: unknown): ExpenseQuickConcept | null {
  const source = (value || {}) as Partial<ExpenseQuickConcept>
  const name = String(source.name || "").trim()

  if (!name) {
    return null
  }

  const category = String(source.category || "Otros").trim() || "Otros"
  const unit = String(source.unit || "unidades").trim() || "unidades"

  return {
    id: String(source.id || "").trim() || createExpenseQuickConceptId(name),
    name,
    category,
    unit,
    relatedInventory: Boolean(source.relatedInventory),
  }
}

function normalizeExpenseQuickConcepts(value: unknown) {
  const source = Array.isArray(value) ? value : []
  const seen = new Set<string>()
  const concepts: ExpenseQuickConcept[] = []

  source.forEach((item) => {
    const normalized = normalizeExpenseQuickConcept(item)
    const key = normalizeComparableText(normalized?.name || "")

    if (!normalized || !key || seen.has(key)) {
      return
    }

    seen.add(key)
    concepts.push(normalized)
  })

  return concepts
}


function inventoryItemToExpenseQuickConcept(
  item: InventoryItemForExpense
): ExpenseQuickConcept {
  return {
    id: `inventory-${item.id}`,
    name: item.name,
    category: item.category || "Materia prima",
    unit: item.unit || "unidades",
    relatedInventory: true,
  }
}

function mergeExpenseQuickConceptsWithInventory(
  concepts: ExpenseQuickConcept[],
  inventoryItems: InventoryItemForExpense[]
) {
  const merged = normalizeExpenseQuickConcepts(concepts)
  const seenNames = new Set(
    merged.map((concept) => normalizeComparableText(concept.name))
  )

  inventoryItems.forEach((item) => {
    const key = normalizeComparableText(item.name)

    if (!item.id || !item.name || !key || seenNames.has(key)) {
      return
    }

    merged.push(inventoryItemToExpenseQuickConcept(item))
    seenNames.add(key)
  })

  return merged
}

function findExpenseInventoryItemByName(
  items: InventoryItemForExpense[],
  name: string
) {
  const target = normalizeComparableText(name)

  if (!target) return undefined

  return items.find((item) => normalizeComparableText(item.name) === target)
}

function normalizeDeliveryZones(value: unknown): DeliveryZone[] {
  if (!Array.isArray(value)) return []

  const seen = new Set<string>()
  const zones: DeliveryZone[] = []

  value.forEach((zone) => {
    const name = String(zone?.name || "").trim()
    const costUSD = Number(zone?.costUSD || 0)
    const key = normalizeComparableText(name)

    if (!name || !key || seen.has(key) || !Number.isFinite(costUSD) || costUSD < 0) {
      return
    }

    seen.add(key)

    zones.push({
      name,
      costUSD,
      isActive: zone?.isActive !== false,
    })
  })

  return zones
}

function getDisplayTableNumber(order: LocalOrder) {
  if (isDeliveryOrder(order)) {
    const cleanZone = String(order.deliveryZone || "").trim()
    const cleanTableNumber = cleanDeliveryLocation(String(order.tableNumber || ""))

    return cleanZone || cleanTableNumber || "Delivery"
  }

  return order.tableNumber || "Sin ubicación"
}

function getOrderDeliveryCost(order: LocalOrder) {
  const savedCost = Number(order.deliveryCostUSD || 0)

  if (savedCost > 0) return savedCost

  if (!isDeliveryOrder(order)) return 0

  const normalizedZone = String(order.deliveryZone || order.tableNumber || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (normalizedZone.includes("trigalena")) return 2
  if (normalizedZone.includes("centro")) return 1
  if (normalizedZone.includes("prebo")) return 2.5
  if (normalizedZone.includes("naguanagua")) return 3
  if (normalizedZone.includes("samanes")) return 3
  if (normalizedZone.includes("san diego")) return 4

  return 0
}

function getOrderTotals(order: LocalOrder) {
  const exchangeRate = Number(order.exchangeRate || 0)
  const deliveryCostUSD = getOrderDeliveryCost(order)

  const itemTotals = order.items.reduce(
    (totals, item) => {
      const subtotal = Number(item.price || 0) * Number(item.quantity || 0)

      if (isComboItem(item)) {
        totals.totalCombosUSD += subtotal
      } else {
        totals.totalRegularUSD += subtotal
      }

      return totals
    },
    {
      totalCombosUSD: 0,
      totalRegularUSD: 0,
    }
  )

  const hasReadableItems = Array.isArray(order.items) && order.items.length > 0

  const savedCombosUSD = Number(order.totalCombosUSD ?? 0)
  const savedRegularUSD = Number(order.totalRegularUSD ?? 0)

  const totalCombosUSD = hasReadableItems
    ? itemTotals.totalCombosUSD
    : savedCombosUSD

  const totalRegularUSD = hasReadableItems
    ? itemTotals.totalRegularUSD
    : savedRegularUSD

  const totalBeforeDeliveryUSD = totalCombosUSD + totalRegularUSD

  const totalRegularVES = hasReadableItems
    ? totalBeforeDeliveryUSD * exchangeRate
    : Number(order.totalVES ?? order.totalRegularVES ?? totalBeforeDeliveryUSD * exchangeRate)

  const totalUSD = totalBeforeDeliveryUSD + deliveryCostUSD

  return {
    totalUSD,
    totalCombosUSD,
    totalRegularUSD,
    totalRegularVES,
    deliveryCostUSD,
    totalBeforeDeliveryUSD,
  }
}

function roundMoney(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue)) {
    return 0
  }

  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function parseMoneyInput(value: string) {
  const rawValue = String(value || "")
    .trim()
    .replace(/\s/g, "")

  if (!rawValue) {
    return 0
  }

  const hasComma = rawValue.includes(",")
  const hasDot = rawValue.includes(".")
  const lastCommaIndex = rawValue.lastIndexOf(",")
  const lastDotIndex = rawValue.lastIndexOf(".")

  let normalizedValue = rawValue

  if (hasComma && hasDot) {
    if (lastCommaIndex > lastDotIndex) {
      // Formato venezolano/europeo: 1.569,25
      normalizedValue = rawValue.replace(/\./g, "").replace(",", ".")
    } else {
      // Formato internacional: 1,569.25
      normalizedValue = rawValue.replace(/,/g, "")
    }
  } else if (hasComma) {
    // Formato común en Venezuela sin separador de miles: 1569,25
    normalizedValue = rawValue.replace(",", ".")
  }

  const numberValue = Number(normalizedValue)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return 0
  }

  return roundMoney(numberValue)
}

function formatMoneyForInput(value: number) {
  const moneyValue = roundMoney(value)

  if (moneyValue <= 0) {
    return ""
  }

  return moneyValue.toFixed(2)
}

function calculatePaymentStatus(
  receivedEquivalentUSD: number,
  totalOrderUSD: number
): PaymentStatus {
  const received = roundMoney(receivedEquivalentUSD)
  const total = roundMoney(totalOrderUSD)

  if (received <= 0) return "Pendiente"
  if (received >= total - 0.01) return "Pagado"

  return "Pago parcial"
}

function normalizePaymentStatus(value: unknown): PaymentStatus {
  if (value === "Pago parcial" || value === "Pagado") return value

  return "Pendiente"
}

function normalizeDeliveryPaymentIn(value: unknown): DeliveryPaymentIn {
  const normalized = normalizeComparableText(String(value || ""))

  if (normalized === "divisas" || normalized === "divisa") {
    return "Divisas"
  }

  if (
    normalized === "bolivares" ||
    normalized === "bolivar" ||
    normalized === "bs" ||
    normalized === "ves"
  ) {
    return "Bolívares"
  }

  if (normalized === "mixto" || normalized === "mixta") {
    return "Mixto"
  }

  return "Sin registrar"
}

function normalizePaymentMethodUSD(value: unknown) {
  const normalized = normalizeComparableText(String(value || ""))

  if (
    !normalized ||
    normalized === "sin registrar" ||
    normalized === "sin metodo" ||
    normalized === "divisas sin metodo"
  ) {
    return ""
  }

  if (
    normalized === "efectivo divisas" ||
    normalized === "efectivo en divisas" ||
    normalized === "divisas" ||
    normalized === "divisa" ||
    normalized === "dolares" ||
    normalized === "dolares efectivo" ||
    normalized === "usd" ||
    normalized === "cash" ||
    normalized.includes("efectivo")
  ) {
    return "Efectivo divisas"
  }

  if (normalized.includes("zelle")) return "Zelle"
  if (
    normalized.includes("binance") ||
    normalized.includes("usdt") ||
    normalized.includes("tether")
  ) {
    return "Binance / USDT"
  }

  if (
    normalized.includes("transferencia internacional") ||
    normalized.includes("transferencia externa") ||
    normalized.includes("wire")
  ) {
    return "Transferencia internacional"
  }

  return "Otro"
}

function normalizePaymentMethodVES(value: unknown) {
  const normalized = normalizeComparableText(String(value || ""))

  if (
    !normalized ||
    normalized === "sin registrar" ||
    normalized === "sin metodo" ||
    normalized === "bolivares sin metodo"
  ) {
    return ""
  }

  if (
    normalized === "pago movil" ||
    normalized === "pagomovil" ||
    normalized.includes("pago movil") ||
    normalized.includes("movil")
  ) {
    return "Pago móvil"
  }

  if (normalized.includes("punto")) return "Punto"
  if (normalized.includes("transferencia")) return "Transferencia"

  if (
    normalized === "efectivo bs" ||
    normalized === "efectivo bolivares" ||
    normalized === "bolivares" ||
    normalized === "bs" ||
    normalized.includes("efectivo")
  ) {
    return "Efectivo Bs"
  }

  if (normalized.includes("biopago") || normalized.includes("bio pago")) {
    return "Biopago"
  }

  return "Otro"
}

function normalizeOrderIndicatedPaymentMethod(value: unknown) {
  const original = String(value || "").trim()
  const normalized = normalizeComparableText(original)

  if (!normalized || normalized === "sin metodo" || normalized === "sin registrar") {
    return "Sin método registrado"
  }

  if (normalized.includes("pago movil") || normalized.includes("pagomovil")) {
    return "Pago móvil"
  }

  if (normalized.includes("efectivo") && normalized.includes("divisa")) {
    return "Efectivo en divisas"
  }

  if (normalized === "divisas" || normalized === "divisa") {
    return "Efectivo en divisas"
  }

  if (normalized.includes("punto")) return "Punto"
  if (normalized.includes("transferencia")) return "Transferencia"
  if (normalized.includes("zelle")) return "Zelle"
  if (
    normalized.includes("binance") ||
    normalized.includes("usdt") ||
    normalized.includes("tether")
  ) {
    return "Binance / USDT"
  }

  return original
}

function getOrderPayment(order: LocalOrder): OrderPayment {
  const orderTotals = getOrderTotals(order)
  const savedPayment = order.payment

  const totalOrderUSD = roundMoney(
    savedPayment?.totalOrderUSD ??
      order.paymentTotalOrderUSD ??
      orderTotals.totalUSD
  )

  const receivedEquivalentUSD = roundMoney(
    savedPayment?.receivedEquivalentUSD ??
      order.paymentReceivedEquivalentUSD ??
      0
  )

  const calculatedStatus = calculatePaymentStatus(
    receivedEquivalentUSD,
    totalOrderUSD
  )

  const status = normalizePaymentStatus(
    savedPayment?.status ?? order.paymentStatus ?? calculatedStatus
  )

  const pendingUSD =
    status === "Pagado"
      ? 0
      : roundMoney(
          savedPayment?.pendingUSD ??
            order.paymentPendingUSD ??
            Math.max(totalOrderUSD - receivedEquivalentUSD, 0)
        )

  return {
    status,
    amountReceivedUSD: roundMoney(
      savedPayment?.amountReceivedUSD ?? order.amountReceivedUSD ?? 0
    ),
    amountReceivedVES: roundMoney(
      savedPayment?.amountReceivedVES ?? order.amountReceivedVES ?? 0
    ),
    paymentMethodUSD: normalizePaymentMethodUSD(
      savedPayment?.paymentMethodUSD ?? order.paymentMethodUSD ?? ""
    ),
    paymentMethodVES: normalizePaymentMethodVES(
      savedPayment?.paymentMethodVES ?? order.paymentMethodVES ?? ""
    ),
    deliveryPaymentIn: normalizeDeliveryPaymentIn(
      savedPayment?.deliveryPaymentIn ?? order.deliveryPaymentIn
    ),
    paymentNote: String(savedPayment?.paymentNote ?? order.paymentNote ?? ""),
    totalOrderUSD,
    receivedEquivalentUSD,
    pendingUSD,
    updatedAt: String(savedPayment?.updatedAt ?? order.paymentUpdatedAt ?? ""),
  }
}

function getPaymentStatusStyle(status: PaymentStatus) {
  if (status === "Pagado") return "bg-green-500 text-white"
  if (status === "Pago parcial") return "bg-yellow-300 text-[#3a0000]"

  return "bg-red-100 text-red-700 border border-red-300"
}

function createPaymentFormFromOrder(order: LocalOrder): PaymentForm {
  const payment = getOrderPayment(order)

  return {
    amountReceivedUSD:
      payment.amountReceivedUSD > 0 ? String(payment.amountReceivedUSD) : "",
    amountReceivedVES:
      payment.amountReceivedVES > 0 ? String(payment.amountReceivedVES) : "",
    paymentMethodUSD: payment.paymentMethodUSD,
    paymentMethodVES: payment.paymentMethodVES,
    deliveryPaymentIn: isDeliveryOrder(order)
      ? payment.deliveryPaymentIn
      : "Sin registrar",
    paymentNote: payment.paymentNote,
  }
}

function calculatePaymentDraft(order: LocalOrder, form: PaymentForm) {
  const orderTotals = getOrderTotals(order)
  const totalOrderUSD = roundMoney(orderTotals.totalUSD)
  const exchangeRate = Number(order.exchangeRate || 0)
  const amountReceivedUSD = parseMoneyInput(form.amountReceivedUSD)
  const amountReceivedVES = parseMoneyInput(form.amountReceivedVES)
  const receivedFromVES =
    amountReceivedVES > 0 && exchangeRate > 0
      ? amountReceivedVES / exchangeRate
      : 0
  const receivedEquivalentUSD = roundMoney(amountReceivedUSD + receivedFromVES)
  const status = calculatePaymentStatus(receivedEquivalentUSD, totalOrderUSD)
  const pendingUSD =
    status === "Pagado"
      ? 0
      : roundMoney(Math.max(totalOrderUSD - receivedEquivalentUSD, 0))

  return {
    totalOrderUSD,
    amountReceivedUSD,
    amountReceivedVES,
    receivedEquivalentUSD,
    pendingUSD,
    status,
  }
}

function createEmptySummaryTotals(): DaySummaryTotals {
  return {
    count: 0,
    totalUSD: 0,
    totalCombosUSD: 0,
    totalRegularUSD: 0,
    totalRegularVES: 0,
    deliveryCostUSD: 0,
  }
}

function addOrderToSummaryTotals(totals: DaySummaryTotals, order: LocalOrder) {
  const orderTotals = getOrderTotals(order)

  totals.count += 1
  totals.totalUSD += orderTotals.totalUSD
  totals.totalCombosUSD += orderTotals.totalCombosUSD
  totals.totalRegularUSD += orderTotals.totalRegularUSD
  totals.totalRegularVES += orderTotals.totalRegularVES
  totals.deliveryCostUSD += orderTotals.deliveryCostUSD
}

function addOrderToSummaryMap(
  map: Map<string, DaySummaryTotals>,
  label: string,
  order: LocalOrder
) {
  const cleanLabel = label.trim() || "Sin dato"
  const current = map.get(cleanLabel) || createEmptySummaryTotals()

  addOrderToSummaryTotals(current, order)
  map.set(cleanLabel, current)
}

function summaryMapToArray(map: Map<string, DaySummaryTotals>): DaySummaryItem[] {
  return Array.from(map.entries())
    .map(([label, totals]) => ({
      label,
      ...totals,
    }))
    .sort((a, b) => b.totalUSD - a.totalUSD)
}

function createEmptyPaymentSummaryTotals(): PaymentSummaryTotals {
  return {
    count: 0,
    totalUSD: 0,
    totalVES: 0,
    deliveryCostUSD: 0,
  }
}

function addPaymentToSummaryMap(
  map: Map<string, PaymentSummaryTotals>,
  label: string,
  totalUSD: number,
  totalVES = 0,
  deliveryCostUSD = 0
) {
  const cleanLabel = label.trim() || "Sin registrar"
  const current = map.get(cleanLabel) || createEmptyPaymentSummaryTotals()

  current.count += 1
  current.totalUSD += roundMoney(totalUSD)
  current.totalVES += roundMoney(totalVES)
  current.deliveryCostUSD += roundMoney(deliveryCostUSD)

  map.set(cleanLabel, current)
}

function paymentSummaryMapToArray(
  map: Map<string, PaymentSummaryTotals>
): PaymentSummaryItem[] {
  return Array.from(map.entries())
    .map(([label, totals]) => ({
      label,
      count: totals.count,
      totalUSD: roundMoney(totals.totalUSD),
      totalVES: roundMoney(totals.totalVES),
      deliveryCostUSD: roundMoney(totals.deliveryCostUSD),
    }))
    .sort((a, b) => b.totalUSD - a.totalUSD)
}

function getDeliveryPaymentLabel(order: LocalOrder) {
  return normalizeOrderIndicatedPaymentMethod(order.paymentMethod)
}

async function readApiResponse(response: Response) {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      "El servidor respondió con una página HTML en vez de datos. Revisa que la API de pedidos y el Apps Script estén funcionando correctamente."
    )
  }
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Caracas",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getDateKeyInCaracas(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value

  if (Number.isNaN(date.getTime())) {
    return ""
  }

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

function formatCaracasLongDate(value: Date) {
  try {
    return new Intl.DateTimeFormat("es-VE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "America/Caracas",
    }).format(value)
  } catch {
    return "Hoy"
  }
}

function getDisplayOrderNumber(order: LocalOrder) {
  if (order.rowNumber && order.rowNumber > 1) {
    return `#${String(order.rowNumber - 1).padStart(2, "0")}`
  }

  const parts = order.id.split("-")
  const lastPart = parts[parts.length - 1] || order.id

  return `#${lastPart.slice(-3)}`
}

function getStatusStyle(status: OrderStatus) {
  if (status === "Nuevo") return "bg-red-500 text-white"
  if (status === "Preparando") return "bg-orange-400 text-[#3a0000]"
  if (status === "Listo") return "bg-yellow-300 text-[#3a0000]"
  if (status === "Entregado") return "bg-green-500 text-white"

  return "bg-[#220000] text-white"
}

function getStatusIcon(status: OrderStatus) {
  if (status === "Nuevo") return <Clock size={16} />
  if (status === "Preparando") return <CookingPot size={16} />
  if (status === "Listo") return <PackageCheck size={16} />
  if (status === "Entregado") return <CheckCircle2 size={16} />

  return <XCircle size={16} />
}

function getPrimaryAction(status: OrderStatus):
  | {
      label: string
      nextStatus: OrderStatus
      className: string
    }
  | undefined {
  if (status === "Nuevo") {
    return {
      label: "Preparar",
      nextStatus: "Preparando",
      className: "bg-orange-400 text-[#3a0000] hover:bg-orange-300",
    }
  }

  if (status === "Preparando") {
    return {
      label: "Marcar listo",
      nextStatus: "Listo",
      className: "bg-yellow-300 text-[#3a0000] hover:bg-yellow-200",
    }
  }

  if (status === "Listo") {
    return {
      label: "Entregado",
      nextStatus: "Entregado",
      className: "bg-green-500 text-white hover:bg-green-400",
    }
  }

  return undefined
}

function shouldShowAsActive(order: LocalOrder) {
  return order.status !== "Entregado" && order.status !== "Cancelado"
}

function getPanelSoundPattern(kind: PanelSoundKind) {
  if (kind === "new-order") {
    return [
      { frequency: 880, delay: 0, duration: 0.14, volume: 0.09 },
      { frequency: 1175, delay: 0.18, duration: 0.14, volume: 0.08 },
      { frequency: 988, delay: 0.36, duration: 0.18, volume: 0.08 },
    ]
  }

  if (kind === "sent-kitchen") {
    return [
      { frequency: 659, delay: 0, duration: 0.12, volume: 0.07 },
      { frequency: 784, delay: 0.16, duration: 0.16, volume: 0.07 },
    ]
  }

  if (kind === "ready") {
    return [
      { frequency: 784, delay: 0, duration: 0.14, volume: 0.08 },
      { frequency: 988, delay: 0.17, duration: 0.14, volume: 0.08 },
      { frequency: 1319, delay: 0.34, duration: 0.2, volume: 0.08 },
    ]
  }

  if (kind === "delivery") {
    return [
      { frequency: 523, delay: 0, duration: 0.14, volume: 0.07 },
      { frequency: 659, delay: 0.16, duration: 0.14, volume: 0.07 },
      { frequency: 784, delay: 0.32, duration: 0.16, volume: 0.07 },
    ]
  }

  if (kind === "warning") {
    return [
      { frequency: 330, delay: 0, duration: 0.18, volume: 0.08 },
      { frequency: 247, delay: 0.22, duration: 0.22, volume: 0.08 },
    ]
  }

  return [
    { frequency: 740, delay: 0, duration: 0.12, volume: 0.07 },
    { frequency: 988, delay: 0.16, duration: 0.16, volume: 0.07 },
  ]
}

function playPanelSoundWithContext(
  audioContext: AudioContext,
  kind: PanelSoundKind
) {
  const pattern = getPanelSoundPattern(kind)

  pattern.forEach((note) => {
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    const startTime = audioContext.currentTime + note.delay
    const endTime = startTime + note.duration

    oscillator.type = "sine"
    oscillator.frequency.setValueAtTime(note.frequency, startTime)

    gain.gain.setValueAtTime(0.0001, startTime)
    gain.gain.linearRampToValueAtTime(note.volume, startTime + 0.02)
    gain.gain.linearRampToValueAtTime(0.0001, endTime)

    oscillator.connect(gain)
    gain.connect(audioContext.destination)

    oscillator.start(startTime)
    oscillator.stop(endTime + 0.03)
  })
}


function getProductsSoldFromOrders(orders: LocalOrder[]) {
  const productMap = new Map<string, ProductSold>()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const subtotalUSD = Number(item.price || 0) * Number(item.quantity || 0)
      const subtotalVES = subtotalUSD * Number(order.exchangeRate || 0)

      const current = productMap.get(item.name) || {
        name: item.name,
        quantity: 0,
        totalUSD: 0,
        totalVES: 0,
        onlyCurrency: false,
      }

      current.quantity += item.quantity
      current.totalUSD += subtotalUSD
      current.totalVES += subtotalVES
      current.onlyCurrency = false

      productMap.set(item.name, current)
    })
  })

  return Array.from(productMap.values()).sort(
    (a, b) => b.quantity - a.quantity
  )
}


type DeliveryWhatsAppMessageType = "confirm" | "preparing" | "onTheWay" | "arrived"

function normalizePhoneForWhatsApp(value: string) {
  const digits = String(value || "").replace(/\D/g, "")

  if (!digits) return ""

  // Venezuela: 0412xxxxxxx, 0414xxxxxxx, 0424xxxxxxx, etc.
  if (digits.startsWith("0") && digits.length === 11) {
    return `58${digits.slice(1)}`
  }

  // Venezuela sin cero inicial: 412xxxxxxx, 414xxxxxxx, etc.
  if (digits.startsWith("4") && digits.length === 10) {
    return `58${digits}`
  }

  // Venezuela con código internacional: 58412xxxxxxx
  if (digits.startsWith("58") && digits.length === 12) {
    return digits
  }

  // Otros números internacionales razonables. Evita abrir WhatsApp con pruebas como "4" o "123".
  if (!digits.startsWith("0") && digits.length >= 10 && digits.length <= 15) {
    return digits
  }

  return ""
}

function getCustomerPhoneLabel(order: LocalOrder) {
  const phone = String(order.customerPhone || "").trim()

  return phone || "Sin teléfono registrado"
}

function buildDeliveryProductsMessage(order: LocalOrder) {
  const exchangeRate = Number(order.exchangeRate || 0)

  if (!order.items.length) {
    return "- Sin productos detallados"
  }

  return order.items
    .map((item) => {
      const subtotalUSD = Number(item.price || 0) * Number(item.quantity || 0)
      const note = item.noteEnabled && item.note ? ` | Nota: ${item.note}` : ""

      return `- ${item.name} x${item.quantity} - ${formatUSD(
        subtotalUSD
      )} / Ref. Bs ${formatVES(subtotalUSD * exchangeRate)}${note}`
    })
    .join("\n")
}

function buildDeliveryWhatsAppMessage(
  order: LocalOrder,
  messageType: DeliveryWhatsAppMessageType
) {
  const orderTotals = getOrderTotals(order)
  const exchangeRate = Number(order.exchangeRate || 0)
  const displayNumber = getDisplayOrderNumber(order)
  const deliveryCostVES = orderTotals.deliveryCostUSD * exchangeRate
  const regularAndDeliveryVES = orderTotals.totalRegularVES + deliveryCostVES
  const customerName = order.customerName || "cliente"
  const customerPhone = getCustomerPhoneLabel(order)
  const zone = getDisplayTableNumber(order)
  const paymentMethod = order.paymentMethod || "Por confirmar"
  const deliveryAddress = order.deliveryAddress || "Sin dirección registrada"
  const deliveryReference = order.deliveryReference || "Sin referencia registrada"

  if (messageType === "preparing") {
    return [
      "Hola, somos La Bambucha.",
      "",
      `${customerName}, tu pedido ${displayNumber} ya está en preparación.`,
      "Te avisaremos cuando vaya saliendo hacia tu dirección.",
      "",
      `Zona: ${zone}`,
      `Total final: ${formatUSD(orderTotals.totalUSD)}`,
      `Delivery incluido: ${formatUSD(orderTotals.deliveryCostUSD)} / Ref. Bs ${formatVES(
        deliveryCostVES
      )}`,
    ].join("\n")
  }

  if (messageType === "onTheWay") {
    return [
      "Hola, somos La Bambucha.",
      "",
      `${customerName}, tu pedido ${displayNumber} ya va saliendo hacia tu dirección.`,
      "Por favor mantente pendiente del teléfono para recibir el delivery.",
      "",
      `Dirección: ${deliveryAddress}`,
      `Referencia: ${deliveryReference}`,
      `Zona: ${zone}`,
      "",
      `Total final: ${formatUSD(orderTotals.totalUSD)}`,
      `Delivery incluido: ${formatUSD(orderTotals.deliveryCostUSD)} / Ref. Bs ${formatVES(
        deliveryCostVES
      )}`,
    ].join("\n")
  }

  if (messageType === "arrived") {
    return [
      "Hola, somos La Bambucha.",
      "",
      `${customerName}, tu pedido ${displayNumber} ya llegó a la ubicación indicada.`,
      "Por favor recibe el delivery y verifica tu pedido con el repartidor.",
      "",
      `Dirección: ${deliveryAddress}`,
      `Referencia: ${deliveryReference}`,
      `Zona: ${zone}`,
      "",
      "Gracias por comprar en La Bambucha.",
    ].join("\n")
  }

  return [
    "Hola, somos La Bambucha.",
    "",
    `Confirmamos tu pedido ${displayNumber}.`,
    "",
    `Cliente: ${customerName}`,
    `Teléfono: ${customerPhone}`,
    `Zona: ${zone}`,
    `Dirección: ${deliveryAddress}`,
    `Referencia: ${deliveryReference}`,
    "",
    "Productos:",
    buildDeliveryProductsMessage(order),
    "",
    "Resumen:",
    `Combos: ${formatUSD(orderTotals.totalCombosUSD)}`,
    `Productos sin delivery: ${formatUSD(
      orderTotals.totalBeforeDeliveryUSD
    )} / Ref. Bs ${formatVES(orderTotals.totalRegularVES)}`,
    `Delivery: ${formatUSD(orderTotals.deliveryCostUSD)} / Ref. Bs ${formatVES(
      deliveryCostVES
    )}`,
    `Total final: ${formatUSD(orderTotals.totalUSD)}`,
    `Referencia en Bs de productos + delivery: Bs ${formatVES(
      regularAndDeliveryVES
    )}`,
    "",
    `Método indicado en el pedido: ${paymentMethod}`,
    "",
    "Por favor confírmanos cómo realizarás el pago:",
    "1. Productos en divisas, bolívares o mixto.",
    "2. Delivery en divisas o bolívares.",
    "",
    "Al confirmar la forma de pago, comenzamos a preparar tu pedido.",
  ].join("\n")
}

function buildDeliveryWhatsAppUrl(
  order: LocalOrder,
  messageType: DeliveryWhatsAppMessageType
) {
  const phone = normalizePhoneForWhatsApp(order.customerPhone || "")
  const message = buildDeliveryWhatsAppMessage(order, messageType)

  if (!phone) return ""

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

function matchesPanelPaymentFilter(order: LocalOrder, filter: PanelPaymentFilter) {
  if (filter === "Todos los cobros") return true

  const payment = getOrderPayment(order)

  if (filter === "Pendiente de pago") return payment.status === "Pendiente"
  if (filter === "Pago parcial") return payment.status === "Pago parcial"
  if (filter === "Pagado") return payment.status === "Pagado"

  return true
}

function matchesPanelScopeFilter(order: LocalOrder, filter: PanelOrderScopeFilter) {
  if (filter === "Todos los tipos") return true
  if (filter === "Delivery") return isDeliveryOrder(order)

  return !isDeliveryOrder(order)
}

function matchesPanelSearch(order: LocalOrder, query: string) {
  const cleanQuery = normalizeComparableText(query)

  if (!cleanQuery) return true

  const payment = getOrderPayment(order)
  const productsText = order.items.map((item) => item.name).join(" ")
  const searchableText = normalizeComparableText(
    [
      order.id,
      getDisplayOrderNumber(order),
      order.customerName,
      order.customerPhone,
      order.tableNumber,
      order.deliveryZone,
      order.deliveryAddress,
      order.deliveryReference,
      order.paymentMethod,
      order.status,
      payment.status,
      payment.paymentMethodUSD,
      payment.paymentMethodVES,
      payment.deliveryPaymentIn,
      productsText,
    ]
      .filter(Boolean)
      .join(" ")
  )

  return searchableText.includes(cleanQuery)
}

function normalizeDayExpense(value: unknown): DayExpense {
  const expense = (value || {}) as Partial<DayExpense>

  return {
    id: String(expense.id || ""),
    dateLabel: String(expense.dateLabel || ""),
    dateValue: String(expense.dateValue || ""),
    concept: String(expense.concept || ""),
    category: String(expense.category || "Otros"),
    amountUSD: roundMoney(expense.amountUSD || 0),
    amountVES: roundMoney(expense.amountVES || 0),
    equivalentUSD: roundMoney(expense.equivalentUSD || 0),
    method: String(expense.method || "Sin registrar"),
    note: String(expense.note || ""),
    createdAt: String(expense.createdAt || ""),
    provider: String(expense.provider || ""),
    expenseType: String(expense.expenseType || "Gasto operativo"),
    inventoryLinked: Boolean(expense.inventoryLinked),
    inventoryItemId: String(expense.inventoryItemId || ""),
    inventoryItemName: String(expense.inventoryItemName || ""),
    inventoryQuantity: roundMoney(expense.inventoryQuantity || 0),
    inventoryUnit: String(expense.inventoryUnit || "unidades"),
  }
}

function normalizeInventoryItemForExpense(value: unknown): InventoryItemForExpense {
  const item = (value || {}) as Partial<InventoryItemForExpense>

  return {
    id: String(item.id || ""),
    name: String(item.name || ""),
    category: String(item.category || "Materia prima"),
    quantity: roundMoney(item.quantity || 0),
    unit: String(item.unit || "unidades"),
    minimumStock: roundMoney(item.minimumStock || 0),
    costUSD: roundMoney(item.costUSD || 0),
    costVES: roundMoney(item.costVES || 0),
    equivalentCostUSD: roundMoney(item.equivalentCostUSD || item.costUSD || 0),
    note: String(item.note || ""),
    isActive: item.isActive !== false,
    updatedAt: String(item.updatedAt || ""),
  }
}

function getExpenseEquivalentUSDFromForm(
  form: ExpenseForm,
  exchangeRate: number
) {
  const amountUSD = parseMoneyInput(form.amountUSD)
  const amountVES = parseMoneyInput(form.amountVES)
  const manualEquivalentUSD = parseMoneyInput(form.equivalentUSD)
  const vesEquivalentUSD =
    amountVES > 0 && exchangeRate > 0 ? amountVES / exchangeRate : 0

  if (manualEquivalentUSD > 0) {
    return roundMoney(manualEquivalentUSD)
  }

  return roundMoney(amountUSD + vesEquivalentUSD)
}

function normalizeBooleanConfig(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value

  const normalized = String(value || "")
    .trim()
    .toLowerCase()

  if (["true", "1", "si", "sí", "activo", "activa", "activado", "activada"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "inactivo", "inactiva", "desactivado", "desactivada", "oculto", "oculta"].includes(normalized)) {
    return false
  }

  return fallback
}

function normalizeBusinessViewMode(value: unknown): BusinessViewMode {
  const normalized = String(value || "").trim().toLowerCase()

  if (normalized === "simple") return "simple"
  if (normalized === "avanzado") return "avanzado"

  return "negocio"
}

function normalizeExchangeRateMode(value: unknown): ExchangeRateMode {
  const normalized = String(value || "").trim().toLowerCase()

  return normalized === "manual" ? "manual" : "automatic"
}

function normalizeBusinessConfig(value: unknown): BusinessConfig {
  const source = (value || {}) as Record<string, unknown>
  const manualExchangeRate = Number(source.manualExchangeRate || 0)

  return {
    businessName:
      String(source.businessName || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.businessName,
    businessShortDescription:
      String(source.businessShortDescription || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.businessShortDescription,
    mainWhatsapp: String(source.mainWhatsapp || "").trim(),
    deliveryWhatsapp: String(source.deliveryWhatsapp || "").trim(),
    exchangeRateMode: normalizeExchangeRateMode(source.exchangeRateMode),
    manualExchangeRate:
      Number.isFinite(manualExchangeRate) && manualExchangeRate > 0
        ? manualExchangeRate
        : 0,
    membershipPlan: normalizeLocalPlanKey(source.membershipPlan),
    membershipPlanMode: normalizeLocalPlanMode(source.membershipPlanMode),
    customIncludedModules: normalizeLocalModuleList(source.customIncludedModules),
    customBlockedModules: normalizeLocalModuleList(source.customBlockedModules),
    deliveryEnabled: normalizeBooleanConfig(
      source.deliveryEnabled,
      DEFAULT_BUSINESS_CONFIG.deliveryEnabled
    ),
    ownerDashboardModuleEnabled: normalizeBooleanConfig(
      source.ownerDashboardModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.ownerDashboardModuleEnabled
    ),
    cashierModuleEnabled: normalizeBooleanConfig(
      source.cashierModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.cashierModuleEnabled
    ),
    kitchenModuleEnabled: normalizeBooleanConfig(
      source.kitchenModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.kitchenModuleEnabled
    ),
    deliveryModuleEnabled: normalizeBooleanConfig(
      source.deliveryModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.deliveryModuleEnabled
    ),
    historyModuleEnabled: normalizeBooleanConfig(
      source.historyModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.historyModuleEnabled
    ),
    expensesModuleEnabled: normalizeBooleanConfig(
      source.expensesModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.expensesModuleEnabled
    ),
    menuProductsModuleEnabled: normalizeBooleanConfig(
      source.menuProductsModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.menuProductsModuleEnabled
    ),
    featuredProductsModuleEnabled: normalizeBooleanConfig(
      source.featuredProductsModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.featuredProductsModuleEnabled
    ),
    customersModuleEnabled: normalizeBooleanConfig(
      source.customersModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.customersModuleEnabled
    ),
    inventoryModuleEnabled: normalizeBooleanConfig(
      source.inventoryModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.inventoryModuleEnabled
    ),
    defaultViewMode: normalizeBusinessViewMode(source.defaultViewMode),
    soundEnabled: normalizeBooleanConfig(
      source.soundEnabled,
      DEFAULT_BUSINESS_CONFIG.soundEnabled
    ),
    filtersOpenByDefault: normalizeBooleanConfig(
      source.filtersOpenByDefault,
      DEFAULT_BUSINESS_CONFIG.filtersOpenByDefault
    ),
    allowCloseWithPendingOrders: normalizeBooleanConfig(
      source.allowCloseWithPendingOrders,
      DEFAULT_BUSINESS_CONFIG.allowCloseWithPendingOrders
    ),
    allowCloseWithPendingPayments: normalizeBooleanConfig(
      source.allowCloseWithPendingPayments,
      DEFAULT_BUSINESS_CONFIG.allowCloseWithPendingPayments
    ),
    updatedAt: String(source.updatedAt || ""),
  }
}

function isBusinessModuleEffective(
  config: BusinessConfig,
  moduleKey: LocalModuleKey
) {
  return getModulePlanAccess(config, moduleKey).effectiveEnabled
}

function getDisplayBusinessName(config: BusinessConfig) {
  const name = String(config.businessName || "").trim()
  const normalizedName = normalizeComparableText(name)

  if (!name || normalizedName.includes("santo perrito")) {
    return "La Bambucha"
  }

  return name
}

function getDisplayBusinessDescription(config: BusinessConfig) {
  const description = String(config.businessShortDescription || "").trim()
  const normalizedDescription = normalizeComparableText(description)

  if (
    !description ||
    normalizedDescription === "menu y pedidos" ||
    normalizedDescription.includes("santo perrito")
  ) {
    return "Grill Burger · pedidos y operación"
  }

  return description
}


export default function PedidosPage() {
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [orders, setOrders] = useState<LocalOrder[]>([])
  const [activeFilter, setActiveFilter] = useState<StatusFilter>("Activos")
  const [panelPaymentFilter, setPanelPaymentFilter] =
    useState<PanelPaymentFilter>("Todos los cobros")
  const [panelOrderScopeFilter, setPanelOrderScopeFilter] =
    useState<PanelOrderScopeFilter>("Todos los tipos")
  const [panelSearchText, setPanelSearchText] = useState("")
  const [arePanelFiltersVisible, setArePanelFiltersVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [highlightedIds, setHighlightedIds] = useState<string[]>([])
  const [newOrderToast, setNewOrderToast] = useState<NewOrderToast | null>(null)
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false)
  const [closeSummaryMessage, setCloseSummaryMessage] = useState<string | null>(
    null
  )
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetConfirmationText, setResetConfirmationText] = useState("")
  const [isResetReviewVisible, setIsResetReviewVisible] = useState(true)
  const [isResettingDay, setIsResettingDay] = useState(false)
  const [isLocationsModalOpen, setIsLocationsModalOpen] = useState(false)
  const [orderLocations, setOrderLocations] = useState<string[]>(
    DEFAULT_ORDER_LOCATIONS
  )
  const [newLocationName, setNewLocationName] = useState("")
  const [locationsMessage, setLocationsMessage] = useState<string | null>(null)
  const [isDeliveryZonesModalOpen, setIsDeliveryZonesModalOpen] = useState(false)
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(
    DEFAULT_DELIVERY_ZONES
  )
  const [newDeliveryZoneName, setNewDeliveryZoneName] = useState("")
  const [newDeliveryZoneCost, setNewDeliveryZoneCost] = useState("")
  const [deliveryZonesMessage, setDeliveryZonesMessage] = useState<string | null>(null)
  const [isLoadingDeliveryZones, setIsLoadingDeliveryZones] = useState(false)
  const [isSavingDeliveryZones, setIsSavingDeliveryZones] = useState(false)
  const [selectedPaymentOrder, setSelectedPaymentOrder] =
    useState<LocalOrder | null>(null)
  const [paymentForm, setPaymentForm] =
    useState<PaymentForm>(EMPTY_PAYMENT_FORM)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  const [dayExpenses, setDayExpenses] = useState<DayExpense[]>([])
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false)
  const [expenseForm, setExpenseForm] =
    useState<ExpenseForm>(EMPTY_EXPENSE_FORM)
  const [expenseMessage, setExpenseMessage] = useState<string | null>(null)
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)
  const [isSavingExpense, setIsSavingExpense] = useState(false)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)
  const [areExpensesVisible, setAreExpensesVisible] = useState(true)
  const [expenseInventory, setExpenseInventory] = useState<InventoryItemForExpense[]>([])
  const [linkExpenseToInventory, setLinkExpenseToInventory] = useState(false)
  const [expenseInventoryForm, setExpenseInventoryForm] = useState<ExpenseInventoryForm>(
    EMPTY_EXPENSE_INVENTORY_FORM
  )
  const [isLoadingExpenseInventory, setIsLoadingExpenseInventory] = useState(false)
  const [expenseQuickConcepts, setExpenseQuickConcepts] = useState<ExpenseQuickConcept[]>(
    DEFAULT_EXPENSE_QUICK_CONCEPTS
  )
  const [selectedExpenseQuickConceptId, setSelectedExpenseQuickConceptId] = useState("")
  const [newExpenseQuickConceptName, setNewExpenseQuickConceptName] = useState("")
  const [newExpenseQuickConceptCategory, setNewExpenseQuickConceptCategory] =
    useState("Materia prima")
  const [newExpenseQuickConceptUnit, setNewExpenseQuickConceptUnit] =
    useState("unidades")
  const [newExpenseQuickConceptRelatedInventory, setNewExpenseQuickConceptRelatedInventory] =
    useState(true)

  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(
    DEFAULT_BUSINESS_CONFIG
  )
  const [isLoadingBusinessConfig, setIsLoadingBusinessConfig] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [soundMessage, setSoundMessage] = useState<string | null>(null)
  const [localAccessRole, setLocalAccessRole] = useState<LocalAccessRole | null>(
    null
  )
  const [localAccessRoleLabel, setLocalAccessRoleLabel] = useState("")

  const knownOrderIdsRef = useRef<Set<string>>(new Set())
  const knownOrderStatusRef = useRef<Map<string, OrderStatus>>(new Map())
  const hasLoadedOnceRef = useRef(false)
  const pendingStatusRef = useRef<Map<string, OrderStatus>>(new Map())
  const businessConfigRef = useRef<BusinessConfig>(DEFAULT_BUSINESS_CONFIG)
  const soundEnabledRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const isLoggedIn = adminPassword.length > 0
  const displayBusinessName = getDisplayBusinessName(businessConfig)
  const displayBusinessDescription = getDisplayBusinessDescription(businessConfig)

  function getPanelAudioContext() {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext

      if (!AudioContextClass) return null

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      return audioContextRef.current
    } catch {
      return null
    }
  }

  function playPanelSound(kind: PanelSoundKind, force = false) {
    const config = businessConfigRef.current

    if (
      !force &&
      (!isBusinessModuleEffective(config, "sounds") ||
        !config.soundEnabled ||
        !soundEnabledRef.current)
    ) {
      return
    }

    try {
      const audioContext = getPanelAudioContext()

      if (!audioContext) return

      if (audioContext.state === "suspended") {
        audioContext.resume().catch(() => undefined)
      }

      playPanelSoundWithContext(audioContext, kind)
    } catch {
      setSoundMessage(
        "El navegador bloqueó el sonido. Pulsa Activar sonido desde el panel."
      )
    }
  }

  async function activatePanelSound() {
    if (!isBusinessModuleEffective(businessConfigRef.current, "sounds")) {
      setSoundMessage("Los avisos sonoros no están activos en este plan.")
      return
    }

    try {
      const audioContext = getPanelAudioContext()

      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume()
      }

      window.localStorage.setItem(SOUND_STORAGE_KEY, "true")
      setSoundEnabled(true)
      soundEnabledRef.current = true
      setSoundMessage("Avisos sonoros activos en este dispositivo.")
      playPanelSound("success", true)
    } catch {
      setSoundMessage(
        "No se pudo activar el sonido. Revisa permisos del navegador o vuelve a intentarlo."
      )
    }
  }

  function disablePanelSound() {
    window.localStorage.setItem(SOUND_STORAGE_KEY, "false")
    setSoundEnabled(false)
    soundEnabledRef.current = false
    setSoundMessage("Avisos sonoros pausados en este dispositivo.")
  }

  async function loadBusinessConfig(password = adminPassword, silent = false) {
    if (!password) return undefined

    if (!silent) {
      setIsLoadingBusinessConfig(true)
    }

    try {
      const response = await fetch("/api/business-config", {
        headers: {
          "x-admin-password": password,
        },
        cache: "no-store",
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        if (response.status === 403) {
          return
        }

        throw new Error(
          data.error || "No se pudo cargar la configuración del negocio"
        )
      }

      const nextConfig = normalizeBusinessConfig(
        data.businessConfig || data.config || data
      )
      const savedSoundPreference = window.localStorage.getItem(SOUND_STORAGE_KEY)
      const nextSoundEnabled =
        savedSoundPreference === null
          ? nextConfig.soundEnabled
          : savedSoundPreference === "true"

      setBusinessConfig(nextConfig)
      businessConfigRef.current = nextConfig
      setSoundEnabled(nextConfig.soundEnabled && nextSoundEnabled)
      soundEnabledRef.current = nextConfig.soundEnabled && nextSoundEnabled
      setArePanelFiltersVisible(nextConfig.filtersOpenByDefault)

      if (!isBusinessModuleEffective(nextConfig, "expenses")) {
        setDayExpenses([])
        setIsExpensesModalOpen(false)
      }

      if (!isBusinessModuleEffective(nextConfig, "delivery")) {
        setDeliveryZones([])
        setIsDeliveryZonesModalOpen(false)
      }

      setSoundMessage(null)

      return nextConfig
    } catch (error) {
      if (!silent) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo cargar la configuración del negocio"
        )
      }
    } finally {
      if (!silent) {
        setIsLoadingBusinessConfig(false)
      }
    }
  }

  function saveOrderLocations(nextLocations: string[], message?: string) {
    const cleanLocations = Array.from(
      new Set(
        nextLocations.map((location) => location.trim()).filter(Boolean)
      )
    )

    const finalLocations =
      cleanLocations.length > 0 ? cleanLocations : DEFAULT_ORDER_LOCATIONS

    setOrderLocations(finalLocations)
    window.localStorage.setItem(
      LOCATIONS_STORAGE_KEY,
      JSON.stringify(finalLocations)
    )
    setLocationsMessage(message || "Ubicaciones actualizadas correctamente.")
  }

  function addOrderLocation() {
    const nextLocation = newLocationName.trim()

    if (!nextLocation) {
      setLocationsMessage("Escribe el nombre de la mesa o ubicación.")
      return
    }

    const alreadyExists = orderLocations.some(
      (location) => location.toLowerCase() === nextLocation.toLowerCase()
    )

    if (alreadyExists) {
      setLocationsMessage("Esa ubicación ya existe.")
      return
    }

    saveOrderLocations(
      [...orderLocations, nextLocation],
      "Ubicación agregada correctamente."
    )
    setNewLocationName("")
  }

  function removeOrderLocation(locationToRemove: string) {
    if (orderLocations.length <= 1) {
      setLocationsMessage("Debe quedar al menos una ubicación disponible.")
      return
    }

    saveOrderLocations(
      orderLocations.filter((location) => location !== locationToRemove),
      "Ubicación eliminada correctamente."
    )
  }

  function restoreDefaultOrderLocations() {
    saveOrderLocations(
      DEFAULT_ORDER_LOCATIONS,
      "Ubicaciones restauradas correctamente."
    )
    setNewLocationName("")
  }

  async function loadDeliveryZones(silent = false) {
    if (!isBusinessModuleEffective(businessConfigRef.current, "delivery")) {
      setDeliveryZones([])
      return
    }

    if (!silent) {
      setIsLoadingDeliveryZones(true)
    }

    try {
      const response = await fetch("/api/delivery-zones", {
        cache: "no-store",
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar las zonas de delivery")
      }

      const cleanZones = normalizeDeliveryZones(data.deliveryZones)

      setDeliveryZones(cleanZones.length ? cleanZones : DEFAULT_DELIVERY_ZONES)
    } catch (error) {
      setDeliveryZonesMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las zonas de delivery"
      )
    } finally {
      if (!silent) {
        setIsLoadingDeliveryZones(false)
      }
    }
  }


  async function loadDayExpenses(password = adminPassword, silent = false) {
    if (!password) return

    if (!isBusinessModuleEffective(businessConfigRef.current, "expenses")) {
      setDayExpenses([])
      return
    }

    if (!silent) {
      setIsLoadingExpenses(true)
    }

    try {
      const todayKey = getDateKeyInCaracas(new Date())
      const response = await fetch(`/api/day-expenses?dateValue=${todayKey}`, {
        headers: {
          "x-admin-password": password,
        },
        cache: "no-store",
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar los gastos del día")
      }

      const cleanExpenses = Array.isArray(data.dayExpenses)
        ? data.dayExpenses.map(normalizeDayExpense)
        : []

      setDayExpenses(cleanExpenses)
    } catch (error) {
      setExpenseMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los gastos del día"
      )
    } finally {
      if (!silent) {
        setIsLoadingExpenses(false)
      }
    }
  }

  function updateDeliveryZoneName(index: number, name: string) {
    setDeliveryZones((currentZones) =>
      currentZones.map((zone, zoneIndex) =>
        zoneIndex === index
          ? {
              ...zone,
              name,
            }
          : zone
      )
    )
    setDeliveryZonesMessage("Cambio pendiente por guardar.")
  }

  function updateDeliveryZoneCost(index: number, cost: string) {
    const normalizedCost = cost.replace(",", ".")

    setDeliveryZones((currentZones) =>
      currentZones.map((zone, zoneIndex) =>
        zoneIndex === index
          ? {
              ...zone,
              costUSD: Number(normalizedCost),
            }
          : zone
      )
    )
    setDeliveryZonesMessage("Cambio pendiente por guardar.")
  }

  function addDeliveryZone() {
    const name = newDeliveryZoneName.trim()
    const costUSD = Number(newDeliveryZoneCost.replace(",", "."))

    if (!name) {
      setDeliveryZonesMessage("Escribe el nombre de la zona.")
      return
    }

    if (!Number.isFinite(costUSD) || costUSD < 0) {
      setDeliveryZonesMessage("Escribe un precio de delivery válido.")
      return
    }

    const alreadyExists = deliveryZones.some(
      (zone) => normalizeComparableText(zone.name) === normalizeComparableText(name)
    )

    if (alreadyExists) {
      setDeliveryZonesMessage("Esa zona ya existe.")
      return
    }

    setDeliveryZones((currentZones) => [
      ...currentZones,
      {
        name,
        costUSD,
        isActive: true,
      },
    ])
    setNewDeliveryZoneName("")
    setNewDeliveryZoneCost("")
    setDeliveryZonesMessage("Zona agregada. Presiona guardar para publicarla.")
  }

  function removeDeliveryZone(indexToRemove: number) {
    if (deliveryZones.length <= 1) {
      setDeliveryZonesMessage("Debe quedar al menos una zona de delivery.")
      return
    }

    setDeliveryZones((currentZones) =>
      currentZones.filter((_, index) => index !== indexToRemove)
    )
    setDeliveryZonesMessage("Zona eliminada. Presiona guardar para publicar el cambio.")
  }

  function restoreDefaultDeliveryZones() {
    setDeliveryZones(DEFAULT_DELIVERY_ZONES)
    setDeliveryZonesMessage("Zonas base restauradas. Presiona guardar para publicarlas.")
  }

  async function saveDeliveryZones() {
    if (!adminPassword) return

    if (!isBusinessModuleEffective(businessConfigRef.current, "delivery")) {
      setDeliveryZonesMessage("Delivery no está activo en este plan.")
      return
    }

    const cleanZones = normalizeDeliveryZones(deliveryZones)

    if (!cleanZones.length) {
      setDeliveryZonesMessage("Debes dejar al menos una zona de delivery.")
      return
    }

    try {
      setIsSavingDeliveryZones(true)
      setDeliveryZonesMessage(null)

      const response = await fetch("/api/delivery-zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          deliveryZones: cleanZones,
        }),
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron guardar las zonas de delivery")
      }

      const savedZones = normalizeDeliveryZones(data.deliveryZones)

      setDeliveryZones(savedZones.length ? savedZones : cleanZones)
      setDeliveryZonesMessage("Zonas de delivery guardadas correctamente.")
    } catch (error) {
      setDeliveryZonesMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron guardar las zonas de delivery"
      )
    } finally {
      setIsSavingDeliveryZones(false)
    }
  }

  async function loadOrders(password = adminPassword, silent = false) {
    if (!password) return

    if (!silent) {
      setIsLoading(true)
    }

    setErrorMessage(null)

    try {
      const response = await fetch("/api/orders", {
        headers: {
          "x-admin-password": password,
        },
        cache: "no-store",
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron cargar los pedidos")
      }

      let nextOrders: LocalOrder[] = data.orders || []

      nextOrders = nextOrders.map((order) => {
        const pendingStatus = pendingStatusRef.current.get(order.id)

        if (!pendingStatus) return order

        return {
          ...order,
          status: pendingStatus,
        }
      })

      if (hasLoadedOnceRef.current) {
        const previousStatuses = knownOrderStatusRef.current
        const changedOrders = nextOrders.filter((order) => {
          const previousStatus = previousStatuses.get(order.id)

          return Boolean(previousStatus && previousStatus !== order.status)
        })

        const readyChange = changedOrders.find((order) => order.status === "Listo")
        const kitchenChange = changedOrders.find(
          (order) => order.status === "Preparando"
        )
        const deliveredChange = changedOrders.find(
          (order) => order.status === "Entregado"
        )

        if (readyChange) {
          playPanelSound("ready")
        } else if (kitchenChange) {
          playPanelSound("sent-kitchen")
        } else if (deliveredChange) {
          playPanelSound(isDeliveryOrder(deliveredChange) ? "delivery" : "success")
        }

        const currentIds = knownOrderIdsRef.current
        const newOrders = nextOrders.filter(
          (order) => order.status === "Nuevo" && !currentIds.has(order.id)
        )

        if (newOrders.length > 0) {
          const newIds = newOrders.map((order) => order.id)
          const newestOrder = newOrders[0]
          const newestOrderTotals = getOrderTotals(newestOrder)

          setHighlightedIds(newIds)
          setNewOrderToast({
            id: newestOrder.id,
            number: getDisplayOrderNumber(newestOrder),
            customerName: newestOrder.customerName || "Cliente",
            tableNumber: getDisplayTableNumber(newestOrder),
            totalUSD: newestOrderTotals.totalUSD,
            orderType: getDisplayOrderType(newestOrder),
          })
          playPanelSound("new-order")

          window.setTimeout(() => {
            setHighlightedIds([])
          }, 12000)

          window.setTimeout(() => {
            setNewOrderToast((currentToast) =>
              currentToast?.id === newestOrder.id ? null : currentToast
            )
          }, 10000)
        }
      }

      knownOrderIdsRef.current = new Set(nextOrders.map((order) => order.id))
      knownOrderStatusRef.current = new Map(
        nextOrders.map((order) => [order.id, order.status] as [string, OrderStatus])
      )
      hasLoadedOnceRef.current = true

      setOrders(nextOrders)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los pedidos"
      )
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  async function validateLocalAccess(password: string) {
    const response = await fetch("/api/local-auth?moduleKey=mainPanel", {
      headers: {
        "x-admin-password": password,
      },
      cache: "no-store",
    })

    const data = (await readApiResponse(response)) as LocalAccessData
    const role = data.access?.role || null
    const roleLabel =
      data.access?.roleLabel || (role ? LOCAL_ROLE_LABELS[role] : "")

    if (role) {
      setLocalAccessRole(role)
      setLocalAccessRoleLabel(roleLabel)
    }

    if (response.status === 401 || !role) {
      throw new Error(data.error || "Clave no autorizada")
    }

    return {
      role,
      roleLabel,
      allowed: Boolean(response.ok && data.ok && data.access?.allowed),
      error: data.error || "",
    }
  }

  function redirectWorkerRole(role: LocalAccessRole) {
    if (!isWorkerOnlyRole(role)) {
      return false
    }

    window.location.href = LOCAL_ROLE_HOME_PATHS[role]
    return true
  }

  async function startLocalSession(password: string) {
    setErrorMessage(null)

    const access = await validateLocalAccess(password)

    window.sessionStorage.setItem(ADMIN_STORAGE_KEY, password)
    setAdminPassword(password)
    setPasswordInput(password)

    if (redirectWorkerRole(access.role)) {
      return
    }

    if (!access.allowed) {
      throw new Error(access.error || "Esta clave no tiene acceso al panel principal")
    }

    const loadedConfig = await loadBusinessConfig(password, true)
    const activeConfig = loadedConfig || businessConfigRef.current

    loadOrders(password)

    if (isBusinessModuleEffective(activeConfig, "delivery")) {
      loadDeliveryZones(true)
    } else {
      setDeliveryZones([])
    }

    if (isBusinessModuleEffective(activeConfig, "expenses")) {
      loadDayExpenses(password, true)
    } else {
      setDayExpenses([])
    }
  }

  async function handleLogin() {
    const password = passwordInput.trim()

    if (!password) return

    try {
      setIsLoading(true)
      await startLocalSession(password)
    } catch (error) {
      window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
      setAdminPassword("")
      setLocalAccessRole(null)
      setLocalAccessRoleLabel("")
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo validar la clave de acceso"
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleLogout() {
    window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
    setAdminPassword("")
    setPasswordInput("")
    setOrders([])
    setErrorMessage(null)
    setSelectedPaymentOrder(null)
    setPaymentForm(EMPTY_PAYMENT_FORM)
    setPaymentMessage(null)
    setDayExpenses([])
    setExpenseForm(EMPTY_EXPENSE_FORM)
    setExpenseMessage(null)
    setExpenseInventory([])
    setExpenseInventoryForm(EMPTY_EXPENSE_INVENTORY_FORM)
    setLinkExpenseToInventory(false)
    setIsExpensesModalOpen(false)
    setArePanelFiltersVisible(true)
    setBusinessConfig(DEFAULT_BUSINESS_CONFIG)
    setSoundMessage(null)
    setLocalAccessRole(null)
    setLocalAccessRoleLabel("")
    knownOrderIdsRef.current = new Set()
    knownOrderStatusRef.current = new Map()
    hasLoadedOnceRef.current = false
    pendingStatusRef.current = new Map()
    businessConfigRef.current = DEFAULT_BUSINESS_CONFIG
  }

  useEffect(() => {
    try {
      const storedLocations = window.localStorage.getItem(LOCATIONS_STORAGE_KEY)

      if (!storedLocations) return

      const parsedLocations = JSON.parse(storedLocations)

      if (!Array.isArray(parsedLocations)) return

      const cleanLocations = parsedLocations
        .map((location) => String(location || "").trim())
        .filter(Boolean)

      if (cleanLocations.length > 0) {
        setOrderLocations(cleanLocations)
      }
    } catch {
      setOrderLocations(DEFAULT_ORDER_LOCATIONS)
    }
  }, [])

  useEffect(() => {
    try {
      const savedConcepts = window.localStorage.getItem(EXPENSE_CONCEPTS_STORAGE_KEY)

      if (!savedConcepts) {
        return
      }

      const parsedConcepts = JSON.parse(savedConcepts)
      const cleanConcepts = normalizeExpenseQuickConcepts(parsedConcepts)

      if (cleanConcepts.length > 0) {
        setExpenseQuickConcepts(cleanConcepts)
      }
    } catch {
      setExpenseQuickConcepts(DEFAULT_EXPENSE_QUICK_CONCEPTS)
    }
  }, [])

  useEffect(() => {
    loadDeliveryZones(true)
  }, [])

  useEffect(() => {
    businessConfigRef.current = businessConfig

    if (!isBusinessModuleEffective(businessConfig, "cashier")) {
      setPanelPaymentFilter("Todos los cobros")
    }

    if (!isBusinessModuleEffective(businessConfig, "delivery")) {
      setPanelOrderScopeFilter("Todos los tipos")
    }
  }, [businessConfig])

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
  }, [soundEnabled])

  useEffect(() => {
    try {
      const savedSoundPreference = window.localStorage.getItem(SOUND_STORAGE_KEY)

      if (savedSoundPreference !== null) {
        const isSoundEnabled = savedSoundPreference === "true"

        setSoundEnabled(isSoundEnabled)
        soundEnabledRef.current = isSoundEnabled
      }
    } catch {
      soundEnabledRef.current = false
    }
  }, [])

  useEffect(() => {
    const savedPassword = window.sessionStorage.getItem(ADMIN_STORAGE_KEY)

    if (!savedPassword) return

    startLocalSession(savedPassword).catch((error) => {
      window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
      setAdminPassword("")
      setPasswordInput("")
      setLocalAccessRole(null)
      setLocalAccessRoleLabel("")
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo restaurar el acceso privado"
      )
    })
  }, [])

  // El panel de pedidos avisa con sonido, así que en segundo plano no se
  // detiene: sigue sondeando cada 30 s para no perderse un pedido nuevo.
  useVisiblePolling(
    () => loadOrders(adminPassword, true),
    2500,
    Boolean(adminPassword),
    30000
  )

  const filteredOrders = useMemo(() => {
    let nextOrders = orders

    if (activeFilter === "Activos") {
      nextOrders = nextOrders.filter(shouldShowAsActive)
    } else if (activeFilter !== "Todos") {
      nextOrders = nextOrders.filter((order) => order.status === activeFilter)
    }

    return nextOrders.filter(
      (order) =>
        matchesPanelPaymentFilter(order, panelPaymentFilter) &&
        matchesPanelScopeFilter(order, panelOrderScopeFilter) &&
        matchesPanelSearch(order, panelSearchText)
    )
  }, [activeFilter, orders, panelOrderScopeFilter, panelPaymentFilter, panelSearchText])

  const activeOrders = orders.filter(shouldShowAsActive)
  const newOrdersCount = orders.filter((order) => order.status === "Nuevo").length
  const readyOrdersCount = orders.filter((order) => order.status === "Listo").length

  const totalRegistered = orders
    .filter((order) => order.status !== "Cancelado")
    .reduce((total, order) => total + getOrderTotals(order).totalUSD, 0)

  const isOwnerAccess = localAccessRole === "owner"
  const isManagerAccess = localAccessRole === "manager"
  const canUseOperationalPanel = isOwnerAccess || isManagerAccess
  const canEditSensitiveSettings = isOwnerAccess

  const planLabel = getShortPlanLabel(businessConfig.membershipPlan)
  const ownerDashboardAccess = getModulePlanAccess(businessConfig, "ownerDashboard")
  const cashierAccess = getModulePlanAccess(businessConfig, "cashier")
  const kitchenAccess = getModulePlanAccess(businessConfig, "kitchen")
  const deliveryAccess = getModulePlanAccess(businessConfig, "delivery")
  const historyAccess = getModulePlanAccess(businessConfig, "history")
  const expensesAccess = getModulePlanAccess(businessConfig, "expenses")
  const menuProductsAccess = getModulePlanAccess(
    businessConfig,
    "menuProducts"
  )
  const customersAccess = getModulePlanAccess(businessConfig, "customers")
  const inventoryAccess = getModulePlanAccess(businessConfig, "inventory")
  const soundsAccess = getModulePlanAccess(businessConfig, "sounds")

  const canEditDeliveryZones = isOwnerAccess && deliveryAccess.effectiveEnabled
  const canDeleteExpenses = isOwnerAccess && expensesAccess.effectiveEnabled

  const isOwnerDashboardModuleVisible =
    isOwnerAccess && ownerDashboardAccess.effectiveEnabled
  const isCashierModuleVisible =
    canUseOperationalPanel && cashierAccess.effectiveEnabled
  const isKitchenModuleVisible =
    canUseOperationalPanel && kitchenAccess.effectiveEnabled
  const isDeliveryModuleVisible =
    canUseOperationalPanel && deliveryAccess.effectiveEnabled
  const isHistoryModuleVisible =
    canUseOperationalPanel && historyAccess.effectiveEnabled
  const isExpensesModuleVisible =
    canUseOperationalPanel && expensesAccess.effectiveEnabled
  const isMenuProductsModuleVisible =
    isOwnerAccess && menuProductsAccess.effectiveEnabled
  const isCustomersModuleVisible =
    isOwnerAccess && customersAccess.effectiveEnabled
  const isInventoryModuleVisible =
    isOwnerAccess && inventoryAccess.effectiveEnabled
  const visibleOperationalModules = [
    isOwnerDashboardModuleVisible,
    isCashierModuleVisible,
    isKitchenModuleVisible,
    isDeliveryModuleVisible,
    isHistoryModuleVisible,
    isExpensesModuleVisible,
    isMenuProductsModuleVisible,
    isCustomersModuleVisible,
    isInventoryModuleVisible,
  ].filter(Boolean).length
  const visibleOperationalModulesLimit = isOwnerAccess ? 9 : 5
  const isPanelSoundAvailable = soundsAccess.effectiveEnabled
  const isPanelSoundActive = isPanelSoundAvailable && soundEnabled

  const filteredPanelTotal = filteredOrders.reduce(
    (total, order) => total + getOrderTotals(order).totalUSD,
    0
  )
  const filteredPanelPending = filteredOrders.reduce(
    (total, order) => total + getOrderPayment(order).pendingUSD,
    0
  )
  const filteredPanelDeliveryCount = filteredOrders.filter(isDeliveryOrder).length
  const filteredPanelPaymentPendingCount = filteredOrders.filter(
    (order) => getOrderPayment(order).status !== "Pagado"
  ).length


  const latestExpenseExchangeRate =
    orders.find((order) => Number(order.exchangeRate || 0) > 0)?.exchangeRate || 0

  const expenseDraftEquivalentUSD = getExpenseEquivalentUSDFromForm(
    expenseForm,
    Number(latestExpenseExchangeRate || 0)
  )

  const dayExpenseTotals = useMemo(() => {
    return dayExpenses.reduce(
      (totals, expense) => {
        totals.count += 1
        totals.amountUSD += roundMoney(expense.amountUSD)
        totals.amountVES += roundMoney(expense.amountVES)
        totals.equivalentUSD += roundMoney(expense.equivalentUSD)
        return totals
      },
      {
        count: 0,
        amountUSD: 0,
        amountVES: 0,
        equivalentUSD: 0,
      }
    )
  }, [dayExpenses])

  const expenseCloseBreakdown = useMemo(() => {
    const createSummary = (label: string): ExpenseSummaryItem => ({
      label,
      count: 0,
      totalUSD: 0,
      amountUSD: 0,
      amountVES: 0,
    })

    const addExpenseToMap = (
      map: Map<string, ExpenseSummaryItem>,
      label: string,
      expense: DayExpense
    ) => {
      const cleanLabel = String(label || "").trim() || "Sin registrar"
      const current = map.get(cleanLabel) || createSummary(cleanLabel)

      current.count += 1
      current.totalUSD = roundMoney(current.totalUSD + expense.equivalentUSD)
      current.amountUSD = roundMoney(current.amountUSD + expense.amountUSD)
      current.amountVES = roundMoney(current.amountVES + expense.amountVES)

      map.set(cleanLabel, current)
    }

    const toArray = (map: Map<string, ExpenseSummaryItem>) =>
      Array.from(map.values()).sort((a, b) => b.totalUSD - a.totalUSD)

    const byProvider = new Map<string, ExpenseSummaryItem>()
    const byType = new Map<string, ExpenseSummaryItem>()
    const byCategory = new Map<string, ExpenseSummaryItem>()
    const byMethod = new Map<string, ExpenseSummaryItem>()

    dayExpenses.forEach((expense) => {
      addExpenseToMap(byProvider, expense.provider || "Sin proveedor", expense)
      addExpenseToMap(byType, expense.expenseType || "Gasto operativo", expense)
      addExpenseToMap(byCategory, expense.category || "Otros", expense)
      addExpenseToMap(byMethod, expense.method || "Sin registrar", expense)
    })

    return {
      byProvider: toArray(byProvider),
      byType: toArray(byType),
      byCategory: toArray(byCategory),
      byMethod: toArray(byMethod),
      inventoryLinkedExpenses: dayExpenses.filter(
        (expense) => expense.inventoryLinked && expense.inventoryItemName
      ),
      expensesWithoutProvider: dayExpenses.filter(
        (expense) => !String(expense.provider || "").trim()
      ),
    }
  }, [dayExpenses])

  const dayStats = useMemo(() => {
    const today = new Date()
    const todayKey = getDateKeyInCaracas(today)
    const ordersToday = orders.filter(
      (order) => getDateKeyInCaracas(order.createdAt) === todayKey
    )

    const deliveredToday = ordersToday.filter(
      (order) => order.status === "Entregado"
    )

    const canceledToday = ordersToday.filter(
      (order) => order.status === "Cancelado"
    )

    const billableToday = ordersToday.filter(
      (order) => order.status !== "Cancelado"
    )

    const activeToday = ordersToday.filter(shouldShowAsActive)
    const deliveryToday = ordersToday.filter(isDeliveryOrder)
    const deliveredDeliveryToday = deliveredToday.filter(isDeliveryOrder)
    const activeDeliveryToday = activeToday.filter(isDeliveryOrder)

    const deliveredTotals = deliveredToday.reduce((totals, order) => {
      addOrderToSummaryTotals(totals, order)
      return totals
    }, createEmptySummaryTotals())

    const activeTotals = activeToday.reduce((totals, order) => {
      addOrderToSummaryTotals(totals, order)
      return totals
    }, createEmptySummaryTotals())

    const deliveredByTypeMap = new Map<string, DaySummaryTotals>()
    const deliveredByPaymentMap = new Map<string, DaySummaryTotals>()
    const deliveredByZoneMap = new Map<string, DaySummaryTotals>()

    deliveredToday.forEach((order) => {
      addOrderToSummaryMap(deliveredByTypeMap, getDisplayOrderType(order), order)

      if (isDeliveryOrder(order)) {
        addOrderToSummaryMap(
          deliveredByPaymentMap,
          getDeliveryPaymentLabel(order),
          order
        )
        addOrderToSummaryMap(
          deliveredByZoneMap,
          getDisplayTableNumber(order),
          order
        )
      }
    })

    const paymentByStatusMap = new Map<string, PaymentSummaryTotals>()
    const paymentByUSDMethodMap = new Map<string, PaymentSummaryTotals>()
    const paymentByVESMethodMap = new Map<string, PaymentSummaryTotals>()
    const deliveryByPaymentInMap = new Map<string, PaymentSummaryTotals>()

    const realPaymentTotals = billableToday.reduce(
      (totals, order) => {
        const orderTotals = getOrderTotals(order)
        const payment = getOrderPayment(order)
        const exchangeRate = Number(order.exchangeRate || 0)
        const amountReceivedVESEquivalentUSD =
          payment.amountReceivedVES > 0 && exchangeRate > 0
            ? payment.amountReceivedVES / exchangeRate
            : 0

        totals.totalSoldUSD += orderTotals.totalUSD
        totals.realCollectedUSD += payment.receivedEquivalentUSD
        totals.realCashUSD += payment.amountReceivedUSD
        totals.realVES += payment.amountReceivedVES
        totals.realVESEquivalentUSD += amountReceivedVESEquivalentUSD
        totals.realPendingUSD += payment.pendingUSD

        if (payment.status === "Pagado") {
          totals.paidOrders += 1
        } else if (payment.status === "Pago parcial") {
          totals.partialPaymentOrders += 1
        } else {
          totals.pendingPaymentOrders += 1
        }

        addPaymentToSummaryMap(
          paymentByStatusMap,
          payment.status,
          payment.receivedEquivalentUSD
        )

        if (payment.amountReceivedUSD > 0) {
          addPaymentToSummaryMap(
            paymentByUSDMethodMap,
            normalizePaymentMethodUSD(payment.paymentMethodUSD) || "Divisas sin método",
            payment.amountReceivedUSD
          )
        }

        if (payment.amountReceivedVES > 0) {
          addPaymentToSummaryMap(
            paymentByVESMethodMap,
            normalizePaymentMethodVES(payment.paymentMethodVES) || "Bolívares sin método",
            amountReceivedVESEquivalentUSD,
            payment.amountReceivedVES
          )
        }

        if (isDeliveryOrder(order) && orderTotals.deliveryCostUSD > 0) {
          const deliveryCostVES = orderTotals.deliveryCostUSD * exchangeRate
          const hasRegisteredDeliveryPayment =
            payment.deliveryPaymentIn !== "Sin registrar" &&
            payment.receivedEquivalentUSD > 0

          totals.deliveryTotalRegisteredUSD += orderTotals.deliveryCostUSD

          if (hasRegisteredDeliveryPayment) {
            totals.deliveryWithPaymentMethodUSD += orderTotals.deliveryCostUSD

            addPaymentToSummaryMap(
              deliveryByPaymentInMap,
              payment.deliveryPaymentIn,
              orderTotals.deliveryCostUSD,
              payment.deliveryPaymentIn === "Bolívares" ? deliveryCostVES : 0,
              orderTotals.deliveryCostUSD
            )

            if (payment.deliveryPaymentIn === "Divisas") {
              totals.deliveryPaidInUSD += orderTotals.deliveryCostUSD
            } else if (payment.deliveryPaymentIn === "Bolívares") {
              totals.deliveryPaidInVES += deliveryCostVES
              totals.deliveryPaidInVESEquivalentUSD += orderTotals.deliveryCostUSD
            } else if (payment.deliveryPaymentIn === "Mixto") {
              totals.deliveryPaidMixedUSD += orderTotals.deliveryCostUSD
            }
          } else {
            totals.deliveryWithoutPaymentMethodUSD += orderTotals.deliveryCostUSD
          }
        }

        return totals
      },
      {
        totalSoldUSD: 0,
        realCollectedUSD: 0,
        realCashUSD: 0,
        realVES: 0,
        realVESEquivalentUSD: 0,
        realPendingUSD: 0,
        paidOrders: 0,
        partialPaymentOrders: 0,
        pendingPaymentOrders: 0,
        deliveryTotalRegisteredUSD: 0,
        deliveryWithPaymentMethodUSD: 0,
        deliveryWithoutPaymentMethodUSD: 0,
        deliveryPaidInUSD: 0,
        deliveryPaidInVES: 0,
        deliveryPaidInVESEquivalentUSD: 0,
        deliveryPaidMixedUSD: 0,
      }
    )

    realPaymentTotals.totalSoldUSD = roundMoney(realPaymentTotals.totalSoldUSD)
    realPaymentTotals.realCashUSD = roundMoney(realPaymentTotals.realCashUSD)
    realPaymentTotals.realVES = roundMoney(realPaymentTotals.realVES)
    realPaymentTotals.realVESEquivalentUSD = roundMoney(
      realPaymentTotals.realVESEquivalentUSD
    )
    realPaymentTotals.realCollectedUSD = roundMoney(
      realPaymentTotals.realCashUSD + realPaymentTotals.realVESEquivalentUSD
    )
    realPaymentTotals.realPendingUSD = roundMoney(
      Math.max(
        realPaymentTotals.realPendingUSD,
        realPaymentTotals.totalSoldUSD - realPaymentTotals.realCollectedUSD
      )
    )
    realPaymentTotals.deliveryTotalRegisteredUSD = roundMoney(
      realPaymentTotals.deliveryTotalRegisteredUSD
    )
    realPaymentTotals.deliveryWithPaymentMethodUSD = roundMoney(
      realPaymentTotals.deliveryWithPaymentMethodUSD
    )
    realPaymentTotals.deliveryWithoutPaymentMethodUSD = roundMoney(
      realPaymentTotals.deliveryWithoutPaymentMethodUSD
    )
    realPaymentTotals.deliveryPaidInUSD = roundMoney(
      realPaymentTotals.deliveryPaidInUSD
    )
    realPaymentTotals.deliveryPaidInVES = roundMoney(
      realPaymentTotals.deliveryPaidInVES
    )
    realPaymentTotals.deliveryPaidInVESEquivalentUSD = roundMoney(
      realPaymentTotals.deliveryPaidInVESEquivalentUSD
    )
    realPaymentTotals.deliveryPaidMixedUSD = roundMoney(
      realPaymentTotals.deliveryPaidMixedUSD
    )

    const productsSold = getProductsSoldFromOrders(deliveredToday)
    const topProduct = productsSold[0]

    return {
      dateLabel: formatCaracasLongDate(today),
      ordersToday,
      deliveredToday,
      canceledToday,
      billableToday,
      activeToday,
      deliveryToday,
      deliveredDeliveryToday,
      activeDeliveryToday,
      deliveredTotals,
      activeTotals,
      deliveredByType: summaryMapToArray(deliveredByTypeMap),
      deliveredByPayment: summaryMapToArray(deliveredByPaymentMap),
      deliveredByZone: summaryMapToArray(deliveredByZoneMap),
      realPaymentTotals,
      paymentByStatus: paymentSummaryMapToArray(paymentByStatusMap),
      paymentByUSDMethod: paymentSummaryMapToArray(paymentByUSDMethodMap),
      paymentByVESMethod: paymentSummaryMapToArray(paymentByVESMethodMap),
      deliveryByPaymentIn: paymentSummaryMapToArray(deliveryByPaymentInMap),
      productsSold,
      topProduct,
    }
  }, [orders])

  const closeSummaryText = useMemo(() => {
    const productLines =
      dayStats.productsSold.length > 0
        ? dayStats.productsSold.map((product) => {
            if (product.onlyCurrency) {
              return `- ${product.name} x${product.quantity} | ${formatUSD(
                product.totalUSD
              )} | Ref. Bs`
            }

            return `- ${product.name} x${product.quantity} | ${formatUSD(
              product.totalUSD
            )} | Bs ${formatVES(product.totalVES)}`
          })
        : ["- Sin productos entregados"]

    const typeLines =
      dayStats.deliveredByType.length > 0
        ? dayStats.deliveredByType.map(
            (item) =>
              `- ${item.label}: ${item.count} pedido(s) | ${formatUSD(
                item.totalUSD
              )}`
          )
        : ["- Sin ventas confirmadas"]

    const paymentLines =
      dayStats.deliveredByPayment.length > 0
        ? dayStats.deliveredByPayment.map(
            (item) =>
              `- ${item.label}: ${item.count} delivery(s) | ${formatUSD(
                item.totalUSD
              )} | Delivery cobrado ${formatUSD(item.deliveryCostUSD)}`
          )
        : ["- Sin deliveries entregados"]

    const zoneLines =
      dayStats.deliveredByZone.length > 0
        ? dayStats.deliveredByZone.map(
            (item) =>
              `- ${item.label}: ${item.count} delivery(s) | ${formatUSD(
                item.totalUSD
              )} | Delivery cobrado ${formatUSD(item.deliveryCostUSD)}`
          )
        : ["- Sin deliveries entregados"]

    const paymentStatusLines =
      dayStats.paymentByStatus.length > 0
        ? dayStats.paymentByStatus.map(
            (item) =>
              `- ${item.label}: ${item.count} pedido(s) | Cobrado ${formatUSD(
                item.totalUSD
              )}`
          )
        : ["- Sin cobros registrados"]

    const usdMethodLines =
      dayStats.paymentByUSDMethod.length > 0
        ? dayStats.paymentByUSDMethod.map(
            (item) =>
              `- ${item.label}: ${item.count} pago(s) | ${formatUSD(
                item.totalUSD
              )}`
          )
        : ["- Sin divisas registradas"]

    const vesMethodLines =
      dayStats.paymentByVESMethod.length > 0
        ? dayStats.paymentByVESMethod.map(
            (item) =>
              `- ${item.label}: ${item.count} pago(s) | Bs ${formatVES(
                item.totalVES || 0
              )} | Equiv. ${formatUSD(item.totalUSD)}`
          )
        : ["- Sin bolívares registrados"]

    const deliveryRealLines =
      dayStats.deliveryByPaymentIn.length > 0
        ? dayStats.deliveryByPaymentIn.map(
            (item) =>
              `- ${item.label}: ${item.count} delivery(s) | ${formatUSD(
                item.deliveryCostUSD || item.totalUSD
              )}${
                item.totalVES && item.totalVES > 0
                  ? ` | Bs ${formatVES(item.totalVES)}`
                  : ""
              }`
          )
        : ["- Sin delivery marcado como cobrado"]

    const expenseLines =
      dayExpenses.length > 0
        ? dayExpenses.map((expense) => {
            const parts = [
              `- ${expense.concept || "Gasto"}`,
              expense.expenseType || "Gasto operativo",
              expense.category || "Otros",
              expense.method || "Sin registrar",
              formatUSD(expense.equivalentUSD),
            ]

            if (expense.provider) {
              parts.push(`Proveedor: ${expense.provider}`)
            }

            if (expense.amountUSD > 0) {
              parts.push(`Divisas ${formatUSD(expense.amountUSD)}`)
            }

            if (expense.amountVES > 0) {
              parts.push(`Bs ${formatVES(expense.amountVES)}`)
            }

            if (expense.inventoryLinked && expense.inventoryItemName) {
              parts.push(
                `Inventario: ${expense.inventoryItemName} +${expense.inventoryQuantity || 0} ${expense.inventoryUnit || "unidades"}`
              )
            }

            if (expense.note) {
              parts.push(`Nota: ${expense.note}`)
            }

            return parts.join(" | ")
          })
        : ["- Sin gastos registrados"]

    const netEstimatedUSD = roundMoney(
      dayStats.realPaymentTotals.realCollectedUSD -
        dayExpenseTotals.equivalentUSD
    )

    return [
      "CIERRE DEL DÍA - LA BAMBUCHA",
      `Fecha: ${dayStats.dateLabel}`,
      "",
      `Pedidos registrados: ${dayStats.ordersToday.length}`,
      `Pedidos activos: ${dayStats.activeToday.length}`,
      `Pedidos entregados: ${dayStats.deliveredToday.length}`,
      `Pedidos cancelados: ${dayStats.canceledToday.length}`,
      `Pedidos delivery registrados: ${dayStats.deliveryToday.length}`,
      `Pedidos delivery entregados: ${dayStats.deliveredDeliveryToday.length}`,
      `Pedidos delivery activos: ${dayStats.activeDeliveryToday.length}`,
      "",
      "COBROS REALES",
      `Total vendido registrado: ${formatUSD(dayStats.realPaymentTotals.totalSoldUSD)}`,
      `Total cobrado real: ${formatUSD(
        dayStats.realPaymentTotals.realCollectedUSD
      )}`,
      `Divisas recibidas: ${formatUSD(dayStats.realPaymentTotals.realCashUSD)}`,
      `Bolívares recibidos: Bs ${formatVES(
        dayStats.realPaymentTotals.realVES
      )} | Equiv. ${formatUSD(
        dayStats.realPaymentTotals.realVESEquivalentUSD
      )}`,
      `Pendiente de cobro: ${formatUSD(
        dayStats.realPaymentTotals.realPendingUSD
      )}`,
      `Pedidos pagados: ${dayStats.realPaymentTotals.paidOrders}`,
      `Pedidos con pago parcial: ${dayStats.realPaymentTotals.partialPaymentOrders}`,
      `Pedidos pendientes de pago: ${dayStats.realPaymentTotals.pendingPaymentOrders}`,
      "",
      "GASTOS DEL DÍA",
      `Gastos registrados: ${dayExpenseTotals.count}`,
      `Total gastos estimado: ${formatUSD(dayExpenseTotals.equivalentUSD)}`,
      `Gastos en divisas: ${formatUSD(dayExpenseTotals.amountUSD)}`,
      `Gastos en bolívares: Bs ${formatVES(dayExpenseTotals.amountVES)}`,
      `Neto estimado del día: ${formatUSD(netEstimatedUSD)}`,
      ...expenseLines,
      "",
      "DELIVERY COBRADO REAL",
      `Delivery total registrado: ${formatUSD(
        dayStats.realPaymentTotals.deliveryTotalRegisteredUSD
      )}`,
      `Delivery con forma de cobro registrada: ${formatUSD(
        dayStats.realPaymentTotals.deliveryWithPaymentMethodUSD
      )}`,
      `Delivery sin forma de cobro registrada: ${formatUSD(
        dayStats.realPaymentTotals.deliveryWithoutPaymentMethodUSD
      )}`,
      `Delivery en divisas: ${formatUSD(
        dayStats.realPaymentTotals.deliveryPaidInUSD
      )}`,
      `Delivery en bolívares: Bs ${formatVES(
        dayStats.realPaymentTotals.deliveryPaidInVES
      )} | Equiv. ${formatUSD(
        dayStats.realPaymentTotals.deliveryPaidInVESEquivalentUSD
      )}`,
      `Delivery mixto marcado: ${formatUSD(
        dayStats.realPaymentTotals.deliveryPaidMixedUSD
      )}`,
      "",
      "COBROS POR ESTADO",
      ...paymentStatusLines,
      "",
      "COBROS EN DIVISAS",
      ...usdMethodLines,
      "",
      "COBROS EN BOLÍVARES",
      ...vesMethodLines,
      "",
      "DELIVERY POR FORMA DE COBRO REAL",
      ...deliveryRealLines,
      "",
      "VENTAS CONFIRMADAS POR ENTREGA",
      `Total general en divisas: ${formatUSD(dayStats.deliveredTotals.totalUSD)}`,
      `Venta de productos: ${formatUSD(
        dayStats.deliveredTotals.totalUSD -
          dayStats.deliveredTotals.deliveryCostUSD
      )}`,
      `Combos: ${formatUSD(dayStats.deliveredTotals.totalCombosUSD)}`,
      `Otros productos: ${formatUSD(dayStats.deliveredTotals.totalRegularUSD)}`,
      `Referencia productos Bs: ${formatVES(
        dayStats.deliveredTotals.totalRegularVES
      )}`,
      `Delivery cobrado por entrega: ${formatUSD(dayStats.deliveredTotals.deliveryCostUSD)}`,
      "",
      "VENTAS POR TIPO",
      ...typeLines,
      "",
      "DELIVERY POR MÉTODO INDICADO EN PEDIDO",
      ...paymentLines,
      "",
      "DELIVERY POR ZONA",
      ...zoneLines,
      "",
      "PENDIENTE POR ENTREGAR",
      `Total pendiente en divisas: ${formatUSD(dayStats.activeTotals.totalUSD)}`,
      `Combos pendientes: ${formatUSD(
        dayStats.activeTotals.totalCombosUSD
      )}`,
      `Productos pendientes: ${formatUSD(
        dayStats.activeTotals.totalUSD - dayStats.activeTotals.deliveryCostUSD
      )}`,
      `Referencia productos pendientes Bs: ${formatVES(
        dayStats.activeTotals.totalRegularVES
      )}`,
      `Delivery pendiente: ${formatUSD(dayStats.activeTotals.deliveryCostUSD)}`,
      "",
      "PRODUCTOS VENDIDOS",
      ...productLines,
    ].join("\n")
  }, [dayExpenseTotals, dayExpenses, dayStats])


  const closeReviewItems = useMemo<CloseReviewItem[]>(() => {
    const reviewItems: CloseReviewItem[] = []
    const totals = dayStats.realPaymentTotals
    const pendingPercent =
      totals.totalSoldUSD > 0
        ? Math.round((totals.realPendingUSD / totals.totalSoldUSD) * 100)
        : 0

    if (dayStats.ordersToday.length === 0) {
      reviewItems.push({
        title: "Sin pedidos para cerrar",
        description:
          "No hay pedidos registrados hoy. Si reinicias, solo se limpiará la pantalla sin guardar un cierre con ventas.",
        value: "0 pedido(s)",
        tone: "info",
      })
    }

    if (dayStats.activeToday.length > 0) {
      reviewItems.push({
        title: "Pedidos activos antes del cierre",
        description:
          "Hay pedidos que todavía no están entregados ni cancelados. Revisa si deben seguir activos, entregarse o cancelarse antes de reiniciar.",
        value: `${dayStats.activeToday.length} pedido(s)`,
        tone: "warning",
      })
    }

    if (totals.pendingPaymentOrders > 0) {
      reviewItems.push({
        title: "Pedidos pendientes de pago",
        description:
          "Hay pedidos sin cobro real registrado. Caja debería revisar estos pedidos antes de cerrar definitivamente.",
        value: `${totals.pendingPaymentOrders} pedido(s)`,
        tone: "danger",
      })
    }

    if (totals.partialPaymentOrders > 0) {
      reviewItems.push({
        title: "Pagos parciales detectados",
        description:
          "Hay pedidos con abono parcial. Conviene confirmar si el cliente completó el pago o si quedará pendiente.",
        value: `${totals.partialPaymentOrders} pedido(s)`,
        tone: "warning",
      })
    }

    if (totals.realPendingUSD > 0) {
      reviewItems.push({
        title: "Pendiente de cobro",
        description:
          "El cierre todavía tiene dinero pendiente por cobrar. Si cierras así, el historial guardará ese pendiente para revisión.",
        value: `${formatUSD(totals.realPendingUSD)} · ${pendingPercent}%`,
        tone: pendingPercent >= 25 ? "danger" : "warning",
      })
    }

    if (totals.deliveryWithoutPaymentMethodUSD > 0) {
      reviewItems.push({
        title: "Delivery sin forma de cobro",
        description:
          "Hay costos de delivery registrados, pero sin indicar si se cobraron en divisas, bolívares o mixto.",
        value: formatUSD(totals.deliveryWithoutPaymentMethodUSD),
        tone: "warning",
      })
    }

    if (dayStats.activeDeliveryToday.length > 0) {
      reviewItems.push({
        title: "Delivery activo",
        description:
          "Hay pedidos delivery que todavía aparecen activos. Revisa si ya fueron entregados, cancelados o siguen pendientes.",
        value: `${dayStats.activeDeliveryToday.length} delivery(s)`,
        tone: "warning",
      })
    }

    const usdWithoutMethod = dayStats.paymentByUSDMethod.find(
      (item) => normalizeComparableText(item.label) === "divisas sin metodo"
    )

    if (usdWithoutMethod && usdWithoutMethod.totalUSD > 0) {
      reviewItems.push({
        title: "Divisas sin método",
        description:
          "Hay divisas cobradas, pero no se indicó si fueron efectivo, Zelle, Binance / USDT u otro método.",
        value: formatUSD(usdWithoutMethod.totalUSD),
        tone: "warning",
      })
    }

    const vesWithoutMethod = dayStats.paymentByVESMethod.find(
      (item) => normalizeComparableText(item.label) === "bolivares sin metodo"
    )

    const vesWithoutMethodTotalVES = vesWithoutMethod?.totalVES || 0

    if (vesWithoutMethodTotalVES > 0) {
      reviewItems.push({
        title: "Bolívares sin método",
        description:
          "Hay bolívares cobrados, pero no se indicó si fueron pago móvil, punto, transferencia, efectivo Bs u otro método.",
        value: `Bs ${formatVES(vesWithoutMethodTotalVES)}`,
        tone: "warning",
      })
    }

    if (
      totals.totalSoldUSD > 0 &&
      dayStats.deliveredToday.length === 0 &&
      dayStats.activeToday.length > 0
    ) {
      reviewItems.push({
        title: "Ventas con pedidos no entregados",
        description:
          "Hay venta registrada, pero ningún pedido aparece entregado. Puede ser normal si todavía están activos, pero conviene revisarlo.",
        value: `${dayStats.activeToday.length} activo(s)`,
        tone: "warning",
      })
    }

    if (dayExpenseTotals.equivalentUSD > 0) {
      const netEstimatedUSD = roundMoney(
        totals.realCollectedUSD - dayExpenseTotals.equivalentUSD
      )

      reviewItems.push({
        title: "Gastos registrados en el día",
        description:
          "Estos gastos se incluirán en el resumen guardado para calcular el neto estimado del cierre.",
        value: `${formatUSD(dayExpenseTotals.equivalentUSD)} · Neto ${formatUSD(
          netEstimatedUSD
        )}`,
        tone: netEstimatedUSD < 0 ? "warning" : "info",
      })
    }

    if (
      reviewItems.length === 0 ||
      reviewItems.every((item) => item.tone === "info")
    ) {
      reviewItems.push({
        title: "Cierre limpio",
        description:
          "No se detectaron pendientes, pagos parciales ni delivery sin forma de cobro. El cierre parece listo para guardarse.",
        value: "Sin alertas",
        tone: "success",
      })
    }

    return reviewItems
  }, [dayExpenseTotals, dayStats])

  const hasCloseReviewWarnings = closeReviewItems.some(
    (item) => item.tone === "danger" || item.tone === "warning"
  )

  async function copyCloseSummary() {
    try {
      await navigator.clipboard.writeText(closeSummaryText)
      setCloseSummaryMessage("Resumen copiado correctamente.")
    } catch {
      setCloseSummaryMessage("No se pudo copiar automáticamente.")
    }
  }

  function buildDayClosePayload() {
    return {
      id: `CIE-${Date.now()}`,
      createdAt: new Date().toISOString(),
      dateLabel: dayStats.dateLabel,
      summaryText: closeSummaryText,

      ordersRegistered: dayStats.ordersToday.length,
      activeOrders: dayStats.activeToday.length,
      deliveredOrders: dayStats.deliveredToday.length,
      canceledOrders: dayStats.canceledToday.length,
      deliveryRegistered: dayStats.deliveryToday.length,
      deliveryDelivered: dayStats.deliveredDeliveryToday.length,
      deliveryActive: dayStats.activeDeliveryToday.length,

      totalConfirmedUSD: dayStats.deliveredTotals.totalUSD,
      productSalesUSD:
        dayStats.deliveredTotals.totalUSD -
        dayStats.deliveredTotals.deliveryCostUSD,
      combosUSD: dayStats.deliveredTotals.totalCombosUSD,
      regularUSD: dayStats.deliveredTotals.totalRegularUSD,
      regularVES: dayStats.deliveredTotals.totalRegularVES,
      deliveryCollectedUSD: dayStats.deliveredTotals.deliveryCostUSD,

      pendingTotalUSD: dayStats.activeTotals.totalUSD,
      pendingCombosUSD: dayStats.activeTotals.totalCombosUSD,
      pendingRegularUSD: dayStats.activeTotals.totalRegularUSD,
      pendingRegularVES: dayStats.activeTotals.totalRegularVES,
      pendingDeliveryUSD: dayStats.activeTotals.deliveryCostUSD,

      totalSoldUSD: dayStats.realPaymentTotals.totalSoldUSD,
      realCollectedUSD: dayStats.realPaymentTotals.realCollectedUSD,
      realCashUSD: dayStats.realPaymentTotals.realCashUSD,
      realVES: dayStats.realPaymentTotals.realVES,
      realVESEquivalentUSD: dayStats.realPaymentTotals.realVESEquivalentUSD,
      realPendingUSD: dayStats.realPaymentTotals.realPendingUSD,
      paidOrders: dayStats.realPaymentTotals.paidOrders,
      partialPaymentOrders: dayStats.realPaymentTotals.partialPaymentOrders,
      pendingPaymentOrders: dayStats.realPaymentTotals.pendingPaymentOrders,
      deliveryTotalRegisteredUSD:
        dayStats.realPaymentTotals.deliveryTotalRegisteredUSD,
      deliveryWithPaymentMethodUSD:
        dayStats.realPaymentTotals.deliveryWithPaymentMethodUSD,
      deliveryWithoutPaymentMethodUSD:
        dayStats.realPaymentTotals.deliveryWithoutPaymentMethodUSD,
      deliveryPaidInUSD: dayStats.realPaymentTotals.deliveryPaidInUSD,
      deliveryPaidInVES: dayStats.realPaymentTotals.deliveryPaidInVES,
      deliveryPaidInVESEquivalentUSD:
        dayStats.realPaymentTotals.deliveryPaidInVESEquivalentUSD,
      deliveryPaidMixedUSD: dayStats.realPaymentTotals.deliveryPaidMixedUSD,

      expensesCount: dayExpenseTotals.count,
      expensesTotalUSD: dayExpenseTotals.equivalentUSD,
      expensesCashUSD: dayExpenseTotals.amountUSD,
      expensesVES: dayExpenseTotals.amountVES,
      expensesVESEquivalentUSD: roundMoney(
        Math.max(dayExpenseTotals.equivalentUSD - dayExpenseTotals.amountUSD, 0)
      ),
      netEstimatedUSD: roundMoney(
        dayStats.realPaymentTotals.realCollectedUSD -
          dayExpenseTotals.equivalentUSD
      ),
      expenses: dayExpenses.map((expense) => ({
        id: expense.id,
        dateLabel: expense.dateLabel,
        dateValue: expense.dateValue,
        concept: expense.concept,
        category: expense.category,
        amountUSD: expense.amountUSD,
        amountVES: expense.amountVES,
        equivalentUSD: expense.equivalentUSD,
        method: expense.method,
        note: expense.note,
        createdAt: expense.createdAt,
        provider: expense.provider || "",
        expenseType: expense.expenseType || "Gasto operativo",
        inventoryLinked: Boolean(expense.inventoryLinked),
        inventoryItemId: expense.inventoryItemId || "",
        inventoryItemName: expense.inventoryItemName || "",
        inventoryQuantity: expense.inventoryQuantity || 0,
        inventoryUnit: expense.inventoryUnit || "unidades",
      })),

      salesByType: dayStats.deliveredByType,
      deliveryByPayment: dayStats.deliveredByPayment,
      deliveryByZone: dayStats.deliveredByZone,
      paymentByStatus: dayStats.paymentByStatus,
      paymentByUSDMethod: dayStats.paymentByUSDMethod,
      paymentByVESMethod: dayStats.paymentByVESMethod,
      deliveryByPaymentIn: dayStats.deliveryByPaymentIn,
      productsSold: dayStats.productsSold,
    }
  }

  async function resetDayOrders() {
    if (!adminPassword) return

    if (resetConfirmationText.trim().toUpperCase() !== "REINICIAR") {
      setErrorMessage("Debes escribir REINICIAR para confirmar el reinicio.")
      return
    }

    try {
      setIsResettingDay(true)
      setErrorMessage(null)

      const shouldSaveDayClose = dayStats.ordersToday.length > 0 || dayExpenseTotals.count > 0

      if (shouldSaveDayClose) {
        const closeResponse = await fetch("/api/day-close", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword,
          },
          body: JSON.stringify({
            dayClose: buildDayClosePayload(),
          }),
        })

        const closeData = await readApiResponse(closeResponse)

        if (!closeResponse.ok) {
          throw new Error(
            closeData.error || "No se pudo guardar el cierre del día"
          )
        }
      }

      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudieron reiniciar los pedidos")
      }

      pendingStatusRef.current = new Map()
      knownOrderIdsRef.current = new Set()
      knownOrderStatusRef.current = new Map()
      hasLoadedOnceRef.current = false

      setOrders([])
      setHighlightedIds([])
      setNewOrderToast(null)
      setDayExpenses([])
      setResetConfirmationText("")
      setIsResetModalOpen(false)
      setIsCloseModalOpen(false)
      setCloseSummaryMessage(
        shouldSaveDayClose
          ? `Cierre guardado y ${
              data.message || "pedidos reiniciados correctamente."
            }`
          : data.message || "Pedidos reiniciados correctamente."
      )

      await loadOrders(adminPassword, true)
      await loadDayExpenses(adminPassword, true)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron reiniciar los pedidos"
      )
    } finally {
      setIsResettingDay(false)
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (!adminPassword) return

    const previousOrder = orders.find((order) => order.id === orderId)
    const requestedStatus = status

    setErrorMessage(null)
    pendingStatusRef.current.set(orderId, requestedStatus)

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: requestedStatus,
            }
          : order
      )
    )

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          status: requestedStatus,
        }),
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el pedido")
      }

      if (requestedStatus === "Preparando") {
        playPanelSound("sent-kitchen")
      } else if (requestedStatus === "Listo") {
        playPanelSound("ready")
      } else if (requestedStatus === "Entregado") {
        playPanelSound(previousOrder && isDeliveryOrder(previousOrder) ? "delivery" : "success")
      } else if (requestedStatus === "Cancelado") {
        playPanelSound("warning")
      }

      window.setTimeout(() => {
        if (pendingStatusRef.current.get(orderId) === requestedStatus) {
          pendingStatusRef.current.delete(orderId)
        }

        loadOrders(adminPassword, true)
      }, 600)
    } catch (error) {
      pendingStatusRef.current.delete(orderId)

      if (previousOrder) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order.id === orderId ? previousOrder : order
          )
        )
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el pedido"
      )
    }
  }

  function openPaymentModal(order: LocalOrder) {
    setSelectedPaymentOrder(order)
    setPaymentForm(createPaymentFormFromOrder(order))
    setPaymentMessage(null)
  }

  function updatePaymentForm<K extends keyof PaymentForm>(
    field: K,
    value: PaymentForm[K]
  ) {
    setPaymentForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setPaymentMessage(null)
  }

  async function savePayment() {
    if (!adminPassword || !selectedPaymentOrder) return

    if (!isBusinessModuleEffective(businessConfigRef.current, "cashier")) {
      setPaymentMessage("Caja no está activa en este plan.")
      return
    }

    try {
      setIsSavingPayment(true)
      setPaymentMessage(null)
      setErrorMessage(null)

      const response = await fetch(
        `/api/orders/${selectedPaymentOrder.id}/payment`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword,
          },
          body: JSON.stringify({
            amountReceivedUSD: parseMoneyInput(paymentForm.amountReceivedUSD),
            amountReceivedVES: parseMoneyInput(paymentForm.amountReceivedVES),
            paymentMethodUSD: paymentForm.paymentMethodUSD,
            paymentMethodVES: paymentForm.paymentMethodVES,
            deliveryPaymentIn: isDeliveryOrder(selectedPaymentOrder)
              ? paymentForm.deliveryPaymentIn
              : "Sin registrar",
            paymentNote: paymentForm.paymentNote,
          }),
        }
      )

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar el cobro")
      }

      const updatedOrder = data.order as LocalOrder

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      )
      setSelectedPaymentOrder(updatedOrder)
      setPaymentForm(createPaymentFormFromOrder(updatedOrder))
      setPaymentMessage("Cobro registrado correctamente.")

      window.setTimeout(() => {
        loadOrders(adminPassword, true)
      }, 600)
    } catch (error) {
      setPaymentMessage(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el cobro"
      )
    } finally {
      setIsSavingPayment(false)
    }
  }


  function updateExpenseForm<K extends keyof ExpenseForm>(
    field: K,
    value: ExpenseForm[K]
  ) {
    setExpenseForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setExpenseMessage(null)
  }

  function resetExpenseForm() {
    setExpenseForm(EMPTY_EXPENSE_FORM)
    setExpenseInventoryForm(EMPTY_EXPENSE_INVENTORY_FORM)
    setLinkExpenseToInventory(false)
    setSelectedExpenseQuickConceptId("")
    setExpenseMessage(null)
  }

  function saveExpenseQuickConcepts(nextConcepts: ExpenseQuickConcept[]) {
    const cleanConcepts = normalizeExpenseQuickConcepts(nextConcepts)

    setExpenseQuickConcepts(cleanConcepts)

    try {
      window.localStorage.setItem(
        EXPENSE_CONCEPTS_STORAGE_KEY,
        JSON.stringify(cleanConcepts)
      )
    } catch {
      setExpenseMessage(
        "La lista se actualizó en pantalla, pero el navegador no permitió guardarla en este dispositivo."
      )
    }

    return cleanConcepts
  }

  function resetExpenseQuickConcepts() {
    saveExpenseQuickConcepts(DEFAULT_EXPENSE_QUICK_CONCEPTS)
    setSelectedExpenseQuickConceptId("")
    setExpenseMessage("Lista de conceptos frecuentes restaurada.")
  }

  function applyExpenseQuickConcept(concept: ExpenseQuickConcept) {
    setExpenseForm((currentForm) => ({
      ...currentForm,
      concept: concept.name,
      category: concept.category || currentForm.category,
      expenseType: getDefaultExpenseTypeFromCategory(
        concept.category || currentForm.category,
        concept.relatedInventory
      ),
    }))

    if (concept.relatedInventory && isInventoryModuleVisible) {
      setLinkExpenseToInventory(true)
      setExpenseInventoryForm((currentForm) => ({
        ...currentForm,
        mode: "new",
        itemId: "",
        name: concept.name,
        category: concept.category || "Materia prima",
        unit: concept.unit || "unidades",
      }))

      loadExpenseInventory(true).then((items: InventoryItemForExpense[]) => {
        const matchedItem = items.find(
          (item: InventoryItemForExpense) =>
            normalizeComparableText(item.name) ===
            normalizeComparableText(concept.name)
        )

        if (!matchedItem) {
          return
        }

        setExpenseInventoryForm((currentForm) => ({
          ...currentForm,
          mode: "existing",
          itemId: matchedItem.id,
          name: matchedItem.name,
          category: matchedItem.category,
          unit: matchedItem.unit,
        }))
      })
    } else {
      setLinkExpenseToInventory(false)
      setExpenseInventoryForm((currentForm) => ({
        ...currentForm,
        mode: "new",
        itemId: "",
        name: concept.relatedInventory ? concept.name : "",
        category: concept.category || "Materia prima",
        unit: concept.unit || "unidades",
      }))
    }
  }

  function selectExpenseQuickConcept(conceptId: string) {
    setSelectedExpenseQuickConceptId(conceptId)
    setExpenseMessage(null)

    if (conceptId === CUSTOM_EXPENSE_CONCEPT_ID) {
      setExpenseForm((currentForm) => ({
        ...currentForm,
        concept: "",
      }))
      setLinkExpenseToInventory(false)
      setExpenseInventoryForm(EMPTY_EXPENSE_INVENTORY_FORM)
      return
    }

    const selectedConcept = expenseQuickConcepts.find(
      (concept) => concept.id === conceptId
    )

    if (!selectedConcept) {
      return
    }

    applyExpenseQuickConcept(selectedConcept)
  }

  function addExpenseQuickConcept() {
    const name = newExpenseQuickConceptName.trim()

    if (!name) {
      setExpenseMessage("Escribe el nombre del concepto frecuente.")
      return
    }

    const alreadyExists = expenseQuickConcepts.some(
      (concept) =>
        normalizeComparableText(concept.name) === normalizeComparableText(name)
    )

    if (alreadyExists) {
      setExpenseMessage("Ese concepto ya existe en la lista.")
      return
    }

    const nextConcept: ExpenseQuickConcept = {
      id: createExpenseQuickConceptId(name),
      name,
      category: newExpenseQuickConceptCategory || "Otros",
      unit: newExpenseQuickConceptUnit || "unidades",
      relatedInventory: newExpenseQuickConceptRelatedInventory,
    }

    saveExpenseQuickConcepts([...expenseQuickConcepts, nextConcept])

    setNewExpenseQuickConceptName("")
    setNewExpenseQuickConceptCategory("Materia prima")
    setNewExpenseQuickConceptUnit("unidades")
    setNewExpenseQuickConceptRelatedInventory(true)
    setExpenseMessage("Concepto frecuente agregado.")
  }

  function removeExpenseQuickConcept(conceptId: string) {
    const nextConcepts = expenseQuickConcepts.filter(
      (concept) => concept.id !== conceptId
    )

    if (!nextConcepts.length) {
      setExpenseMessage("Debe quedar al menos un concepto frecuente.")
      return
    }

    saveExpenseQuickConcepts(nextConcepts)

    if (selectedExpenseQuickConceptId === conceptId) {
      setSelectedExpenseQuickConceptId("")
    }

    setExpenseMessage("Concepto frecuente eliminado.")
  }


  function updateExpenseInventoryForm<K extends keyof ExpenseInventoryForm>(
    field: K,
    value: ExpenseInventoryForm[K]
  ) {
    setExpenseInventoryForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setExpenseMessage(null)
  }

  async function loadExpenseInventory(silent = false): Promise<InventoryItemForExpense[]> {
    if (!adminPassword) return []

    if (!isBusinessModuleEffective(businessConfigRef.current, "inventory")) {
      setExpenseInventory([])
      return []
    }

    if (!silent) {
      setIsLoadingExpenseInventory(true)
    }

    try {
      const response = await fetch("/api/inventory", {
        headers: {
          "x-admin-password": adminPassword,
        },
        cache: "no-store",
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar el inventario")
      }

      const cleanInventory = Array.isArray(data.inventory)
        ? data.inventory.map(normalizeInventoryItemForExpense)
        : []

      setExpenseInventory(cleanInventory)
      saveExpenseQuickConcepts(
        mergeExpenseQuickConceptsWithInventory(expenseQuickConcepts, cleanInventory)
      )

      return cleanInventory
    } catch (error) {
      setExpenseMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el inventario"
      )
      return []
    } finally {
      if (!silent) {
        setIsLoadingExpenseInventory(false)
      }
    }
  }

  async function saveExpenseInventoryEntry(equivalentUSD: number, amountUSD: number, amountVES: number) {
    if (!isBusinessModuleEffective(businessConfigRef.current, "inventory")) {
      throw new Error("Inventario no está activo en este plan.")
    }

    const quantityToAdd = parseMoneyInput(expenseInventoryForm.quantity)

    if (quantityToAdd <= 0) {
      throw new Error("Escribe la cantidad que entra al inventario.")
    }

    let currentInventory = expenseInventory

    if (!currentInventory.length) {
      currentInventory = await loadExpenseInventory(true)
    }

    const selectedItem = currentInventory.find(
      (item) => item.id === expenseInventoryForm.itemId
    )
    const isExisting = expenseInventoryForm.mode === "existing"

    if (isExisting && !selectedItem) {
      throw new Error("Selecciona un producto de inventario válido.")
    }

    const itemName = isExisting
      ? selectedItem!.name
      : expenseInventoryForm.name.trim()

    if (!itemName) {
      throw new Error("Escribe el nombre del producto de inventario.")
    }

    const nextQuantity = isExisting
      ? roundMoney((selectedItem?.quantity || 0) + quantityToAdd)
      : quantityToAdd

    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        id: isExisting ? selectedItem!.id : undefined,
        name: itemName,
        category: isExisting ? selectedItem!.category : expenseInventoryForm.category,
        quantity: nextQuantity,
        unit: isExisting ? selectedItem!.unit : expenseInventoryForm.unit,
        minimumStock: isExisting
          ? selectedItem!.minimumStock
          : parseMoneyInput(expenseInventoryForm.minimumStock),
        costUSD: amountUSD > 0 ? amountUSD : selectedItem?.costUSD || 0,
        costVES: amountVES > 0 ? amountVES : selectedItem?.costVES || 0,
        equivalentCostUSD: equivalentUSD > 0 ? equivalentUSD : selectedItem?.equivalentCostUSD || 0,
        note:
          expenseInventoryForm.note.trim() ||
          `Entrada desde gastos: +${quantityToAdd} ${
            isExisting ? selectedItem!.unit : expenseInventoryForm.unit
          }.`,
        isActive: true,
      }),
    })

    const data = await readApiResponse(response)

    if (!response.ok) {
      throw new Error(data.error || "No se pudo sumar el gasto al inventario")
    }

    const savedItem = normalizeInventoryItemForExpense(data.inventoryItem)

    setExpenseInventory((currentItems) => {
      const exists = currentItems.some((item) => item.id === savedItem.id)

      if (exists) {
        return currentItems.map((item) =>
          item.id === savedItem.id ? savedItem : item
        )
      }

      return [savedItem, ...currentItems]
    })
    saveExpenseQuickConcepts(
      mergeExpenseQuickConceptsWithInventory(expenseQuickConcepts, [savedItem])
    )

    return savedItem
  }

  async function saveDayExpense() {
    if (!adminPassword) return

    if (!isBusinessModuleEffective(businessConfigRef.current, "expenses")) {
      setExpenseMessage("Gastos no está activo en este plan.")
      return
    }

    const concept = expenseForm.concept.trim()
    const amountUSD = parseMoneyInput(expenseForm.amountUSD)
    const amountVES = parseMoneyInput(expenseForm.amountVES)
    const equivalentUSD = expenseDraftEquivalentUSD
    const inventoryQuantity = linkExpenseToInventory
      ? parseMoneyInput(expenseInventoryForm.quantity)
      : 0
    const selectedExpenseInventoryItem = expenseInventory.find(
      (item) => item.id === expenseInventoryForm.itemId
    )
    const inventoryItemNameForExpense = linkExpenseToInventory
      ? expenseInventoryForm.mode === "existing"
        ? selectedExpenseInventoryItem?.name || ""
        : expenseInventoryForm.name.trim()
      : ""
    const inventoryUnitForExpense = linkExpenseToInventory
      ? expenseInventoryForm.mode === "existing"
        ? selectedExpenseInventoryItem?.unit || "unidades"
        : expenseInventoryForm.unit || "unidades"
      : "unidades"

    if (!concept) {
      setExpenseMessage("Escribe el concepto del gasto.")
      return
    }

    if (amountVES > 0 && !parseMoneyInput(expenseForm.equivalentUSD) && latestExpenseExchangeRate <= 0) {
      setExpenseMessage(
        "No hay una tasa disponible para convertir bolívares. Escribe el equivalente en USD manualmente."
      )
      return
    }

    if (amountUSD <= 0 && amountVES <= 0 && equivalentUSD <= 0) {
      setExpenseMessage("Registra un monto en divisas, bolívares o equivalente USD.")
      return
    }

    if (linkExpenseToInventory) {
      if (!isBusinessModuleEffective(businessConfigRef.current, "inventory")) {
        setExpenseMessage("Inventario no está activo en este plan.")
        return
      }

      if (inventoryQuantity <= 0) {
        setExpenseMessage("Escribe la cantidad que entrará al inventario.")
        return
      }

      if (expenseInventoryForm.mode === "existing" && !expenseInventoryForm.itemId) {
        setExpenseMessage("Selecciona el producto de inventario que recibirá la entrada.")
        return
      }

      if (expenseInventoryForm.mode === "new" && !expenseInventoryForm.name.trim()) {
        setExpenseMessage("Escribe el nombre del producto que se creará en inventario.")
        return
      }
    }

    try {
      setIsSavingExpense(true)
      setExpenseMessage(null)

      const response = await fetch("/api/day-expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          concept,
          category: expenseForm.category,
          provider: expenseForm.provider,
          expenseType: expenseForm.expenseType,
          amountUSD,
          amountVES,
          equivalentUSD,
          method: expenseForm.method,
          note: expenseForm.note,
          inventoryLinked: linkExpenseToInventory,
          inventoryItemId:
            linkExpenseToInventory && expenseInventoryForm.mode === "existing"
              ? expenseInventoryForm.itemId
              : "",
          inventoryItemName: inventoryItemNameForExpense,
          inventoryQuantity,
          inventoryUnit: inventoryUnitForExpense,
          dateValue: getDateKeyInCaracas(new Date()),
          dateLabel: formatCaracasLongDate(new Date()),
        }),
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar el gasto del día")
      }

      const savedExpense = normalizeDayExpense(data.dayExpense)
      let inventoryWasUpdated = false
      let inventoryErrorMessage = ""

      if (linkExpenseToInventory) {
        try {
          await saveExpenseInventoryEntry(equivalentUSD, amountUSD, amountVES)
          inventoryWasUpdated = true
        } catch (inventoryError) {
          inventoryErrorMessage =
            inventoryError instanceof Error
              ? inventoryError.message
              : "No se pudo sumar este gasto al inventario"
        }
      }

      setDayExpenses((currentExpenses) => [savedExpense, ...currentExpenses])
      setExpenseForm(EMPTY_EXPENSE_FORM)
      setExpenseInventoryForm(EMPTY_EXPENSE_INVENTORY_FORM)
      setLinkExpenseToInventory(false)
      setSelectedExpenseQuickConceptId("")
      setExpenseMessage(
        inventoryWasUpdated
          ? "Gasto guardado y entrada de inventario registrada correctamente."
          : inventoryErrorMessage
            ? `Gasto guardado, pero inventario no se actualizó: ${inventoryErrorMessage}`
            : "Gasto guardado correctamente."
      )
    } catch (error) {
      setExpenseMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el gasto del día"
      )
    } finally {
      setIsSavingExpense(false)
    }
  }

  async function deleteDayExpense(expenseId: string) {
    if (!adminPassword || !expenseId) return

    if (!isBusinessModuleEffective(businessConfigRef.current, "expenses")) {
      setExpenseMessage("Gastos no está activo en este plan.")
      return
    }

    try {
      setDeletingExpenseId(expenseId)
      setExpenseMessage(null)

      const response = await fetch(
        `/api/day-expenses?id=${encodeURIComponent(expenseId)}`,
        {
          method: "DELETE",
          headers: {
            "x-admin-password": adminPassword,
          },
        }
      )

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo eliminar el gasto")
      }

      setDayExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== expenseId)
      )
      setExpenseMessage("Gasto eliminado correctamente.")
    } catch (error) {
      setExpenseMessage(
        error instanceof Error ? error.message : "No se pudo eliminar el gasto"
      )
    } finally {
      setDeletingExpenseId(null)
    }
  }

  const paymentModalOrder = selectedPaymentOrder
    ? orders.find((order) => order.id === selectedPaymentOrder.id) ||
      selectedPaymentOrder
    : null

  const paymentModalIsDelivery = Boolean(
    paymentModalOrder && isDeliveryOrder(paymentModalOrder)
  )

  const paymentDraft = paymentModalOrder
    ? calculatePaymentDraft(paymentModalOrder, paymentForm)
    : null

  const currentPaymentVES = parseMoneyInput(paymentForm.amountReceivedVES)
  const currentPaymentUSD = parseMoneyInput(paymentForm.amountReceivedUSD)
  const paymentExchangeRate = Number(paymentModalOrder?.exchangeRate || 0)
  const pendingVESForPayment =
    paymentDraft && paymentExchangeRate > 0
      ? roundMoney(paymentDraft.pendingUSD * paymentExchangeRate)
      : 0
  const showLowVESWarning =
    Boolean(paymentDraft && paymentExchangeRate > 100) &&
    currentPaymentVES > 0 &&
    currentPaymentVES < paymentExchangeRate * 0.2 &&
    paymentDraft!.pendingUSD > 0.5

  function completePaymentPendingInVES() {
    if (!paymentDraft || !paymentExchangeRate) return

    const nextVES = currentPaymentVES + paymentDraft.pendingUSD * paymentExchangeRate

    updatePaymentForm("amountReceivedVES", formatMoneyForInput(nextVES))
  }

  function completePaymentPendingInUSD() {
    if (!paymentDraft) return

    const nextUSD = currentPaymentUSD + paymentDraft.pendingUSD

    updatePaymentForm("amountReceivedUSD", formatMoneyForInput(nextUSD))
  }

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#d8a116] bg-[radial-gradient(circle_at_50%_18%,rgba(255,242,172,0.62),transparent_30%),radial-gradient(circle_at_70%_55%,rgba(255,183,28,0.45),transparent_38%),radial-gradient(circle_at_20%_78%,rgba(198,74,0,0.20),transparent_36%)] px-4 py-8 text-[#220000]">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-[#a00000] bg-white shadow-[0_12px_0_rgba(160,0,0,0.14)]">
          <div className="h-6 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#fff7e8]" />

          <div className="px-6 py-6">
            <a
              href="/"
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
              Panel del local
            </h1>

            <p className="mt-3 text-center text-sm font-bold leading-6 text-[#3a0000]/75">
              Ingresa la clave autorizada para gestionar los pedidos del negocio.
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
                  onClick={() => setShowPassword((value) => !value)}
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
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] shadow-[0_6px_0_rgba(160,0,0,0.18)] transition hover:scale-[1.02] disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={21} className="animate-spin" /> : <LogIn size={21} />}
              {isLoading ? "Validando acceso" : "Entrar al panel"}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#d8a116] bg-[radial-gradient(circle_at_50%_18%,rgba(255,242,172,0.58),transparent_30%),radial-gradient(circle_at_72%_56%,rgba(255,183,28,0.48),transparent_38%),radial-gradient(circle_at_18%_82%,rgba(198,74,0,0.24),transparent_36%)] px-3 py-4 text-[#220000] sm:px-6 lg:px-8">
      {newOrderToast && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-[1.4rem] border-2 border-[#a00000] bg-white p-4 shadow-2xl shadow-black/20">
          <div className="flex gap-3">
            <BellRing className="mt-1 text-[#a00000]" size={24} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Nuevo pedido
              </p>
              <p className="mt-1 text-lg font-black text-[#220000]">
                {newOrderToast.number} · {formatUSD(newOrderToast.totalUSD)}
              </p>
              <p className="text-sm font-bold text-[#3a0000]/70">
                {newOrderToast.customerName} · {newOrderToast.orderType} · {newOrderToast.tableNumber}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[1.6rem] border-4 border-[#5c1c00] bg-[#f3c234] shadow-[0_12px_0_rgba(92,28,0,0.18)]">
          <div className="h-5 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#fff7e8]" />

          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                  >
                    <ArrowLeft size={16} />
                    Menú
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setCloseSummaryMessage(null)
                      setIsCloseModalOpen(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                  >
                    <Clock size={16} />
                    Cierre del día
                  </button>

                  {isHistoryModuleVisible && (
                    <a
                      href="/local-santo/cierres"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                    >
                      <Clock size={16} />
                      Historial de cierres
                    </a>
                  )}

                  {isExpensesModuleVisible && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpenseMessage(null)
                        setIsExpensesModalOpen(true)
                        loadDayExpenses(adminPassword, true)
                        if (isBusinessModuleEffective(businessConfigRef.current, "inventory")) {
                          loadExpenseInventory(true)
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                    >
                      <Plus size={16} />
                      Gastos
                    </button>
                  )}

                  {isCustomersModuleVisible && (
                    <a
                      href="/local-santo/clientes"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                    >
                      <MessageCircle size={16} />
                      Clientes
                    </a>
                  )}

                  {isInventoryModuleVisible && (
                    <a
                      href="/local-santo/inventario"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                    >
                      <PackageCheck size={16} />
                      Inventario
                    </a>
                  )}

                  {isMenuProductsModuleVisible && (
                    <a
                      href="/local-santo/menu"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                    >
                      <Store size={16} />
                      Productos
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsLocationsModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                  >
                    <MapPin size={16} />
                    Mesas
                  </button>

                  {canEditDeliveryZones && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryZonesMessage(null)
                        setIsDeliveryZonesModalOpen(true)
                        loadDeliveryZones(true)
                      }}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                    >
                      <Truck size={16} />
                      Zonas delivery
                    </button>
                  )}

                  {canEditSensitiveSettings && (
                    <button
                      type="button"
                      onClick={() => loadBusinessConfig(adminPassword)}
                      disabled={isLoadingBusinessConfig}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100 disabled:opacity-50"
                    >
                      {isLoadingBusinessConfig ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RefreshCw size={16} />
                      )}
                      Config
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={isPanelSoundActive ? disablePanelSound : activatePanelSound}
                    disabled={!isPanelSoundAvailable}
                    className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                      isPanelSoundActive
                        ? "border-[#a00000] bg-yellow-300 text-[#4a0000] hover:bg-yellow-200"
                        : "border-[#a00000] bg-white text-[#a00000] hover:bg-yellow-100"
                    }`}
                  >
                    {isPanelSoundActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    {isPanelSoundActive ? "Sonido activo" : isPanelSoundAvailable ? "Activar sonido" : "Sonido no activo"}
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
                  >
                    Cerrar sesión
                  </button>
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.32em] text-[#a00000]">
                  {displayBusinessName}
                </p>

                <h1 className="mt-1 text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)] sm:text-5xl">
                  Control de pedidos
                </h1>

                <p className="mt-3 text-sm font-bold leading-6 text-[#3a0000]/70">
                  {displayBusinessDescription} · Plan {planLabel} · Acceso {localAccessRoleLabel || "privado"} · {visibleOperationalModules}/{visibleOperationalModulesLimit} módulos visibles · Vista {businessConfig.defaultViewMode}
                  {isPanelSoundAvailable ? " · Sonidos permitidos" : " · Sonidos no activos"}
                </p>

                {soundMessage && (
                  <p className="mt-2 rounded-2xl border-2 border-[#a00000]/20 bg-[#fff7e8] px-3 py-2 text-xs font-black text-[#3a0000]">
                    {soundMessage}
                  </p>
                )}
              </div>

              <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 2xl:max-w-[760px]">
                <MetricCard label="Activos" value={activeOrders.length} />
                <MetricCard label="Nuevos" value={newOrdersCount} />
                <MetricCard label="Listos" value={readyOrdersCount} tone="yellow" />
                <MetricCard label="Ventas" value={formatUSD(totalRegistered)} />
              </div>
            </div>
          </div>
        </header>



        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {isOwnerDashboardModuleVisible && (
            <ModuleAccessCard
              href="/local-santo/dueno"
              icon={<PackageCheck size={24} />}
              eyebrow="Dueño"
              title="Resumen del negocio"
              description="Revisa ventas, cobros, gastos, delivery, pendientes y alertas importantes del día."
              metric="Resumen"
            />
          )}

          {isCashierModuleVisible && (
            <ModuleAccessCard
              href="/local-santo/caja"
              icon={<CheckCircle2 size={24} />}
              eyebrow="Módulo Caja"
              title="Confirmar y cobrar"
              description="Confirma pedidos, registra pagos y coordina la entrega final."
              metric={`${orders.filter((order) => getOrderPayment(order).status !== "Pagado" && order.status !== "Cancelado").length} por cobrar`}
            />
          )}

          {isKitchenModuleVisible && (
            <ModuleAccessCard
              href="/local-santo/cocina"
              icon={<CookingPot size={24} />}
              eyebrow="Módulo Cocina"
              title="Preparación"
              description="Solo muestra pedidos enviados por caja y permite marcarlos como listos."
              metric={`${orders.filter((order) => order.status === "Preparando").length} en cocina`}
            />
          )}

          {isDeliveryModuleVisible && (
            <ModuleAccessCard
              href="/local-santo/delivery"
              icon={<Truck size={24} />}
              eyebrow="Módulo Delivery"
              title="Ruta y WhatsApp"
              description="Coordina datos del cliente, salida, llegada y entregas a domicilio."
              metric={`${orders.filter(isDeliveryOrder).length} delivery`}
            />
          )}

          {isHistoryModuleVisible && (
            <ModuleAccessCard
              href="/local-santo/cierres"
              icon={<Clock size={24} />}
              eyebrow="Historial"
              title="Cierres y reportes"
              description="Revisa cierres guardados, gráficas, alertas y exportaciones."
              metric="Reportes"
            />
          )}

          {isExpensesModuleVisible && (
            <ModuleAccessCard
              onClick={() => {
                setExpenseMessage(null)
                setIsExpensesModalOpen(true)
                loadDayExpenses(adminPassword, true)
                if (isBusinessModuleEffective(businessConfigRef.current, "inventory")) {
                  loadExpenseInventory(true)
                }
              }}
              icon={<Plus size={24} />}
              eyebrow="Gastos"
              title="Gastos del día"
              description="Registra compras, pagos y salidas de caja para estimar el neto diario."
              metric={formatUSD(dayExpenseTotals.equivalentUSD)}
            />
          )}

          {isCustomersModuleVisible && (
            <ModuleAccessCard
              href="/local-santo/clientes"
              icon={<MessageCircle size={24} />}
              eyebrow="Clientes"
              title="Clientes frecuentes"
              description="Revisa clientes que más compran, último pedido, total aproximado y contacto por WhatsApp."
              metric="Seguimiento"
            />
          )}

          {isInventoryModuleVisible && (
            <ModuleAccessCard
              href="/local-santo/inventario"
              icon={<PackageCheck size={24} />}
              eyebrow="Inventario"
              title="Inventario básico"
              description="Controla existencias, entradas, salidas y alertas de stock bajo sin afectar pedidos."
              metric="Stock"
            />
          )}

          {isMenuProductsModuleVisible && (
            <ModuleAccessCard
              href="/local-santo/menu"
              icon={<Store size={24} />}
              eyebrow="Menú editable"
              title="Productos del menú"
              description="Crea productos, cambia precios, categorías, fotos, disponibilidad y destacados de la página pública."
              metric="Editar"
            />
          )}

          {canEditSensitiveSettings && (
            <ModuleAccessCard
              href="/local-santo/configuracion"
              icon={<MapPin size={24} />}
              eyebrow="Configuración"
              title="Negocio"
              description="Datos del local, módulos visibles, tasa, sonidos y reglas operativas."
              metric="Ajustes"
            />
          )}
        </section>

        {visibleOperationalModules === 0 && (
          <section className="mt-4 rounded-[1.4rem] border-2 border-yellow-400 bg-yellow-100 p-4">
            <p className="text-sm font-black uppercase text-[#8a5a00]">
              No hay módulos operativos visibles
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/75">
              Revisa los módulos incluidos en el plan y los interruptores disponibles en Configuración del negocio. Los módulos no incluidos en el plan se muestran bloqueados en configuración para que el dueño pueda solicitar una mejora.
            </p>
          </section>
        )}

        <section className="sticky top-0 z-30 mt-4 rounded-[1.4rem] border-2 border-[#a00000] bg-white p-3 shadow-[0_8px_0_rgba(160,0,0,0.10)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#a00000]">
                Filtros operativos
              </p>
              <p className="mt-1 text-xs font-bold text-[#3a0000]/65">
                {filteredOrders.length} pedido(s) en pantalla · Total {formatUSD(filteredPanelTotal)}{isCashierModuleVisible ? ` · Pendiente ${formatUSD(filteredPanelPending)}` : ""}
              </p>
              {!arePanelFiltersVisible && (
                <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#a00000]/70">
                  {activeFilter} · {panelPaymentFilter} · {panelOrderScopeFilter}
                  {panelSearchText.trim() ? ` · ${panelSearchText.trim()}` : ""}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setArePanelFiltersVisible((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
              >
                {arePanelFiltersVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                {arePanelFiltersVisible ? "Ocultar filtros" : "Mostrar filtros"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter("Activos")
                  setPanelPaymentFilter("Todos los cobros")
                  setPanelOrderScopeFilter("Todos los tipos")
                  setPanelSearchText("")
                }}
                className="rounded-full border-2 border-[#a00000] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
              >
                Limpiar filtros
              </button>

              <button
                type="button"
                onClick={() => loadOrders()}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-xs font-black uppercase text-[#4a0000] transition hover:scale-105"
              >
                {isLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <RefreshCw size={17} />
                )}
                Actualizar
              </button>
            </div>
          </div>

          {arePanelFiltersVisible && (
            <>
              <div className="mt-3 grid gap-3">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a00000]"
                  />
                  <input
                    value={panelSearchText}
                    onChange={(event) => setPanelSearchText(event.target.value)}
                    placeholder="Buscar por cliente, teléfono, mesa, zona, producto, número o estado"
                    className="w-full rounded-full border-2 border-[#a00000]/25 bg-[#fff7e8] px-11 py-3 text-sm font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#a00000]"
                  />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {filterOptions.map((status) => {
                    const isActive = activeFilter === status

                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setActiveFilter(status)}
                        className={`shrink-0 rounded-full border-2 px-4 py-2.5 text-xs font-black uppercase transition ${
                          isActive
                            ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
                            : "border-[#a00000] bg-white text-[#a00000] hover:bg-yellow-100"
                        }`}
                      >
                        {status}
                      </button>
                    )
                  })}
                </div>

                {isCashierModuleVisible && (
                  <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {panelPaymentFilterOptions.map((filter) => {
                      const isActive = panelPaymentFilter === filter

                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setPanelPaymentFilter(filter)}
                          className={`shrink-0 rounded-full border-2 px-4 py-2.5 text-xs font-black uppercase transition ${
                            isActive
                              ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
                              : "border-[#a00000]/35 bg-white text-[#a00000] hover:bg-yellow-100"
                          }`}
                        >
                          {filter}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {panelOrderScopeFilterOptions.map((filter) => {
                    const isActive = panelOrderScopeFilter === filter

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setPanelOrderScopeFilter(filter)}
                        className={`shrink-0 rounded-full border-2 px-4 py-2.5 text-xs font-black uppercase transition ${
                          isActive
                            ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
                            : "border-[#a00000]/35 bg-white text-[#a00000] hover:bg-yellow-100"
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <PanelMiniMetric label="En pantalla" value={filteredOrders.length} />
                {isCashierModuleVisible && (
                  <PanelMiniMetric label="Pendientes de cobro" value={filteredPanelPaymentPendingCount} />
                )}
                {isDeliveryModuleVisible && (
                  <PanelMiniMetric label="Delivery en pantalla" value={filteredPanelDeliveryCount} />
                )}
                {isCashierModuleVisible && (
                  <PanelMiniMetric label="Pendiente USD" value={formatUSD(filteredPanelPending)} />
                )}
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
        </section>

        {filteredOrders.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border-2 border-[#a00000] bg-white px-6 py-14 text-center shadow-[0_8px_0_rgba(160,0,0,0.12)]">
            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="mx-auto h-28 w-28 object-contain"
            />

            <h2 className="mt-5 text-3xl font-black uppercase text-[#a00000]">
              Sin pedidos pendientes
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-[#3a0000]/70">
              Los pedidos nuevos aparecerán automáticamente en esta pantalla.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 xl:grid-cols-2">
            {filteredOrders.map((order) => {
              const primaryAction = getPrimaryAction(order.status)
              const isHighlighted = highlightedIds.includes(order.id)
              const orderTotals = getOrderTotals(order)
              const comboItems = order.items.filter(isComboItem)
              const regularItems = order.items.filter((item) => !isComboItem(item))
              const isDelivery = isDeliveryOrder(order)
              const displayOrderType = getDisplayOrderType(order)
              const displayTableNumber = getDisplayTableNumber(order)
              const orderPayment = getOrderPayment(order)

              return (
                <article
                  key={order.id}
                  className={`overflow-hidden rounded-[1.6rem] border-2 bg-white shadow-[0_8px_0_rgba(160,0,0,0.12)] transition ${
                    isHighlighted
                      ? "border-red-500 ring-4 ring-red-300"
                      : "border-[#a00000]"
                  }`}
                >
                  <div className="border-b-2 border-[#a00000] bg-[#fff7e8] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-4xl font-black leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
                            {getDisplayOrderNumber(order)}
                          </p>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase ${getStatusStyle(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>

                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-black uppercase ${getPaymentStatusStyle(
                              orderPayment.status
                            )}`}
                          >
                            {orderPayment.status}
                          </span>

                          {isDelivery && (
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#a00000] px-3 py-1.5 text-xs font-black uppercase text-white">
                              <Truck size={15} />
                              Delivery
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-xs font-bold text-[#3a0000]/70">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-black leading-none text-[#220000]">
                          {formatUSD(orderTotals.totalUSD)}
                        </p>
                        {orderTotals.totalRegularVES > 0 && (
                          <p className="mt-1 text-xs font-black text-[#3a0000]/60">
                            Ref. Bs {formatVES(orderTotals.totalRegularVES)}
                          </p>
                        )}
                        {orderTotals.deliveryCostUSD > 0 && (
                          <p className="mt-1 text-xs font-black text-[#a00000]">
                            Incluye delivery {formatUSD(orderTotals.deliveryCostUSD)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoBox label="Cliente" value={order.customerName || "Cliente"} />
                      <InfoBox label={isDelivery ? "Zona" : "Mesa / ubicación"} value={displayTableNumber} />
                      <InfoBox label="Tipo" value={displayOrderType} />
                      <InfoBox label="Tasa" value={`Bs ${formatVES(order.exchangeRate)}`} />
                    </div>

                    {isDelivery && (
                      <div className="space-y-3 rounded-[1.4rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                          <Truck size={16} />
                          Datos de delivery
                        </p>

                        <div className="grid gap-2 text-sm font-bold leading-6 text-[#3a0000]/80">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <p className="rounded-2xl bg-white px-3 py-2"><strong>Teléfono:</strong> {order.customerPhone || "Sin teléfono"}</p>
                            <p className="rounded-2xl bg-white px-3 py-2"><strong>Método de pago:</strong> {order.paymentMethod || "Sin método"}</p>
                          </div>
                          <p className="rounded-2xl bg-white px-3 py-2"><strong>Dirección:</strong> {order.deliveryAddress || "Sin dirección"}</p>
                          <p className="rounded-2xl bg-white px-3 py-2"><strong>Referencia:</strong> {order.deliveryReference || "Sin referencia"}</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <p className="rounded-2xl bg-white px-3 py-2"><strong>Zona:</strong> {displayTableNumber}</p>
                            <p className="rounded-2xl bg-white px-3 py-2"><strong>Costo delivery:</strong> {formatUSD(orderTotals.deliveryCostUSD)} / Bs {formatVES(orderTotals.deliveryCostUSD * Number(order.exchangeRate || 0))}</p>
                          </div>
                        </div>

                        {isDeliveryModuleVisible && normalizePhoneForWhatsApp(order.customerPhone || "") ? (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <a
                              href={buildDeliveryWhatsAppUrl(order, "confirm")}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-3 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#4a0000] transition hover:bg-yellow-200"
                            >
                              <MessageCircle size={16} />
                              Confirmar
                            </a>

                            <a
                              href={buildDeliveryWhatsAppUrl(order, "preparing")}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-3 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#a00000] transition hover:bg-yellow-100"
                            >
                              <CookingPot size={16} />
                              Preparación
                            </a>

                            <a
                              href={buildDeliveryWhatsAppUrl(order, "onTheWay")}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-[#a00000] px-4 py-3 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] text-white transition hover:bg-red-800"
                            >
                              <Truck size={16} />
                              Va saliendo
                            </a>

                            <a
                              href={buildDeliveryWhatsAppUrl(order, "arrived")}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-green-600 bg-green-500 px-4 py-3 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] text-white transition hover:bg-green-400"
                            >
                              <CheckCircle2 size={16} />
                              Llegué
                            </a>
                          </div>
                        ) : isDeliveryModuleVisible ? (
                          <div className="rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-3 py-2 text-xs font-black text-[#8a5a00]">
                            Este delivery no tiene teléfono válido para abrir WhatsApp.
                          </div>
                        ) : null}
                      </div>
                    )}

                    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                        Productos
                      </p>

                      <div className="mt-3 space-y-2">
                        {comboItems.length > 0 && (
                          <ProductGroup
                            title="Combos"
                            items={comboItems}
                            exchangeRate={order.exchangeRate}
                          />
                        )}

                        {regularItems.length > 0 && (
                          <ProductGroup
                            title="Productos"
                            items={regularItems}
                            exchangeRate={order.exchangeRate}
                          />
                        )}
                      </div>
                    </div>

                    {isCashierModuleVisible && (
                      <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                              Cobro
                            </p>
                            <span
                              className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-xs font-black uppercase ${getPaymentStatusStyle(
                                orderPayment.status
                              )}`}
                            >
                              {orderPayment.status}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => openPaymentModal(order)}
                            className="rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
                          >
                            Registrar cobro
                          </button>
                        </div>

                        <div className="mt-3 space-y-1 text-sm font-black text-[#220000]">
                          {orderTotals.totalCombosUSD > 0 && (
                            <p>Combos: {formatUSD(orderTotals.totalCombosUSD)}</p>
                          )}
                          {orderTotals.totalBeforeDeliveryUSD > 0 && (
                            <p>
                              Productos sin delivery: {formatUSD(orderTotals.totalBeforeDeliveryUSD)} / Bs {formatVES(orderTotals.totalRegularVES)}
                            </p>
                          )}
                          {isDelivery && (
                            <p>Delivery: {formatUSD(orderTotals.deliveryCostUSD)}</p>
                          )}
                          <p className="text-[#a00000]">
                            Total final: {formatUSD(orderTotals.totalUSD)}
                          </p>
                        </div>

                        <div className={`mt-3 grid gap-2 ${isDelivery ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                          <InfoBox
                            label="Recibido equiv."
                            value={formatUSD(orderPayment.receivedEquivalentUSD)}
                          />
                          <InfoBox
                            label="Pendiente"
                            value={formatUSD(orderPayment.pendingUSD)}
                          />
                          {isDelivery && (
                            <InfoBox
                              label="Delivery pago"
                              value={orderPayment.deliveryPaymentIn}
                            />
                          )}
                        </div>

                        {(orderPayment.amountReceivedUSD > 0 ||
                          orderPayment.amountReceivedVES > 0) && (
                          <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-bold leading-5 text-[#3a0000]/70">
                            {orderPayment.amountReceivedUSD > 0 && (
                              <p>
                                Divisas recibidas: {formatUSD(orderPayment.amountReceivedUSD)}
                                {orderPayment.paymentMethodUSD
                                  ? ` · ${orderPayment.paymentMethodUSD}`
                                  : ""}
                              </p>
                            )}
                            {orderPayment.amountReceivedVES > 0 && (
                              <p>
                                Bolívares recibidos: Bs {formatVES(orderPayment.amountReceivedVES)}
                                {orderPayment.paymentMethodVES
                                  ? ` · ${orderPayment.paymentMethodVES}`
                                  : ""}
                              </p>
                            )}
                            {orderPayment.paymentNote && (
                              <p>Nota: {orderPayment.paymentNote}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {order.customerNote && (
                      <div className="rounded-[1.4rem] border-2 border-yellow-400 bg-yellow-100 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a5a00]">
                          Nota general
                        </p>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]">
                          {order.customerNote}
                        </p>
                      </div>
                    )}

                    <div className="grid gap-2 sm:grid-cols-2">
                      {primaryAction && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, primaryAction.nextStatus)}
                          className={`rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${primaryAction.className}`}
                        >
                          {primaryAction.label}
                        </button>
                      )}

                      {order.status !== "Cancelado" && order.status !== "Entregado" && (
                        <button
                          type="button"
                          onClick={() => updateStatus(order.id, "Cancelado")}
                          className="rounded-full bg-[#220000] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-red-800"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>

      {isCloseModalOpen && (
        <ModalShell onClose={() => setIsCloseModalOpen(false)} title="Cierre del día">
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border-2 border-[#a00000] bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Resumen principal
                  </p>
                  <h2 className="mt-1 text-3xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_2px_0_rgba(255,211,0,0.75)]">
                    Cierre operativo
                  </h2>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                    Revisa primero los números generales. Los detalles quedan organizados abajo en secciones desplegables para no sobrecargar la pantalla.
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                    hasCloseReviewWarnings
                      ? "border-yellow-400 bg-yellow-100 text-[#8a5a00]"
                      : "border-green-600 bg-green-50 text-green-700"
                  }`}
                >
                  {hasCloseReviewWarnings ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
                  {hasCloseReviewWarnings ? "Revisar antes de cerrar" : "Cierre limpio"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox label="Fecha" value={dayStats.dateLabel} />
                <InfoBox
                  label="Total vendido"
                  value={formatUSD(dayStats.realPaymentTotals.totalSoldUSD)}
                />
                <InfoBox
                  label="Cobrado real"
                  value={formatUSD(dayStats.realPaymentTotals.realCollectedUSD)}
                />
                <InfoBox
                  label="Pendiente"
                  value={formatUSD(dayStats.realPaymentTotals.realPendingUSD)}
                />
                <InfoBox
                  label="Gastos"
                  value={formatUSD(dayExpenseTotals.equivalentUSD)}
                />
                <InfoBox
                  label="Neto estimado"
                  value={formatUSD(
                    roundMoney(
                      dayStats.realPaymentTotals.realCollectedUSD -
                        dayExpenseTotals.equivalentUSD
                    )
                  )}
                />
                <InfoBox
                  label="Pedidos hoy"
                  value={String(dayStats.ordersToday.length)}
                />
                <InfoBox
                  label="Activos"
                  value={String(dayStats.activeToday.length)}
                />
              </div>
            </div>

            <div
              className={`rounded-[1.4rem] border-2 p-4 ${
                hasCloseReviewWarnings
                  ? "border-yellow-400 bg-yellow-100"
                  : "border-green-500/35 bg-green-50"
              }`}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p
                    className={`text-xs font-black uppercase tracking-[0.18em] ${
                      hasCloseReviewWarnings ? "text-[#8a5a00]" : "text-green-800"
                    }`}
                  >
                    Alertas antes de cerrar
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/75">
                    Estos puntos no bloquean el cierre, pero ayudan a evitar errores de caja, delivery o inventario.
                  </p>
                </div>

                <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000]">
                  {closeReviewItems.length} punto(s)
                </span>
              </div>

              <div className="mt-3 grid gap-2 lg:grid-cols-2">
                {closeReviewItems.slice(0, 4).map((item) => {
                  const classes = getCloseReviewItemClasses(item.tone)

                  return (
                    <div
                      key={`${item.title}-${item.value}`}
                      className={`rounded-2xl border-2 px-4 py-3 ${classes.wrapper}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className={`text-sm font-black uppercase ${classes.title}`}>
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/70">
                            {item.description}
                          </p>
                        </div>
                        <p className={`shrink-0 text-sm font-black ${classes.value}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {closeReviewItems.length > 4 && (
                <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-black text-[#3a0000]/70">
                  Hay {closeReviewItems.length - 4} punto(s) adicional(es). Abre “Alertas completas” para revisarlos todos.
                </p>
              )}
            </div>

            <CloseDetailSection
              title="Detalle de cobros"
              description="Divisas, bolívares, métodos de pago y estado de los cobros reales."
              defaultOpen
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoBox
                  label="Divisas recibidas"
                  value={formatUSD(dayStats.realPaymentTotals.realCashUSD)}
                />
                <InfoBox
                  label="Bolívares recibidos"
                  value={`Bs ${formatVES(dayStats.realPaymentTotals.realVES)}`}
                />
                <InfoBox
                  label="Equiv. Bs en USD"
                  value={formatUSD(dayStats.realPaymentTotals.realVESEquivalentUSD)}
                />
                <InfoBox
                  label="Pedidos pagados"
                  value={String(dayStats.realPaymentTotals.paidOrders)}
                />
                <InfoBox
                  label="Pago parcial"
                  value={String(dayStats.realPaymentTotals.partialPaymentOrders)}
                />
                <InfoBox
                  label="Pendientes"
                  value={String(dayStats.realPaymentTotals.pendingPaymentOrders)}
                />
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <PaymentSummaryList
                  title="Cobros por estado"
                  emptyText="Todavía no hay cobros registrados."
                  items={dayStats.paymentByStatus}
                />

                <PaymentSummaryList
                  title="Cobros en divisas"
                  emptyText="Todavía no hay divisas registradas."
                  items={dayStats.paymentByUSDMethod}
                />

                <PaymentSummaryList
                  title="Cobros en bolívares"
                  emptyText="Todavía no hay bolívares registrados."
                  items={dayStats.paymentByVESMethod}
                  showVES
                />
              </div>
            </CloseDetailSection>

            <CloseDetailSection
              title="Detalle de pedidos"
              description="Estado operativo de los pedidos del día y ventas confirmadas por entrega."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox label="Registrados" value={String(dayStats.ordersToday.length)} />
                <InfoBox label="Entregados" value={String(dayStats.deliveredToday.length)} />
                <InfoBox label="Activos" value={String(dayStats.activeToday.length)} />
                <InfoBox label="Cancelados" value={String(dayStats.canceledToday.length)} />
                <InfoBox
                  label="Total entregado"
                  value={formatUSD(dayStats.deliveredTotals.totalUSD)}
                />
                <InfoBox
                  label="Venta de productos"
                  value={formatUSD(
                    dayStats.deliveredTotals.totalUSD -
                      dayStats.deliveredTotals.deliveryCostUSD
                  )}
                />
                <InfoBox
                  label="Combos"
                  value={formatUSD(dayStats.deliveredTotals.totalCombosUSD)}
                />
                <InfoBox
                  label="Productos"
                  value={formatUSD(dayStats.deliveredTotals.totalRegularUSD)}
                />
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <SummaryList
                  title="Ventas por tipo"
                  emptyText="Todavía no hay ventas entregadas."
                  items={dayStats.deliveredByType}
                />

                <div className="rounded-[1.4rem] border-2 border-yellow-400 bg-yellow-100 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a5a00]">
                    Pendiente por entregar
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <InfoBox
                      label="Total pendiente"
                      value={formatUSD(dayStats.activeTotals.totalUSD)}
                    />
                    <InfoBox
                      label="Delivery pendiente"
                      value={formatUSD(dayStats.activeTotals.deliveryCostUSD)}
                    />
                  </div>
                </div>
              </div>
            </CloseDetailSection>

            <CloseDetailSection
              title="Delivery"
              description="Pedidos a domicilio, zonas, métodos indicados y forma real de cobro del delivery."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoBox label="Delivery registrados" value={String(dayStats.deliveryToday.length)} />
                <InfoBox label="Delivery entregados" value={String(dayStats.deliveredDeliveryToday.length)} />
                <InfoBox label="Delivery activos" value={String(dayStats.activeDeliveryToday.length)} />
                <InfoBox
                  label="Delivery total"
                  value={formatUSD(dayStats.realPaymentTotals.deliveryTotalRegisteredUSD)}
                />
                <InfoBox
                  label="Forma registrada"
                  value={formatUSD(dayStats.realPaymentTotals.deliveryWithPaymentMethodUSD)}
                />
                <InfoBox
                  label="Sin forma registrada"
                  value={formatUSD(dayStats.realPaymentTotals.deliveryWithoutPaymentMethodUSD)}
                />
              </div>

              {dayStats.realPaymentTotals.deliveryWithoutPaymentMethodUSD > 0 && (
                <p className="mt-3 rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3 text-xs font-black leading-5 text-[#8a5a00]">
                  Hay delivery con costo registrado, pero todavía sin forma de cobro marcada. Revisa los pedidos pendientes o parciales antes de cerrar caja.
                </p>
              )}

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <PaymentSummaryList
                  title="Forma real de cobro"
                  emptyText="Todavía no hay delivery marcado como cobrado."
                  items={dayStats.deliveryByPaymentIn}
                  showDelivery
                  showVES
                />

                <SummaryList
                  title="Método indicado en pedido"
                  emptyText="Todavía no hay deliveries entregados."
                  items={dayStats.deliveredByPayment}
                  showDelivery
                />

                <SummaryList
                  title="Delivery por zona"
                  emptyText="Todavía no hay deliveries entregados."
                  items={dayStats.deliveredByZone}
                  showDelivery
                />
              </div>
            </CloseDetailSection>

            <CloseDetailSection
              title="Gastos y proveedores"
              description="Salidas de caja, compras de inventario, proveedores, categorías y métodos de gasto."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoBox label="Gastos registrados" value={String(dayExpenseTotals.count)} />
                <InfoBox
                  label="Total gastos"
                  value={formatUSD(dayExpenseTotals.equivalentUSD)}
                />
                <InfoBox
                  label="En divisas"
                  value={formatUSD(dayExpenseTotals.amountUSD)}
                />
                <InfoBox
                  label="En bolívares"
                  value={`Bs ${formatVES(dayExpenseTotals.amountVES)}`}
                />
              </div>

              {expenseCloseBreakdown.expensesWithoutProvider.length > 0 && (
                <p className="mt-3 rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3 text-xs font-black leading-5 text-[#8a5a00]">
                  Hay {expenseCloseBreakdown.expensesWithoutProvider.length} gasto(s) sin proveedor. No bloquea el cierre, pero conviene completarlo para que el historial sea más útil.
                </p>
              )}

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <ExpenseSummaryList
                  title="Gastos por proveedor"
                  emptyText="Todavía no hay gastos por proveedor para mostrar."
                  items={expenseCloseBreakdown.byProvider}
                />
                <ExpenseSummaryList
                  title="Gastos por tipo"
                  emptyText="Todavía no hay tipos de gasto para mostrar."
                  items={expenseCloseBreakdown.byType}
                />
                <ExpenseSummaryList
                  title="Gastos por categoría"
                  emptyText="Todavía no hay categorías de gasto para mostrar."
                  items={expenseCloseBreakdown.byCategory}
                />
                <ExpenseSummaryList
                  title="Gastos por método"
                  emptyText="Todavía no hay métodos de gasto para mostrar."
                  items={expenseCloseBreakdown.byMethod}
                />
              </div>

              <div className="mt-3 rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Gastos registrados hoy
                </p>
                {dayExpenses.length === 0 ? (
                  <p className="mt-3 rounded-2xl bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/70">
                    Todavía no hay gastos registrados.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {dayExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="rounded-2xl border border-[#a00000]/15 bg-[#fff7e8] px-4 py-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-black uppercase text-[#220000]">
                              {expense.concept || "Gasto"}
                            </p>
                            <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/65">
                              {expense.expenseType || "Gasto operativo"} · {expense.category || "Otros"} · {expense.method || "Sin registrar"}
                              {expense.provider ? ` · ${expense.provider}` : " · Sin proveedor"}
                            </p>
                            {expense.inventoryLinked && expense.inventoryItemName && (
                              <p className="mt-1 text-xs font-black text-green-700">
                                Inventario: {expense.inventoryItemName} +{expense.inventoryQuantity || 0} {expense.inventoryUnit || "unidades"}
                              </p>
                            )}
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-base font-black text-[#a00000]">
                              {formatUSD(expense.equivalentUSD)}
                            </p>
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
            </CloseDetailSection>

            <CloseDetailSection
              title="Inventario y recetas"
              description="Compras que sumaron inventario y revisión rápida de movimientos relacionados con el cierre."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoBox
                  label="Compras con inventario"
                  value={String(expenseCloseBreakdown.inventoryLinkedExpenses.length)}
                />
                <InfoBox
                  label="Compras sin inventario"
                  value={String(
                    Math.max(
                      dayExpenseTotals.count -
                        expenseCloseBreakdown.inventoryLinkedExpenses.length,
                      0
                    )
                  )}
                />
                <InfoBox
                  label="Productos vendidos"
                  value={String(dayStats.productsSold.length)}
                />
              </div>

              <p className="mt-3 rounded-2xl border-2 border-[#a00000]/20 bg-white px-4 py-3 text-xs font-bold leading-5 text-[#3a0000]/70">
                Los descuentos por receta se ejecutan cuando los pedidos se marcan como entregados. Esta sección resume las compras que sumaron inventario desde gastos y los productos vendidos que conviene revisar contra recetas.
              </p>

              {expenseCloseBreakdown.inventoryLinkedExpenses.length === 0 ? (
                <p className="mt-3 rounded-2xl bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/70">
                  Hoy no hay compras marcadas como entrada de inventario.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {expenseCloseBreakdown.inventoryLinkedExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="rounded-2xl border border-green-500/25 bg-green-50 px-4 py-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-black uppercase text-green-800">
                            {expense.inventoryItemName}
                          </p>
                          <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/70">
                            {expense.concept || "Compra"} · {expense.provider || "Sin proveedor"}
                          </p>
                        </div>
                        <p className="text-sm font-black text-green-700">
                          +{expense.inventoryQuantity || 0} {expense.inventoryUnit || "unidades"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CloseDetailSection>

            <CloseDetailSection
              title="Productos vendidos"
              description="Ranking del día para revisar qué se movió antes de guardar el cierre."
            >
              {dayStats.productsSold.length === 0 ? (
                <p className="rounded-2xl bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/70">
                  Todavía no hay productos entregados para mostrar.
                </p>
              ) : (
                <div className="space-y-2">
                  {dayStats.productsSold.map((product, index) => (
                    <div
                      key={product.name}
                      className="rounded-2xl border border-[#a00000]/15 bg-[#fff7e8] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black uppercase text-[#220000]">
                            {index + 1}. {product.name}
                          </p>
                          <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                            {product.quantity} unidad(es)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-[#a00000]">
                            {formatUSD(product.totalUSD)}
                          </p>
                          {!product.onlyCurrency && product.totalVES > 0 && (
                            <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                              Bs {formatVES(product.totalVES)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CloseDetailSection>

            <CloseDetailSection
              title="Alertas completas"
              description="Lista completa de puntos detectados antes del cierre."
            >
              <div className="space-y-2">
                {closeReviewItems.map((item) => {
                  const classes = getCloseReviewItemClasses(item.tone)

                  return (
                    <div
                      key={`${item.title}-${item.value}`}
                      className={`rounded-2xl border-2 px-4 py-3 ${classes.wrapper}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${classes.icon}`}>
                          {item.tone === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <p className={`text-sm font-black uppercase ${classes.title}`}>
                              {item.title}
                            </p>
                            <p className={`text-sm font-black ${classes.value}`}>
                              {item.value}
                            </p>
                          </div>
                          <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/70">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CloseDetailSection>

            <CloseDetailSection
              title="Resumen para copiar"
              description="Texto completo para enviar o guardar fuera del sistema."
            >
              <pre className="max-h-[360px] overflow-y-auto whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-[#3a0000]">
                {closeSummaryText}
              </pre>
            </CloseDetailSection>

            {closeSummaryMessage && (
              <div className="rounded-2xl border-2 border-green-500/30 bg-green-50 px-4 py-3">
                <p className="text-sm font-black text-green-700">
                  {closeSummaryMessage}
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyCloseSummary}
                className="w-full rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000]"
              >
                Copiar resumen
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsResetReviewVisible(true)
                  setIsResetModalOpen(true)
                }}
                className="w-full rounded-full bg-red-700 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-white"
              >
                Guardar cierre y reiniciar pedidos
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {isResetModalOpen && (
        <ModalShell onClose={() => setIsResetModalOpen(false)} title="Revisión antes de cerrar">
          <div className="space-y-4">
            <div
              className={`rounded-[1.4rem] border-2 p-4 ${
                hasCloseReviewWarnings
                  ? "border-yellow-400 bg-yellow-100"
                  : "border-green-500/35 bg-green-50"
              }`}
            >
              <div className="flex gap-3">
                {hasCloseReviewWarnings ? (
                  <AlertTriangle className="mt-1 shrink-0 text-[#8a5a00]" size={26} />
                ) : (
                  <CheckCircle2 className="mt-1 shrink-0 text-green-700" size={26} />
                )}
                <div>
                  <p
                    className={`text-sm font-black uppercase ${
                      hasCloseReviewWarnings ? "text-[#8a5a00]" : "text-green-800"
                    }`}
                  >
                    {hasCloseReviewWarnings
                      ? "Hay puntos que conviene revisar antes de reiniciar."
                      : "El cierre parece listo para reiniciar."}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/75">
                    Al confirmar, el sistema guardará el cierre del día en el historial y después borrará los pedidos actuales de la pantalla operativa.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoBox
                label="Pedidos de hoy"
                value={String(dayStats.ordersToday.length)}
              />
              <InfoBox
                label="Cobrado real"
                value={formatUSD(dayStats.realPaymentTotals.realCollectedUSD)}
              />
              <InfoBox
                label="Pendiente"
                value={formatUSD(dayStats.realPaymentTotals.realPendingUSD)}
              />
            </div>

            <CloseReviewPanel
              items={closeReviewItems}
              isVisible={isResetReviewVisible}
              onToggle={() =>
                setIsResetReviewVisible((currentValue) => !currentValue)
              }
            />

            <div className="rounded-[1.4rem] border-2 border-red-500/35 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="mt-1 shrink-0 text-red-600" size={26} />
                <div>
                  <p className="text-sm font-black uppercase text-red-800">
                    Esta acción reinicia el día operativo.
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-red-800/80">
                    Si continúas, primero se intentará guardar el cierre. Si el cierre no se guarda, el sistema no debería borrar los pedidos.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Escribe REINICIAR para confirmar
              </label>
              <input
                value={resetConfirmationText}
                onChange={(event) => setResetConfirmationText(event.target.value)}
                placeholder="REINICIAR"
                className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
              />
              <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/60">
                Esta palabra evita reinicios accidentales. Puedes volver al panel para corregir pedidos antes de cerrar.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false)
                  setIsCloseModalOpen(false)
                  setResetConfirmationText("")
                }}
                disabled={isResettingDay}
                className="rounded-full border-2 border-[#a00000] bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
              >
                Volver a revisar pedidos
              </button>

              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResettingDay}
                className="rounded-full border-2 border-[#a00000] bg-white px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
              >
                Seguir viendo cierre
              </button>

              <button
                type="button"
                onClick={resetDayOrders}
                disabled={isResettingDay}
                className="flex items-center justify-center gap-3 rounded-full bg-red-700 px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50"
              >
                {isResettingDay && <Loader2 size={18} className="animate-spin" />}
                Cerrar de todos modos
              </button>
            </div>
          </div>
        </ModalShell>
      )}


      {isExpensesModalOpen && (
        <ModalShell
          onClose={() => {
            if (!isSavingExpense && !deletingExpenseId) {
              setIsExpensesModalOpen(false)
              setExpenseMessage(null)
            }
          }}
          title="Gastos del día"
        >
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Control de salidas de caja
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                Registra gastos de hoy como compras, pagos, motorizado o servicios. Estos gastos se integran al cierre del día para mostrar el neto estimado.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoBox
                label="Gastos registrados"
                value={String(dayExpenseTotals.count)}
              />
              <InfoBox
                label="Total equiv. USD"
                value={formatUSD(dayExpenseTotals.equivalentUSD)}
              />
              <InfoBox
                label="Bolívares gastados"
                value={`Bs ${formatVES(dayExpenseTotals.amountVES)}`}
              />
            </div>

            <div className="rounded-[1.4rem] border-2 border-[#a00000] bg-[#fff7e8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Nuevo gasto
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Concepto frecuente o insumo del inventario
                  </label>
                  <select
                    value={selectedExpenseQuickConceptId}
                    onChange={(event) =>
                      selectExpenseQuickConcept(event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  >
                    <option value="">Selecciona un gasto rápido o insumo guardado</option>
                    {expenseQuickConcepts.map((concept) => (
                      <option key={concept.id} value={concept.id}>
                        {concept.name}
                        {concept.relatedInventory ? " · puede sumar inventario" : ""}
                      </option>
                    ))}
                    <option value={CUSTOM_EXPENSE_CONCEPT_ID}>
                      Escribir otro
                    </option>
                  </select>
                  <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/60">
                    Al seleccionar un concepto frecuente o un insumo ya guardado, se completa la categoría y se conecta con inventario para evitar nombres duplicados.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Concepto
                  </label>
                  <input
                    value={expenseForm.concept}
                    onChange={(event) => {
                      updateExpenseForm("concept", event.target.value)
                      if (selectedExpenseQuickConceptId !== CUSTOM_EXPENSE_CONCEPT_ID) {
                        setSelectedExpenseQuickConceptId(CUSTOM_EXPENSE_CONCEPT_ID)
                      }
                    }}
                    placeholder="Ej: compra de pan, pago motorizado, salsas"
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Proveedor
                  </label>
                  <input
                    value={expenseForm.provider}
                    onChange={(event) =>
                      updateExpenseForm("provider", event.target.value)
                    }
                    placeholder="Ej: Distribuidora, mercado, motorizado"
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Tipo
                  </label>
                  <select
                    value={expenseForm.expenseType}
                    onChange={(event) =>
                      updateExpenseForm("expenseType", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  >
                    {EXPENSE_TYPES.map((expenseType) => (
                      <option key={expenseType} value={expenseType}>
                        {expenseType}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Categoría
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(event) =>
                      updateExpenseForm("category", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  >
                    {EXPENSE_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Método
                  </label>
                  <select
                    value={expenseForm.method}
                    onChange={(event) =>
                      updateExpenseForm("method", event.target.value)
                    }
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  >
                    {EXPENSE_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Monto en divisas
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expenseForm.amountUSD}
                    onChange={(event) =>
                      updateExpenseForm("amountUSD", event.target.value)
                    }
                    placeholder="Ej: 10.00"
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Monto en bolívares
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expenseForm.amountVES}
                    onChange={(event) =>
                      updateExpenseForm("amountVES", event.target.value)
                    }
                    placeholder="Ej: 650.00 o 650,00"
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Equivalente USD manual
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={expenseForm.equivalentUSD}
                    onChange={(event) =>
                      updateExpenseForm("equivalentUSD", event.target.value)
                    }
                    placeholder="Opcional. Útil si no hay tasa del día."
                    className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  />
                  <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/60">
                    Estimado actual: {formatUSD(expenseDraftEquivalentUSD)}
                    {latestExpenseExchangeRate > 0
                      ? ` usando tasa Bs ${formatVES(latestExpenseExchangeRate)}`
                      : " · escribe equivalente manual si el gasto fue en bolívares"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Nota
                  </label>
                  <textarea
                    value={expenseForm.note}
                    onChange={(event) =>
                      updateExpenseForm("note", event.target.value)
                    }
                    placeholder="Detalle opcional del gasto."
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                  />
                </div>

                <div className="sm:col-span-2 rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                        <PackageCheck size={16} />
                        Relación con inventario
                      </p>
                      <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                        Si este gasto fue una compra de materia prima o productos, también puedes sumar la entrada al inventario.
                      </p>
                    </div>

                    <label className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] ${
                      isInventoryModuleVisible
                        ? "cursor-pointer border-[#a00000] bg-yellow-300 text-[#4a0000]"
                        : "cursor-not-allowed border-[#a00000]/25 bg-[#fff7e8] text-[#a00000]/55"
                    }`}>
                      <input
                        type="checkbox"
                        checked={linkExpenseToInventory && isInventoryModuleVisible}
                        onChange={(event) => {
                          setLinkExpenseToInventory(event.target.checked)
                          if (event.target.checked) {
                            loadExpenseInventory(true)
                          }
                        }}
                        disabled={!isInventoryModuleVisible}
                        className="h-4 w-4 accent-[#a00000]"
                      />
                      Sumar al inventario
                    </label>
                  </div>

                  {!isInventoryModuleVisible && (
                    <p className="mt-3 rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3 text-xs font-black leading-5 text-[#8a5a00]">
                      Inventario no está activo en este plan. El gasto puede guardarse normalmente, pero no se sumará mercancía.
                    </p>
                  )}

                  {linkExpenseToInventory && isInventoryModuleVisible && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateExpenseInventoryForm("mode", "existing")}
                          className={`rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                            expenseInventoryForm.mode === "existing"
                              ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
                              : "border-[#a00000] bg-white text-[#a00000]"
                          }`}
                        >
                          Producto existente
                        </button>
                        <button
                          type="button"
                          onClick={() => updateExpenseInventoryForm("mode", "new")}
                          className={`rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] ${
                            expenseInventoryForm.mode === "new"
                              ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
                              : "border-[#a00000] bg-white text-[#a00000]"
                          }`}
                        >
                          Nuevo producto
                        </button>
                        <button
                          type="button"
                          onClick={() => loadExpenseInventory()}
                          disabled={isLoadingExpenseInventory}
                          className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
                        >
                          {isLoadingExpenseInventory ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                          Inventario
                        </button>
                      </div>

                      {expenseInventoryForm.mode === "existing" ? (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                            Producto existente
                          </label>
                          <select
                            value={expenseInventoryForm.itemId}
                            onChange={(event) => updateExpenseInventoryForm("itemId", event.target.value)}
                            className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                          >
                            <option value="">Selecciona un producto</option>
                            {expenseInventory.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} · {item.quantity} {item.unit}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                              Nombre en inventario
                            </label>
                            <input
                              value={expenseInventoryForm.name}
                              onChange={(event) => updateExpenseInventoryForm("name", event.target.value)}
                              placeholder="Ej: Pan, salchichas, papas"
                              className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                              Categoría inventario
                            </label>
                            <select
                              value={expenseInventoryForm.category}
                              onChange={(event) => updateExpenseInventoryForm("category", event.target.value)}
                              className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                            >
                              {EXPENSE_CATEGORIES.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}

                      <div>
                        <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                          Cantidad que entra
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={expenseInventoryForm.quantity}
                          onChange={(event) => updateExpenseInventoryForm("quantity", event.target.value)}
                          placeholder="Ej: 24"
                          className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                          Unidad
                        </label>
                        <select
                          value={expenseInventoryForm.unit}
                          onChange={(event) => updateExpenseInventoryForm("unit", event.target.value)}
                          disabled={expenseInventoryForm.mode === "existing"}
                          className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000] disabled:opacity-60"
                        >
                          {EXPENSE_INVENTORY_UNIT_OPTIONS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </div>

                      {expenseInventoryForm.mode === "new" && (
                        <div className="sm:col-span-2">
                          <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                            Stock mínimo
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={expenseInventoryForm.minimumStock}
                            onChange={(event) => updateExpenseInventoryForm("minimumStock", event.target.value)}
                            placeholder="Opcional"
                            className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                          />
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                          Nota para inventario
                        </label>
                        <input
                          value={expenseInventoryForm.note}
                          onChange={(event) => updateExpenseInventoryForm("note", event.target.value)}
                          placeholder="Opcional. Ej: compra de la mañana"
                          className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

                <details className="sm:col-span-2 rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
                  <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Editar conceptos frecuentes
                  </summary>

                  <div className="mt-4 space-y-4">
                    <p className="text-sm font-bold leading-6 text-[#3a0000]/70">
                      Agrega o quita opciones rápidas para no escribir siempre los mismos gastos. Esta lista queda guardada en este dispositivo.
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {expenseQuickConcepts.map((concept) => (
                        <div
                          key={concept.id}
                          className="rounded-2xl border-2 border-[#a00000]/15 bg-[#fff7e8] p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-black uppercase text-[#220000]">
                                {concept.name}
                              </p>
                              <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#a00000]">
                                {concept.category} · {concept.unit}
                              </p>
                              <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                                {concept.relatedInventory
                                  ? "Puede sugerir entrada de inventario"
                                  : "Solo gasto, sin inventario"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeExpenseQuickConcept(concept.id)}
                              className="rounded-full bg-red-100 p-2 text-red-700"
                              aria-label={`Eliminar ${concept.name}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-[1.2rem] border-2 border-[#a00000]/20 bg-[#fff7e8] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                        Agregar concepto
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                            Nombre
                          </label>
                          <input
                            value={newExpenseQuickConceptName}
                            onChange={(event) =>
                              setNewExpenseQuickConceptName(event.target.value)
                            }
                            placeholder="Ej: Carbón, aceite, gas, hielo"
                            className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                            Categoría sugerida
                          </label>
                          <select
                            value={newExpenseQuickConceptCategory}
                            onChange={(event) =>
                              setNewExpenseQuickConceptCategory(event.target.value)
                            }
                            className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                          >
                            {EXPENSE_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                            Unidad sugerida
                          </label>
                          <select
                            value={newExpenseQuickConceptUnit}
                            onChange={(event) =>
                              setNewExpenseQuickConceptUnit(event.target.value)
                            }
                            className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                          >
                            {EXPENSE_INVENTORY_UNIT_OPTIONS.map((unit) => (
                              <option key={unit} value={unit}>
                                {unit}
                              </option>
                            ))}
                          </select>
                        </div>

                        <label className="sm:col-span-2 inline-flex items-center gap-2 rounded-2xl border-2 border-[#a00000]/20 bg-white px-4 py-3 text-sm font-black text-[#4a0000]">
                          <input
                            type="checkbox"
                            checked={newExpenseQuickConceptRelatedInventory}
                            onChange={(event) =>
                              setNewExpenseQuickConceptRelatedInventory(event.target.checked)
                            }
                            className="h-4 w-4 accent-[#a00000]"
                          />
                          Puede relacionarse con inventario
                        </label>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={addExpenseQuickConcept}
                          className="rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000]"
                        >
                          Agregar concepto
                        </button>

                        <button
                          type="button"
                          onClick={resetExpenseQuickConcepts}
                          className="rounded-full border-2 border-[#a00000] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000]"
                        >
                          Restaurar lista base
                        </button>
                      </div>
                    </div>
                  </div>
                </details>


              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={saveDayExpense}
                  disabled={isSavingExpense}
                  className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] disabled:opacity-50"
                >
                  {isSavingExpense && <Loader2 size={18} className="animate-spin" />}
                  Guardar gasto
                </button>

                <button
                  type="button"
                  onClick={resetExpenseForm}
                  disabled={isSavingExpense}
                  className="rounded-full border-2 border-[#a00000] bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
                >
                  Limpiar formulario
                </button>
              </div>
            </div>

            {expenseMessage && (
              <p className="rounded-2xl border-2 border-[#a00000]/20 bg-white px-4 py-3 text-sm font-black text-[#3a0000]">
                {expenseMessage}
              </p>
            )}

            <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Gastos registrados hoy
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                    {dayExpenseTotals.count} gasto(s) · {formatUSD(dayExpenseTotals.equivalentUSD)} estimado(s)
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAreExpensesVisible((value) => !value)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000]"
                  >
                    {areExpensesVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                    {areExpensesVisible ? "Ocultar lista" : "Mostrar lista"}
                  </button>

                  <button
                    type="button"
                    onClick={() => loadDayExpenses(adminPassword)}
                    disabled={isLoadingExpenses}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
                  >
                    {isLoadingExpenses ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Actualizar
                  </button>
                </div>
              </div>

              {areExpensesVisible ? (
                dayExpenses.length === 0 ? (
                  <p className="mt-4 rounded-2xl bg-[#fff7e8] px-4 py-4 text-sm font-bold leading-6 text-[#3a0000]/70">
                    Todavía no hay gastos registrados para hoy.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {dayExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="rounded-2xl border-2 border-[#a00000]/15 bg-[#fff7e8] p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-black uppercase text-[#220000]">
                              {expense.concept || "Gasto"}
                            </p>
                            <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-[#a00000]">
                              {expense.expenseType || "Gasto operativo"} · {expense.category || "Otros"} · {expense.method || "Sin registrar"}
                            </p>
                            {expense.provider && (
                              <p className="mt-1 text-xs font-black uppercase tracking-[0.1em] text-[#3a0000]/60">
                                Proveedor: {expense.provider}
                              </p>
                            )}
                            {expense.inventoryLinked && expense.inventoryItemName && (
                              <p className="mt-1 text-xs font-bold text-[#3a0000]/65">
                                Inventario: {expense.inventoryItemName} +{expense.inventoryQuantity || 0} {expense.inventoryUnit || "unidades"}
                              </p>
                            )}
                            {expense.note && (
                              <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                                {expense.note}
                              </p>
                            )}
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-lg font-black text-[#a00000]">
                              {formatUSD(expense.equivalentUSD)}
                            </p>
                            {expense.amountUSD > 0 && (
                              <p className="text-xs font-black text-[#3a0000]/65">
                                Divisas {formatUSD(expense.amountUSD)}
                              </p>
                            )}
                            {expense.amountVES > 0 && (
                              <p className="text-xs font-black text-[#3a0000]/65">
                                Bs {formatVES(expense.amountVES)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-bold text-[#3a0000]/55">
                            {expense.dateLabel || expense.dateValue || "Hoy"}
                          </p>

                          {canDeleteExpenses && (
                            <button
                              type="button"
                              onClick={() => deleteDayExpense(expense.id)}
                              disabled={deletingExpenseId === expense.id}
                              className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-red-700 disabled:opacity-50"
                            >
                              {deletingExpenseId === expense.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="mt-4 rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3 text-sm font-bold leading-6 text-[#8a5a00]">
                  Lista oculta. Hay {dayExpenseTotals.count} gasto(s) por {formatUSD(dayExpenseTotals.equivalentUSD)}.
                </p>
              )}
            </div>
          </div>
        </ModalShell>
      )}

      {isLocationsModalOpen && (
        <ModalShell onClose={() => setIsLocationsModalOpen(false)} title="Mesas y ubicaciones">
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {orderLocations.map((location) => (
                <div
                  key={location}
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-3"
                >
                  <p className="font-black uppercase text-[#220000]">{location}</p>
                  <button
                    type="button"
                    onClick={() => removeOrderLocation(location)}
                    className="rounded-full bg-red-100 p-2 text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={newLocationName}
                onChange={(event) => setNewLocationName(event.target.value)}
                placeholder="Nueva mesa o ubicación"
                className="rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
              />
              <button
                type="button"
                onClick={addOrderLocation}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase text-[#4a0000]"
              >
                <Plus size={18} />
                Agregar
              </button>
            </div>

            {locationsMessage && (
              <p className="rounded-2xl border-2 border-[#a00000]/20 bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]">
                {locationsMessage}
              </p>
            )}

            <button
              type="button"
              onClick={restoreDefaultOrderLocations}
              className="w-full rounded-full border-2 border-[#a00000] bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#a00000]"
            >
              Restaurar ubicaciones base
            </button>
          </div>
        </ModalShell>
      )}


      {isDeliveryZonesModalOpen && (
        <ModalShell
          onClose={() => {
            if (!isSavingDeliveryZones) {
              setIsDeliveryZonesModalOpen(false)
              setNewDeliveryZoneName("")
              setNewDeliveryZoneCost("")
            }
          }}
          title="Zonas de delivery"
        >
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Precios publicados en el carrito
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                Cada zona guardada aquí aparecerá en el carrito del cliente. El cliente selecciona la zona y el costo se calcula automáticamente.
              </p>
            </div>

            <div className="grid gap-3">
              {deliveryZones.map((zone, index) => (
                <div
                  key={`${zone.name}-${index}`}
                  className="grid gap-2 rounded-2xl border-2 border-[#a00000]/25 bg-white p-3 sm:grid-cols-[1fr_140px_auto] sm:items-center"
                >
                  <input
                    value={zone.name}
                    onChange={(event) =>
                      updateDeliveryZoneName(index, event.target.value)
                    }
                    placeholder="Nombre de la zona"
                    className="rounded-2xl border-2 border-[#a00000]/20 bg-[#fff7e8] px-4 py-3 text-sm font-black text-[#4a0000] outline-none focus:border-[#a00000]"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number.isFinite(zone.costUSD) ? zone.costUSD : ""}
                    onChange={(event) =>
                      updateDeliveryZoneCost(index, event.target.value)
                    }
                    placeholder="USD"
                    className="rounded-2xl border-2 border-[#a00000]/20 bg-[#fff7e8] px-4 py-3 text-sm font-black text-[#4a0000] outline-none focus:border-[#a00000]"
                  />

                  <button
                    type="button"
                    onClick={() => removeDeliveryZone(index)}
                    className="inline-flex items-center justify-center rounded-full bg-red-100 p-3 text-red-700 transition hover:bg-red-200"
                    aria-label={`Eliminar ${zone.name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Agregar zona
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_130px_auto]">
                <input
                  value={newDeliveryZoneName}
                  onChange={(event) => setNewDeliveryZoneName(event.target.value)}
                  placeholder="Ejemplo: Las Chimeneas"
                  className="rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newDeliveryZoneCost}
                  onChange={(event) => setNewDeliveryZoneCost(event.target.value)}
                  placeholder="USD"
                  className="rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                />

                <button
                  type="button"
                  onClick={addDeliveryZone}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase text-[#4a0000]"
                >
                  <Plus size={18} />
                  Agregar
                </button>
              </div>
            </div>

            {deliveryZonesMessage && (
              <p className="rounded-2xl border-2 border-[#a00000]/20 bg-white px-4 py-3 text-sm font-bold text-[#3a0000]">
                {deliveryZonesMessage}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={saveDeliveryZones}
                disabled={isSavingDeliveryZones || isLoadingDeliveryZones}
                className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] disabled:opacity-50"
              >
                {isSavingDeliveryZones && <Loader2 size={18} className="animate-spin" />}
                Guardar zonas
              </button>

              <button
                type="button"
                onClick={restoreDefaultDeliveryZones}
                disabled={isSavingDeliveryZones}
                className="rounded-full border-2 border-[#a00000] bg-white px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
              >
                Restaurar base
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {paymentModalOrder && paymentDraft && (
        <ModalShell
          onClose={() => {
            if (!isSavingPayment) {
              setSelectedPaymentOrder(null)
              setPaymentForm(EMPTY_PAYMENT_FORM)
              setPaymentMessage(null)
            }
          }}
          title="Registrar cobro"
        >
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                {getDisplayOrderNumber(paymentModalOrder)} · {paymentModalOrder.customerName || "Cliente"}
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                Registra aquí el dinero recibido por caja. El sistema calcula automáticamente si el pedido queda pagado, parcial o pendiente.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoBox
                label="Total pedido"
                value={formatUSD(paymentDraft.totalOrderUSD)}
              />
              <InfoBox
                label="Recibido equiv."
                value={formatUSD(paymentDraft.receivedEquivalentUSD)}
              />
              <InfoBox
                label="Pendiente"
                value={formatUSD(paymentDraft.pendingUSD)}
              />
            </div>

            <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Estado estimado
                </p>
                <span
                  className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-black uppercase ${getPaymentStatusStyle(
                    paymentDraft.status
                  )}`}
                >
                  {paymentDraft.status}
                </span>
              </div>

              <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/65">
                Tasa del pedido: Bs {formatVES(paymentModalOrder.exchangeRate)} por USD.
              </p>
            </div>

            {paymentDraft.status !== "Pagado" && (
              <div className="rounded-[1.4rem] border-2 border-yellow-400 bg-yellow-100 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a5a00]">
                  Ayuda rápida para completar el pendiente
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/75">
                  Pendiente actual: {formatUSD(paymentDraft.pendingUSD)}. En bolívares serían Bs {formatVES(pendingVESForPayment)} según la tasa del pedido.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={completePaymentPendingInVES}
                    disabled={paymentDraft.pendingUSD <= 0 || paymentExchangeRate <= 0}
                    className="rounded-full border-2 border-[#a00000] bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
                  >
                    Completar pendiente en Bs
                  </button>
                  <button
                    type="button"
                    onClick={completePaymentPendingInUSD}
                    disabled={paymentDraft.pendingUSD <= 0}
                    className="rounded-full border-2 border-[#a00000] bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50"
                  >
                    Completar pendiente en divisas
                  </button>
                </div>
              </div>
            )}

            {showLowVESWarning && (
              <div className="rounded-[1.4rem] border-2 border-red-500/35 bg-red-50 p-4">
                <p className="text-sm font-black leading-6 text-red-800">
                  Revisa el monto en bolívares: lo escrito equivale a menos de $0.20. Si querías cubrir el pendiente en Bs, usa el botón “Completar pendiente en Bs” o escribe el monto completo sin separador de miles.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Monto recibido en divisas
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={paymentForm.amountReceivedUSD}
                  onChange={(event) =>
                    updatePaymentForm("amountReceivedUSD", event.target.value)
                  }
                  placeholder="Ej: 35.00"
                  className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Método en divisas
                </label>
                <select
                  value={paymentForm.paymentMethodUSD}
                  onChange={(event) =>
                    updatePaymentForm("paymentMethodUSD", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                >
                  {paymentForm.paymentMethodUSD &&
                    !PAYMENT_METHOD_USD_OPTIONS.includes(paymentForm.paymentMethodUSD) && (
                      <option value={paymentForm.paymentMethodUSD}>
                        {paymentForm.paymentMethodUSD}
                      </option>
                    )}
                  {PAYMENT_METHOD_USD_OPTIONS.map((option) => (
                    <option key={option || "sin-metodo-divisas"} value={option}>
                      {option || "Sin registrar"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Monto recibido en bolívares reales
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={paymentForm.amountReceivedVES}
                  onChange={(event) =>
                    updatePaymentForm("amountReceivedVES", event.target.value)
                  }
                  placeholder="Ej: 1569.25 o 1569,25"
                  className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                />
                <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/60">
                  Escribe el monto real en bolívares, no el equivalente en dólares. Evita separador de miles: usa 1569.25 o 1569,25.
                </p>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Método en bolívares
                </label>
                <select
                  value={paymentForm.paymentMethodVES}
                  onChange={(event) =>
                    updatePaymentForm("paymentMethodVES", event.target.value)
                  }
                  className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                >
                  {paymentForm.paymentMethodVES &&
                    !PAYMENT_METHOD_VES_OPTIONS.includes(paymentForm.paymentMethodVES) && (
                      <option value={paymentForm.paymentMethodVES}>
                        {paymentForm.paymentMethodVES}
                      </option>
                    )}
                  {PAYMENT_METHOD_VES_OPTIONS.map((option) => (
                    <option key={option || "sin-metodo-bolivares"} value={option}>
                      {option || "Sin registrar"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {paymentModalIsDelivery && (
              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Delivery pagado en
                </label>
                <select
                  value={paymentForm.deliveryPaymentIn}
                  onChange={(event) =>
                    updatePaymentForm(
                      "deliveryPaymentIn",
                      event.target.value as DeliveryPaymentIn
                    )
                  }
                  className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
                >
                  {DELIVERY_PAYMENT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/60">
                  Usa este campo solo para indicar cómo se cobró el costo de delivery.
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Nota de pago
              </label>
              <textarea
                value={paymentForm.paymentNote}
                onChange={(event) =>
                  updatePaymentForm("paymentNote", event.target.value)
                }
                placeholder="Ejemplo: Cliente pagó productos mixto y delivery por pago móvil."
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#a00000]"
              />
            </div>

            {paymentMessage && (
              <div className="rounded-2xl border-2 border-[#a00000]/20 bg-white px-4 py-3">
                <p className="text-sm font-black text-[#3a0000]">
                  {paymentMessage}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={savePayment}
              disabled={isSavingPayment}
              className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] disabled:opacity-50"
            >
              {isSavingPayment && <Loader2 size={18} className="animate-spin" />}
              Guardar cobro
            </button>
          </div>
        </ModalShell>
      )}

    </main>
  )
}


function ModuleAccessCard({
  href,
  onClick,
  icon,
  eyebrow,
  title,
  description,
  metric,
  disabled,
}: {
  href?: string
  onClick?: () => void
  icon: ReactNode
  eyebrow: string
  title: string
  description: string
  metric: string
  disabled?: boolean
}) {
  const className =
    "group flex min-h-[220px] flex-col justify-between rounded-[1.7rem] border-2 border-[#4a1f00] bg-[#5c1c00]/95 p-5 text-left shadow-[0_10px_0_rgba(92,28,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#6b2700]"

  const content = (
    <>
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-yellow-300 bg-yellow-300 text-[#4a0000] shadow-lg shadow-black/20">
            {icon}
          </div>

          <span className="rounded-full border-2 border-yellow-300/70 bg-yellow-300 px-3 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#4a0000]">
            {metric}
          </span>
        </div>

        <p className="mt-4 text-[0.62rem] font-black uppercase tracking-[0.18em] text-yellow-300">
          {eyebrow}
        </p>

        <h2 className="mt-1 text-[1.65rem] font-black uppercase leading-[0.98] text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.35)] sm:text-3xl">
          {title}
        </h2>

        <p className="mt-3 text-sm font-bold leading-6 text-yellow-50/88">
          {description}
        </p>
      </div>

      <div className="mt-4 rounded-full border-2 border-yellow-300 bg-yellow-300 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] group-hover:bg-yellow-200">
        {disabled ? "Disponible luego" : "Entrar"}
      </div>
    </>
  )

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`${className} cursor-not-allowed opacity-70`}
      >
        {content}
      </button>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    )
  }

  if (!href) {
    return (
      <button
        type="button"
        disabled
        className={`${className} cursor-not-allowed opacity-70`}
      >
        {content}
      </button>
    )
  }

  return (
    <a href={href} className={className}>
      {content}
    </a>
  )
}

function PanelMiniMetric({ label, value }: { label: string; value: string | number }) {
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

function MetricCard({
  label,
  value,
  tone = "red",
}: {
  label: string
  value: string | number
  tone?: "red" | "yellow"
}) {
  const style =
    tone === "yellow"
      ? "border-yellow-400 bg-yellow-100 text-[#8a5a00]"
      : "border-[#a00000] bg-[#fff7e8] text-[#a00000]"

  return (
    <div className={`min-w-0 overflow-hidden rounded-[1.2rem] border-2 p-3 ${style}`}>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 whitespace-nowrap text-lg font-black leading-tight tracking-[-0.03em] sm:text-xl xl:text-2xl">
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

function CloseDetailSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string
  description?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[1.4rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4"
    >
      <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
            {title}
          </p>
          {description && (
            <p className="mt-1 text-sm font-bold leading-6 text-[#3a0000]/70">
              {description}
            </p>
          )}
        </div>

        <span className="inline-flex w-fit rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#a00000] group-open:bg-yellow-300 group-open:text-[#4a0000]">
          <span className="group-open:hidden">Mostrar</span>
          <span className="hidden group-open:inline">Ocultar</span>
        </span>
      </summary>

      <div className="mt-4 border-t-2 border-[#a00000]/15 pt-4">
        {children}
      </div>
    </details>
  )
}

function ExpenseSummaryList({
  title,
  emptyText,
  items,
}: {
  title: string
  emptyText: string
  items: ExpenseSummaryItem[]
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
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#a00000]/15 bg-[#fff7e8] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase text-[#220000]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                    {item.count} gasto(s)
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-black text-[#a00000]">
                    {formatUSD(item.totalUSD)}
                  </p>
                  {item.amountVES > 0 && (
                    <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                      Bs {formatVES(item.amountVES)}
                    </p>
                  )}
                  {item.amountUSD > 0 && Math.abs(item.amountUSD - item.totalUSD) > 0.009 && (
                    <p className="mt-1 text-xs font-black text-[#3a0000]/65">
                      Divisas {formatUSD(item.amountUSD)}
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

function PaymentSummaryList({
  title,
  emptyText,
  items,
  showVES,
  showDelivery,
}: {
  title: string
  emptyText: string
  items: PaymentSummaryItem[]
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
          {items.map((item) => (
            <div
              key={item.label}
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
                  {showDelivery &&
                    item.deliveryCostUSD &&
                    item.deliveryCostUSD > 0 &&
                    Math.abs(item.deliveryCostUSD - item.totalUSD) > 0.009 && (
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

function SummaryList({
  title,
  emptyText,
  items,
  showDelivery,
}: {
  title: string
  emptyText: string
  items: DaySummaryItem[]
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
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#a00000]/15 bg-[#fff7e8] px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase text-[#220000]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                    {item.count} pedido(s)
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-base font-black text-[#a00000]">
                    {formatUSD(item.totalUSD)}
                  </p>
                  {showDelivery && item.deliveryCostUSD > 0 && (
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

function ProductGroup({
  title,
  items,
  exchangeRate,
  onlyCurrency,
}: {
  title: string
  items: CartItem[]
  exchangeRate: number
  onlyCurrency?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#a00000]/20 bg-[#fff7e8] p-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#a00000]">
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => {
          const subtotal = Number(item.price || 0) * Number(item.quantity || 0)
          const subtotalVES = subtotal * Number(exchangeRate || 0)

          return (
            <div
              key={`${item.id}-${item.name}-${index}`}
              className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#220000]"
            >
              <div className="flex items-start justify-between gap-3">
                <p>{item.name} x{item.quantity}</p>
                <p className="shrink-0 font-black text-[#a00000]">
                  {formatUSD(subtotal)}
                </p>
              </div>
              <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                {`Bs ${formatVES(subtotalVES)}`}
              </p>
              {item.noteEnabled && item.note && (
                <p className="mt-1 text-xs font-bold text-[#3a0000]/70">
                  Nota: {item.note}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


function getCloseReviewItemClasses(tone: CloseReviewTone) {
  if (tone === "danger") {
    return {
      wrapper: "border-red-500/45 bg-red-50",
      icon: "border-red-600 bg-white text-red-700",
      title: "text-red-800",
      value: "text-red-700",
    }
  }

  if (tone === "warning") {
    return {
      wrapper: "border-yellow-400 bg-yellow-100",
      icon: "border-[#8a5a00] bg-yellow-300 text-[#8a5a00]",
      title: "text-[#8a5a00]",
      value: "text-[#a00000]",
    }
  }

  if (tone === "success") {
    return {
      wrapper: "border-green-500/45 bg-green-50",
      icon: "border-green-700 bg-green-500 text-white",
      title: "text-green-800",
      value: "text-green-700",
    }
  }

  return {
    wrapper: "border-[#a00000]/25 bg-white",
    icon: "border-[#a00000] bg-[#fff7e8] text-[#a00000]",
    title: "text-[#a00000]",
    value: "text-[#220000]",
  }
}

function CloseReviewPanel({
  items,
  isVisible,
  onToggle,
}: {
  items: CloseReviewItem[]
  isVisible: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
            Revisión inteligente del cierre
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
            {isVisible
              ? "El sistema marca puntos de caja y operación que conviene revisar antes de guardar el cierre y reiniciar pedidos."
              : "La revisión está oculta para dejar más limpio el cierre. Puedes mostrarla otra vez antes de confirmar."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="w-fit rounded-full border-2 border-[#a00000] bg-[#fff7e8] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#a00000]">
            {items.length} punto(s)
          </span>

          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            {isVisible ? "Ocultar revisión" : "Mostrar revisión"}
          </button>
        </div>
      </div>

      {isVisible ? (
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => (
            <CloseReviewItemCard key={`${item.title}-${index}`} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3">
          <p className="text-sm font-black uppercase text-[#8a5a00]">
            Revisión oculta
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-[#3a0000]/75">
            Hay {items.length} punto(s) detectado(s). El cierre puede continuar si escribes REINICIAR, pero conviene revisar esos puntos cuando caja no cuadre.
          </p>
        </div>
      )}
    </div>
  )
}

function CloseReviewItemCard({ item }: { item: CloseReviewItem }) {
  const classes = getCloseReviewItemClasses(item.tone)

  return (
    <div className={`rounded-2xl border-2 p-4 ${classes.wrapper}`}>
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${classes.icon}`}
        >
          {item.tone === "success" ? (
            <CheckCircle2 size={20} />
          ) : item.tone === "info" ? (
            <Clock size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <p className={`text-sm font-black uppercase ${classes.title}`}>
              {item.title}
            </p>
            <p className={`shrink-0 text-sm font-black ${classes.value}`}>
              {item.value}
            </p>
          </div>

          <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/75">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  )
}


function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#220000]/60 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border-4 border-[#a00000] bg-[#fff7e8] text-[#220000] shadow-2xl shadow-black/45">
        <div className="h-5 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#fff7e8]" />
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#a00000] bg-white px-6 py-5">
          <h2 className="text-3xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
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
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  )
}