"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Eye,
  EyeOff,
  Grid2X2,
  ImageIcon,
  Loader2,
  LockKeyhole,
  LogIn,
  LogOut,
  Phone,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Truck,
  UploadCloud,
  XCircle,
} from "lucide-react"
import {
  getLocalPlanDefinition,
  getModulePlanAccess,
  getVisibleOwnerSettingModules,
  type LocalModuleKey,
  type LocalModulePlanAccess,
  type LocalPlanKey,
  type LocalPlanMode,
} from "@/lib/localPlans"
import { products as fallbackProducts, type Product } from "@/data/products"

const ADMIN_STORAGE_KEY = "la_bambucha_premium_owner_session"

type BusinessViewMode = "simple" | "negocio" | "avanzado"
type ExchangeRateMode = "automatic" | "manual"

type BusinessConfig = {
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
  menuProductsModuleEnabled: boolean
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

type PublicProductsResponse = {
  ok?: boolean
  products?: Product[]
  warning?: string
  error?: string
  fallback?: boolean
}

const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  businessName: "La Bambucha",
  businessShortDescription: "Menú y pedidos",
  publicTagline: "La mejor manera de comer carne",
  publicInfoTitle: "Visita La Bambucha",
  publicInfoText: "Estamos listos para recibirte con hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y bebidas. Abre nuestra ubicación en Google Maps o escribe por WhatsApp para coordinar tu pedido.",
  scheduleTitle: "Horario",
  scheduleLine1: "Lunes a jueves: 6:00 p.m. a 12:00 a.m.",
  scheduleLine2: "Viernes a domingos: 6:00 p.m. a 1:00 a.m.",
  reviewsTitle: "Reseñas",
  reviewsText: "Después de probar tu pedido, puedes apoyar el negocio dejando tu reseña o compartiendo la página.",
  quickOrderTitle: "Pedido rápido",
  quickOrderText: "Agrega productos al carrito y registra el pedido en el local o envíalo directamente por WhatsApp.",
  locationButtonText: "Abrir ubicación",
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
  promotionModuleEnabled: true,
  promotionActive: false,
  promotionTitle: "Promoción especial",
  promotionText: "Aprovecha una oferta preparada para disfrutar en La Bambucha.",
  promotionHighlight: "Disponible por tiempo limitado.",
  promotionButtonText: "Ver menú",
  promotionButtonHref: "#menu",
  promotionProductId: 0,
  promotionProductName: "",
  promotionPriceUSD: 0,
  promotionImage: "",
  menuProductsModuleEnabled: true,
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

const VIEW_MODE_OPTIONS: Array<{
  value: BusinessViewMode
  label: string
  description: string
}> = [
  {
    value: "simple",
    label: "Simple",
    description: "Pantallas más limpias para negocios que quieren ver solo lo básico.",
  },
  {
    value: "negocio",
    label: "Negocio",
    description: "Balance recomendado entre control, alertas y reportes.",
  },
  {
    value: "avanzado",
    label: "Avanzado",
    description: "Más datos visibles para auditoría, análisis y revisión completa.",
  },
]

const MODULE_ICON_BY_KEY: Partial<Record<LocalModuleKey, ReactNode>> = {
  ownerDashboard: <BarChart3 size={18} />,
  cashier: <ShieldCheck size={18} />,
  kitchen: <Settings2 size={18} />,
  delivery: <Truck size={18} />,
  history: <SlidersHorizontal size={18} />,
  expenses: <DollarSign size={18} />,
  sounds: <Settings2 size={18} />,
  reports: <BarChart3 size={18} />,
  roles: <ShieldCheck size={18} />,
  advancedPublicConfig: <Store size={18} />,
  promotions: <Grid2X2 size={18} />,
  menuProducts: <Store size={18} />,
  featuredProducts: <Store size={18} />,
  customers: <Phone size={18} />,
  inventory: <Store size={18} />,
  advancedReports: <BarChart3 size={18} />,
  futureModules: <SlidersHorizontal size={18} />,
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value

  const normalized = String(value || "").trim().toLowerCase()

  if (["true", "1", "si", "sí", "activo", "activa"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "inactivo", "inactiva"].includes(normalized)) {
    return false
  }

  return fallback
}

function normalizeViewMode(value: unknown): BusinessViewMode {
  const normalized = String(value || "").trim().toLowerCase()

  if (normalized === "simple") return "simple"
  if (normalized === "avanzado") return "avanzado"

  return "negocio"
}

function normalizeExchangeRateMode(value: unknown): ExchangeRateMode {
  const normalized = String(value || "").trim().toLowerCase()

  return normalized === "manual" ? "manual" : "automatic"
}

function isKnownPlan(value: unknown): value is LocalPlanKey {
  return (
    value === "menuDigital" ||
    value === "basic" ||
    value === "operational" ||
    value === "pro" ||
    value === "complete"
  )
}

function normalizeModuleList(value: unknown): LocalModuleKey[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean) as LocalModuleKey[]
  }

  if (typeof value === "string") {
    const clean = value.trim()

    if (!clean) return []

    try {
      const parsed = JSON.parse(clean)

      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean) as LocalModuleKey[]
      }
    } catch {
      return clean.split(/[;,|]/g).map((item) => item.trim()).filter(Boolean) as LocalModuleKey[]
    }
  }

  return []
}

function normalizeNumberList(value: unknown, fallback: number[]) {
  const rawList = Array.isArray(value)
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

function mergeNumberLists(firstList: number[], secondList: number[]) {
  return normalizeNumberList([...firstList, ...secondList], [])
}

function areNumberListsEqual(firstList: number[], secondList: number[]) {
  if (firstList.length !== secondList.length) return false

  return firstList.every((item, index) => item === secondList[index])
}

function getProductFeaturedIds(productsList: Product[]) {
  return normalizeNumberList(
    productsList
      .filter((product) => product.isActive !== false && product.isFeatured === true)
      .map((product) => product.id),
    []
  )
}

function normalizePublicProducts(value: unknown): Product[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const source = (item || {}) as Partial<Product>
      const id = Number(source.id || 0)
      const name = String(source.name || "").trim()
      const price = Number(source.price || 0)

      if (!Number.isFinite(id) || id <= 0 || !name) return null

      return {
        id: Math.round(id),
        name,
        category: source.category || "Perritos",
        description: String(source.description || "").trim(),
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        image:
          String(source.image || "/logo-bambucha.png").trim() ||
          "/logo-bambucha.png",
        paymentMode: source.paymentMode || "mixto",
        isActive: source.isActive !== false,
        isFeatured: source.isFeatured === true,
        sortOrder: Number(source.sortOrder || 999),
      } as Product
    })
    .filter((product): product is Product => Boolean(product))
    .sort((a, b) => {
      const orderA = Number(a.sortOrder || 999)
      const orderB = Number(b.sortOrder || 999)

      if (orderA !== orderB) return orderA - orderB

      return a.name.localeCompare(b.name, "es")
    })
}

function normalizePlanMode(value: unknown): LocalPlanMode {
  return value === "custom" ? "custom" : "plan"
}

function normalizePositiveNumber(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return 0
  }

  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function normalizeBusinessConfig(value: unknown): BusinessConfig {
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
    deliveryEnabled: normalizeBoolean(
      source.deliveryEnabled,
      DEFAULT_BUSINESS_CONFIG.deliveryEnabled
    ),
    membershipPlan: isKnownPlan(source.membershipPlan)
      ? source.membershipPlan
      : DEFAULT_BUSINESS_CONFIG.membershipPlan,
    membershipPlanMode: normalizePlanMode(source.membershipPlanMode),
    customIncludedModules: normalizeModuleList(source.customIncludedModules),
    customBlockedModules: normalizeModuleList(source.customBlockedModules),
    ownerDashboardModuleEnabled: normalizeBoolean(
      source.ownerDashboardModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.ownerDashboardModuleEnabled
    ),
    cashierModuleEnabled: normalizeBoolean(
      source.cashierModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.cashierModuleEnabled
    ),
    kitchenModuleEnabled: normalizeBoolean(
      source.kitchenModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.kitchenModuleEnabled
    ),
    deliveryModuleEnabled: normalizeBoolean(
      source.deliveryModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.deliveryModuleEnabled
    ),
    historyModuleEnabled: normalizeBoolean(
      source.historyModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.historyModuleEnabled
    ),
    expensesModuleEnabled: normalizeBoolean(
      source.expensesModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.expensesModuleEnabled
    ),
    promotionModuleEnabled: normalizeBoolean(
      source.promotionModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.promotionModuleEnabled
    ),
    promotionActive: normalizeBoolean(
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
    promotionProductId: Math.round(normalizePositiveNumber(source.promotionProductId)),
    promotionProductName: String(source.promotionProductName || "").trim(),
    promotionPriceUSD: normalizePositiveNumber(source.promotionPriceUSD),
    promotionImage: String(source.promotionImage || "").trim(),
    menuProductsModuleEnabled: normalizeBoolean(
      source.menuProductsModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.menuProductsModuleEnabled
    ),
    featuredProductsModuleEnabled: normalizeBoolean(
      source.featuredProductsModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.featuredProductsModuleEnabled
    ),
    featuredProductsActive: normalizeBoolean(
      source.featuredProductsActive,
      DEFAULT_BUSINESS_CONFIG.featuredProductsActive
    ),
    featuredProductsTitle:
      String(source.featuredProductsTitle || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.featuredProductsTitle,
    featuredProductsText:
      String(source.featuredProductsText || "").trim() ||
      DEFAULT_BUSINESS_CONFIG.featuredProductsText,
    featuredProductIds: normalizeNumberList(
      source.featuredProductIds,
      DEFAULT_BUSINESS_CONFIG.featuredProductIds
    ),
    customersModuleEnabled: normalizeBoolean(
      source.customersModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.customersModuleEnabled
    ),
    inventoryModuleEnabled: normalizeBoolean(
      source.inventoryModuleEnabled,
      DEFAULT_BUSINESS_CONFIG.inventoryModuleEnabled
    ),
    defaultViewMode: normalizeViewMode(source.defaultViewMode),
    soundEnabled: normalizeBoolean(
      source.soundEnabled,
      DEFAULT_BUSINESS_CONFIG.soundEnabled
    ),
    filtersOpenByDefault: normalizeBoolean(
      source.filtersOpenByDefault,
      DEFAULT_BUSINESS_CONFIG.filtersOpenByDefault
    ),
    allowCloseWithPendingOrders: normalizeBoolean(
      source.allowCloseWithPendingOrders,
      DEFAULT_BUSINESS_CONFIG.allowCloseWithPendingOrders
    ),
    allowCloseWithPendingPayments: normalizeBoolean(
      source.allowCloseWithPendingPayments,
      DEFAULT_BUSINESS_CONFIG.allowCloseWithPendingPayments
    ),
    updatedAt: source.updatedAt ? String(source.updatedAt) : undefined,
  }
}

function formatDateTime(value?: string) {
  if (!value) return "Sin cambios guardados"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function getModuleCheckedValue(config: BusinessConfig, moduleItem: LocalModulePlanAccess) {
  if (!moduleItem.includedInPlan) return false

  if (moduleItem.moduleKey === "ownerDashboard") return config.ownerDashboardModuleEnabled
  if (moduleItem.moduleKey === "cashier") return config.cashierModuleEnabled
  if (moduleItem.moduleKey === "kitchen") return config.kitchenModuleEnabled
  if (moduleItem.moduleKey === "delivery") return config.deliveryEnabled && config.deliveryModuleEnabled
  if (moduleItem.moduleKey === "history") return config.historyModuleEnabled
  if (moduleItem.moduleKey === "expenses") return config.expensesModuleEnabled
  if (moduleItem.moduleKey === "promotions") return config.promotionModuleEnabled
  if (moduleItem.moduleKey === "menuProducts") return config.menuProductsModuleEnabled
  if (moduleItem.moduleKey === "featuredProducts") return config.featuredProductsModuleEnabled
  if (moduleItem.moduleKey === "customers") return config.customersModuleEnabled
  if (moduleItem.moduleKey === "inventory") return config.inventoryModuleEnabled
  if (moduleItem.moduleKey === "sounds") return config.soundEnabled

  return moduleItem.effectiveEnabled
}

function countIncludedOwnerModules(config: BusinessConfig) {
  return getVisibleOwnerSettingModules()
    .map((moduleDefinition) => getModulePlanAccess(config, moduleDefinition.key))
    .filter((moduleItem) => moduleItem.includedInPlan).length
}

function getOwnerModuleLabel(moduleItem: LocalModulePlanAccess) {
  if (moduleItem.moduleKey === "menuProducts") {
    return "Productos del menú"
  }

  return moduleItem.label
}

function getOwnerModuleDescription(moduleItem: LocalModulePlanAccess) {
  if (moduleItem.moduleKey === "featuredProducts") {
    return "Permite crear, editar, activar, pausar y destacar productos visibles en la página pública."
  }

  return moduleItem.description
}


export default function BusinessConfigPage() {
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig>(
    DEFAULT_BUSINESS_CONFIG
  )
  const [availableProducts, setAvailableProducts] =
    useState<Product[]>(fallbackProducts)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [productsWarning, setProductsWarning] = useState<string | null>(null)
  const [isUploadingPromotionImage, setIsUploadingPromotionImage] = useState(false)
  const promotionImageInputRef = useRef<HTMLInputElement | null>(null)
  const hasMergedMenuFeaturedStateRef = useRef(false)

  const activePlan = getLocalPlanDefinition(businessConfig.membershipPlan)
  const includedModulesCount = useMemo(
    () => countIncludedOwnerModules(businessConfig),
    [businessConfig]
  )
  const visibleOwnerModules = useMemo(
    () =>
      getVisibleOwnerSettingModules().map((moduleDefinition) =>
        getModulePlanAccess(businessConfig, moduleDefinition.key)
      ),
    [businessConfig]
  )
  const advancedPublicAccess = getModulePlanAccess(
    businessConfig,
    "advancedPublicConfig"
  )
  const canEditAdvancedPublic = advancedPublicAccess.includedInPlan
  const promotionAccess = getModulePlanAccess(businessConfig, "promotions")
  const canEditPromotion = promotionAccess.includedInPlan
  const selectedPromotionProduct = useMemo(
    () =>
      availableProducts.find(
        (product) => product.id === businessConfig.promotionProductId
      ) || null,
    [availableProducts, businessConfig.promotionProductId]
  )
  const promotionPreviewImage =
    businessConfig.promotionImage ||
    selectedPromotionProduct?.image ||
    "/logo-bambucha.png"
  const menuProductsAccess = getModulePlanAccess(
    businessConfig,
    "menuProducts"
  )
  const canEditMenuProducts = menuProductsAccess.effectiveEnabled
  const featuredProductsAccess = getModulePlanAccess(
    businessConfig,
    "featuredProducts"
  )
  const canEditFeaturedProducts = featuredProductsAccess.includedInPlan

  function updateConfig<K extends keyof BusinessConfig>(
    key: K,
    value: BusinessConfig[K]
  ) {
    setBusinessConfig((current) => ({
      ...current,
      [key]: value,
    }))
    setSuccessMessage(null)
  }

  async function loadAvailableProducts(quiet = false) {
    if (!quiet) {
      setIsLoadingProducts(true)
      setProductsWarning(null)
    }

    try {
      const response = await fetch("/api/public/products", {
        method: "GET",
        cache: "no-store",
      })

      const data = (await response.json()) as PublicProductsResponse
      const loadedProducts = normalizePublicProducts(data.products)

      if (!response.ok || data.error) {
        throw new Error(
          data.error || "No se pudieron cargar los productos del menú editable"
        )
      }

      if (loadedProducts.length > 0) {
        hasMergedMenuFeaturedStateRef.current = false
        setAvailableProducts(loadedProducts)
        setProductsWarning(data.warning || null)
        return
      }

      setAvailableProducts(fallbackProducts)
      setProductsWarning(
        data.warning ||
          "No se encontraron productos activos del menú editable. Se muestra el menú base como respaldo."
      )
    } catch (error) {
      setAvailableProducts(fallbackProducts)
      setProductsWarning(
        error instanceof Error
          ? `No se pudo cargar el menú editable. Se muestra el menú base. Detalle: ${error.message}`
          : "No se pudo cargar el menú editable. Se muestra el menú base."
      )
    } finally {
      if (!quiet) {
        setIsLoadingProducts(false)
      }
    }
  }

  function applyPromotionProduct(productId: number) {
    if (!canEditPromotion) return

    const product = availableProducts.find((item) => item.id === productId)

    if (!product) {
      updateConfig("promotionProductId", 0)
      updateConfig("promotionProductName", "")
      updateConfig("promotionImage", "")
      return
    }

    setBusinessConfig((current) => ({
      ...current,
      promotionProductId: product.id,
      promotionProductName: product.name,
      promotionImage: product.image || current.promotionImage,
      promotionTitle:
        current.promotionTitle &&
        current.promotionTitle !== DEFAULT_BUSINESS_CONFIG.promotionTitle
          ? current.promotionTitle
          : product.name,
      promotionButtonText:
        current.promotionButtonText &&
        current.promotionButtonText !== DEFAULT_BUSINESS_CONFIG.promotionButtonText
          ? current.promotionButtonText
          : "Pedir promoción",
      promotionButtonHref: current.promotionButtonHref || "#menu",
    }))
    setSuccessMessage(null)
  }


  function readImageAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => resolve(String(reader.result || ""))
      reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."))
      reader.readAsDataURL(file)
    })
  }

  function buildPromotionImageFileName(file: File) {
    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg"
    const baseName =
      businessConfig.promotionTitle ||
      businessConfig.promotionProductName ||
      selectedPromotionProduct?.name ||
      "promocion"
    const safeName = baseName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()

    return `${safeName || "promocion"}-${Date.now()}.${extension}`
  }

  async function uploadPromotionImage(file: File) {
    if (!canEditPromotion) return

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Selecciona una imagen válida para la promoción.")
      return
    }

    if (file.size > 3_600_000) {
      setErrorMessage(
        "La imagen es muy pesada. Recórtala o reduce su tamaño antes de subirla."
      )
      return
    }

    const cleanPassword = String(adminPassword || "").trim()

    if (!cleanPassword) {
      setErrorMessage("No hay clave privada activa. Vuelve a iniciar sesión.")
      return
    }

    setIsUploadingPromotionImage(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const dataUrl = await readImageAsDataUrl(file)
      const response = await fetch("/api/menu-products/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": cleanPassword,
        },
        body: JSON.stringify({
          dataUrl,
          fileName: buildPromotionImageFileName(file),
          mimeType: file.type || "image/jpeg",
          productName:
            businessConfig.promotionTitle ||
            businessConfig.promotionProductName ||
            selectedPromotionProduct?.name ||
            "promocion",
        }),
      })

      const data = await response.json()
      const imageUrl = String(
        data.image?.imageUrl || data.image?.thumbnailUrl || ""
      ).trim()

      if (!response.ok || data.error || !imageUrl) {
        throw new Error(
          data.error || "No se recibió un enlace válido para la imagen subida."
        )
      }

      setBusinessConfig((current) => ({
        ...current,
        promotionImage: imageUrl,
      }))
      setSuccessMessage(
        "Imagen de promoción subida correctamente. Guarda la configuración para aplicarla en la página pública."
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen de la promoción."
      )
    } finally {
      setIsUploadingPromotionImage(false)
    }
  }

  function handlePromotionImageInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      void uploadPromotionImage(file)
    }

    event.target.value = ""
  }

  function useSelectedProductImageForPromotion() {
    if (!selectedPromotionProduct?.image) return

    updateConfig("promotionImage", selectedPromotionProduct.image)
  }

  function updateModuleValue(moduleItem: LocalModulePlanAccess, value: boolean) {
    if (!moduleItem.includedInPlan) return

    if (moduleItem.moduleKey === "ownerDashboard") {
      updateConfig("ownerDashboardModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "cashier") {
      updateConfig("cashierModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "kitchen") {
      updateConfig("kitchenModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "delivery") {
      updateConfig("deliveryEnabled", value)
      updateConfig("deliveryModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "history") {
      updateConfig("historyModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "expenses") {
      updateConfig("expensesModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "promotions") {
      updateConfig("promotionModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "menuProducts") {
      updateConfig("menuProductsModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "featuredProducts") {
      updateConfig("featuredProductsModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "customers") {
      updateConfig("customersModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "inventory") {
      updateConfig("inventoryModuleEnabled", value)
      return
    }

    if (moduleItem.moduleKey === "sounds") {
      updateConfig("soundEnabled", value)
    }
  }

  async function syncMenuProductFeaturedState(
    productId: number,
    nextFeaturedState: boolean
  ) {
    const product = availableProducts.find((item) => item.id === productId)

    if (!product || !adminPassword) return

    const response = await fetch("/api/menu-products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        image: product.image,
        paymentMode: product.paymentMode,
        isActive: product.isActive !== false,
        isFeatured: nextFeaturedState,
        sortOrder: Number(product.sortOrder || product.id || 999),
      }),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      throw new Error(
        data.error ||
          "No se pudo sincronizar el destacado con Productos del menú."
      )
    }
  }

  async function toggleFeaturedProduct(productId: number) {
    if (!canEditFeaturedProducts) return

    const product = availableProducts.find((item) => item.id === productId)
    const currentIds = Array.isArray(businessConfig.featuredProductIds)
      ? businessConfig.featuredProductIds
      : []
    const isCurrentlySelected =
      currentIds.includes(productId) || product?.isFeatured === true
    const nextFeaturedState = !isCurrentlySelected
    const nextIds = nextFeaturedState
      ? mergeNumberLists(currentIds, [productId])
      : currentIds.filter((id) => id !== productId)

    setBusinessConfig((current) => ({
      ...current,
      featuredProductIds: nextIds,
    }))
    setAvailableProducts((currentProducts) =>
      currentProducts.map((item) =>
        item.id === productId
          ? {
              ...item,
              isFeatured: nextFeaturedState,
            }
          : item
      )
    )
    setSuccessMessage(null)
    setProductsWarning(null)

    try {
      await syncMenuProductFeaturedState(productId, nextFeaturedState)
    } catch (error) {
      setProductsWarning(
        error instanceof Error
          ? error.message
          : "La selección quedó guardada en Configuración, pero no se pudo actualizar el estado en Productos del menú."
      )
    }
  }

  async function loadBusinessConfig(password: string, quiet = false) {
    const cleanPassword = password.trim()

    if (!cleanPassword) return

    if (!quiet) {
      setIsLoading(true)
      setErrorMessage(null)
      setSuccessMessage(null)
    }

    try {
      const response = await fetch("/api/business-config", {
        method: "GET",
        headers: {
          "x-admin-password": cleanPassword,
        },
        cache: "no-store",
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "No se pudo cargar la configuración")
      }

      hasMergedMenuFeaturedStateRef.current = false
      setBusinessConfig(normalizeBusinessConfig(data.businessConfig || data.config || {}))
      setIsAuthenticated(true)
      setAdminPassword(cleanPassword)
      setPasswordInput(cleanPassword)
      window.sessionStorage.setItem(ADMIN_STORAGE_KEY, cleanPassword)

      if (!quiet) {
        setSuccessMessage("Configuración cargada correctamente.")
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la configuración del negocio"
      )
      setIsAuthenticated(false)
      window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
    } finally {
      if (!quiet) {
        setIsLoading(false)
      }
    }
  }

  async function saveBusinessConfig() {
    const cleanPassword = String(adminPassword || "").trim()

    if (!cleanPassword) {
      setErrorMessage("No hay clave privada activa. Vuelve a iniciar sesión.")
      setIsAuthenticated(false)
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/business-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": cleanPassword,
        },
        body: JSON.stringify({
          businessConfig,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || "No se pudo guardar la configuración")
      }

      setBusinessConfig(normalizeBusinessConfig(data.businessConfig || data.config || businessConfig))
      setSuccessMessage("Configuración guardada correctamente.")
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la configuración del negocio"
      )
    } finally {
      setIsSaving(false)
    }
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    loadBusinessConfig(passwordInput)
  }

  function handleLogout() {
    window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
    setAdminPassword("")
    setPasswordInput("")
    setIsAuthenticated(false)
    setBusinessConfig(DEFAULT_BUSINESS_CONFIG)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  useEffect(() => {
    const savedPassword = window.sessionStorage.getItem(ADMIN_STORAGE_KEY)

    if (savedPassword) {
      loadBusinessConfig(savedPassword, true)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return

    loadAvailableProducts(true)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || hasMergedMenuFeaturedStateRef.current) return

    const productFeaturedIds = getProductFeaturedIds(availableProducts)

    hasMergedMenuFeaturedStateRef.current = true

    if (!productFeaturedIds.length) return

    setBusinessConfig((current) => {
      const currentIds = Array.isArray(current.featuredProductIds)
        ? current.featuredProductIds
        : []
      const mergedIds = mergeNumberLists(currentIds, productFeaturedIds)

      if (areNumberListsEqual(currentIds, mergedIds)) {
        return current
      }

      return {
        ...current,
        featuredProductIds: mergedIds,
      }
    })
  }, [availableProducts, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff7e8] px-4 py-8 text-[#220000]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-[#a00000] bg-white shadow-[0_12px_0_rgba(160,0,0,0.14)]"
        >
          <div className="h-6 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#fff7e8]" />

          <div className="px-6 py-6">
            <Link
              href="/local-santo"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#a00000]"
            >
              <ArrowLeft size={16} />
              Volver
            </Link>

            <div className="mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-[1.8rem] border-4 border-[#a00000] bg-yellow-300 text-[#4a0000] shadow-[0_7px_0_rgba(160,0,0,0.14)]">
              <Settings2 size={42} />
            </div>

            <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.28em] text-[#a00000]">
              Configuración privada
            </p>

            <h1 className="mt-2 text-center text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
              Negocio
            </h1>

            <p className="mt-3 text-center text-sm font-bold leading-6 text-[#3a0000]/75">
              Ingresa la clave del dueño para ajustar datos y módulos permitidos por el plan activo.
            </p>
          </div>

          <div className="space-y-4 px-6 pb-6">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Clave del dueño
              </label>

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(event) => setPasswordInput(event.target.value)}
                  placeholder="Ingresa la clave privada"
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
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] shadow-[0_6px_0_rgba(160,0,0,0.18)] transition hover:scale-[1.02] disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={21} className="animate-spin" /> : <LogIn size={21} />}
              {isLoading ? "Cargando" : "Entrar a configuración"}
            </button>
          </div>
        </form>
      </main>
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
                  <Link
                    href="/local-santo"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                  >
                    <ArrowLeft size={16} />
                    Volver al panel
                  </Link>

                  <button
                    type="button"
                    onClick={() => loadBusinessConfig(adminPassword)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Actualizar
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.32em] text-[#a00000]">
                  {businessConfig.businessName}
                </p>

                <h1 className="mt-1 text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)] sm:text-5xl">
                  Configuración del negocio
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#3a0000]/70">
                  Ajusta datos del local y activa o desactiva los módulos incluidos en tu plan. Las funciones no incluidas se muestran con candado para que sepas que están disponibles en planes superiores.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:w-[620px]">
                <MetricCard label="Plan activo" value={activePlan.shortLabel} />
                <MetricCard label="Módulos incluidos" value={`${includedModulesCount}/${visibleOwnerModules.length}`} />
                <MetricCard label="Modo" value={businessConfig.membershipPlanMode === "custom" ? "Personalizado" : "Plan fijo"} />
                <MetricCard label="Actualizado" value={formatDateTime(businessConfig.updatedAt)} />
              </div>
            </div>
          </div>
        </header>

        {(errorMessage || successMessage) && (
          <section
            className={`mt-4 rounded-[1.4rem] border-2 p-4 ${
              errorMessage
                ? "border-red-500/45 bg-red-50 text-red-800"
                : "border-green-500/45 bg-green-50 text-green-800"
            }`}
          >
            <p className="text-sm font-black leading-6">
              {errorMessage || successMessage}
            </p>
          </section>
        )}

        <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <SectionCard
            icon={<Store size={22} />}
            title="Datos básicos"
            description="Información principal del negocio. Estos datos se pueden ajustar en todos los planes."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextInput
                label="Nombre del negocio"
                value={businessConfig.businessName}
                onChange={(value) => updateConfig("businessName", value)}
                placeholder="La Bambucha"
              />
              <TextInput
                label="Descripción corta"
                value={businessConfig.businessShortDescription}
                onChange={(value) => updateConfig("businessShortDescription", value)}
                placeholder="Menú y pedidos"
              />
              <TextInput
                label="WhatsApp principal"
                value={businessConfig.mainWhatsapp}
                onChange={(value) => updateConfig("mainWhatsapp", value)}
                placeholder="Ej: 58412xxxxxxx"
              />
              <TextInput
                label="WhatsApp delivery"
                value={businessConfig.deliveryWhatsapp}
                onChange={(value) => updateConfig("deliveryWhatsapp", value)}
                placeholder="Ej: 58412xxxxxxx"
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<ShieldCheck size={22} />}
            title="Plan activo"
            description="El plan lo define soporte. El dueño solo controla lo que ya está incluido."
          >
            <div className="rounded-[1.3rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
              <p className="text-sm font-black uppercase text-[#a00000]">
                {activePlan.label}
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                {activePlan.description}
              </p>
              <p className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000]/70">
                {businessConfig.membershipPlanMode === "custom"
                  ? "Configuración personalizada por soporte"
                  : "Plan fijo configurado por soporte"}
              </p>
            </div>
          </SectionCard>
        </section>

        <section className="mt-4">
          <SectionCard
            icon={<Grid2X2 size={22} />}
            title="Módulos del negocio"
            description="Puedes activar o desactivar los módulos incluidos en tu plan. Los no incluidos quedan visibles con candado y no se pueden activar desde aquí."
          >
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {visibleOwnerModules.map((moduleItem) => (
                <ModuleToggleCard
                  key={moduleItem.moduleKey}
                  moduleItem={moduleItem}
                  checked={getModuleCheckedValue(businessConfig, moduleItem)}
                  onChange={(value) => updateModuleValue(moduleItem, value)}
                  icon={MODULE_ICON_BY_KEY[moduleItem.moduleKey] || <Settings2 size={18} />}
                />
              ))}
            </div>
          </SectionCard>
        </section>

        <section className="mt-4">
          <SectionCard
            icon={<Store size={22} />}
            title="Productos del menú"
            description="Acceso directo para crear productos con foto, precio, categoría, descripción, disponibilidad y estado destacado."
            locked={!canEditMenuProducts}
            lockedText={`Disponible desde ${menuProductsAccess.minimumPlanLabel}. Si el módulo no está incluido o está apagado, el dueño no podrá editar el menú desde esta sección.`}
          >
            <div className={`grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center ${!canEditFeaturedProducts ? "opacity-65" : ""}`}>
              <div className="rounded-[1.4rem] border-2 border-[#a00000]/20 bg-[#fff7e8] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Editor operativo
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/75">
                  Desde aquí el dueño puede agregar productos nuevos, subir o pegar una imagen, cambiar precios, categorías, descripción, orden, visibilidad y marcado como destacado. Si el módulo se apaga, la página pública mantiene el menú guardado y no se rompe la venta.
                </p>
              </div>

              <Link
                href="/local-santo/menu"
                className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-4 text-xs font-black uppercase tracking-[0.12em] transition ${
                  canEditMenuProducts
                    ? "border-[#a00000] bg-yellow-300 text-[#4a0000] hover:bg-yellow-200"
                    : "pointer-events-none border-[#a00000]/25 bg-white text-[#a00000]/45"
                }`}
              >
                <Store size={18} />
                Abrir productos
              </Link>
            </div>
          </SectionCard>
        </section>

        <section className="mt-4">
          <SectionCard
            icon={<Store size={22} />}
            title="Información pública avanzada"
            description="Disponible en planes profesionales. Permite editar textos visibles de la página pública sin tocar código."
            locked={!canEditAdvancedPublic}
            lockedText={`Disponible desde ${advancedPublicAccess.minimumPlanLabel}. Solicita activación para editar títulos, horarios, ubicación y textos públicos desde aquí.`}
          >
            <div className={`grid gap-4 sm:grid-cols-2 ${!canEditAdvancedPublic ? "opacity-65" : ""}`}>
              <TextInput
                label="Frase principal pública"
                value={businessConfig.publicTagline}
                onChange={(value) => updateConfig("publicTagline", value)}
                placeholder="La mejor manera de comer carne"
                disabled={!canEditAdvancedPublic}
              />
              <TextInput
                label="Título de información"
                value={businessConfig.publicInfoTitle}
                onChange={(value) => updateConfig("publicInfoTitle", value)}
                placeholder="Visita La Bambucha"
                disabled={!canEditAdvancedPublic}
              />
              <TextAreaInput
                label="Texto informativo"
                value={businessConfig.publicInfoText}
                onChange={(value) => updateConfig("publicInfoText", value)}
                placeholder="Texto visible en la página pública"
                disabled={!canEditAdvancedPublic}
              />
              <div className="grid gap-4">
                <TextInput
                  label="Título horario"
                  value={businessConfig.scheduleTitle}
                  onChange={(value) => updateConfig("scheduleTitle", value)}
                  placeholder="Horario"
                  disabled={!canEditAdvancedPublic}
                />
                <TextInput
                  label="Horario línea 1"
                  value={businessConfig.scheduleLine1}
                  onChange={(value) => updateConfig("scheduleLine1", value)}
                  placeholder="Lunes a jueves..."
                  disabled={!canEditAdvancedPublic}
                />
                <TextInput
                  label="Horario línea 2"
                  value={businessConfig.scheduleLine2}
                  onChange={(value) => updateConfig("scheduleLine2", value)}
                  placeholder="Viernes a domingos..."
                  disabled={!canEditAdvancedPublic}
                />
              </div>
              <TextInput
                label="Título reseñas"
                value={businessConfig.reviewsTitle}
                onChange={(value) => updateConfig("reviewsTitle", value)}
                placeholder="Reseñas"
                disabled={!canEditAdvancedPublic}
              />
              <TextInput
                label="Texto reseñas"
                value={businessConfig.reviewsText}
                onChange={(value) => updateConfig("reviewsText", value)}
                placeholder="Invitación a dejar reseña"
                disabled={!canEditAdvancedPublic}
              />
              <TextInput
                label="Título pedido rápido"
                value={businessConfig.quickOrderTitle}
                onChange={(value) => updateConfig("quickOrderTitle", value)}
                placeholder="Pedido rápido"
                disabled={!canEditAdvancedPublic}
              />
              <TextInput
                label="Texto pedido rápido"
                value={businessConfig.quickOrderText}
                onChange={(value) => updateConfig("quickOrderText", value)}
                placeholder="Agrega productos al carrito..."
                disabled={!canEditAdvancedPublic}
              />
              <TextInput
                label="Texto botón ubicación"
                value={businessConfig.locationButtonText}
                onChange={(value) => updateConfig("locationButtonText", value)}
                placeholder="Abrir ubicación"
                disabled={!canEditAdvancedPublic}
              />
              <TextInput
                label="Link de Google Maps"
                value={businessConfig.googleMapsUrl}
                onChange={(value) => updateConfig("googleMapsUrl", value)}
                placeholder="https://maps.google.com/..."
                disabled={!canEditAdvancedPublic}
              />
              <TextInput
                label="Instagram"
                value={businessConfig.instagramUrl}
                onChange={(value) => updateConfig("instagramUrl", value)}
                placeholder="https://www.instagram.com/..."
                disabled={!canEditAdvancedPublic}
              />
            </div>
          </SectionCard>
        </section>

        <section className="mt-4">
          <SectionCard
            icon={<Grid2X2 size={22} />}
            title="Promoción pública"
            description="Configura una promoción visible en la página pública. Puede ser una oferta general o estar relacionada con un producto o combo del menú editable."
            locked={!canEditPromotion}
            lockedText={`Disponible desde ${promotionAccess.minimumPlanLabel}. La sección queda visible para que el negocio sepa que puede desbloquear promociones al subir de plan.`}
          >
            <div className={`grid gap-4 lg:grid-cols-[0.82fr_1.18fr] ${!canEditPromotion ? "opacity-65" : ""}`}>
              <div className="grid gap-3">
                <ToggleRow
                  label="Módulo de promociones"
                  description="Permite que la página pública pueda mostrar promociones configuradas desde este panel."
                  checked={businessConfig.promotionModuleEnabled}
                  onChange={(value) => updateConfig("promotionModuleEnabled", value)}
                  icon={<Grid2X2 size={18} />}
                  disabled={!canEditPromotion}
                  lockedText={`No incluido en tu plan. Disponible desde ${promotionAccess.minimumPlanLabel}.`}
                />

                <ToggleRow
                  label="Promoción visible"
                  description="Muestra u oculta la promoción en la página pública sin borrar el contenido guardado."
                  checked={businessConfig.promotionActive}
                  onChange={(value) => updateConfig("promotionActive", value)}
                  icon={<Eye size={18} />}
                  disabled={!canEditPromotion}
                  lockedText={`No incluido en tu plan. Disponible desde ${promotionAccess.minimumPlanLabel}.`}
                />

                <div className="rounded-[1.2rem] border-2 border-[#a00000]/20 bg-[#fff7e8] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a00000]">
                    Producto o combo relacionado
                  </p>

                  <select
                    value={businessConfig.promotionProductId || 0}
                    disabled={!canEditPromotion}
                    onChange={(event) =>
                      applyPromotionProduct(Number(event.target.value || 0))
                    }
                    className="mt-3 w-full rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-4 text-sm font-black text-[#4a0000] outline-none focus:border-[#a00000] disabled:cursor-not-allowed disabled:bg-[#f3ead7] disabled:text-[#4a0000]/50"
                  >
                    <option value={0}>Promoción general sin producto</option>
                    {availableProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {product.category} · ${product.price.toFixed(2)}
                      </option>
                    ))}
                  </select>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadAvailableProducts()}
                      disabled={isLoadingProducts || !canEditPromotion}
                      className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100 disabled:opacity-50"
                    >
                      {isLoadingProducts ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Actualizar productos
                    </button>

                    {businessConfig.promotionProductId > 0 && (
                      <button
                        type="button"
                        disabled={!canEditPromotion}
                        onClick={() => applyPromotionProduct(0)}
                        className="inline-flex items-center justify-center rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100 disabled:opacity-50"
                      >
                        Quitar producto
                      </button>
                    )}
                  </div>

                  <p className="mt-3 text-xs font-bold leading-5 text-[#3a0000]/65">
                    Puedes usar productos o combos existentes. Si no eliges ninguno, la promoción queda como anuncio general.
                  </p>
                </div>

                <div className="rounded-[1.2rem] border-2 border-[#a00000]/20 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a00000]">
                    Vista rápida
                  </p>
                  <div className="mt-3 grid grid-cols-[76px_1fr] items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="h-[76px] w-[76px] rounded-2xl border-2 border-[#a00000]/20 bg-[#fff7e8] bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${promotionPreviewImage})`,
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase leading-tight text-[#220000]">
                        {businessConfig.promotionTitle || "Promoción especial"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#3a0000]/65">
                        {businessConfig.promotionHighlight ||
                          businessConfig.promotionText ||
                          "Disponible por tiempo limitado."}
                      </p>
                      {businessConfig.promotionPriceUSD > 0 && (
                        <p className="mt-2 text-lg font-black text-[#a00000]">
                          ${businessConfig.promotionPriceUSD.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Título de promoción"
                  value={businessConfig.promotionTitle}
                  onChange={(value) => updateConfig("promotionTitle", value)}
                  placeholder="Combo especial de la noche"
                  disabled={!canEditPromotion}
                />
                <TextInput
                  label="Detalle o beneficio"
                  value={businessConfig.promotionHighlight}
                  onChange={(value) => updateConfig("promotionHighlight", value)}
                  placeholder="Disponible por tiempo limitado"
                  disabled={!canEditPromotion}
                />
                <TextInput
                  label="Precio promocional USD"
                  type="number"
                  value={businessConfig.promotionPriceUSD || ""}
                  onChange={(value) =>
                    updateConfig(
                      "promotionPriceUSD",
                      Number.isFinite(Number(value)) && Number(value) > 0
                        ? Number(value)
                        : 0
                    )
                  }
                  placeholder="Ej: 12.00"
                  helper="Opcional. Si lo dejas vacío, la promoción se muestra sin precio."
                  disabled={!canEditPromotion}
                />
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                    Imagen de promoción
                  </label>

                  <div className="mt-2 rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] p-3">
                    <input
                      ref={promotionImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePromotionImageInputChange}
                    />

                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        type="text"
                        value={businessConfig.promotionImage}
                        disabled={!canEditPromotion}
                        onChange={(event) =>
                          updateConfig("promotionImage", event.target.value)
                        }
                        placeholder="Sube una foto o pega /producto.png o https://..."
                        className="w-full rounded-2xl border-2 border-[#a00000]/20 bg-white px-4 py-4 text-sm font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#a00000] disabled:cursor-not-allowed disabled:bg-[#f3ead7] disabled:text-[#4a0000]/50"
                      />

                      <button
                        type="button"
                        disabled={!canEditPromotion || isUploadingPromotionImage}
                        onClick={() => promotionImageInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isUploadingPromotionImage ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <UploadCloud size={16} />
                        )}
                        {isUploadingPromotionImage ? "Subiendo" : "Subir foto"}
                      </button>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr] sm:items-center">
                      <div
                        aria-hidden="true"
                        className="flex h-[120px] w-full items-center justify-center rounded-2xl border-2 border-[#a00000]/15 bg-white bg-cover bg-center text-[#a00000] sm:w-[120px]"
                        style={{
                          backgroundImage: promotionPreviewImage
                            ? `url(${promotionPreviewImage})`
                            : undefined,
                        }}
                      >
                        {!promotionPreviewImage && <ImageIcon size={24} />}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-bold leading-5 text-[#3a0000]/65">
                          Puedes subir una imagen desde el teléfono, pegar una URL o usar la imagen del producto relacionado como respaldo. Luego presiona Guardar configuración.
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {selectedPromotionProduct?.image && (
                            <button
                              type="button"
                              disabled={!canEditPromotion}
                              onClick={useSelectedProductImageForPromotion}
                              className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#a00000] transition hover:bg-yellow-100 disabled:opacity-50"
                            >
                              <ImageIcon size={14} />
                              Usar imagen del producto
                            </button>
                          )}

                          {businessConfig.promotionImage && (
                            <button
                              type="button"
                              disabled={!canEditPromotion}
                              onClick={() => updateConfig("promotionImage", "")}
                              className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#a00000] transition hover:bg-yellow-100 disabled:opacity-50"
                            >
                              <XCircle size={14} />
                              Quitar imagen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <TextAreaInput
                  label="Texto corto"
                  value={businessConfig.promotionText}
                  onChange={(value) => updateConfig("promotionText", value)}
                  placeholder="Describe la promoción de forma clara para el cliente."
                  disabled={!canEditPromotion}
                />
                <div className="grid gap-4">
                  <TextInput
                    label="Texto del botón"
                    value={businessConfig.promotionButtonText}
                    onChange={(value) => updateConfig("promotionButtonText", value)}
                    placeholder="Pedir promoción"
                    disabled={!canEditPromotion}
                  />
                  <TextInput
                    label="Acción o enlace del botón"
                    value={businessConfig.promotionButtonHref}
                    onChange={(value) => updateConfig("promotionButtonHref", value)}
                    placeholder="#menu, /, https://..."
                    helper="Puedes usar un ancla de la página, una ruta interna o un enlace completo."
                    disabled={!canEditPromotion}
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="mt-4">
          <SectionCard
            icon={<Store size={22} />}
            title="Destacados públicos"
            description="Selecciona productos o combos para mostrarlos como recomendados en la página pública. El editor completo del menú está en Productos del menú."
            locked={!canEditFeaturedProducts}
            lockedText={`Disponible desde ${featuredProductsAccess.minimumPlanLabel}. La sección queda visible para que el negocio sepa que puede desbloquear productos destacados al subir de plan.`}
          >
            <div className={`grid gap-4 lg:grid-cols-[0.85fr_1.15fr] ${!canEditMenuProducts ? "opacity-65" : ""}`}>
              <div className="grid gap-3">
                <ToggleRow
                  label="Módulo de destacados"
                  description="Permite mostrar una selección editable de productos o combos recomendados en la página pública."
                  checked={businessConfig.featuredProductsModuleEnabled}
                  onChange={(value) => updateConfig("featuredProductsModuleEnabled", value)}
                  icon={<Store size={18} />}
                  disabled={!canEditFeaturedProducts}
                  lockedText={`No incluido en tu plan. Disponible desde ${featuredProductsAccess.minimumPlanLabel}.`}
                />

                <ToggleRow
                  label="Destacados visibles"
                  description="Muestra u oculta la sección pública sin borrar los productos seleccionados."
                  checked={businessConfig.featuredProductsActive}
                  onChange={(value) => updateConfig("featuredProductsActive", value)}
                  icon={<Eye size={18} />}
                  disabled={!canEditFeaturedProducts}
                  lockedText={`No incluido en tu plan. Disponible desde ${featuredProductsAccess.minimumPlanLabel}.`}
                />

                <TextInput
                  label="Título de sección"
                  value={businessConfig.featuredProductsTitle}
                  onChange={(value) => updateConfig("featuredProductsTitle", value)}
                  placeholder="Favoritos de la casa"
                  disabled={!canEditFeaturedProducts}
                />

                <TextAreaInput
                  label="Texto corto"
                  value={businessConfig.featuredProductsText}
                  onChange={(value) => updateConfig("featuredProductsText", value)}
                  placeholder="Explica por qué estos productos son recomendados."
                  disabled={!canEditFeaturedProducts}
                />

                <div className="rounded-[1.2rem] border-2 border-[#a00000]/20 bg-[#fff7e8] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a00000]">
                    Seleccionados
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                    {businessConfig.featuredProductIds.length} productos marcados. La sección pública aparece solo si el plan incluye el módulo, está activo y hay productos seleccionados.
                  </p>
                </div>
              </div>

              <div className="rounded-[1.4rem] border-2 border-[#a00000]/20 bg-[#fff7e8] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                      Productos disponibles
                    </p>
                    <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/60">
                      Se cargan desde el menú editable activo. Si no hay conexión, se usa el menú base como respaldo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadAvailableProducts()}
                    disabled={isLoadingProducts}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100 disabled:opacity-50"
                  >
                    {isLoadingProducts ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Actualizar productos
                  </button>
                </div>

                {productsWarning && (
                  <div className="mt-3 rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3">
                    <p className="text-xs font-black leading-5 text-[#8a5a00]">
                      {productsWarning}
                    </p>
                  </div>
                )}

                <div className="mt-4 grid max-h-[540px] gap-2 overflow-y-auto pr-1">
                  {availableProducts.length === 0 && (
                    <div className="rounded-[1.2rem] border-2 border-[#a00000]/20 bg-white p-4 text-center">
                      <p className="text-sm font-black uppercase text-[#a00000]">
                        Sin productos disponibles
                      </p>
                      <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/60">
                        Carga el menú editable o crea productos desde Productos del menú.
                      </p>
                    </div>
                  )}

                  {availableProducts.map((product) => {
                    const isSelected =
                      businessConfig.featuredProductIds.includes(product.id) ||
                      product.isFeatured === true

                    return (
                      <button
                        key={product.id}
                        type="button"
                        disabled={!canEditFeaturedProducts}
                        onClick={() => void toggleFeaturedProduct(product.id)}
                        className={`rounded-[1.2rem] border-2 p-3 text-left transition disabled:cursor-not-allowed ${
                          isSelected
                            ? "border-green-500 bg-green-50"
                            : "border-[#a00000]/20 bg-white hover:border-[#a00000]"
                        }`}
                      >
                        <div className="grid grid-cols-[72px_1fr] items-center gap-3">
                          <div
                            aria-hidden="true"
                            className="h-[72px] w-[72px] shrink-0 rounded-2xl border-2 border-[#a00000]/15 bg-[#fff7e8] bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${product.image || "/logo-bambucha.png"})`,
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-black uppercase leading-tight text-[#220000]">
                                {product.name}
                              </p>
                              {isSelected && (
                                <span className="rounded-full bg-green-500 px-2 py-1 text-[0.6rem] font-black uppercase tracking-[0.1em] text-white">
                                  Marcado
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#a00000]">
                              {product.category} · ${product.price.toFixed(2)}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[#3a0000]/65">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </SectionCard>
        </section>

        <section className="mt-4 grid gap-4 xl:grid-cols-2">
          <SectionCard
            icon={<DollarSign size={22} />}
            title="Tasa y moneda"
            description="Se mantiene la lógica actual del sistema. No cambia la fuente ni la regla de conversión por modificar esta pantalla."
          >
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div className="grid gap-3 sm:grid-cols-2">
                <ModeButton
                  label="Automática"
                  description="Usar la tasa calculada por el sistema actual."
                  active={businessConfig.exchangeRateMode === "automatic"}
                  onClick={() => updateConfig("exchangeRateMode", "automatic")}
                />
                <ModeButton
                  label="Manual"
                  description="Usar una tasa fijada por el negocio cuando sea necesario."
                  active={businessConfig.exchangeRateMode === "manual"}
                  onClick={() => updateConfig("exchangeRateMode", "manual")}
                />
              </div>

              <TextInput
                label="Tasa manual de referencia"
                type="number"
                value={businessConfig.manualExchangeRate || ""}
                onChange={(value) =>
                  updateConfig(
                    "manualExchangeRate",
                    Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0
                  )
                }
                placeholder="Ej: 645.68"
                helper="Solo se usa si el modo de tasa está en Manual."
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<SlidersHorizontal size={22} />}
            title="Vista y operación"
            description="Preferencias internas para adaptar la pantalla al modo de trabajo del negocio."
          >
            <div className="grid gap-3 lg:grid-cols-3">
              {VIEW_MODE_OPTIONS.map((option) => (
                <ModeButton
                  key={option.value}
                  label={option.label}
                  description={option.description}
                  active={businessConfig.defaultViewMode === option.value}
                  onClick={() => updateConfig("defaultViewMode", option.value)}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ToggleRow
                label="Filtros abiertos por defecto"
                description="Mostrar filtros operativos apenas entra al panel."
                checked={businessConfig.filtersOpenByDefault}
                onChange={(value) => updateConfig("filtersOpenByDefault", value)}
                icon={<Eye size={18} />}
              />
              <ToggleRow
                label="Cerrar con pedidos activos"
                description="Permitir cierre aunque queden pedidos sin entregar."
                checked={businessConfig.allowCloseWithPendingOrders}
                onChange={(value) => updateConfig("allowCloseWithPendingOrders", value)}
                icon={<CheckCircle2 size={18} />}
              />
              <ToggleRow
                label="Cerrar con pagos pendientes"
                description="Permitir cierre aunque queden cobros pendientes o parciales."
                checked={businessConfig.allowCloseWithPendingPayments}
                onChange={(value) => updateConfig("allowCloseWithPendingPayments", value)}
                icon={<DollarSign size={18} />}
              />
            </div>
          </SectionCard>
        </section>

        <section className="mt-6 rounded-[1.6rem] border-4 border-[#a00000] bg-white p-4 shadow-[0_10px_0_rgba(160,0,0,0.12)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Guardar cambios
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/65">
                Los módulos bloqueados por plan no se activarán aunque aparezcan en pantalla.
              </p>
            </div>

            <button
              type="button"
              onClick={saveBusinessConfig}
              disabled={isSaving}
              className="flex items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-8 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Guardar configuración
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.2rem] border-2 border-[#a00000]/20 bg-[#fff7e8] px-4 py-3">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#a00000]">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-black text-[#220000]">
        {value}
      </p>
    </div>
  )
}

function SectionCard({
  icon,
  title,
  description,
  children,
  locked,
  lockedText,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
  locked?: boolean
  lockedText?: string
}) {
  return (
    <section className="rounded-[1.6rem] border-2 border-[#a00000] bg-white p-4 shadow-[0_8px_0_rgba(160,0,0,0.10)]">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-[#a00000] bg-yellow-300 text-[#4a0000]">
            {icon}
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
              {title}
            </p>
            <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/65">
              {description}
            </p>
          </div>
        </div>

        {locked && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#220000] px-3 py-1 text-[0.65rem] font-black uppercase tracking-[0.1em] text-white">
            <LockKeyhole size={13} />
            Bloqueado
          </span>
        )}
      </div>

      {locked && lockedText && (
        <div className="mb-4 rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3">
          <p className="text-sm font-black leading-6 text-[#8a5a00]">
            {lockedText}
          </p>
        </div>
      )}

      {children}
    </section>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  helper,
  type = "text",
  disabled,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  helper?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-sm font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#a00000] disabled:cursor-not-allowed disabled:bg-[#f3ead7] disabled:text-[#4a0000]/50"
      />
      {helper && (
        <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/60">
          {helper}
        </p>
      )}
    </div>
  )
}

function TextAreaInput({
  label,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
        {label}
      </label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={7}
        className="mt-2 w-full resize-none rounded-2xl border-2 border-[#a00000]/25 bg-[#fff7e8] px-4 py-4 text-sm font-bold leading-6 text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#a00000] disabled:cursor-not-allowed disabled:bg-[#f3ead7] disabled:text-[#4a0000]/50"
      />
    </div>
  )
}

function ModeButton({
  label,
  description,
  active,
  onClick,
}: {
  label: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.2rem] border-2 p-4 text-left transition ${
        active
          ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
          : "border-[#a00000]/25 bg-[#fff7e8] text-[#220000] hover:border-[#a00000]"
      }`}
    >
      <p className="text-sm font-black uppercase">{label}</p>
      <p className="mt-2 text-xs font-bold leading-5">{description}</p>
    </button>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
  disabled,
  lockedText,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  icon: ReactNode
  disabled?: boolean
  lockedText?: string
}) {
  return (
    <div
      className={`rounded-[1.2rem] border-2 p-4 ${
        disabled
          ? "border-[#a00000]/15 bg-[#f3ead7]"
          : checked
            ? "border-green-500/45 bg-green-50"
            : "border-[#a00000]/25 bg-[#fff7e8]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 border-[#a00000] bg-yellow-300 text-[#4a0000]">
            {disabled ? <LockKeyhole size={18} /> : icon}
          </div>
          <div>
            <p className="text-sm font-black uppercase text-[#220000]">
              {label}
            </p>
            <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/65">
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={`h-8 w-14 shrink-0 rounded-full border-2 p-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${
            checked
              ? "border-green-600 bg-green-500"
              : "border-[#a00000]/30 bg-white"
          }`}
          aria-label={`Cambiar ${label}`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-[#4a0000] transition ${
              checked ? "translate-x-6 bg-white" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {disabled && lockedText && (
        <p className="mt-3 rounded-2xl border border-[#a00000]/15 bg-white px-3 py-2 text-xs font-black leading-5 text-[#a00000]">
          {lockedText}
        </p>
      )}
    </div>
  )
}

function ModuleToggleCard({
  moduleItem,
  checked,
  onChange,
  icon,
}: {
  moduleItem: LocalModulePlanAccess
  checked: boolean
  onChange: (value: boolean) => void
  icon: ReactNode
}) {
  const canToggle =
    moduleItem.includedInPlan &&
    Boolean(moduleItem.ownerConfigKey) &&
    !moduleItem.comingSoon

  return (
    <ToggleRow
      label={getOwnerModuleLabel(moduleItem)}
      description={getOwnerModuleDescription(moduleItem)}
      checked={checked}
      onChange={onChange}
      icon={icon}
      disabled={!canToggle}
      lockedText={
        !moduleItem.includedInPlan
          ? `No incluido en tu plan. Disponible desde ${moduleItem.minimumPlanLabel}. Solicita activación para usar esta función.`
          : moduleItem.comingSoon
            ? "Esta función ya está contemplada para el plan, pero se activará cuando el módulo esté terminado."
            : !moduleItem.ownerConfigKey
              ? "Esta función se gestiona automáticamente por el sistema o por soporte."
              : undefined
      }
    />
  )
}
