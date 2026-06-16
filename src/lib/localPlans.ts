export type LocalPlanKey =
  | "menuDigital"
  | "basic"
  | "operational"
  | "pro"
  | "complete"

export type LocalPlanMode = "plan" | "custom"

export type LocalModuleKey =
  | "publicMenu"
  | "publicCart"
  | "publicWhatsapp"
  | "businessBasicConfig"
  | "settings"
  | "mainPanel"
  | "kitchen"
  | "sounds"
  | "cashier"
  | "delivery"
  | "history"
  | "ownerDashboard"
  | "expenses"
  | "reports"
  | "roles"
  | "advancedPublicConfig"
  | "promotions"
  | "featuredProducts"
  | "menuProducts"
  | "customers"
  | "inventory"
  | "advancedReports"
  | "futureModules"
  | "support"

export type LocalPlanDefinition = {
  key: LocalPlanKey
  label: string
  shortLabel: string
  description: string
  commercialFocus: string
  order: number
  includedModules: LocalModuleKey[]
}

export type LocalModuleCategory =
  | "public"
  | "operation"
  | "money"
  | "management"
  | "growth"
  | "internal"

export type LocalModuleDefinition = {
  key: LocalModuleKey
  label: string
  description: string
  category: LocalModuleCategory
  minimumPlan: LocalPlanKey | "internal"
  ownerConfigKey?: string
  visibleForOwnerSettings?: boolean
  visibleForSupport?: boolean
  routePath?: string
  comingSoon?: boolean
}

export type LocalPlanConfigLike = {
  membershipPlan?: unknown
  membershipPlanMode?: unknown
  customIncludedModules?: unknown
  customBlockedModules?: unknown
  ownerDashboardModuleEnabled?: unknown
  cashierModuleEnabled?: unknown
  kitchenModuleEnabled?: unknown
  deliveryEnabled?: unknown
  deliveryModuleEnabled?: unknown
  historyModuleEnabled?: unknown
  expensesModuleEnabled?: unknown
  promotionModuleEnabled?: unknown
  featuredProductsModuleEnabled?: unknown
  menuProductsModuleEnabled?: unknown
  customersModuleEnabled?: unknown
  inventoryModuleEnabled?: unknown
  soundEnabled?: unknown
}

export type LocalModulePlanAccess = {
  moduleKey: LocalModuleKey
  label: string
  description: string
  category: LocalModuleCategory
  minimumPlan: LocalPlanKey | "internal"
  minimumPlanLabel: string
  plan: LocalPlanKey
  planLabel: string
  planMode: LocalPlanMode
  baseIncluded: boolean
  customIncluded: boolean
  customBlocked: boolean
  includedInPlan: boolean
  enabledByOwner: boolean
  effectiveEnabled: boolean
  lockedByPlan: boolean
  ownerConfigKey?: string
  routePath?: string
  comingSoon?: boolean
}

export const LOCAL_PLAN_KEYS: LocalPlanKey[] = [
  "menuDigital",
  "basic",
  "operational",
  "pro",
  "complete",
]

export const LOCAL_MODULE_KEYS: LocalModuleKey[] = [
  "publicMenu",
  "publicCart",
  "publicWhatsapp",
  "businessBasicConfig",
  "settings",
  "mainPanel",
  "kitchen",
  "sounds",
  "cashier",
  "delivery",
  "history",
  "ownerDashboard",
  "expenses",
  "reports",
  "roles",
  "advancedPublicConfig",
  "promotions",
  "featuredProducts",
  "menuProducts",
  "customers",
  "inventory",
  "advancedReports",
  "futureModules",
  "support",
]

const PLAN_LABELS: Record<LocalPlanKey, string> = {
  menuDigital: "Menú Digital",
  basic: "Básico",
  operational: "Operativo",
  pro: "Pro",
  complete: "Completo",
}

export const LOCAL_PLAN_DEFINITIONS: LocalPlanDefinition[] = [
  {
    key: "menuDigital",
    label: "Plan Menú Digital",
    shortLabel: "Menú Digital",
    description:
      "Carta online con carrito, tasa de referencia y envío del pedido por WhatsApp.",
    commercialFocus:
      "Para negocios que quieren empezar a vender online sin panel operativo avanzado.",
    order: 1,
    includedModules: [
      "publicMenu",
      "publicCart",
      "publicWhatsapp",
      "businessBasicConfig",
      "settings",
    ],
  },
  {
    key: "basic",
    label: "Plan Básico",
    shortLabel: "Básico",
    description:
      "Menú digital más panel interno para organizar pedidos y cocina.",
    commercialFocus:
      "Para negocios que quieren dejar el cuaderno y ordenar la preparación.",
    order: 2,
    includedModules: [
      "publicMenu",
      "publicCart",
      "publicWhatsapp",
      "businessBasicConfig",
      "settings",
      "mainPanel",
      "kitchen",
      "sounds",
    ],
  },
  {
    key: "operational",
    label: "Plan Operativo",
    shortLabel: "Operativo",
    description:
      "Pedidos, caja, delivery, cobros reales e historial de cierres.",
    commercialFocus:
      "Para negocios que necesitan controlar la operación diaria desde un solo panel.",
    order: 3,
    includedModules: [
      "publicMenu",
      "publicCart",
      "publicWhatsapp",
      "businessBasicConfig",
      "settings",
      "mainPanel",
      "kitchen",
      "sounds",
      "cashier",
      "delivery",
      "history",
    ],
  },
  {
    key: "pro",
    label: "Plan Pro",
    shortLabel: "Pro",
    description:
      "Operación completa con gastos, resumen del dueño, reportes, roles y configuración pública avanzada.",
    commercialFocus:
      "Para dueños que quieren administrar, medir y ajustar el negocio sin depender del código.",
    order: 4,
    includedModules: [
      "publicMenu",
      "publicCart",
      "publicWhatsapp",
      "businessBasicConfig",
      "settings",
      "mainPanel",
      "kitchen",
      "sounds",
      "cashier",
      "delivery",
      "history",
      "ownerDashboard",
      "expenses",
      "reports",
      "roles",
      "advancedPublicConfig",
      "promotions",
      "featuredProducts",
      "menuProducts",
      "customers",
      "inventory",
    ],
  },
  {
    key: "complete",
    label: "Plan Completo",
    shortLabel: "Completo",
    description:
      "Todo el sistema activo más funciones premium de crecimiento, clientes, promociones e inventario.",
    commercialFocus:
      "Para negocios que quieren operar, medir, personalizar y preparar crecimiento futuro.",
    order: 5,
    includedModules: [
      "publicMenu",
      "publicCart",
      "publicWhatsapp",
      "businessBasicConfig",
      "settings",
      "mainPanel",
      "kitchen",
      "sounds",
      "cashier",
      "delivery",
      "history",
      "ownerDashboard",
      "expenses",
      "reports",
      "roles",
      "advancedPublicConfig",
      "promotions",
      "featuredProducts",
      "menuProducts",
      "customers",
      "inventory",
      "advancedReports",
      "futureModules",
    ],
  },
]

export const LOCAL_MODULE_DEFINITIONS: LocalModuleDefinition[] = [
  {
    key: "publicMenu",
    label: "Menú digital",
    description: "Carta pública con categorías, productos y precios visibles para el cliente.",
    category: "public",
    minimumPlan: "menuDigital",
    visibleForOwnerSettings: false,
    visibleForSupport: true,
  },
  {
    key: "publicCart",
    label: "Carrito público",
    description: "Carrito con totales, tasa de referencia y resumen del pedido.",
    category: "public",
    minimumPlan: "menuDigital",
    visibleForOwnerSettings: false,
    visibleForSupport: true,
  },
  {
    key: "publicWhatsapp",
    label: "Pedido por WhatsApp",
    description: "Envío del pedido al WhatsApp del negocio desde la página pública.",
    category: "public",
    minimumPlan: "menuDigital",
    visibleForOwnerSettings: false,
    visibleForSupport: true,
  },
  {
    key: "businessBasicConfig",
    label: "Configuración básica",
    description: "Nombre del negocio, descripción, WhatsApp y datos principales.",
    category: "public",
    minimumPlan: "menuDigital",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "settings",
    label: "Panel de configuración",
    description: "Acceso del dueño para ajustar el negocio dentro de lo permitido por su plan.",
    category: "management",
    minimumPlan: "menuDigital",
    visibleForOwnerSettings: false,
    visibleForSupport: true,
    routePath: "/local-santo/configuracion",
  },
  {
    key: "mainPanel",
    label: "Panel de pedidos",
    description: "Pantalla interna para revisar pedidos activos y coordinar el trabajo del local.",
    category: "operation",
    minimumPlan: "basic",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
    routePath: "/local-santo",
  },
  {
    key: "kitchen",
    label: "Cocina",
    description: "Vista para preparar pedidos y marcarlos como listos.",
    category: "operation",
    minimumPlan: "basic",
    ownerConfigKey: "kitchenModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
    routePath: "/local-santo/cocina",
  },
  {
    key: "sounds",
    label: "Sonidos",
    description: "Avisos sonoros para nuevos pedidos y cambios importantes.",
    category: "operation",
    minimumPlan: "basic",
    ownerConfigKey: "soundEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "cashier",
    label: "Caja",
    description: "Confirmación de pedidos, cobros reales, métodos de pago y pagos mixtos.",
    category: "money",
    minimumPlan: "operational",
    ownerConfigKey: "cashierModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
    routePath: "/local-santo/caja",
  },
  {
    key: "delivery",
    label: "Delivery",
    description: "Flujo de delivery, zonas, WhatsApp de seguimiento y coordinación de entregas.",
    category: "operation",
    minimumPlan: "operational",
    ownerConfigKey: "deliveryModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
    routePath: "/local-santo/delivery",
  },
  {
    key: "history",
    label: "Historial de cierres",
    description: "Revisión de cierres guardados, totales cobrados y resultados del día.",
    category: "money",
    minimumPlan: "operational",
    ownerConfigKey: "historyModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "ownerDashboard",
    label: "Dashboard del dueño",
    description: "Resumen de ventas, pedidos, cobros, delivery y alertas del negocio.",
    category: "management",
    minimumPlan: "pro",
    ownerConfigKey: "ownerDashboardModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "expenses",
    label: "Gastos",
    description: "Registro de gastos diarios, métodos de pago y relación con inventario.",
    category: "money",
    minimumPlan: "pro",
    ownerConfigKey: "expensesModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "reports",
    label: "Reportes",
    description: "Lectura de resultados, productos, cobros, delivery y alertas del negocio.",
    category: "management",
    minimumPlan: "pro",
    visibleForOwnerSettings: false,
    visibleForSupport: true,
  },
  {
    key: "roles",
    label: "Roles por trabajador",
    description: "Accesos separados para dueño, encargado, caja, cocina y delivery.",
    category: "management",
    minimumPlan: "pro",
    visibleForOwnerSettings: false,
    visibleForSupport: true,
  },
  {
    key: "advancedPublicConfig",
    label: "Configuración pública avanzada",
    description: "Edición de títulos, textos, horarios, ubicación, reseñas y secciones públicas desde el panel.",
    category: "growth",
    minimumPlan: "pro",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "promotions",
    label: "Promociones visibles",
    description: "Promoción editable en la página pública para impulsar ventas sin tocar código.",
    category: "growth",
    minimumPlan: "pro",
    ownerConfigKey: "promotionModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "featuredProducts",
    label: "Productos destacados",
    description: "Selección editable de productos o combos destacados en la página pública.",
    category: "growth",
    minimumPlan: "pro",
    ownerConfigKey: "featuredProductsModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "menuProducts",
    label: "Productos del menú",
    description: "Permite crear y editar productos visibles en el menú público con precio, categoría, descripción e imagen.",
    category: "growth",
    minimumPlan: "pro",
    ownerConfigKey: "menuProductsModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
    routePath: "/local-santo/menu",
  },
  {
    key: "customers",
    label: "Clientes frecuentes",
    description: "Historial de clientes, pedidos frecuentes y preferencias para recompra.",
    category: "growth",
    minimumPlan: "pro",
    ownerConfigKey: "customersModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "inventory",
    label: "Inventario básico",
    description: "Control inicial de insumos, existencias, recetas, movimientos y alertas de reposición.",
    category: "management",
    minimumPlan: "pro",
    ownerConfigKey: "inventoryModuleEnabled",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
    routePath: "/local-santo/inventario",
  },
  {
    key: "advancedReports",
    label: "Reportes avanzados",
    description: "Lecturas más completas para crecimiento, comparación y análisis del negocio.",
    category: "growth",
    minimumPlan: "complete",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
  },
  {
    key: "futureModules",
    label: "Módulos futuros premium",
    description: "Preparación para nuevas funciones de la plantilla sin rehacer la estructura de planes.",
    category: "growth",
    minimumPlan: "complete",
    visibleForOwnerSettings: true,
    visibleForSupport: true,
    comingSoon: true,
  },
  {
    key: "support",
    label: "Soporte privado",
    description: "Centro privado para revisar entrega, variables y plan del cliente.",
    category: "internal",
    minimumPlan: "internal",
    visibleForOwnerSettings: false,
    visibleForSupport: true,
    routePath: "/local-santo/soporte",
  },
]

function uniqueModules(modules: LocalModuleKey[]) {
  return Array.from(new Set(modules.filter(isKnownLocalModuleKey)))
}

export function isKnownLocalPlanKey(value: unknown): value is LocalPlanKey {
  return LOCAL_PLAN_KEYS.includes(value as LocalPlanKey)
}

export function isKnownLocalModuleKey(value: unknown): value is LocalModuleKey {
  return LOCAL_MODULE_KEYS.includes(value as LocalModuleKey)
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value

  const normalized = String(value || "").trim().toLowerCase()

  if (["true", "1", "si", "sí", "activo", "activa", "on"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "inactivo", "inactiva", "off"].includes(normalized)) {
    return false
  }

  return fallback
}

export function normalizeLocalPlanKey(value: unknown): LocalPlanKey {
  return isKnownLocalPlanKey(value) ? value : "complete"
}

export function normalizeLocalPlanMode(value: unknown): LocalPlanMode {
  return value === "custom" ? "custom" : "plan"
}

export function normalizeLocalModuleList(value: unknown): LocalModuleKey[] {
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
      : []

  const normalized = rawList
    .map((item) => String(item || "").trim())
    .filter(isKnownLocalModuleKey)

  return uniqueModules(normalized)
}

export function getLocalPlanDefinition(planKey: unknown) {
  const normalizedPlan = normalizeLocalPlanKey(planKey)

  return (
    LOCAL_PLAN_DEFINITIONS.find((plan) => plan.key === normalizedPlan) ||
    LOCAL_PLAN_DEFINITIONS[LOCAL_PLAN_DEFINITIONS.length - 1]
  )
}

export function getLocalModuleDefinition(moduleKey: LocalModuleKey) {
  return (
    LOCAL_MODULE_DEFINITIONS.find((moduleDefinition) => moduleDefinition.key === moduleKey) ||
    LOCAL_MODULE_DEFINITIONS[0]
  )
}

export function getPlanLabel(planKey: unknown) {
  return getLocalPlanDefinition(planKey).label
}

export function getShortPlanLabel(planKey: unknown) {
  return getLocalPlanDefinition(planKey).shortLabel
}

export function getIncludedModulesForPlan(planKey: unknown) {
  const plan = getLocalPlanDefinition(planKey)

  return uniqueModules(plan.includedModules)
}

export function getMinimumPlanLabel(planKey: LocalPlanKey | "internal") {
  if (planKey === "internal") return "Uso interno"

  return PLAN_LABELS[planKey]
}

export function getEffectiveIncludedModules(config: LocalPlanConfigLike) {
  const plan = normalizeLocalPlanKey(config.membershipPlan)
  const mode = normalizeLocalPlanMode(config.membershipPlanMode)
  const baseIncluded = getIncludedModulesForPlan(plan)

  if (mode !== "custom") {
    return baseIncluded
  }

  const customIncluded = normalizeLocalModuleList(config.customIncludedModules)
  const customBlocked = normalizeLocalModuleList(config.customBlockedModules)
  const includedSet = new Set<LocalModuleKey>(baseIncluded)

  customIncluded.forEach((moduleKey) => includedSet.add(moduleKey))
  customBlocked.forEach((moduleKey) => includedSet.delete(moduleKey))

  includedSet.add("settings")
  includedSet.add("businessBasicConfig")
  includedSet.add("publicMenu")
  includedSet.add("publicCart")
  includedSet.add("publicWhatsapp")

  return uniqueModules(Array.from(includedSet))
}

export function getModuleEnabledByOwner(
  config: LocalPlanConfigLike,
  moduleKey: LocalModuleKey
) {
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

  if (moduleKey === "promotions") {
    return normalizeBoolean(config.promotionModuleEnabled, true)
  }

  if (moduleKey === "featuredProducts") {
    return normalizeBoolean(config.featuredProductsModuleEnabled, true)
  }

  if (moduleKey === "menuProducts") {
    return normalizeBoolean(config.menuProductsModuleEnabled, true)
  }

  if (moduleKey === "customers") {
    return normalizeBoolean(config.customersModuleEnabled, true)
  }

  if (moduleKey === "inventory") {
    return normalizeBoolean(config.inventoryModuleEnabled, true)
  }

  if (moduleKey === "sounds") {
    return normalizeBoolean(config.soundEnabled, true)
  }

  return true
}

export function getModulePlanAccess(
  config: LocalPlanConfigLike,
  moduleKey: LocalModuleKey
): LocalModulePlanAccess {
  const moduleDefinition = getLocalModuleDefinition(moduleKey)
  const plan = normalizeLocalPlanKey(config.membershipPlan)
  const planMode = normalizeLocalPlanMode(config.membershipPlanMode)
  const planDefinition = getLocalPlanDefinition(plan)
  const baseIncluded = getIncludedModulesForPlan(plan).includes(moduleKey)
  const customIncluded = normalizeLocalModuleList(config.customIncludedModules).includes(moduleKey)
  const customBlocked = normalizeLocalModuleList(config.customBlockedModules).includes(moduleKey)
  const effectiveIncludedModules = getEffectiveIncludedModules(config)
  const isInternal = moduleDefinition.minimumPlan === "internal"
  const includedInPlan = isInternal ? true : effectiveIncludedModules.includes(moduleKey)
  const enabledByOwner = getModuleEnabledByOwner(config, moduleKey)

  return {
    moduleKey,
    label: moduleDefinition.label,
    description: moduleDefinition.description,
    category: moduleDefinition.category,
    minimumPlan: moduleDefinition.minimumPlan,
    minimumPlanLabel: getMinimumPlanLabel(moduleDefinition.minimumPlan),
    plan,
    planLabel: planDefinition.label,
    planMode,
    baseIncluded,
    customIncluded,
    customBlocked,
    includedInPlan,
    enabledByOwner,
    effectiveEnabled: includedInPlan && enabledByOwner,
    lockedByPlan: !includedInPlan,
    ownerConfigKey: moduleDefinition.ownerConfigKey,
    routePath: moduleDefinition.routePath,
    comingSoon: moduleDefinition.comingSoon,
  }
}

export function getVisibleOwnerSettingModules() {
  return LOCAL_MODULE_DEFINITIONS.filter(
    (moduleDefinition) => moduleDefinition.visibleForOwnerSettings
  )
}

export function getVisibleSupportModules() {
  return LOCAL_MODULE_DEFINITIONS.filter(
    (moduleDefinition) => moduleDefinition.visibleForSupport
  )
}

export function getPlanModuleMatrix(config: LocalPlanConfigLike) {
  return LOCAL_MODULE_DEFINITIONS.map((moduleDefinition) =>
    getModulePlanAccess(config, moduleDefinition.key)
  )
}
