import {
  normalizeLocalModuleList,
  normalizeLocalPlanKey,
  getModulePlanAccess,
  normalizeLocalPlanMode,
  type LocalModuleKey,
  type LocalPlanKey,
  type LocalPlanMode,
} from "./localPlans"

export type OrderStatus =
  | "Nuevo"
  | "Preparando"
  | "Listo"
  | "Entregado"
  | "Cancelado"

export type PaymentStatus = "Pendiente" | "Pago parcial" | "Pagado"

export type DeliveryPaymentIn =
  | "Divisas"
  | "Bolívares"
  | "Mixto"
  | "Sin registrar"

export type DeliveryReportStatus = "Sin reportar" | "Entrega reportada"

export type ProductPaymentMode = "divisa" | "mixto"

export type MenuProduct = {
  id: number
  name: string
  category: string
  description: string
  price: number
  image: string
  paymentMode: ProductPaymentMode
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export type SaveMenuProductInput = {
  id?: number
  name: string
  category: string
  description?: string
  price: number
  image?: string
  paymentMode?: ProductPaymentMode
  isActive?: boolean
  isFeatured?: boolean
  sortOrder?: number
}

export type UploadMenuProductImageInput = {
  dataUrl: string
  fileName: string
  mimeType: string
  productName?: string
}

export type UploadedMenuProductImage = {
  imageUrl: string
  thumbnailUrl: string
  viewUrl: string
  fileId: string
  fileName: string
  uploadedAt: string
}

export type OrderType = "Comer aquí" | "Para llevar" | "Delivery"

export type DeliveryZone = {
  name: string
  costUSD: number
  isActive?: boolean
}

export type InventoryItem = {
  id: string
  name: string
  category: string
  quantity: number
  unit: string
  minimumStock: number
  costUSD: number
  costVES: number
  equivalentCostUSD: number
  note: string
  isActive: boolean
  updatedAt: string
}

export type InventoryMovement = {
  id: string
  dateLabel: string
  itemId: string
  itemName: string
  movementType: string
  previousQuantity: number
  quantityMoved: number
  finalQuantity: number
  unit: string
  reason: string
  relatedExpense: boolean
  expenseId: string
  note: string
  createdAt: string
}

export type InventoryRecipeIngredient = {
  itemId: string
  itemName: string
  quantity: number
  unit: string
}

export type InventoryRecipe = {
  id: string
  productId: number
  productName: string
  productCategory: string
  ingredients: InventoryRecipeIngredient[]
  note: string
  isActive: boolean
  updatedAt: string
}

export type SaveInventoryRecipeInput = {
  id?: string
  productId: number
  productName: string
  productCategory?: string
  ingredients: InventoryRecipeIngredient[]
  note?: string
  isActive?: boolean
}

export type SaveInventoryItemInput = {
  id?: string
  name: string
  category?: string
  quantity?: number
  unit?: string
  minimumStock?: number
  costUSD?: number
  costVES?: number
  equivalentCostUSD?: number
  note?: string
  isActive?: boolean
  movementType?: string
  movementReason?: string
  movementNote?: string
  relatedExpense?: boolean
  expenseId?: string
}

export type OrderItem = {
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

export type OrderPayment = {
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

export type LocalOrder = {
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

  items: OrderItem[]
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
  deliveryReportStatus?: DeliveryReportStatus
  deliveryReportedAt?: string
  deliveryReportedBy?: string
  inventoryProcessed?: boolean
  inventoryProcessedAt?: string
  inventorySummary?: string
  inventoryWarnings?: string
  inventoryMovements?: InventoryMovement[]

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

export type CreateOrderInput = {
  customerName: string
  customerPhone?: string
  tableNumber: string
  orderType: OrderType
  customerNote?: string

  deliveryAddress?: string
  deliveryReference?: string
  deliveryZone?: string
  paymentMethod?: string
  deliveryCostUSD?: number
  totalBeforeDeliveryUSD?: number

  items: OrderItem[]
  exchangeRate: number
  exchangeSource?: string
  exchangeValueDate?: string

  totalUSD?: number
  totalCombosUSD?: number
  totalRegularUSD?: number
  totalRegularVES?: number
}

export type UpdateOrderPaymentInput = {
  amountReceivedUSD: number
  amountReceivedVES: number
  paymentMethodUSD?: string
  paymentMethodVES?: string
  deliveryPaymentIn: DeliveryPaymentIn
  paymentNote?: string
}

export type DayCloseSummaryItem = {
  label: string
  count: number
  totalUSD: number
  totalVES?: number
  totalCombosUSD?: number
  totalRegularUSD?: number
  totalRegularVES?: number
  deliveryCostUSD?: number
}

export type DayCloseProductSold = {
  name: string
  quantity: number
  totalUSD: number
  totalVES: number
  onlyCurrency: boolean
}

export type DayCloseExpense = {
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

export type DayCloseInventoryProduct = {
  itemName: string
  quantity: number
  unit: string
  movementCount?: number
}

export type DayCloseInventoryAlert = {
  orderNumber: string
  customerName?: string
  warning: string
}

export type SaveDayCloseInput = {
  id?: string
  createdAt?: string
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

  totalSoldUSD?: number
  realCollectedUSD?: number
  realCashUSD?: number
  realVES?: number
  realVESEquivalentUSD?: number
  realPendingUSD?: number
  paidOrders?: number
  partialPaymentOrders?: number
  pendingPaymentOrders?: number
  deliveryPaidInUSD?: number
  deliveryPaidInVES?: number
  deliveryPaidInVESEquivalentUSD?: number
  deliveryPaidMixedUSD?: number

  expensesCount?: number
  expensesTotalUSD?: number
  expensesCashUSD?: number
  expensesVES?: number
  expensesVESEquivalentUSD?: number
  netEstimatedUSD?: number
  expenses?: DayCloseExpense[]

  inventoryProcessedOrders?: number
  inventoryPendingOrders?: number
  inventoryWarningOrders?: number
  inventoryMovementCount?: number
  inventoryProducts?: DayCloseInventoryProduct[]
  inventoryAlerts?: DayCloseInventoryAlert[]

  salesByType: DayCloseSummaryItem[]
  deliveryByPayment: DayCloseSummaryItem[]
  deliveryByZone: DayCloseSummaryItem[]
  paymentByStatus?: DayCloseSummaryItem[]
  paymentByUSDMethod?: DayCloseSummaryItem[]
  paymentByVESMethod?: DayCloseSummaryItem[]
  deliveryByPaymentIn?: DayCloseSummaryItem[]
  productsSold: DayCloseProductSold[]
}

export type SavedDayClose = SaveDayCloseInput & {
  id: string
  createdAt: string
}

export type DayExpense = {
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
  closeStatus?: string
  closeId?: string
  closedAt?: string

  provider?: string
  expenseType?: string
  inventoryLinked?: boolean
  inventoryItemId?: string
  inventoryItemName?: string
  inventoryQuantity?: number
  inventoryUnit?: string
}

export type SaveDayExpenseInput = {
  id?: string
  dateLabel?: string
  dateValue?: string
  concept: string
  category?: string
  amountUSD?: number
  amountVES?: number
  equivalentUSD?: number
  method?: string
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

export type DayExpenseFilters = {
  dateFrom?: string
  dateTo?: string
  dateValue?: string
  includeClosed?: boolean
}

export type BusinessViewMode = "simple" | "negocio" | "avanzado"

export type ExchangeRateMode = "automatic" | "manual"

export type BusinessConfig = {
  businessName: string
  businessShortDescription: string
  publicTagline: string
  publicInfoTitle: string
  publicInfoText: string
  scheduleTitle: string
  scheduleLine1: string
  scheduleLine2: string
  reviewsTitle: string
  reviewsText: string
  quickOrderTitle: string
  quickOrderText: string
  locationButtonText: string
  googleMapsUrl: string
  instagramUrl: string
  mainWhatsapp: string
  deliveryWhatsapp: string
  exchangeRateMode: ExchangeRateMode
  manualExchangeRate: number
  deliveryEnabled: boolean
  membershipPlan: LocalPlanKey
  membershipPlanMode: LocalPlanMode
  customIncludedModules: LocalModuleKey[]
  customBlockedModules: LocalModuleKey[]
  ownerDashboardModuleEnabled: boolean
  cashierModuleEnabled: boolean
  kitchenModuleEnabled: boolean
  deliveryModuleEnabled: boolean
  historyModuleEnabled: boolean
  expensesModuleEnabled: boolean
  menuProductsModuleEnabled: boolean
  promotionModuleEnabled: boolean
  promotionActive: boolean
  promotionTitle: string
  promotionText: string
  promotionHighlight: string
  promotionButtonText: string
  promotionButtonHref: string
  promotionProductId: number
  promotionProductName: string
  promotionPriceUSD: number
  promotionImage: string
  featuredProductsModuleEnabled: boolean
  featuredProductsActive: boolean
  featuredProductsTitle: string
  featuredProductsText: string
  featuredProductIds: number[]
  customersModuleEnabled: boolean
  inventoryModuleEnabled: boolean
  defaultViewMode: BusinessViewMode
  soundEnabled: boolean
  filtersOpenByDefault: boolean
  allowCloseWithPendingOrders: boolean
  allowCloseWithPendingPayments: boolean
  updatedAt?: string
}

export type SaveBusinessConfigInput = Partial<BusinessConfig>

const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  businessName: "La Bambucha",
  businessShortDescription: "MenÃƒÂº y pedidos",
  publicTagline: "Los Mejores Perros De Valencia",
  publicInfoTitle: "Visita La Bambucha",
  publicInfoText: "Estamos listos para recibirte con hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y bebidas al estilo Bambucha Grill Burger.",
  scheduleTitle: "Horario",
  scheduleLine1: "Lunes a jueves: 6:00 p.m. a 12:00 a.m.",
  scheduleLine2: "Viernes a domingos: 6:00 p.m. a 1:00 a.m.",
  reviewsTitle: "ReseÃƒÂ±as",
  reviewsText: "DespuÃƒÂ©s de probar tu pedido, puedes apoyar el negocio dejando tu reseÃƒÂ±a o compartiendo la pÃƒÂ¡gina.",
  quickOrderTitle: "Pedido rÃƒÂ¡pido",
  quickOrderText: "Agrega productos al carrito y registra el pedido en el local o envÃƒÂ­alo directamente por WhatsApp.",
  locationButtonText: "Abrir ubicaciÃƒÂ³n",
  googleMapsUrl: "",
  instagramUrl: "",
  mainWhatsapp: "",
  deliveryWhatsapp: "",
  exchangeRateMode: "automatic",
  manualExchangeRate: 0,
  deliveryEnabled: true,
  membershipPlan: "complete",
  membershipPlanMode: "plan",
  customIncludedModules: [],
  customBlockedModules: [],
  ownerDashboardModuleEnabled: true,
  cashierModuleEnabled: true,
  kitchenModuleEnabled: true,
  deliveryModuleEnabled: true,
  historyModuleEnabled: true,
  expensesModuleEnabled: true,
  menuProductsModuleEnabled: true,
  promotionModuleEnabled: true,
  promotionActive: false,
  promotionTitle: "Promoción especial",
  promotionText: "Arma tu pedido con tus favoritos de La Bambucha y envíalo directo por WhatsApp.",
  promotionHighlight: "Disponible por tiempo limitado.",
  promotionButtonText: "Ver menú",
  promotionButtonHref: "#menu",
  promotionProductId: 0,
  promotionProductName: "",
  promotionPriceUSD: 0,
  promotionImage: "",
  featuredProductsModuleEnabled: true,
  featuredProductsActive: false,
  featuredProductsTitle: "Favoritos de la casa",
  featuredProductsText: "Una selección rápida para pedir lo más recomendado del menú.",
  featuredProductIds: [1, 2, 5],
  customersModuleEnabled: true,
  inventoryModuleEnabled: true,
  defaultViewMode: "negocio",
  soundEnabled: true,
  filtersOpenByDefault: false,
  allowCloseWithPendingOrders: true,
  allowCloseWithPendingPayments: true,
}

function normalizeBooleanConfig(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value

  const normalized = String(value || "").trim().toLowerCase()

  if (["true", "1", "si", "sÃƒÂ­", "activo", "activa", "activado", "activada"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "inactivo", "inactiva", "desactivado", "desactivada"].includes(normalized)) {
    return false
  }

  return fallback
}

function normalizeNumberListConfig(value: unknown, fallback: number[]) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          const cleanValue = value.trim()

          if (!cleanValue) return []

          try {
            const parsedValue = JSON.parse(cleanValue)

            return Array.isArray(parsedValue) ? parsedValue : cleanValue.split(/[;,|]/g)
          } catch {
            return cleanValue.split(/[;,|]/g)
          }
        })()
      : fallback

  const seen = new Set<number>()

  return source
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
    .map((item) => Math.round(item))
    .filter((item) => {
      if (seen.has(item)) return false
      seen.add(item)
      return true
    })
}


function normalizePositiveNumberConfig(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return 0
  }

  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function normalizeViewMode(value: unknown): BusinessViewMode {
  const normalized = String(value || "").trim().toLowerCase()

  if (normalized === "simple") return "simple"
  if (normalized === "avanzado") return "avanzado"

  return "negocio"
}

function normalizeExchangeRateMode(value: unknown): ExchangeRateMode {
  const normalized = String(value || "").trim().toLowerCase()

  if (normalized === "manual") return "manual"

  return "automatic"
}

export function normalizeBusinessConfig(value: unknown): BusinessConfig {
  const source = (value || {}) as Partial<BusinessConfig>
  const manualExchangeRate = Number(source.manualExchangeRate || 0)

  return {
    businessName:
      String(source.businessName || "").trim() || DEFAULT_BUSINESS_CONFIG.businessName,
    businessShortDescription:
      String(source.businessShortDescription || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.businessShortDescription,
    publicTagline:
      String(source.publicTagline || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.publicTagline,
    publicInfoTitle:
      String(source.publicInfoTitle || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.publicInfoTitle,
    publicInfoText:
      String(source.publicInfoText || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.publicInfoText,
    scheduleTitle:
      String(source.scheduleTitle || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.scheduleTitle,
    scheduleLine1:
      String(source.scheduleLine1 || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.scheduleLine1,
    scheduleLine2:
      String(source.scheduleLine2 || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.scheduleLine2,
    reviewsTitle:
      String(source.reviewsTitle || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.reviewsTitle,
    reviewsText:
      String(source.reviewsText || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.reviewsText,
    quickOrderTitle:
      String(source.quickOrderTitle || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.quickOrderTitle,
    quickOrderText:
      String(source.quickOrderText || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.quickOrderText,
    locationButtonText:
      String(source.locationButtonText || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.locationButtonText,
    googleMapsUrl: String(source.googleMapsUrl || "").trim(),
    instagramUrl: String(source.instagramUrl || "").trim(),
    mainWhatsapp: String(source.mainWhatsapp || "").trim(),
    deliveryWhatsapp: String(source.deliveryWhatsapp || "").trim(),
    exchangeRateMode: normalizeExchangeRateMode(source.exchangeRateMode),
    manualExchangeRate:
      Number.isFinite(manualExchangeRate) && manualExchangeRate > 0
        ? manualExchangeRate
        : 0,
    deliveryEnabled: normalizeBooleanConfig(
      source.deliveryEnabled,
      DEFAULT_BUSINESS_CONFIG.deliveryEnabled
    ),
    membershipPlan: normalizeLocalPlanKey(source.membershipPlan),
    membershipPlanMode: normalizeLocalPlanMode(source.membershipPlanMode),
    customIncludedModules: normalizeLocalModuleList(source.customIncludedModules),
    customBlockedModules: normalizeLocalModuleList(source.customBlockedModules),
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
    promotionModuleEnabled: normalizeBooleanConfig(
      source.promotionModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.promotionModuleEnabled
    ),
    promotionActive: normalizeBooleanConfig(
      source.promotionActive,
      DEFAULT_BUSINESS_CONFIG.promotionActive
    ),
    promotionTitle:
      String(source.promotionTitle || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.promotionTitle,
    promotionText:
      String(source.promotionText || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.promotionText,
    promotionHighlight:
      String(source.promotionHighlight || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.promotionHighlight,
    promotionButtonText:
      String(source.promotionButtonText || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.promotionButtonText,
    promotionButtonHref:
      String(source.promotionButtonHref || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.promotionButtonHref,
    promotionProductId: Math.round(normalizePositiveNumberConfig(source.promotionProductId)),
    promotionProductName: String(source.promotionProductName || "").trim(),
    promotionPriceUSD: normalizePositiveNumberConfig(source.promotionPriceUSD),
    promotionImage: String(source.promotionImage || "").trim(),
    featuredProductsModuleEnabled: normalizeBooleanConfig(
      source.featuredProductsModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.featuredProductsModuleEnabled
    ),
    featuredProductsActive: normalizeBooleanConfig(
      source.featuredProductsActive,
      DEFAULT_BUSINESS_CONFIG.featuredProductsActive
    ),
    featuredProductsTitle:
      String(source.featuredProductsTitle || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.featuredProductsTitle,
    featuredProductsText:
      String(source.featuredProductsText || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.featuredProductsText,
    featuredProductIds: normalizeNumberListConfig(
      source.featuredProductIds,
      DEFAULT_BUSINESS_CONFIG.featuredProductIds
    ),
    customersModuleEnabled: normalizeBooleanConfig(
      source.customersModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.customersModuleEnabled
    ),
    inventoryModuleEnabled: normalizeBooleanConfig(
      source.inventoryModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.inventoryModuleEnabled
    ),
    defaultViewMode: normalizeViewMode(source.defaultViewMode),
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
    updatedAt: source.updatedAt ? String(source.updatedAt) : undefined,
  }
}

function applyPlanLocksToBusinessConfig(config: BusinessConfig): BusinessConfig {
  const ownerDashboardAccess = getModulePlanAccess(config, "ownerDashboard")
  const cashierAccess = getModulePlanAccess(config, "cashier")
  const kitchenAccess = getModulePlanAccess(config, "kitchen")
  const deliveryAccess = getModulePlanAccess(config, "delivery")
  const historyAccess = getModulePlanAccess(config, "history")
  const expensesAccess = getModulePlanAccess(config, "expenses")
  const promotionsAccess = getModulePlanAccess(config, "promotions")
  const featuredProductsAccess = getModulePlanAccess(config, "featuredProducts")
  const customersAccess = getModulePlanAccess(config, "customers")
  const inventoryAccess = getModulePlanAccess(config, "inventory")
  const soundsAccess = getModulePlanAccess(config, "sounds")

  return {
    ...config,
    ownerDashboardModuleEnabled: ownerDashboardAccess.includedInPlan
      ? config.ownerDashboardModuleEnabled
      : false,
    cashierModuleEnabled: cashierAccess.includedInPlan
      ? config.cashierModuleEnabled
      : false,
    kitchenModuleEnabled: kitchenAccess.includedInPlan
      ? config.kitchenModuleEnabled
      : false,
    deliveryEnabled: deliveryAccess.includedInPlan ? config.deliveryEnabled : false,
    deliveryModuleEnabled: deliveryAccess.includedInPlan
      ? config.deliveryModuleEnabled
      : false,
    historyModuleEnabled: historyAccess.includedInPlan
      ? config.historyModuleEnabled
      : false,
    expensesModuleEnabled: expensesAccess.includedInPlan
      ? config.expensesModuleEnabled
      : false,
    promotionModuleEnabled: promotionsAccess.includedInPlan
      ? config.promotionModuleEnabled
      : false,
    promotionActive: promotionsAccess.includedInPlan && config.promotionModuleEnabled
      ? config.promotionActive
      : false,
    featuredProductsModuleEnabled: featuredProductsAccess.includedInPlan
      ? config.featuredProductsModuleEnabled
      : false,
    featuredProductsActive: featuredProductsAccess.includedInPlan && config.featuredProductsModuleEnabled
      ? config.featuredProductsActive
      : false,
    customersModuleEnabled: customersAccess.includedInPlan
      ? config.customersModuleEnabled
      : false,
    inventoryModuleEnabled: inventoryAccess.includedInPlan
      ? config.inventoryModuleEnabled
      : false,
    soundEnabled: soundsAccess.includedInPlan ? config.soundEnabled : false,
  }
}

function getWebAppUrl() {
  const url = process.env.GOOGLE_SHEETS_WEB_APP_URL

  if (!url) {
    throw new Error("Falta GOOGLE_SHEETS_WEB_APP_URL")
  }

  return url
}

function getSecret() {
  const secret = process.env.ORDERS_API_SECRET

  if (!secret) {
    throw new Error("Falta ORDERS_API_SECRET")
  }

  return secret
}

async function readJsonResponse(response: Response) {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text || "Respuesta invÃƒÂ¡lida de Google Apps Script")
  }
}

export async function getOrdersFromAppsScript() {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "list")
  url.searchParams.set("secret", getSecret())

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudieron cargar los pedidos")
  }

  return data.orders as LocalOrder[]
}

export async function getDeliveryZonesFromAppsScript() {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "deliveryZones")
  url.searchParams.set("secret", getSecret())

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudieron cargar las zonas de delivery")
  }

  const deliveryZones = Array.isArray(data.deliveryZones)
    ? data.deliveryZones
    : []

  return deliveryZones
    .map((zone: Partial<DeliveryZone>) => ({
      name: String(zone?.name || "").trim(),
      costUSD: Number(zone?.costUSD || 0),
      isActive: zone?.isActive !== false,
    }))
    .filter(
      (zone: DeliveryZone) =>
        zone.name && Number.isFinite(zone.costUSD) && zone.costUSD >= 0
    )
}

export async function saveDeliveryZonesInAppsScript(deliveryZones: DeliveryZone[]) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "saveDeliveryZones",
      secret: getSecret(),
      deliveryZones,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudieron guardar las zonas de delivery")
  }

  const savedDeliveryZones = Array.isArray(data.deliveryZones)
    ? data.deliveryZones
    : []

  return savedDeliveryZones
    .map((zone: Partial<DeliveryZone>) => ({
      name: String(zone?.name || "").trim(),
      costUSD: Number(zone?.costUSD || 0),
      isActive: zone?.isActive !== false,
    }))
    .filter(
      (zone: DeliveryZone) =>
        zone.name && Number.isFinite(zone.costUSD) && zone.costUSD >= 0
    )
}

export async function createOrderInAppsScript(input: CreateOrderInput) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "create",
      secret: getSecret(),
      ...input,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo registrar el pedido")
  }

  return data.order as LocalOrder
}

export async function saveDayCloseInAppsScript(input: SaveDayCloseInput) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "saveDayClose",
      secret: getSecret(),
      dayClose: input,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo guardar el cierre del día")
  }

  return data.dayClose as SavedDayClose
}


export async function getDayClosesFromAppsScript() {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "listDayCloses")
  url.searchParams.set("secret", getSecret())

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudieron cargar los cierres guardados")
  }

  const dayCloses = Array.isArray(data.dayCloses) ? data.dayCloses : []

  return dayCloses as SavedDayClose[]
}


export async function clearDayClosesInAppsScript() {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "clearDayCloses",
      secret: getSecret(),
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo borrar el historial de cierres")
  }

  return {
    deleted: Number(data.deleted || 0),
    message: String(data.message || "Historial de cierres borrado correctamente."),
  }
}


export async function getDayExpensesFromAppsScript(
  filters: DayExpenseFilters = {}
) {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "listDayExpenses")
  url.searchParams.set("secret", getSecret())

  if (filters.dateFrom) {
    url.searchParams.set("dateFrom", filters.dateFrom)
  }

  if (filters.dateTo) {
    url.searchParams.set("dateTo", filters.dateTo)
  }

  if (filters.dateValue) {
    url.searchParams.set("dateValue", filters.dateValue)
  }

  if (filters.includeClosed) {
    url.searchParams.set("includeClosed", "true")
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudieron cargar los gastos del día")
  }

  const dayExpenses = Array.isArray(data.dayExpenses) ? data.dayExpenses : []

  return dayExpenses as DayExpense[]
}

export async function saveDayExpenseInAppsScript(input: SaveDayExpenseInput) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "saveDayExpense",
      secret: getSecret(),
      dayExpense: input,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo guardar el gasto del día")
  }

  return data.dayExpense as DayExpense
}

export async function deleteDayExpenseInAppsScript(expenseId: string) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "deleteDayExpense",
      secret: getSecret(),
      expenseId,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo eliminar el gasto del día")
  }

  return data as {
    ok: boolean
  }
}

export async function updateOrderStatusInAppsScript(
  orderId: string,
  status: OrderStatus
) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "updateStatus",
      secret: getSecret(),
      orderId,
      status,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo actualizar el pedido")
  }

  return data.order as LocalOrder
}

export async function updateOrderDeliveryReportInAppsScript(orderId: string) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "updateDeliveryReport",
      secret: getSecret(),
      orderId,
      deliveryReportStatus: "Entrega reportada",
      deliveryReportedAt: new Date().toISOString(),
      deliveryReportedBy: "Delivery",
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo reportar la entrega a caja")
  }

  return data.order as LocalOrder
}
export async function updateOrderPaymentInAppsScript(
  orderId: string,
  payment: UpdateOrderPaymentInput
) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "updatePayment",
      secret: getSecret(),
      orderId,
      payment,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo registrar el cobro")
  }

  return data.order as LocalOrder
}

export async function deleteOrderInAppsScript(orderId: string) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "delete",
      secret: getSecret(),
      orderId,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo eliminar el pedido")
  }

  return data
}

export async function clearOrdersInAppsScript() {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "clearOrders",
      secret: getSecret(),
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudieron reiniciar los pedidos")
  }

  return data as {
    ok: boolean
    deleted?: number
    message?: string
  }
}



function normalizeMenuProductPaymentMode(value: unknown): ProductPaymentMode {
  return value === "divisa" ? "divisa" : "mixto"
}

function normalizeMenuProduct(value: unknown): MenuProduct {
  const source = (value || {}) as Partial<MenuProduct>
  const id = Number(source.id || 0)
  const price = Number(source.price || 0)
  const sortOrder = Number(source.sortOrder || 0)

  return {
    id: Number.isFinite(id) && id > 0 ? Math.round(id) : 0,
    name: String(source.name || "").trim(),
    category: String(source.category || "Otros").trim() || "Otros",
    description: String(source.description || "").trim(),
    price: Number.isFinite(price) && price > 0 ? Math.round((price + Number.EPSILON) * 100) / 100 : 0,
    image: String(source.image || "").trim(),
    paymentMode: normalizeMenuProductPaymentMode(source.paymentMode),
    isActive: source.isActive !== false,
    isFeatured: source.isFeatured === true,
    sortOrder: Number.isFinite(sortOrder) && sortOrder > 0 ? Math.round(sortOrder) : 9999,
    createdAt: String(source.createdAt || "").trim(),
    updatedAt: String(source.updatedAt || "").trim(),
  }
}

function normalizeMenuProducts(value: unknown): MenuProduct[] {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizeMenuProduct)
    .filter((product: MenuProduct) => product.id > 0 && product.name)
    .sort((a: MenuProduct, b: MenuProduct) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.name.localeCompare(b.name)
    })
}

function normalizeInventoryItem(value: unknown): InventoryItem {
  const source = (value || {}) as Partial<InventoryItem>
  const quantity = Number(source.quantity || 0)
  const minimumStock = Number(source.minimumStock || 0)
  const costUSD = Number(source.costUSD || 0)
  const costVES = Number(source.costVES || 0)
  const equivalentCostUSD = Number(source.equivalentCostUSD || source.costUSD || 0)

  return {
    id: String(source.id || "").trim(),
    name: String(source.name || "").trim(),
    category: String(source.category || "General").trim() || "General",
    quantity: Number.isFinite(quantity) ? quantity : 0,
    unit: String(source.unit || "unidades").trim() || "unidades",
    minimumStock: Number.isFinite(minimumStock) ? minimumStock : 0,
    costUSD: Number.isFinite(costUSD) ? costUSD : 0,
    costVES: Number.isFinite(costVES) ? costVES : 0,
    equivalentCostUSD: Number.isFinite(equivalentCostUSD) ? equivalentCostUSD : 0,
    note: String(source.note || "").trim(),
    isActive: source.isActive !== false,
    updatedAt: String(source.updatedAt || "").trim(),
  }
}

function normalizeInventoryMovement(value: unknown): InventoryMovement {
  const source = (value || {}) as Partial<InventoryMovement>
  const previousQuantity = Number(source.previousQuantity || 0)
  const quantityMoved = Number(source.quantityMoved || 0)
  const finalQuantity = Number(source.finalQuantity || 0)

  return {
    id: String(source.id || "").trim(),
    dateLabel: String(source.dateLabel || "").trim(),
    itemId: String(source.itemId || "").trim(),
    itemName: String(source.itemName || "").trim(),
    movementType: String(source.movementType || "Ajuste").trim() || "Ajuste",
    previousQuantity: Number.isFinite(previousQuantity) ? previousQuantity : 0,
    quantityMoved: Number.isFinite(quantityMoved) ? quantityMoved : 0,
    finalQuantity: Number.isFinite(finalQuantity) ? finalQuantity : 0,
    unit: String(source.unit || "unidades").trim() || "unidades",
    reason: String(source.reason || "Movimiento manual").trim(),
    relatedExpense: source.relatedExpense === true,
    expenseId: String(source.expenseId || "").trim(),
    note: String(source.note || "").trim(),
    createdAt: String(source.createdAt || "").trim(),
  }
}

function normalizeInventoryRecipeIngredient(value: unknown): InventoryRecipeIngredient {
  const source = (value || {}) as Partial<InventoryRecipeIngredient>
  const quantity = Number(source.quantity || 0)

  return {
    itemId: String(source.itemId || "").trim(),
    itemName: String(source.itemName || "").trim(),
    quantity: Number.isFinite(quantity) ? quantity : 0,
    unit: String(source.unit || "unidades").trim() || "unidades",
  }
}

function normalizeInventoryRecipe(value: unknown): InventoryRecipe {
  const source = (value || {}) as Partial<InventoryRecipe>
  const productId = Number(source.productId || 0)
  const ingredients: unknown[] = Array.isArray(source.ingredients)
    ? source.ingredients
    : []

  return {
    id: String(source.id || "").trim(),
    productId: Number.isFinite(productId) ? productId : 0,
    productName: String(source.productName || "").trim(),
    productCategory: String(source.productCategory || "").trim(),
    ingredients: ingredients
      .map(normalizeInventoryRecipeIngredient)
      .filter((ingredient: InventoryRecipeIngredient) => ingredient.itemId && ingredient.itemName && ingredient.quantity > 0),
    note: String(source.note || "").trim(),
    isActive: source.isActive !== false,
    updatedAt: String(source.updatedAt || "").trim(),
  }
}


function normalizeUploadedMenuProductImage(value: unknown): UploadedMenuProductImage {
  const source = (value || {}) as Partial<UploadedMenuProductImage>

  return {
    imageUrl: String(source.imageUrl || source.thumbnailUrl || "").trim(),
    thumbnailUrl: String(source.thumbnailUrl || source.imageUrl || "").trim(),
    viewUrl: String(source.viewUrl || "").trim(),
    fileId: String(source.fileId || "").trim(),
    fileName: String(source.fileName || "").trim(),
    uploadedAt: String(source.uploadedAt || "").trim(),
  }
}

export async function getMenuProductsFromAppsScript(options: { includeInactive?: boolean } = {}) {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "listMenuProducts")
  url.searchParams.set("secret", getSecret())

  if (options.includeInactive) {
    url.searchParams.set("includeInactive", "true")
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudieron cargar los productos del menú")
  }

  return normalizeMenuProducts(data.menuProducts || data.products || [])
}

export async function saveMenuProductInAppsScript(input: SaveMenuProductInput) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "saveMenuProduct",
      secret: getSecret(),
      menuProduct: input,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo guardar el producto del menú")
  }

  return {
    menuProduct: normalizeMenuProduct(data.menuProduct || data.product),
  }
}

export async function uploadMenuProductImageInAppsScript(input: UploadMenuProductImageInput) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "uploadMenuProductImage",
      secret: getSecret(),
      image: input,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo subir la imagen del producto")
  }

  const image = normalizeUploadedMenuProductImage(data.image || data.menuProductImage)

  if (!image.imageUrl) {
    throw new Error("La imagen se subió, pero no se recibió un enlace válido")
  }

  return image
}

export async function deleteMenuProductInAppsScript(productId: number) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "deleteMenuProduct",
      secret: getSecret(),
      productId,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo desactivar el producto del menú")
  }

  return {
    ok: true,
    message: String(data.message || "Producto desactivado correctamente."),
  }
}

export async function getInventoryFromAppsScript() {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "listInventory")
  url.searchParams.set("secret", getSecret())

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo cargar el inventario")
  }

  const inventory: unknown[] = Array.isArray(data.inventory) ? data.inventory : []

  return inventory
    .map(normalizeInventoryItem)
    .filter((item: InventoryItem) => item.id && item.name)
}

export async function getInventoryMovementsFromAppsScript() {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "listInventoryMovements")
  url.searchParams.set("secret", getSecret())

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo cargar el historial de inventario")
  }

  const movements: unknown[] = Array.isArray(data.inventoryMovements)
    ? data.inventoryMovements
    : []

  return movements
    .map(normalizeInventoryMovement)
    .filter((movement: InventoryMovement) => movement.id && movement.itemId)
}

export async function getInventoryRecipesFromAppsScript() {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "listInventoryRecipes")
  url.searchParams.set("secret", getSecret())

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudieron cargar las recetas de inventario")
  }

  const recipes: unknown[] = Array.isArray(data.inventoryRecipes)
    ? data.inventoryRecipes
    : []

  return recipes
    .map(normalizeInventoryRecipe)
    .filter((recipe: InventoryRecipe) => recipe.id && recipe.productName)
}

export async function saveInventoryRecipeInAppsScript(input: SaveInventoryRecipeInput) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "saveInventoryRecipe",
      secret: getSecret(),
      inventoryRecipe: input,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo guardar la receta de inventario")
  }

  return {
    inventoryRecipe: normalizeInventoryRecipe(data.inventoryRecipe),
  }
}

export async function deleteInventoryRecipeInAppsScript(recipeId: string) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "deleteInventoryRecipe",
      secret: getSecret(),
      recipeId,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo eliminar la receta de inventario")
  }

  return {
    ok: true,
    message: String(data.message || "Receta eliminada correctamente."),
  }
}

export async function saveInventoryItemInAppsScript(input: SaveInventoryItemInput) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "saveInventoryItem",
      secret: getSecret(),
      inventoryItem: input,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo guardar el producto de inventario")
  }

  return {
    inventoryItem: normalizeInventoryItem(data.inventoryItem),
    inventoryMovement: data.inventoryMovement
      ? normalizeInventoryMovement(data.inventoryMovement)
      : null,
  }
}

export async function deleteInventoryItemInAppsScript(itemId: string) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "deleteInventoryItem",
      secret: getSecret(),
      itemId,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo eliminar el producto de inventario")
  }

  return {
    ok: true,
    message: String(data.message || "Producto eliminado del inventario."),
    inventoryMovement: data.inventoryMovement
      ? normalizeInventoryMovement(data.inventoryMovement)
      : null,
  }
}

export async function getBusinessConfigFromAppsScript() {
  const url = new URL(getWebAppUrl())

  url.searchParams.set("action", "businessConfig")
  url.searchParams.set("secret", getSecret())

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo cargar la configuración del negocio")
  }

  return applyPlanLocksToBusinessConfig(
    normalizeBusinessConfig(data.businessConfig || data.config || {})
  )
}

export async function saveBusinessConfigInAppsScript(input: SaveBusinessConfigInput) {
  const response = await fetch(getWebAppUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    cache: "no-store",
    body: JSON.stringify({
      action: "saveBusinessConfig",
      secret: getSecret(),
      businessConfig: input,
    }),
  })

  const data = await readJsonResponse(response)

  if (!response.ok || data.error) {
    throw new Error(data.error || "No se pudo guardar la configuración del negocio")
  }

  return applyPlanLocksToBusinessConfig(
    normalizeBusinessConfig(data.businessConfig || data.config || {})
  )
}

