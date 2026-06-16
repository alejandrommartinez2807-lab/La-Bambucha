export type PublicBusinessConfig = {
  businessName: string
  businessShortDescription: string
  publicTagline: string
  heroBadgeText: string
  heroSubtitle: string
  heroDescription: string
  publicSectionTitle: string
  publicWelcomeTitle: string
  publicWelcomeText: string
  scheduleTitle: string
  scheduleLine1: string
  scheduleLine2: string
  reviewsTitle: string
  reviewsText: string
  quickOrderTitle: string
  quickOrderText: string
  locationButtonText: string
  whatsappButtonText: string
  instagramButtonText: string
  googleMapsUrl: string
  instagramUrl: string
  mainWhatsapp: string
  deliveryWhatsapp: string
  exchangeRateMode: "automatic" | "manual"
  manualExchangeRate: number
  deliveryEnabled: boolean
  membershipPlan: string
  membershipPlanMode: string
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
  defaultViewMode: string
  soundEnabled: boolean
  filtersOpenByDefault: boolean
  allowCloseWithPendingOrders: boolean
  allowCloseWithPendingPayments: boolean
  updatedAt?: string
}

export const DEFAULT_PUBLIC_BUSINESS_CONFIG: PublicBusinessConfig = {
  businessName: "La Bambucha",
  businessShortDescription: "Grill Burger",
  publicTagline: "La mejor manera de comer carne",
  heroBadgeText: "La mejor manera de comer carne",
  heroSubtitle: "Grill Burger",
  heroDescription:
    "Hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y bebidas al estilo Bambucha Grill Burger.",
  publicSectionTitle: "Encuéntranos",
  publicWelcomeTitle: "Visita La Bambucha",
  publicWelcomeText:
    "Estamos listos para recibirte con hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y bebidas al estilo Bambucha Grill Burger.",
  scheduleTitle: "Horario",
  scheduleLine1: "Lunes a domingo: horario publicado por el negocio.",
  scheduleLine2: "",
  reviewsTitle: "Reseñas",
  reviewsText:
    "Después de probar tu pedido, puedes apoyar el negocio dejando tu reseña o compartiendo la página.",
  quickOrderTitle: "Pedido rápido",
  quickOrderText:
    "Agrega productos al carrito, revisa el total y envía tu pedido directo por WhatsApp.",
  locationButtonText: "Abrir ubicación",
  whatsappButtonText: "WhatsApp",
  instagramButtonText: "Instagram",
  googleMapsUrl: "https://maps.app.goo.gl/r4QXeRTgXuRJTqvU8",
  instagramUrl: "https://www.instagram.com/la_bambucha_burguer/",
  mainWhatsapp: "584121317635",
  deliveryWhatsapp: "584121317635",
  exchangeRateMode: "automatic",
  manualExchangeRate: 0,
  deliveryEnabled: true,
  membershipPlan: "complete",
  membershipPlanMode: "plan",
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
  promotionText: "Aprovecha una promoción preparada para disfrutar al estilo Bambucha.",
  promotionHighlight: "Disponible por tiempo limitado.",
  promotionButtonText: "Ver menú",
  promotionButtonHref: "#menu",
  promotionProductId: 0,
  promotionProductName: "",
  promotionPriceUSD: 0,
  promotionImage: "",
  featuredProductsModuleEnabled: true,
  featuredProductsActive: true,
  featuredProductsTitle: "Favoritos de La Bambucha",
  featuredProductsText:
    "Una selección rápida con favoritos de La Bambucha para armar tu antojo.",
  featuredProductIds: [78, 73, 74, 79, 50, 25],
  customersModuleEnabled: true,
  inventoryModuleEnabled: true,
  defaultViewMode: "negocio",
  soundEnabled: true,
  filtersOpenByDefault: false,
  allowCloseWithPendingOrders: true,
  allowCloseWithPendingPayments: true,
}

export function normalizeWhatsappNumber(value: unknown, fallback = "584121317635") {
  const digits = String(value || "").replace(/\D/g, "")

  if (!digits) return fallback
  if (digits.startsWith("0") && digits.length === 11) return `58${digits.slice(1)}`
  if (digits.startsWith("4") && digits.length === 10) return `58${digits}`
  if (digits.startsWith("58") && digits.length === 12) return digits
  if (!digits.startsWith("0") && digits.length >= 10 && digits.length <= 15) return digits

  return fallback
}

export function buildWhatsappUrl(phone: unknown, message?: string) {
  const normalizedPhone = normalizeWhatsappNumber(phone)
  const baseUrl = `https://wa.me/${normalizedPhone}`

  if (!message) return baseUrl

  return `${baseUrl}?text=${encodeURIComponent(message)}`
}

export function normalizePublicBusinessConfig(value: unknown): PublicBusinessConfig {
  const source = (value || {}) as Partial<PublicBusinessConfig> & {
    publicInfoTitle?: string
    publicInfoText?: string
  }

  const businessName =
    String(source.businessName || "").trim() ||
    DEFAULT_PUBLIC_BUSINESS_CONFIG.businessName
  const businessShortDescription =
    String(source.businessShortDescription || "").trim() ||
    DEFAULT_PUBLIC_BUSINESS_CONFIG.businessShortDescription
  const publicTagline =
    String(source.publicTagline || "").trim() ||
    DEFAULT_PUBLIC_BUSINESS_CONFIG.publicTagline
  const publicWelcomeTitle =
    String(source.publicWelcomeTitle || source.publicInfoTitle || "").trim() ||
    DEFAULT_PUBLIC_BUSINESS_CONFIG.publicWelcomeTitle
  const publicWelcomeText =
    String(source.publicWelcomeText || source.publicInfoText || "").trim() ||
    DEFAULT_PUBLIC_BUSINESS_CONFIG.publicWelcomeText

  return {
    ...DEFAULT_PUBLIC_BUSINESS_CONFIG,
    ...source,
    businessName,
    businessShortDescription,
    publicTagline,
    heroBadgeText:
      String(source.heroBadgeText || "").trim() || publicTagline,
    heroSubtitle:
      String(source.heroSubtitle || "").trim() || businessShortDescription,
    heroDescription:
      String(source.heroDescription || "").trim() || publicWelcomeText,
    publicWelcomeTitle,
    publicWelcomeText,
    mainWhatsapp: normalizeWhatsappNumber(source.mainWhatsapp),
    deliveryWhatsapp: normalizeWhatsappNumber(
      source.deliveryWhatsapp,
      normalizeWhatsappNumber(source.mainWhatsapp)
    ),
    googleMapsUrl:
      String(source.googleMapsUrl || "").trim() ||
      DEFAULT_PUBLIC_BUSINESS_CONFIG.googleMapsUrl,
    instagramUrl:
      String(source.instagramUrl || "").trim() ||
      DEFAULT_PUBLIC_BUSINESS_CONFIG.instagramUrl,
    manualExchangeRate: Number(source.manualExchangeRate || 0),
    promotionProductId: Math.round(Number(source.promotionProductId || 0)),
    promotionPriceUSD: Number(source.promotionPriceUSD || 0),
    featuredProductIds: Array.isArray(source.featuredProductIds)
      ? source.featuredProductIds
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item) && item > 0)
          .map((item) => Math.round(item))
      : DEFAULT_PUBLIC_BUSINESS_CONFIG.featuredProductIds,
  }
}
