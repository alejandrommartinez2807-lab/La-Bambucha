"use client"

import { useEffect, useState } from "react"
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  MessageCircle,
  BadgeCheck,
  AlertTriangle,
  ClipboardList,
  Store,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { formatUSD, formatVES } from "@/utils/formatCurrency"

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

type CartDrawerProps = {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  totalPrice: number
  removeItem: (id: number) => void
  increaseQuantity: (id: number) => void
  decreaseQuantity: (id: number) => void
  updateItemNote?: (id: number, note: string) => void
  updateItemNoteEnabled?: (id: number, enabled: boolean) => void
  exchangeRate: number
  exchangeSource?: string
  exchangeValueDate?: string
  exchangeFallback?: boolean
  exchangeWarning?: string
  businessName?: string
  whatsappNumber?: string
}

type OrderType = "Comer aquí" | "Para llevar" | "Delivery"

type DeliveryZone = {
  name: string
  costUSD: number
  isActive?: boolean
}

type MembershipPlan = "menuDigital" | "basic" | "operational" | "pro" | "complete"

type PublicBusinessConfig = {
  businessName: string
  businessShortDescription: string
  mainWhatsapp: string
  deliveryWhatsapp: string
  deliveryEnabled: boolean
  deliveryModuleEnabled: boolean
  membershipPlan: MembershipPlan
}

const PUBLIC_CONFIG_CACHE_KEY = "la_bambucha_premium_public_business_config_v2"

const DEFAULT_PUBLIC_CONFIG: PublicBusinessConfig = {
  businessName: "La Bambucha",
  businessShortDescription: "Grill Burger",
  mainWhatsapp: "",
  deliveryWhatsapp: "",
  deliveryEnabled: true,
  deliveryModuleEnabled: true,
  membershipPlan: "menuDigital",
}

function cleanText(value: unknown) {
  return String(value || "").trim()
}

function cleanWhatsappNumber(value: unknown) {
  const rawValue = cleanText(value)
  const onlyDigits = rawValue.replace(/\D/g, "")

  if (!onlyDigits) return ""

  if (onlyDigits.startsWith("00")) {
    return onlyDigits.slice(2)
  }

  if (onlyDigits.startsWith("0") && onlyDigits.length === 11) {
    return `58${onlyDigits.slice(1)}`
  }

  return onlyDigits
}

function normalizeMembershipPlan(value: unknown): MembershipPlan {
  const normalized = cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (
    normalized === "menudigital" ||
    normalized === "menu digital" ||
    normalized === "menu-digital" ||
    normalized === "menu_digital"
  ) {
    return "menuDigital"
  }

  if (normalized === "basic" || normalized === "basico" || normalized === "basic plan") {
    return "basic"
  }

  if (
    normalized === "operational" ||
    normalized === "operativo" ||
    normalized === "operation"
  ) {
    return "operational"
  }

  if (normalized === "pro" || normalized === "profesional") {
    return "pro"
  }

  return "complete"
}

function doesPlanAllowLocalOrders(plan: MembershipPlan) {
  return plan !== "menuDigital"
}

function doesPlanAllowDelivery(plan: MembershipPlan) {
  return plan === "operational" || plan === "pro" || plan === "complete"
}

function normalizePublicBoolean(value: unknown, fallback = true) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value > 0

  const normalized = cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

  if (["true", "1", "si", "activo", "activa", "activado", "activada", "enabled", "on"].includes(normalized)) {
    return true
  }

  if (["false", "0", "no", "inactivo", "inactiva", "desactivado", "desactivada", "disabled", "off"].includes(normalized)) {
    return false
  }

  return fallback
}

function normalizePublicBusinessConfig(value: unknown): PublicBusinessConfig {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {}

  const businessConfig =
    source.businessConfig && typeof source.businessConfig === "object"
      ? (source.businessConfig as Record<string, unknown>)
      : source

  const membershipPlan = normalizeMembershipPlan(businessConfig.membershipPlan)

  return {
    businessName:
      cleanText(businessConfig.businessName) ||
      DEFAULT_PUBLIC_CONFIG.businessName,
    businessShortDescription:
      cleanText(businessConfig.businessShortDescription) ||
      DEFAULT_PUBLIC_CONFIG.businessShortDescription,
    mainWhatsapp: cleanWhatsappNumber(businessConfig.mainWhatsapp),
    deliveryWhatsapp: cleanWhatsappNumber(businessConfig.deliveryWhatsapp),
    deliveryEnabled:
      normalizePublicBoolean(businessConfig.deliveryEnabled, true) &&
      doesPlanAllowDelivery(membershipPlan),
    deliveryModuleEnabled: normalizePublicBoolean(
      businessConfig.deliveryModuleEnabled,
      true
    ),
    membershipPlan,
  }
}

function readCachedPublicBusinessConfig(): PublicBusinessConfig {
  if (typeof window === "undefined") return DEFAULT_PUBLIC_CONFIG

  try {
    const cachedValue = window.localStorage.getItem(PUBLIC_CONFIG_CACHE_KEY)

    if (!cachedValue) return DEFAULT_PUBLIC_CONFIG

    return normalizePublicBusinessConfig(JSON.parse(cachedValue))
  } catch {
    return DEFAULT_PUBLIC_CONFIG
  }
}

function writeCachedPublicBusinessConfig(config: PublicBusinessConfig) {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(PUBLIC_CONFIG_CACHE_KEY, JSON.stringify(config))
  } catch {
    // La configuración pública funciona aunque el navegador no permita guardar cache local.
  }
}

const LOCATIONS_STORAGE_KEY = "la_bambucha_order_locations"

const DEFAULT_QUICK_PLACES = [
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

const PAYMENT_METHOD_OPTIONS = [
  "Pago móvil",
  "Efectivo en divisas",
  "Efectivo en Bs",
  "Punto de venta",
  "Transferencia",
  "Por confirmar",
]

const ADDRESS_HELPERS = [
  "Urb.",
  "Calle",
  "Casa",
  "Apto",
  "Edificio",
  "Conjunto",
  "Frente a",
  "Al lado de",
]

function isComboItem(_item: CartItem) {
  // En La Bambucha Premium todos los productos se pueden pagar en divisas o bolívares.
  // Se conserva la función para no tocar el flujo interno, pero ya no separa combos.
  return false
}

function getItemPaymentMode(_item: CartItem): ProductPaymentMode {
  return "mixto"
}

async function readApiResponse(response: Response) {
  const text = await response.text()

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      "El servidor no devolvió una respuesta válida. Revisa que la API de pedidos y Google Sheets estén funcionando correctamente."
    )
  }
}

function normalizeDeliveryZones(value: unknown): DeliveryZone[] {
  if (!Array.isArray(value)) return []

  return value
    .map((zone) => ({
      name: String(zone?.name || "").trim(),
      costUSD: Number(zone?.costUSD || 0),
      isActive: zone?.isActive !== false,
    }))
    .filter(
      (zone) =>
        zone.name &&
        zone.isActive !== false &&
        Number.isFinite(zone.costUSD) &&
        zone.costUSD >= 0
    )
}

type PickerOption = {
  label: string
  value: string
  helper?: string
}

type OptionPickerProps = {
  label: string
  value: string
  placeholder: string
  options: PickerOption[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}

function OptionPicker({
  label,
  value,
  placeholder,
  options,
  isOpen,
  onToggle,
  onSelect,
}: OptionPickerProps) {
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative">
      <label className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
        {label}
      </label>

      <button
        type="button"
        onClick={onToggle}
        className={`mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-4 text-left text-sm font-black outline-none transition ${
          isOpen
            ? "border-yellow-300 bg-[#fff6d9] shadow-[0_5px_0_rgba(0,0,0,0.18)]"
            : "border-yellow-300/35 bg-[#fff6d9] hover:border-yellow-300"
        }`}
      >
        <span className={selectedOption ? "text-[#4a0000]" : "text-[#7a4b32]/55"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#a00000] transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-[180] overflow-hidden rounded-[1.25rem] border-2 border-yellow-300 bg-[#2c0b00] shadow-[0_16px_34px_rgba(0,0,0,0.42)]">
          <div className="max-h-72 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => onSelect("")}
              className={`flex w-full flex-col rounded-2xl px-4 py-3 text-left transition ${
                !value
                  ? "bg-yellow-300 text-[#4a0000]"
                  : "text-yellow-50 hover:bg-[#5c2100]"
              }`}
            >
              <span className="text-sm font-black uppercase">{placeholder}</span>
              <span className="mt-0.5 text-[0.68rem] font-bold text-yellow-50/65">
                Toca una opción para continuar
              </span>
            </button>

            {options.map((option) => {
              const selected = option.value === value

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  className={`mt-1 flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    selected
                      ? "bg-yellow-300 text-[#4a0000]"
                      : "text-yellow-50 hover:bg-[#5c2100]"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-black uppercase leading-tight">
                      {option.label}
                    </span>
                    {option.helper && (
                      <span className="mt-0.5 block text-[0.68rem] font-bold text-yellow-50/65">
                        {option.helper}
                      </span>
                    )}
                  </span>

                  {selected && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#a00000] text-[0.68rem] font-black text-white">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  totalPrice,
  removeItem,
  increaseQuantity,
  decreaseQuantity,
  updateItemNote,
  updateItemNoteEnabled,
  exchangeRate,
  exchangeSource,
  exchangeValueDate,
  exchangeFallback,
  exchangeWarning,
}: CartDrawerProps) {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [orderType, setOrderType] = useState<OrderType>("Comer aquí")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryReference, setDeliveryReference] = useState("")
  const [deliveryZone, setDeliveryZone] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [customerNote, setCustomerNote] = useState("")
  const [lastCreatedOrderId, setLastCreatedOrderId] = useState<string | null>(
    null
  )
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [quickPlaces, setQuickPlaces] = useState(DEFAULT_QUICK_PLACES)
  const [isZonePickerOpen, setIsZonePickerOpen] = useState(false)
  const [isPaymentPickerOpen, setIsPaymentPickerOpen] = useState(false)
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(
    DEFAULT_DELIVERY_ZONES
  )
  const [isLoadingDeliveryZones, setIsLoadingDeliveryZones] = useState(false)
  const [deliveryZonesError, setDeliveryZonesError] = useState<string | null>(
    null
  )
  const [publicConfig, setPublicConfig] = useState<PublicBusinessConfig>(() =>
    readCachedPublicBusinessConfig()
  )

  const canRegisterOrdersInPanel = doesPlanAllowLocalOrders(publicConfig.membershipPlan)
  const isPublicDeliveryAvailable =
    publicConfig.deliveryEnabled &&
    publicConfig.deliveryModuleEnabled &&
    doesPlanAllowDelivery(publicConfig.membershipPlan)

  useEffect(() => {
    let ignore = false

    async function loadPublicConfig() {
      try {
        const response = await fetch("/api/public/business-config", {
          cache: "no-store",
        })

        const data = await readApiResponse(response)

        if (!response.ok) {
          throw new Error(data.error || "No se pudo cargar la configuración pública")
        }

        const cleanConfig = normalizePublicBusinessConfig(data)

        if (!ignore) {
          setPublicConfig(cleanConfig)
          writeCachedPublicBusinessConfig(cleanConfig)
        }
      } catch {
        // Si la configuración pública tarda o falla, se conserva la última configuración válida guardada en este dispositivo.
      }
    }

    loadPublicConfig()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!canRegisterOrdersInPanel && isOrderModalOpen) {
      closeOrderModal()
    }
  }, [canRegisterOrdersInPanel, isOrderModalOpen])

  useEffect(() => {
    if (!isPublicDeliveryAvailable && orderType === "Delivery") {
      setOrderType("Comer aquí")
      setTableNumber("")
      setDeliveryAddress("")
      setDeliveryReference("")
      setDeliveryZone("")
      setPaymentMethod("")
      setIsZonePickerOpen(false)
      setIsPaymentPickerOpen(false)
    }
  }, [isPublicDeliveryAvailable, orderType])

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
        setQuickPlaces(cleanLocations)
      }
    } catch {
      setQuickPlaces(DEFAULT_QUICK_PLACES)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    if (!isPublicDeliveryAvailable) {
      setDeliveryZones([])
      setDeliveryZonesError(null)
      setIsLoadingDeliveryZones(false)
      return
    }

    let ignore = false

    async function loadDeliveryZones() {
      try {
        setIsLoadingDeliveryZones(true)
        setDeliveryZonesError(null)

        const response = await fetch("/api/delivery-zones", {
          cache: "no-store",
        })

        const data = await readApiResponse(response)

        if (!response.ok) {
          throw new Error(
            data.error || "No se pudieron cargar las zonas de delivery"
          )
        }

        const cleanZones = normalizeDeliveryZones(data.deliveryZones)

        if (!ignore) {
          setDeliveryZones(cleanZones)
        }
      } catch (error) {
        if (!ignore) {
          setDeliveryZones([])
          setDeliveryZonesError(
            error instanceof Error
              ? error.message
              : "No se pudieron cargar las zonas de delivery"
          )
        }
      } finally {
        if (!ignore) {
          setIsLoadingDeliveryZones(false)
        }
      }
    }

    loadDeliveryZones()

    return () => {
      ignore = true
    }
  }, [isOpen, isPublicDeliveryAvailable])

  const hasItems = items.length > 0

  const comboItems = items.filter(isComboItem)
  const regularItems = items.filter((item) => !isComboItem(item))

  const comboTotalPrice = comboItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  const regularTotalPrice = regularItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  )

  // Sin tasa válida no se muestra, ni se envía, ni se registra ningún monto
  // en bolívares: mostrar "Bs 0,00" es lo que llegó a los clientes cuando la
  // consulta de tasa falló.
  const hasValidRate = Number.isFinite(exchangeRate) && exchangeRate > 0
  const regularTotalVES = regularTotalPrice * exchangeRate
  const productsTotalUSD = comboTotalPrice + regularTotalPrice
  const isDeliveryOrder = orderType === "Delivery"
  const selectedDeliveryZone = deliveryZones.find(
    (zone) => zone.name === deliveryZone && zone.isActive !== false
  )
  const deliveryZoneOptions = deliveryZones.map((zone) => ({
    label: `${zone.name} — ${formatUSD(zone.costUSD)}`,
    value: zone.name,
    helper: `Delivery ${formatUSD(zone.costUSD)}`,
  }))
  const paymentMethodOptions = PAYMENT_METHOD_OPTIONS.map((method) => ({
    label: method,
    value: method,
  }))
  const deliveryCostValue =
    isDeliveryOrder && selectedDeliveryZone ? selectedDeliveryZone.costUSD : 0
  const totalUSD = productsTotalUSD + deliveryCostValue
  const totalVES = totalUSD * exchangeRate

  const hasCombos = comboTotalPrice > 0
  const hasRegularProducts = regularTotalPrice > 0

  const sourceLabel = exchangeSource || "BCV"
  const isOfficialBcv = sourceLabel === "BCV" && !exchangeFallback

  const canRegisterLocalOrder =
    hasItems &&
    !isSubmittingOrder &&
    // Un pedido registrado sin tasa queda con el monto en bolívares en cero.
    hasValidRate &&
    (isDeliveryOrder
      ? customerName.trim().length > 0 &&
        customerPhone.trim().length > 0 &&
        deliveryAddress.trim().length > 0 &&
        deliveryReference.trim().length > 0 &&
        deliveryZone.trim().length > 0 &&
        paymentMethod.trim().length > 0
      : tableNumber.trim().length > 0)

  function appendAddressHelper(text: string) {
    setDeliveryAddress((current) => {
      const cleanCurrent = current.trimEnd()

      if (!cleanCurrent) {
        return `${text} `
      }

      return `${cleanCurrent} ${text} `
    })
  }

  function buildWhatsAppMessage() {
    const comboLines = comboItems.map((item) => {
      const subtotal = item.price * item.quantity

      const baseLine = `• ${item.name} x${item.quantity} — ${formatUSD(
        subtotal
      )} / Ref.`

      if (item.noteEnabled && item.note?.trim()) {
        return `${baseLine}\n  Nota: ${item.note.trim()}`
      }

      return baseLine
    })

    const regularLines = regularItems.map((item) => {
      const subtotal = item.price * item.quantity
      const baseLine = `• ${item.name} x${item.quantity} — ${formatUSD(
        subtotal
      )}${hasValidRate ? ` / Bs ${formatVES(subtotal * exchangeRate)}` : ""}`

      if (item.noteEnabled && item.note?.trim()) {
        return `${baseLine}\n  Nota: ${item.note.trim()}`
      }

      return baseLine
    })

    const sourceLine = isOfficialBcv
      ? `Fuente: BCV${
          exchangeValueDate ? `\nFecha valor: ${exchangeValueDate}` : ""
        }`
      : `Fuente: ${sourceLabel}`

    const currentBusinessName = publicConfig.businessName || "La Bambucha"

    const messageParts = [
      `Hola, quiero hacer este pedido en ${currentBusinessName}:`,
      "",
      "DATOS DEL PEDIDO",
      `Tipo: ${orderType}`,
    ]

    if (customerName.trim()) {
      messageParts.push(`Cliente: ${customerName.trim()}`)
    }

    if (orderType === "Delivery") {
      messageParts.push(`Teléfono: ${customerPhone.trim() || "Por confirmar"}`)
      messageParts.push(`Dirección: ${deliveryAddress.trim() || "Por confirmar"}`)
      messageParts.push(
        `Punto de referencia: ${deliveryReference.trim() || "Por confirmar"}`
      )
      messageParts.push(`Zona: ${deliveryZone.trim() || "Por confirmar"}`)
      messageParts.push(`Método de pago: ${paymentMethod.trim() || "Por confirmar"}`)
      messageParts.push(`Costo delivery: ${formatUSD(deliveryCostValue)}`)
    } else {
      messageParts.push(`Ubicación: ${tableNumber.trim() || "Por confirmar"}`)
    }

    if (customerNote.trim()) {
      messageParts.push(`Nota general: ${customerNote.trim()}`)
    }

    messageParts.push("")

    if (comboLines.length > 0) {
      messageParts.push("COMBOS")
      messageParts.push(...comboLines)
      messageParts.push(`Subtotal combos: ${formatUSD(comboTotalPrice)}`)
      messageParts.push("")
    }

    if (regularLines.length > 0) {
      messageParts.push("PRODUCTOS")
      messageParts.push(...regularLines)
      messageParts.push(
        `Subtotal productos: ${formatUSD(regularTotalPrice)}${
          hasValidRate ? ` / Bs ${formatVES(regularTotalVES)}` : ""
        }`
      )
      messageParts.push("")
    }

    messageParts.push("TOTAL")
    messageParts.push(`Productos: ${formatUSD(productsTotalUSD)}`)

    if (isDeliveryOrder) {
      messageParts.push(`Delivery: ${formatUSD(deliveryCostValue)}`)
    }

    messageParts.push(`Total final: ${formatUSD(totalUSD)}`)

    if (hasCombos) {
      messageParts.push(`Combos: ${formatUSD(comboTotalPrice)}`)
    }

    if (hasRegularProducts) {
      messageParts.push(
        `Productos: ${formatUSD(regularTotalPrice)}${
          hasValidRate ? ` / Bs ${formatVES(regularTotalVES)}` : ""
        }`
      )

      if (hasValidRate) {
        messageParts.push("")
        messageParts.push(`Tasa usada: Bs ${formatVES(exchangeRate)}`)
        messageParts.push(sourceLine)
      }
    }

    return encodeURIComponent(messageParts.join("\n"))
  }

  async function handleRegisterLocalOrder() {
    if (!canRegisterLocalOrder) return

    setIsSubmittingOrder(true)
    setOrderError(null)

    await new Promise((resolve) => requestAnimationFrame(resolve))

    try {
      const normalizedItems = items.map((item) => ({
        ...item,
        paymentMode: getItemPaymentMode(item),
      }))

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: customerName.trim() || "Cliente",
          customerPhone: customerPhone.trim(),
          tableNumber: isDeliveryOrder
            ? `Delivery${deliveryZone.trim() ? ` - ${deliveryZone.trim()}` : ""}`
            : tableNumber.trim(),
          orderType,
          customerNote: customerNote.trim(),
          deliveryAddress: deliveryAddress.trim(),
          deliveryReference: deliveryReference.trim(),
          deliveryZone: deliveryZone.trim(),
          paymentMethod: paymentMethod.trim(),
          deliveryCostUSD: deliveryCostValue,
          totalBeforeDeliveryUSD: productsTotalUSD,
          items: normalizedItems,
          exchangeRate,
          exchangeSource,
          exchangeValueDate,
          totalUSD,
          totalCombosUSD: comboTotalPrice,
          totalRegularUSD: regularTotalPrice,
          totalRegularVES: regularTotalVES,
        }),
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar el pedido")
      }

      const orderId = data.order?.id || "Pedido registrado"

      items.forEach((item) => {
        removeItem(item.id)
      })

      setLastCreatedOrderId(orderId)
      setCustomerName("")
      setCustomerPhone("")
      setTableNumber("")
      setDeliveryAddress("")
      setDeliveryReference("")
      setDeliveryZone("")
      setPaymentMethod("")
      setCustomerNote("")
      setOrderType("Comer aquí")
      setIsZonePickerOpen(false)
      setIsPaymentPickerOpen(false)

      window.setTimeout(() => {
        setIsOrderModalOpen(false)
        setLastCreatedOrderId(null)
        setOrderError(null)
        onClose()
      }, 750)
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el pedido"
      )
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  function closeOrderModal() {
    if (isSubmittingOrder) return

    setIsOrderModalOpen(false)
    setLastCreatedOrderId(null)
    setOrderError(null)
    setIsZonePickerOpen(false)
    setIsPaymentPickerOpen(false)
  }

  function selectOrderType(type: OrderType) {
    if (type === "Delivery" && !isPublicDeliveryAvailable) return

    setOrderType(type)
    setIsZonePickerOpen(false)
    setIsPaymentPickerOpen(false)

    if (type === "Para llevar") {
      setTableNumber("Para llevar")
    }

    if (type === "Delivery") {
      setTableNumber("Delivery")
    }

    if (
      type === "Comer aquí" &&
      (tableNumber === "Para llevar" || tableNumber === "Delivery")
    ) {
      setTableNumber("")
    }
  }

  const businessName = publicConfig.businessName || "La Bambucha"
  const whatsappNumber =
    isDeliveryOrder && publicConfig.deliveryWhatsapp
      ? publicConfig.deliveryWhatsapp
      : publicConfig.mainWhatsapp
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${buildWhatsAppMessage()}`
    : ""
  const whatsappButtonLabel = whatsappHref
    ? "Enviar por WhatsApp"
    : "WhatsApp no configurado"
  const orderTypes: OrderType[] = isPublicDeliveryAvailable
    ? ["Comer aquí", "Para llevar", "Delivery"]
    : ["Comer aquí", "Para llevar"]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Cerrar carrito"
        onClick={onClose}
        className="absolute inset-0 bg-[#220000]/62 backdrop-blur-sm"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col overflow-hidden border-l-4 border-yellow-300/70 bg-[linear-gradient(180deg,#d8a116_0%,#bf7600_30%,#7a2b00_66%,#3a1000_100%)] text-white shadow-2xl shadow-black/50 sm:w-[92%]">
        <div className="h-5 shrink-0 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px_0] bg-[#fff7e8]" />

        <div className="relative shrink-0 overflow-hidden border-b-4 border-yellow-300/50 bg-[linear-gradient(90deg,#7a2400_0%,#b85500_46%,#d99b08_100%)] px-5 py-5 sm:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,211,0,0.32),transparent_42%)]" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-yellow-200">
                {businessName}
              </p>

              <div className="mt-2 flex min-w-0 items-center gap-3">
                <ShoppingCart className="shrink-0 text-yellow-300" size={32} />

                <h2 className="pb-1 text-[2.35rem] font-black uppercase leading-[1.02] text-white drop-shadow-[0_4px_0_rgba(74,0,0,0.45)] sm:text-5xl">
                  Tu pedido
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar carrito"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-yellow-200/70 bg-[#4a1600]/70 text-yellow-200 shadow-[0_5px_0_rgba(74,0,0,0.28)] transition hover:scale-105 hover:bg-yellow-300 hover:text-[#4a1600]"
            >
              <X size={28} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {!hasItems ? (
            <div className="flex min-h-[calc(100vh-210px)] flex-col items-center justify-center rounded-[2rem] border-2 border-[#a00000] bg-white px-6 py-12 text-center shadow-[0_10px_0_rgba(160,0,0,0.12)]">
              <img
                src="/logo-bambucha.png"
                alt={businessName}
                className="mb-6 h-44 w-44 object-contain drop-shadow-[0_16px_18px_rgba(160,0,0,0.16)] sm:h-52 sm:w-52"
              />

              <h3 className="text-3xl font-black uppercase leading-tight text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
                Tu carrito está vacío
              </h3>

              <p className="mt-4 max-w-sm text-sm font-bold leading-6 text-[#3a0000]/75">
                Agrega productos del menú para preparar tu pedido.
              </p>

              <a
                href="#menu"
                onClick={onClose}
                className="mt-7 inline-flex items-center justify-center rounded-full border-2 border-[#a00000] bg-yellow-300 px-7 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] shadow-[0_6px_0_rgba(160,0,0,0.18)] transition hover:scale-105"
              >
                Ver menú
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const itemSubtotal = item.price * item.quantity
                const itemSubtotalVES = itemSubtotal * exchangeRate
                const isCombo = isComboItem(item)
                const canUseNotes = item.category !== "Bebidas"

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[1.45rem] border-2 border-yellow-300/45 bg-[#4a1600] shadow-[0_7px_0_rgba(0,0,0,0.20)]"
                  >
                    <div className="grid grid-cols-[86px_1fr] gap-3 p-3 sm:grid-cols-[96px_1fr] sm:p-4">
                      <div className="h-[86px] w-[86px] overflow-hidden rounded-[1.05rem] border-2 border-yellow-300/45 bg-[#1d0700] sm:h-24 sm:w-24">
                        <img
                          src={item.image || "/logo-bambucha.png"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = "/logo-bambucha.png"
                          }}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[0.58rem] font-black uppercase tracking-[0.22em] text-yellow-300 sm:text-[0.65rem]">
                              {item.category}
                            </p>

                            <h3 className="mt-1 line-clamp-2 text-lg font-black uppercase leading-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.45)] sm:text-xl">
                              {item.name}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            aria-label={`Eliminar ${item.name}`}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-yellow-300/50 bg-[#7a2400] text-yellow-100 transition hover:bg-[#a00000] hover:text-white sm:h-10 sm:w-10"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <div className="mt-3 flex items-end justify-between gap-3">
                          <div className="flex items-center rounded-full border-2 border-yellow-300/45 bg-[#2c0b00] p-1">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a00000] text-white transition hover:scale-105 sm:h-9 sm:w-9"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus size={17} />
                            </button>

                            <span className="min-w-9 text-center text-base font-black text-white sm:min-w-10">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => increaseQuantity(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-300 text-[#4a0000] transition hover:scale-105 sm:h-9 sm:w-9"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus size={17} />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-lg font-black leading-none text-yellow-300 sm:text-xl">
                              {formatUSD(itemSubtotal)}
                            </p>

                            <p className="mt-1 text-[0.72rem] font-black leading-none text-yellow-100/90 sm:text-xs">
                              {hasValidRate
                                ? `Bs ${formatVES(itemSubtotalVES)}`
                                : "Actualizando tasa"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {canUseNotes && updateItemNote && updateItemNoteEnabled && (
                      <div className="border-t-2 border-yellow-300/20 bg-[#351000] px-4 py-3">
                        <label className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.08em] text-yellow-200 sm:text-sm">
                          <input
                            type="checkbox"
                            checked={Boolean(item.noteEnabled)}
                            onChange={(event) =>
                              updateItemNoteEnabled(
                                item.id,
                                event.target.checked
                              )
                            }
                            className="h-5 w-5 accent-yellow-300"
                          />
                          Agregar nota
                        </label>

                        {item.noteEnabled && (
                          <textarea
                            value={item.note || ""}
                            onChange={(event) =>
                              updateItemNote(item.id, event.target.value)
                            }
                            placeholder="Ejemplo: sin cebolla, extra salsa, sin picante..."
                            className="mt-3 min-h-20 w-full resize-none rounded-2xl border-2 border-yellow-300/30 bg-[#1d0700] px-4 py-3 text-sm font-bold text-yellow-50 outline-none placeholder:text-yellow-50/45 focus:border-yellow-300"
                          />
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>

        {hasItems && (
          <div className="shrink-0 border-t-4 border-yellow-300/45 bg-[#4a1600] px-4 py-2 sm:px-6">
            <div className="rounded-[0.95rem] border border-yellow-300/30 bg-[#2c0b00]/78 px-3 py-2 shadow-[0_8px_22px_rgba(0,0,0,0.22)]">
              <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-yellow-200">
                Total a cobrar
              </p>

              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <div className="rounded-[0.82rem] border border-yellow-300/25 bg-[#5c2100] px-3 py-1.5">
                  <p className="text-[0.54rem] font-black uppercase tracking-[0.12em] text-yellow-200">
                    Divisas
                  </p>
                  <strong className="mt-0.5 block text-[1.05rem] font-black leading-none text-white">
                    {formatUSD(totalUSD)}
                  </strong>
                </div>

                <div className="rounded-[0.82rem] border border-yellow-300/25 bg-[#5c2100] px-3 py-1.5 text-right">
                  <p className="text-[0.54rem] font-black uppercase tracking-[0.12em] text-yellow-200">
                    Bolívares
                  </p>
                  <strong className="mt-0.5 block text-[1.05rem] font-black leading-none text-white">
                    {hasValidRate ? (
                      `Bs ${formatVES(totalVES)}`
                    ) : (
                      <span className="text-[0.62rem] uppercase tracking-[0.08em] text-yellow-200">
                        Actualizando
                      </span>
                    )}
                  </strong>
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-between gap-2 rounded-[0.72rem] border border-yellow-300/18 bg-[#1d0700]/45 px-2.5 py-1">
                <p className="inline-flex items-center gap-1 text-[0.5rem] font-black uppercase tracking-[0.08em] text-yellow-200">
                  {isOfficialBcv ? (
                    <BadgeCheck size={10} />
                  ) : (
                    <AlertTriangle size={10} />
                  )}
                  Tasa usada
                </p>

                <div className="text-right">
                  <strong className="block text-xs font-black leading-3 text-yellow-300">
                    {hasValidRate
                      ? `Bs ${formatVES(exchangeRate)}`
                      : "Actualizando"}
                  </strong>
                  {exchangeValueDate && (
                    <p className="text-[0.48rem] font-bold leading-3 text-yellow-50/50">
                      {exchangeValueDate}
                    </p>
                  )}
                </div>
              </div>

              {exchangeWarning && (
                <div className="mt-1 rounded-lg border border-orange-300/35 bg-orange-100 px-2.5 py-1">
                  <p className="text-[0.56rem] font-bold leading-3 text-[#7a2e00]">
                    {exchangeWarning}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-2 grid gap-2">
              {canRegisterOrdersInPanel && (
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-yellow-300 bg-yellow-300 px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] shadow-[0_4px_0_rgba(0,0,0,0.20)] transition hover:bg-yellow-200 active:translate-y-1 active:shadow-none"
                >
                  <Store size={17} />
                  Registrar pedido local
                </button>
              )}

              <a
                href={whatsappHref || "#"}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!whatsappHref}
                onClick={(event) => {
                  if (!whatsappHref) event.preventDefault()
                }}
                className={`flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#a00000] px-5 py-2.5 text-xs font-black uppercase tracking-[0.12em] shadow-[0_4px_0_rgba(160,0,0,0.18)] transition active:translate-y-1 active:shadow-none ${
                  whatsappHref
                    ? "bg-[#a00000] text-white hover:bg-yellow-300 hover:text-[#4a0000]"
                    : "cursor-not-allowed bg-[#ddd3c4] text-[#3a0000]/45"
                }`}
              >
                <MessageCircle size={17} />
                {whatsappButtonLabel}
              </a>
            </div>
          </div>
        )}
      </aside>

      {isOrderModalOpen && canRegisterOrdersInPanel && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-[#1d0700]/75 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border-4 border-yellow-300 bg-[#4a1600] text-yellow-50 shadow-2xl shadow-black/60">
            <div className="h-5 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px_0] bg-yellow-300" />

            <div className="relative border-b-4 border-yellow-300/45 bg-[linear-gradient(90deg,#6b2100_0%,#a13a00_48%,#d99400_100%)] px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-300">
                    Pedido del cliente
                  </p>

                  <h3 className="mt-2 text-3xl font-black uppercase leading-none text-white drop-shadow-[0_4px_0_rgba(92,28,0,0.65)]">
                    Identificar pedido
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={closeOrderModal}
                  disabled={isSubmittingOrder}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-yellow-300 bg-yellow-300 text-[#4a0000] disabled:opacity-50"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {lastCreatedOrderId ? (
              <div className="px-6 py-8 text-center">
                <CheckCircle2
                  size={58}
                  className="mx-auto text-yellow-300"
                  strokeWidth={2.2}
                />

                <p className="mt-5 text-sm font-black uppercase tracking-[0.24em] text-yellow-300">
                  Pedido registrado
                </p>

                <h4 className="mt-2 text-3xl font-black text-yellow-50">
                  Listo para preparar
                </h4>

                <p className="mx-auto mt-4 max-w-sm text-sm font-bold leading-6 text-yellow-50/80">
                  El pedido fue enviado al panel interno del local.
                </p>

                <p className="mt-3 text-[0.7rem] font-black uppercase tracking-[0.16em] text-yellow-300/70">
                  Referencia interna: {lastCreatedOrderId}
                </p>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-yellow-50/65">
                  Cerrando para seguir vendiendo...
                </p>
              </div>
            ) : isSubmittingOrder ? (
              <div className="px-6 py-12 text-center">
                <Loader2
                  size={58}
                  className="mx-auto animate-spin text-yellow-300"
                />

                <p className="mt-6 text-sm font-black uppercase tracking-[0.24em] text-yellow-300">
                  Enviando pedido
                </p>

                <h4 className="mt-2 text-3xl font-black uppercase leading-tight text-yellow-50">
                  Registrando en el panel
                </h4>

                <p className="mx-auto mt-4 max-w-sm text-sm font-bold leading-6 text-yellow-50/80">
                  Espera un momento. El pedido se está guardando para el local.
                </p>
              </div>
            ) : (
              <div className="space-y-4 px-6 py-6">
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    {isDeliveryOrder ? "Nombre del cliente" : "Nombre del cliente opcional"}
                  </label>

                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Ejemplo: Carlos"
                    autoComplete="name"
                    className="mt-2 w-full rounded-2xl border-2 border-yellow-300/25 bg-[#fff6d9] px-4 py-4 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#7a4b32]/55 focus:border-yellow-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    Tipo de pedido
                  </label>

                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {orderTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => selectOrderType(type)}
                        className={`rounded-2xl border-2 px-4 py-4 text-sm font-black uppercase transition ${
                          orderType === type
                            ? "border-yellow-300 bg-yellow-300 text-[#4a0000]"
                            : "border-yellow-300 bg-[#2c0b00] text-yellow-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {!isDeliveryOrder && (
                  <div>
                    <label className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                      Mesa o ubicación
                    </label>

                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {quickPlaces.map((place) => (
                        <button
                          key={place}
                          type="button"
                          onClick={() => {
                            setTableNumber(place)
                            setOrderType("Comer aquí")
                          }}
                          className={`rounded-xl border-2 px-3 py-3 text-xs font-black uppercase transition ${
                            tableNumber === place
                              ? "border-yellow-300 bg-yellow-300 text-[#4a0000]"
                              : "border-yellow-300 bg-[#2c0b00] text-yellow-200"
                          }`}
                        >
                          {place}
                        </button>
                      ))}
                    </div>

                    <input
                      value={tableNumber}
                      onChange={(event) => setTableNumber(event.target.value)}
                      placeholder="O escribe otra ubicación..."
                      className="mt-3 w-full rounded-2xl border-2 border-yellow-300/25 bg-[#fff6d9] px-4 py-4 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#7a4b32]/55 focus:border-yellow-300"
                    />

                    <p className="mt-2 text-[0.68rem] font-bold text-yellow-50/60">
                      Las mesas y ubicaciones se administran desde el panel del
                      local.
                    </p>
                  </div>
                )}

                {isDeliveryOrder && (
                  <div className="space-y-4 rounded-[1.5rem] border-2 border-yellow-300/25 bg-[#351000] px-4 py-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        placeholder="Ejemplo: 0412-0000000"
                        className="mt-2 w-full rounded-2xl border-2 border-yellow-300/25 bg-[#fff6d9] px-4 py-4 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#7a4b32]/55 focus:border-yellow-300"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                        Dirección
                      </label>
                      <textarea
                        value={deliveryAddress}
                        onChange={(event) => setDeliveryAddress(event.target.value)}
                        placeholder="Ejemplo: Urb. La Trigaleña, calle 3, edificio Torre Azul, apto 4B"
                        autoComplete="street-address"
                        className="mt-2 min-h-24 w-full resize-none rounded-2xl border-2 border-yellow-300/25 bg-[#fff6d9] px-4 py-4 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#7a4b32]/55 focus:border-yellow-300"
                      />
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {ADDRESS_HELPERS.map((helper) => (
                          <button
                            key={helper}
                            type="button"
                            onClick={() => appendAddressHelper(helper)}
                            className="shrink-0 rounded-full border-2 border-yellow-300/25 bg-[#351000] px-3 py-1.5 text-[0.68rem] font-black uppercase text-yellow-300 transition hover:border-yellow-300 hover:bg-[#5c2100]"
                          >
                            + {helper}
                          </button>
                        ))}
                      </div>

                      <p className="mt-2 text-[0.68rem] font-bold leading-4 text-yellow-50/60">
                        Usa los botones rápidos para armar la dirección y luego completa los datos faltantes.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                        Punto de referencia
                      </label>
                      <input
                        value={deliveryReference}
                        onChange={(event) => setDeliveryReference(event.target.value)}
                        placeholder="Ejemplo: frente a la farmacia, portón negro, al lado del colegio..."
                        className="mt-2 w-full rounded-2xl border-2 border-yellow-300/25 bg-[#fff6d9] px-4 py-4 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#7a4b32]/55 focus:border-yellow-300"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <OptionPicker
                        label="Zona"
                        value={deliveryZone}
                        placeholder={
                          isLoadingDeliveryZones
                            ? "Cargando zonas..."
                            : "Selecciona una zona"
                        }
                        options={deliveryZoneOptions}
                        isOpen={isZonePickerOpen}
                        onToggle={() => {
                          setIsZonePickerOpen((current) => !current)
                          setIsPaymentPickerOpen(false)
                        }}
                        onSelect={(value) => {
                          setDeliveryZone(value)
                          setIsZonePickerOpen(false)
                        }}
                      />

                      <OptionPicker
                        label="Método de pago"
                        value={paymentMethod}
                        placeholder="Selecciona método"
                        options={paymentMethodOptions}
                        isOpen={isPaymentPickerOpen}
                        onToggle={() => {
                          setIsPaymentPickerOpen((current) => !current)
                          setIsZonePickerOpen(false)
                        }}
                        onSelect={(value) => {
                          setPaymentMethod(value)
                          setIsPaymentPickerOpen(false)
                        }}
                      />
                    </div>

                    {deliveryZonesError && (
                      <div className="rounded-2xl border-2 border-orange-400/35 bg-orange-100 px-4 py-3">
                        <p className="text-sm font-bold leading-5 text-orange-800">
                          {deliveryZonesError}. Se usarán las zonas base mientras se revisa la conexión.
                        </p>
                      </div>
                    )}

                    <div className="rounded-2xl border-2 border-yellow-300/20 bg-[#2c0b00] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                        Costo de delivery
                      </p>
                      <p className="mt-1 text-2xl font-black text-yellow-50">
                        {selectedDeliveryZone ? formatUSD(deliveryCostValue) : "Selecciona zona"}
                      </p>
                      <p className="mt-2 text-[0.68rem] font-bold leading-4 text-yellow-50/60">
                        El cliente no puede escribir este monto. El costo se calcula automáticamente según la zona.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border-2 border-yellow-300/25 bg-[#351000] px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    Resumen de cobro
                  </p>

                  <div className="mt-3 space-y-2 text-sm font-black text-yellow-50">
                    {hasCombos && (
                      <p>
                        Combos:{" "}
                        <span className="text-yellow-300">
                          {formatUSD(comboTotalPrice)}
                        </span>
                      </p>
                    )}

                    {hasRegularProducts && (
                      <p>
                        Productos:{" "}
                        <span className="text-yellow-300">
                          {formatUSD(regularTotalPrice)}
                        </span>
                        {hasValidRate && ` / Bs ${formatVES(regularTotalVES)}`}
                      </p>
                    )}

                    {isDeliveryOrder && (
                      <p>
                        Delivery:{" "}
                        <span className="text-yellow-300">
                          {formatUSD(deliveryCostValue)}
                        </span>
                      </p>
                    )}

                    <p>
                      Total final:{" "}
                      <span className="text-yellow-300">
                        {formatUSD(totalUSD)}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    Nota general opcional
                  </label>

                  <textarea
                    value={customerNote}
                    onChange={(event) => setCustomerNote(event.target.value)}
                    placeholder="Ejemplo: cliente espera afuera, entregar rápido..."
                    className="mt-2 min-h-20 w-full resize-none rounded-2xl border-2 border-yellow-300/25 bg-[#fff6d9] px-4 py-4 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#7a4b32]/55 focus:border-yellow-300"
                  />
                </div>

                {orderError && (
                  <div className="rounded-2xl border-2 border-red-500/35 bg-red-100 px-4 py-3">
                    <p className="text-sm font-bold leading-6 text-red-800">
                      {orderError}
                    </p>
                  </div>
                )}

                {hasItems && !hasValidRate && (
                  <p className="mt-2 rounded-[0.9rem] border border-yellow-300/30 bg-[#5c2100]/60 px-3 py-2 text-center text-[0.66rem] font-black uppercase tracking-[0.08em] text-yellow-200">
                    Actualizando la tasa del BCV. En un momento puedes registrar
                    el pedido.
                  </p>
                )}

                <button
                  type="button"
                  disabled={!canRegisterLocalOrder}
                  onClick={handleRegisterLocalOrder}
                  className={`mt-2 flex w-full items-center justify-center gap-3 rounded-full border-2 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] shadow-[0_6px_0_rgba(160,0,0,0.18)] transition active:translate-y-1 active:shadow-none ${
                    canRegisterLocalOrder
                      ? "border-yellow-300 bg-yellow-300 text-[#4a0000]"
                      : "border-yellow-300/15 bg-[#ddd3c4] text-yellow-50/35"
                  }`}
                >
                  <ClipboardList size={21} />
                  Registrar pedido
                </button>

                <a
                  href={whatsappHref || "#"}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!whatsappHref}
                  onClick={(event) => {
                    if (!whatsappHref) event.preventDefault()
                  }}
                  className={`flex w-full items-center justify-center gap-3 rounded-full border-2 border-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] shadow-[0_6px_0_rgba(160,0,0,0.18)] transition active:translate-y-1 active:shadow-none ${
                    whatsappHref
                      ? "bg-[#a00000] text-white hover:bg-yellow-300 hover:text-[#4a0000]"
                      : "cursor-not-allowed bg-[#ddd3c4] text-yellow-50/45"
                  }`}
                >
                  <MessageCircle size={21} />
                  {whatsappButtonLabel}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
