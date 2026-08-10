"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CookingPot,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Search,
  Send,
  Truck,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from "lucide-react"
import { formatUSD, formatVES } from "@/utils/formatCurrency"
import ModuleAccessGuard from "@/components/ModuleAccessGuard"
import { useOperationalSounds, useOrderSoundAlerts } from "@/hooks/useOperationalSounds"
import { useVisiblePolling } from "@/hooks/useVisiblePolling"

const ADMIN_STORAGE_KEY = "la_bambucha_premium_cashier_session"

type ProductPaymentMode = "divisa" | "mixto"
type OrderStatus = "Nuevo" | "Preparando" | "Listo" | "Entregado" | "Cancelado"
type PaymentStatus = "Pendiente" | "Pago parcial" | "Pagado"
type DeliveryPaymentIn = "Divisas" | "Bolívares" | "Mixto" | "Sin registrar"
type DeliveryReportStatus = "Sin reportar" | "Entrega reportada"
type OrderType = "Comer aquí" | "Para llevar" | "Delivery"
type CashFilter =
  | "Por confirmar"
  | "Delivery por confirmar"
  | "Pendientes"
  | "Pago parcial"
  | "Listos"
  | "Completos"
  | "Delivery"
  | "Pagados"
  | "Cancelados"
  | "Todos"

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
  deliveryReportStatus?: DeliveryReportStatus
  deliveryReportedAt?: string
  deliveryReportedBy?: string
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

const CASH_FILTERS: CashFilter[] = [
  "Por confirmar",
  "Delivery por confirmar",
  "Pendientes",
  "Pago parcial",
  "Listos",
  "Completos",
  "Delivery",
  "Pagados",
  "Cancelados",
  "Todos",
]

const PAYMENT_METHOD_USD_OPTIONS = [
  "",
  "Efectivo divisas",
  "Zelle",
  "Binance",
  "USDT",
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

const DELIVERY_PAYMENT_OPTIONS: DeliveryPaymentIn[] = [
  "Sin registrar",
  "Divisas",
  "Bolívares",
  "Mixto",
]

const EMPTY_PAYMENT_FORM: PaymentForm = {
  amountReceivedUSD: "",
  amountReceivedVES: "",
  paymentMethodUSD: "",
  paymentMethodVES: "",
  deliveryPaymentIn: "Sin registrar",
  paymentNote: "",
}

type DeliveryWhatsAppMessageType = "confirm" | "preparing" | "onTheWay" | "arrived"

function readApiResponse(response: Response) {
  return response.text().then((text) => {
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(
        "El servidor respondió con una página HTML en vez de datos. Revisa que la API de pedidos esté funcionando correctamente."
      )
    }
  })
}

function roundMoney(value: unknown) {
  const numberValue = Number(value || 0)
  if (!Number.isFinite(numberValue)) return 0
  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function parseMoneyInput(value: string) {
  const rawValue = String(value || "").trim().replace(/\s/g, "")
  if (!rawValue) return 0

  const hasComma = rawValue.includes(",")
  const hasDot = rawValue.includes(".")
  const lastCommaIndex = rawValue.lastIndexOf(",")
  const lastDotIndex = rawValue.lastIndexOf(".")
  let normalizedValue = rawValue

  if (hasComma && hasDot) {
    if (lastCommaIndex > lastDotIndex) {
      normalizedValue = rawValue.replace(/\./g, "").replace(",", ".")
    } else {
      normalizedValue = rawValue.replace(/,/g, "")
    }
  } else if (hasComma) {
    normalizedValue = rawValue.replace(",", ".")
  }

  const numberValue = Number(normalizedValue)
  if (!Number.isFinite(numberValue) || numberValue <= 0) return 0
  return roundMoney(numberValue)
}

function formatMoneyForInput(value: number) {
  const moneyValue = roundMoney(value)
  if (moneyValue <= 0) return ""
  return moneyValue.toFixed(2)
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
}

function isComboItem(_item: CartItem) {
  return false
}

function isDeliveryOrder(order: LocalOrder) {
  return (
    order.orderType === "Delivery" ||
    order.tableNumber?.toLowerCase().startsWith("delivery") ||
    Boolean(
      order.customerPhone ||
        order.deliveryAddress ||
        order.deliveryReference ||
        order.deliveryZone
    )
  )
}

function cleanDeliveryLocation(value: string) {
  return value.replace(/^delivery\s*-\s*/i, "").trim()
}

function isDeliveryReported(order: LocalOrder) {
  return order.deliveryReportStatus === "Entrega reportada"
}

function getDisplayOrderType(order: LocalOrder): OrderType {
  if (isDeliveryOrder(order)) return "Delivery"
  if (order.orderType === "Para llevar") return "Para llevar"
  return "Comer aquí"
}

function getDisplayLocation(order: LocalOrder) {
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
      if (isComboItem(item)) totals.totalCombosUSD += subtotal
      else totals.totalRegularUSD += subtotal
      return totals
    },
    { totalCombosUSD: 0, totalRegularUSD: 0 }
  )

  const hasReadableItems = Array.isArray(order.items) && order.items.length > 0
  const totalCombosUSD = hasReadableItems
    ? itemTotals.totalCombosUSD
    : Number(order.totalCombosUSD ?? 0)
  const totalRegularUSD = hasReadableItems
    ? itemTotals.totalRegularUSD
    : Number(order.totalRegularUSD ?? 0)
  const totalRegularVES = hasReadableItems
    ? totalRegularUSD * exchangeRate
    : Number(order.totalRegularVES ?? order.totalVES ?? totalRegularUSD * exchangeRate)

  return {
    totalUSD: totalCombosUSD + totalRegularUSD + deliveryCostUSD,
    totalCombosUSD,
    totalRegularUSD,
    totalRegularVES,
    deliveryCostUSD,
  }
}

function calculatePaymentStatus(receivedEquivalentUSD: number, totalOrderUSD: number): PaymentStatus {
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
  if (normalized === "divisas" || normalized === "divisa") return "Divisas"
  if (normalized === "bolivares" || normalized === "bolivar" || normalized === "bs" || normalized === "ves") return "Bolívares"
  if (normalized === "mixto" || normalized === "mixta") return "Mixto"
  return "Sin registrar"
}

function normalizePaymentMethodUSD(value: unknown) {
  const normalized = normalizeComparableText(String(value || ""))
  if (!normalized || normalized === "sin registrar" || normalized === "sin metodo" || normalized === "divisas sin metodo") return ""
  if (normalized.includes("efectivo") || normalized === "divisas" || normalized === "divisa" || normalized === "usd" || normalized === "cash") return "Efectivo divisas"
  if (normalized.includes("zelle")) return "Zelle"
  if (normalized.includes("binance")) return "Binance"
  if (normalized.includes("usdt") || normalized.includes("tether")) return "USDT"
  if (normalized.includes("transferencia internacional") || normalized.includes("transferencia externa") || normalized.includes("wire")) return "Transferencia internacional"
  return "Otro"
}

function normalizePaymentMethodVES(value: unknown) {
  const normalized = normalizeComparableText(String(value || ""))
  if (!normalized || normalized === "sin registrar" || normalized === "sin metodo" || normalized === "bolivares sin metodo") return ""
  if (normalized.includes("pago movil") || normalized.includes("pagomovil") || normalized.includes("movil")) return "Pago móvil"
  if (normalized.includes("punto")) return "Punto"
  if (normalized.includes("transferencia")) return "Transferencia"
  if (normalized.includes("efectivo") || normalized === "bolivares" || normalized === "bs") return "Efectivo Bs"
  if (normalized.includes("biopago") || normalized.includes("bio pago")) return "Biopago"
  return "Otro"
}

function getOrderPayment(order: LocalOrder): OrderPayment {
  const orderTotals = getOrderTotals(order)
  const savedPayment = order.payment
  const totalOrderUSD = roundMoney(savedPayment?.totalOrderUSD ?? order.paymentTotalOrderUSD ?? orderTotals.totalUSD)
  const receivedEquivalentUSD = roundMoney(savedPayment?.receivedEquivalentUSD ?? order.paymentReceivedEquivalentUSD ?? 0)
  const calculatedStatus = calculatePaymentStatus(receivedEquivalentUSD, totalOrderUSD)
  const status = normalizePaymentStatus(savedPayment?.status ?? order.paymentStatus ?? calculatedStatus)
  const pendingUSD = status === "Pagado" ? 0 : roundMoney(savedPayment?.pendingUSD ?? order.paymentPendingUSD ?? Math.max(totalOrderUSD - receivedEquivalentUSD, 0))

  return {
    status,
    amountReceivedUSD: roundMoney(savedPayment?.amountReceivedUSD ?? order.amountReceivedUSD ?? 0),
    amountReceivedVES: roundMoney(savedPayment?.amountReceivedVES ?? order.amountReceivedVES ?? 0),
    paymentMethodUSD: normalizePaymentMethodUSD(savedPayment?.paymentMethodUSD ?? order.paymentMethodUSD ?? ""),
    paymentMethodVES: normalizePaymentMethodVES(savedPayment?.paymentMethodVES ?? order.paymentMethodVES ?? ""),
    deliveryPaymentIn: normalizeDeliveryPaymentIn(savedPayment?.deliveryPaymentIn ?? order.deliveryPaymentIn),
    paymentNote: String(savedPayment?.paymentNote ?? order.paymentNote ?? ""),
    totalOrderUSD,
    receivedEquivalentUSD,
    pendingUSD,
    updatedAt: String(savedPayment?.updatedAt ?? order.paymentUpdatedAt ?? ""),
  }
}

function createPaymentFormFromOrder(order: LocalOrder): PaymentForm {
  const payment = getOrderPayment(order)
  return {
    amountReceivedUSD: payment.amountReceivedUSD > 0 ? String(payment.amountReceivedUSD) : "",
    amountReceivedVES: payment.amountReceivedVES > 0 ? String(payment.amountReceivedVES) : "",
    paymentMethodUSD: payment.paymentMethodUSD,
    paymentMethodVES: payment.paymentMethodVES,
    deliveryPaymentIn: payment.deliveryPaymentIn,
    paymentNote: payment.paymentNote,
  }
}

function calculatePaymentDraft(order: LocalOrder, form: PaymentForm) {
  const orderTotals = getOrderTotals(order)
  const totalOrderUSD = roundMoney(orderTotals.totalUSD)
  const exchangeRate = Number(order.exchangeRate || 0)
  const amountReceivedUSD = parseMoneyInput(form.amountReceivedUSD)
  const amountReceivedVES = parseMoneyInput(form.amountReceivedVES)
  const receivedFromVES = amountReceivedVES > 0 && exchangeRate > 0 ? amountReceivedVES / exchangeRate : 0
  const receivedEquivalentUSD = roundMoney(amountReceivedUSD + receivedFromVES)
  const status = calculatePaymentStatus(receivedEquivalentUSD, totalOrderUSD)
  const pendingUSD = status === "Pagado" ? 0 : roundMoney(Math.max(totalOrderUSD - receivedEquivalentUSD, 0))
  return { totalOrderUSD, amountReceivedUSD, amountReceivedVES, receivedEquivalentUSD, pendingUSD, status }
}

function getDisplayOrderNumber(order: LocalOrder) {
  if (order.rowNumber && order.rowNumber > 1) return `#${String(order.rowNumber - 1).padStart(2, "0")}`
  const parts = order.id.split("-")
  const lastPart = parts[parts.length - 1] || order.id
  return `#${lastPart.slice(-3)}`
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

function getStatusStyle(status: OrderStatus) {
  if (status === "Nuevo") return "bg-red-500 text-[#220000]"
  if (status === "Preparando") return "bg-orange-400 text-[#3a0000]"
  if (status === "Listo") return "bg-yellow-300 text-[#3a1600]"
  if (status === "Entregado") return "bg-green-500 text-[#220000]"
  return "bg-[#220000] text-white"
}

function getPaymentStatusStyle(status: PaymentStatus) {
  if (status === "Pagado") return "bg-green-500 text-[#220000]"
  if (status === "Pago parcial") return "bg-yellow-300 text-[#3a1600]"
  return "bg-red-100 text-red-700 border border-red-300"
}

function getStatusIcon(status: OrderStatus) {
  if (status === "Nuevo") return <Clock size={16} />
  if (status === "Preparando") return <CookingPot size={16} />
  if (status === "Listo") return <PackageCheck size={16} />
  if (status === "Entregado") return <CheckCircle2 size={16} />
  return <XCircle size={16} />
}

function normalizePhoneForWhatsApp(value: string) {
  const digits = String(value || "").replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("0") && digits.length === 11) return `58${digits.slice(1)}`
  if (digits.startsWith("4") && digits.length === 10) return `58${digits}`
  if (digits.startsWith("58") && digits.length === 12) return digits
  if (!digits.startsWith("0") && digits.length >= 10 && digits.length <= 15) return digits
  return ""
}

function getCustomerPhoneLabel(order: LocalOrder) {
  const phone = String(order.customerPhone || "").trim()
  return phone || "Sin teléfono registrado"
}

function buildDeliveryProductsMessage(order: LocalOrder) {
  const exchangeRate = Number(order.exchangeRate || 0)
  if (!order.items.length) return "- Sin productos detallados"

  return order.items
    .map((item) => {
      const subtotalUSD = Number(item.price || 0) * Number(item.quantity || 0)
      const note = item.noteEnabled && item.note ? ` | Nota: ${item.note}` : ""
      if (isComboItem(item)) return `- ${item.name} x${item.quantity} - ${formatUSD(subtotalUSD)} / Ref. Bs ${formatVES(subtotalUSD * exchangeRate)}${note}`
      return `- ${item.name} x${item.quantity} - ${formatUSD(subtotalUSD)} / Ref. Bs ${formatVES(subtotalUSD * exchangeRate)}${note}`
    })
    .join("\n")
}

function buildDeliveryWhatsAppMessage(order: LocalOrder, messageType: DeliveryWhatsAppMessageType) {
  const orderTotals = getOrderTotals(order)
  const exchangeRate = Number(order.exchangeRate || 0)
  const displayNumber = getDisplayOrderNumber(order)
  const deliveryCostVES = orderTotals.deliveryCostUSD * exchangeRate
  const regularAndDeliveryVES = orderTotals.totalRegularVES + deliveryCostVES
  const customerName = order.customerName || "cliente"
  const customerPhone = getCustomerPhoneLabel(order)
  const zone = getDisplayLocation(order)
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
      `Delivery incluido: ${formatUSD(orderTotals.deliveryCostUSD)} / Ref. Bs ${formatVES(deliveryCostVES)}`,
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
      `Delivery incluido: ${formatUSD(orderTotals.deliveryCostUSD)} / Ref. Bs ${formatVES(deliveryCostVES)}`,
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
    `Combos/base divisa: ${formatUSD(orderTotals.totalCombosUSD)}`,
    `Productos normales: ${formatUSD(orderTotals.totalRegularUSD)} / Ref. Bs ${formatVES(orderTotals.totalRegularVES)}`,
    `Delivery: ${formatUSD(orderTotals.deliveryCostUSD)} / Ref. Bs ${formatVES(deliveryCostVES)}`,
    `Total final: ${formatUSD(orderTotals.totalUSD)}`,
    `Referencia en Bs de productos normales + delivery: Bs ${formatVES(regularAndDeliveryVES)}`,
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

function buildDeliveryWhatsAppUrl(order: LocalOrder, messageType: DeliveryWhatsAppMessageType) {
  const phone = normalizePhoneForWhatsApp(order.customerPhone || "")
  const message = buildDeliveryWhatsAppMessage(order, messageType)
  if (!phone) return ""
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export default function CajaPage() {
  return (
    <ModuleAccessGuard moduleKey="cashier" moduleName="Caja">
      <CajaPageContent />
    </ModuleAccessGuard>
  )
}

function CajaPageContent() {
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [orders, setOrders] = useState<LocalOrder[]>([])
  const [activeFilter, setActiveFilter] = useState<CashFilter>("Por confirmar")
  const [searchText, setSearchText] = useState("")
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<LocalOrder | null>(null)
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(EMPTY_PAYMENT_FORM)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [isSavingPayment, setIsSavingPayment] = useState(false)

  const pendingStatusRef = useRef<Map<string, OrderStatus>>(new Map())
  const isLoggedIn = adminPassword.length > 0
  const soundControls = useOperationalSounds({ adminPassword })

  useOrderSoundAlerts(orders, {
    module: "cashier",
    enabled: isLoggedIn && soundControls.isSoundEnabled,
    playSound: soundControls.playSound,
  })

  async function loadOrders(password = adminPassword, silent = false) {
    if (!password) return
    if (!silent) setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch("/api/orders", {
        headers: { "x-admin-password": password },
        cache: "no-store",
      })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.error || "No se pudieron cargar los pedidos de caja")

      let nextOrders: LocalOrder[] = data.orders || []
      nextOrders = nextOrders.map((order) => {
        const pendingStatus = pendingStatusRef.current.get(order.id)
        if (!pendingStatus) return order
        return { ...order, status: pendingStatus }
      })
      setOrders(nextOrders)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudieron cargar los pedidos de caja")
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (!adminPassword) return
    const previousOrder = orders.find((order) => order.id === orderId)
    pendingStatusRef.current.set(orderId, status)
    setErrorMessage(null)
    setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? { ...order, status } : order))

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ status }),
      })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar el pedido")

      window.setTimeout(() => {
        if (pendingStatusRef.current.get(orderId) === status) pendingStatusRef.current.delete(orderId)
        loadOrders(adminPassword, true)
      }, 600)
    } catch (error) {
      pendingStatusRef.current.delete(orderId)
      if (previousOrder) {
        setOrders((currentOrders) => currentOrders.map((order) => order.id === orderId ? previousOrder : order))
      }
      setErrorMessage(error instanceof Error ? error.message : "No se pudo actualizar el pedido")
    }
  }

  function handleLogin() {
    const password = passwordInput.trim()
    if (!password) return
    window.sessionStorage.setItem(ADMIN_STORAGE_KEY, password)
    setAdminPassword(password)
    loadOrders(password)
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
    setSearchText("")
    setActiveFilter("Por confirmar")
    setShowControls(true)
    pendingStatusRef.current = new Map()
  }

  function openPaymentModal(order: LocalOrder) {
    setSelectedPaymentOrder(order)
    setPaymentForm(createPaymentFormFromOrder(order))
    setPaymentMessage(null)
  }

  function updatePaymentForm<K extends keyof PaymentForm>(field: K, value: PaymentForm[K]) {
    setPaymentForm((currentForm) => ({ ...currentForm, [field]: value }))
    setPaymentMessage(null)
  }

  async function savePayment() {
    if (!adminPassword || !selectedPaymentOrder) return

    try {
      setIsSavingPayment(true)
      setPaymentMessage(null)
      setErrorMessage(null)

      const response = await fetch(`/api/orders/${selectedPaymentOrder.id}/payment`, {
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
          deliveryPaymentIn: paymentForm.deliveryPaymentIn,
          paymentNote: paymentForm.paymentNote,
        }),
      })
      const data = await readApiResponse(response)
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el cobro")

      const updatedOrder = data.order as LocalOrder
      setOrders((currentOrders) => currentOrders.map((order) => order.id === updatedOrder.id ? updatedOrder : order))
      setSelectedPaymentOrder(updatedOrder)
      setPaymentForm(createPaymentFormFromOrder(updatedOrder))
      setPaymentMessage("Cobro registrado correctamente.")

      window.setTimeout(() => loadOrders(adminPassword, true), 600)
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : "No se pudo registrar el cobro")
    } finally {
      setIsSavingPayment(false)
    }
  }

  useEffect(() => {
    const savedPassword = window.sessionStorage.getItem(ADMIN_STORAGE_KEY)
    if (savedPassword) {
      setAdminPassword(savedPassword)
      setPasswordInput(savedPassword)
      loadOrders(savedPassword)
    }
  }, [])

  // Caja avisa con sonido, así que en segundo plano no se detiene: sigue
  // sondeando cada 30 s para no perderse un pedido nuevo.
  useVisiblePolling(
    () => loadOrders(adminPassword, true),
    2500,
    Boolean(adminPassword),
    30000
  )

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return orders
      .filter((order) => {
        const payment = getOrderPayment(order)

        if (activeFilter === "Por confirmar") {
          return order.status === "Nuevo"
        }

        if (activeFilter === "Delivery por confirmar") {
          return isDeliveryOrder(order) && isDeliveryReported(order) && order.status === "Listo"
        }

        if (activeFilter === "Pendientes") {
          return order.status !== "Cancelado" && payment.status === "Pendiente"
        }

        if (activeFilter === "Pago parcial") {
          return order.status !== "Cancelado" && payment.status === "Pago parcial"
        }

        if (activeFilter === "Listos") {
          return order.status === "Listo"
        }

        if (activeFilter === "Completos") {
          return order.status === "Entregado" && payment.status === "Pagado"
        }

        if (activeFilter === "Delivery") {
          return order.status !== "Cancelado" && isDeliveryOrder(order)
        }

        if (activeFilter === "Pagados") {
          return order.status !== "Cancelado" && payment.status === "Pagado"
        }

        if (activeFilter === "Cancelados") {
          return order.status === "Cancelado"
        }

        return true
      })
      .filter((order) => {
        if (!query) return true
        const searchableText = [
          getDisplayOrderNumber(order),
          order.deliveryReportStatus,
          order.deliveryReportedAt,
          order.deliveryReportedBy,
          order.customerName,
          order.customerPhone,
          order.tableNumber,
          order.deliveryZone,
          order.deliveryAddress,
          order.deliveryReference,
          order.customerNote,
          order.itemsText,
          order.items.map((item) => item.name).join(" "),
          getDisplayLocation(order),
          getDisplayOrderType(order),
          order.status,
          getOrderPayment(order).status,
        ]
          .join(" ")
          .toLowerCase()
        return searchableText.includes(query)
      })
  }, [activeFilter, orders, searchText])

  const pendingPaymentCount = orders.filter((order) => getOrderPayment(order).status === "Pendiente" && order.status !== "Cancelado").length
  const partialPaymentCount = orders.filter((order) => getOrderPayment(order).status === "Pago parcial" && order.status !== "Cancelado").length
  const readyCount = orders.filter((order) => order.status === "Listo").length
  const deliveryCount = orders.filter((order) => isDeliveryOrder(order) && order.status !== "Cancelado").length
  const filteredPendingUSD = filteredOrders.reduce((total, order) => total + getOrderPayment(order).pendingUSD, 0)

  const paymentModalOrder = selectedPaymentOrder
    ? orders.find((order) => order.id === selectedPaymentOrder.id) || selectedPaymentOrder
    : null
  const paymentDraft = paymentModalOrder ? calculatePaymentDraft(paymentModalOrder, paymentForm) : null
  const currentPaymentVES = parseMoneyInput(paymentForm.amountReceivedVES)
  const currentPaymentUSD = parseMoneyInput(paymentForm.amountReceivedUSD)
  const paymentExchangeRate = Number(paymentModalOrder?.exchangeRate || 0)
  const pendingVESForPayment = paymentDraft && paymentExchangeRate > 0 ? roundMoney(paymentDraft.pendingUSD * paymentExchangeRate) : 0

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
      <LoginShell
        title="Caja"
        subtitle="Ingresa la clave del local para confirmar pedidos, registrar cobros y coordinar entregas."
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
        <header className="overflow-hidden rounded-[1.8rem] border-4 border-[#4a1600] bg-white shadow-[0_12px_0_rgba(70,20,0,0.35)]">
          <div className="h-5 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#ffbb00]" />
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <a href="/local-santo" className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100">
                    <ArrowLeft size={16} /> Panel
                  </a>
                  <button type="button" onClick={() => loadOrders()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200 disabled:opacity-50">
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Actualizar
                  </button>
                  <button
                    type="button"
                    onClick={
                      soundControls.isSoundEnabled
                        ? soundControls.deactivateSound
                        : soundControls.activateSound
                    }
                    disabled={!soundControls.businessAllowsSound}
                    className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-55 ${
                      soundControls.isSoundEnabled
                        ? "border-green-600 bg-green-100 text-green-700 hover:bg-green-200"
                        : "border-[#a00000] bg-white text-[#a00000] hover:bg-yellow-100"
                    }`}
                  >
                    {soundControls.isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    {soundControls.isSoundEnabled
                      ? "Avisos permitidos"
                      : soundControls.businessAllowsSound
                        ? "Permitir avisos en este equipo"
                        : "Sonidos desactivados por configuración"}
                  </button>
                  <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100">
                    Salir
                  </button>
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.32em] text-[#a00000]">La Bambucha</p>
                <h1 className="mt-1 text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)] sm:text-5xl">Módulo caja</h1>
                <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#3a0000]/80">
                  Caja confirma pedidos, registra pagos y decide cuándo enviar a cocina. Cuando cocina marca listo, caja puede avisar “Va saliendo” y cerrar la entrega.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-4 lg:w-[690px]">
                <MetricCard label="Pendientes" value={pendingPaymentCount} />
                <MetricCard label="Parciales" value={partialPaymentCount} tone="yellow" />
                <MetricCard label="Listos" value={readyCount} tone="soft" />
                <MetricCard label="Delivery" value={deliveryCount} tone="soft" />
              </div>
            </div>
          </div>
        </header>

        <section className="sticky top-0 z-30 mt-4 rounded-[1.4rem] border-2 border-[#4a1600] bg-white p-3 shadow-[0_8px_0_rgba(70,20,0,0.28)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Controles de caja
              </p>
              <p className="mt-1 text-xs font-bold text-[#3a0000]/70">
                {filteredOrders.length} pedido(s) en pantalla · Pendiente visible {formatUSD(filteredPendingUSD)} · {activeFilter}
                {searchText.trim() ? ` · Búsqueda: ${searchText.trim()}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => loadOrders()} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200 disabled:opacity-50">
                {isLoading ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
                Actualizar
              </button>

              <button
                type="button"
                onClick={() => setShowControls((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-100"
              >
                {showControls ? <EyeOff size={17} /> : <Eye size={17} />}
                {showControls ? "Ocultar filtros" : "Mostrar filtros"}
              </button>
            </div>
          </div>

          {showControls ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a00000]" />
                  <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Buscar por pedido, cliente, teléfono, mesa, zona o producto" className="w-full rounded-full border-2 border-[#a00000]/30 bg-[#ffffff] px-11 py-3 text-sm font-bold text-[#3a0000] outline-none placeholder:text-[#3a0000]/45 focus:border-[#a00000]" />
                </div>
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {CASH_FILTERS.map((filter) => {
                    const isActive = activeFilter === filter
                    return (
                      <button key={filter} type="button" onClick={() => setActiveFilter(filter)} className={`shrink-0 rounded-full border-2 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] transition ${isActive ? "border-[#a00000] bg-yellow-300 text-[#4a0000]" : "border-[#a00000] bg-white text-[#a00000] hover:bg-yellow-100"}`}>
                        {filter}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <MiniMetric label="En pantalla" value={filteredOrders.length} />
                <MiniMetric label="Pendiente visible" value={formatUSD(filteredPendingUSD)} />
                <MiniMetric label="Filtro" value={activeFilter} />
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border-2 border-[#a00000]/20 bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/80">
              Filtros ocultos · {filteredOrders.length} pedido(s) en pantalla · Pendiente visible {formatUSD(filteredPendingUSD)} · {activeFilter}
              {searchText.trim() ? ` · Búsqueda: ${searchText.trim()}` : ""}
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 rounded-2xl border-2 border-red-500/35 bg-red-100 px-4 py-3">
              <p className="text-sm font-bold leading-6 text-red-800">{errorMessage}</p>
            </div>
          )}
        </section>

        {filteredOrders.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border-2 border-[#4a1600] bg-white px-6 py-14 text-center shadow-[0_8px_0_rgba(70,20,0,0.30)]">
            <img src="/logo-bambucha.png" alt="La Bambucha Grill Burger" className="mx-auto h-28 w-28 object-contain" />
            <h2 className="mt-5 text-3xl font-black uppercase text-[#a00000]">Sin pedidos para caja</h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-[#3a0000]/80">Cambia el filtro o espera nuevos pedidos.</p>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 xl:grid-cols-2">
            {filteredOrders.map((order) => (
              <CashOrderCard
                key={order.id}
                order={order}
                onOpenPayment={() => openPaymentModal(order)}
                onSendToKitchen={() => updateStatus(order.id, "Preparando")}
                onMarkDelivered={() => updateStatus(order.id, "Entregado")}
                onCancelOrder={() => updateStatus(order.id, "Cancelado")}
              />
            ))}
          </section>
        )}
      </div>

      {paymentModalOrder && paymentDraft && (
        <ModalShell title="Registrar cobro" onClose={() => {
          if (!isSavingPayment) {
            setSelectedPaymentOrder(null)
            setPaymentForm(EMPTY_PAYMENT_FORM)
            setPaymentMessage(null)
          }
        }}>
          <div className="space-y-4">
            <div className="rounded-[1.4rem] border-2 border-[#a00000]/30 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                {getDisplayOrderNumber(paymentModalOrder)} · {paymentModalOrder.customerName || "Cliente"}
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/80">
                Registra el dinero recibido por caja. El sistema calcula si queda pagado, parcial o pendiente.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <InfoBox label="Total pedido" value={formatUSD(paymentDraft.totalOrderUSD)} />
              <InfoBox label="Recibido equiv." value={formatUSD(paymentDraft.receivedEquivalentUSD)} />
              <InfoBox label="Pendiente" value={formatUSD(paymentDraft.pendingUSD)} />
            </div>

            {paymentDraft.status !== "Pagado" && (
              <div className="rounded-[1.4rem] border-2 border-yellow-400 bg-yellow-100 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a5a00]">Ayuda rápida</p>
                <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/85">
                  Pendiente actual: {formatUSD(paymentDraft.pendingUSD)}. En bolívares serían Bs {formatVES(pendingVESForPayment)} según la tasa del pedido.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={completePaymentPendingInVES} disabled={paymentDraft.pendingUSD <= 0 || paymentExchangeRate <= 0} className="rounded-full border-2 border-[#a00000] bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50">Completar pendiente en Bs</button>
                  <button type="button" onClick={completePaymentPendingInUSD} disabled={paymentDraft.pendingUSD <= 0} className="rounded-full border-2 border-[#a00000] bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] disabled:opacity-50">Completar pendiente en divisas</button>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <InputBox label="Monto recibido en divisas" value={paymentForm.amountReceivedUSD} onChange={(value) => updatePaymentForm("amountReceivedUSD", value)} placeholder="Ej: 35.00" />
              <SelectBox label="Método en divisas" value={paymentForm.paymentMethodUSD} onChange={(value) => updatePaymentForm("paymentMethodUSD", value)} options={PAYMENT_METHOD_USD_OPTIONS} emptyLabel="Sin registrar" />
              <InputBox label="Monto recibido en bolívares reales" value={paymentForm.amountReceivedVES} onChange={(value) => updatePaymentForm("amountReceivedVES", value)} placeholder="Ej: 1569.25 o 1569,25" helper="Escribe el monto real en bolívares, no el equivalente en dólares." />
              <SelectBox label="Método en bolívares" value={paymentForm.paymentMethodVES} onChange={(value) => updatePaymentForm("paymentMethodVES", value)} options={PAYMENT_METHOD_VES_OPTIONS} emptyLabel="Sin registrar" />
            </div>

            <SelectBox label="Delivery pagado en" value={paymentForm.deliveryPaymentIn} onChange={(value) => updatePaymentForm("deliveryPaymentIn", value as DeliveryPaymentIn)} options={DELIVERY_PAYMENT_OPTIONS} />

            <div>
              <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">Nota de pago</label>
              <textarea value={paymentForm.paymentNote} onChange={(event) => updatePaymentForm("paymentNote", event.target.value)} placeholder="Ejemplo: Cliente pagó productos mixto y delivery por pago móvil." rows={4} className="mt-2 w-full resize-none rounded-2xl border-2 border-[#a00000]/30 bg-white px-4 py-4 text-base font-bold text-[#3a0000] outline-none focus:border-[#a00000]" />
            </div>

            {paymentMessage && (
              <div className="rounded-2xl border-2 border-[#a00000]/25 bg-white px-4 py-3">
                <p className="text-sm font-black text-[#3a0000]">{paymentMessage}</p>
              </div>
            )}

            <button type="button" onClick={savePayment} disabled={isSavingPayment} className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] disabled:opacity-50">
              {isSavingPayment && <Loader2 size={18} className="animate-spin" />}
              Guardar cobro
            </button>
          </div>
        </ModalShell>
      )}
    </main>
  )
}

function CashOrderCard({
  order,
  onOpenPayment,
  onSendToKitchen,
  onMarkDelivered,
  onCancelOrder,
}: {
  order: LocalOrder
  onOpenPayment: () => void
  onSendToKitchen: () => void
  onMarkDelivered: () => void
  onCancelOrder: () => void
}) {
  const orderTotals = getOrderTotals(order)
  const payment = getOrderPayment(order)
  const isDelivery = isDeliveryOrder(order)
  const deliveryReported = isDeliveryReported(order)
  const phone = normalizePhoneForWhatsApp(order.customerPhone || "")
  const comboItems = order.items.filter(isComboItem)
  const regularItems = order.items.filter((item) => !isComboItem(item))

  return (
    <article className="overflow-hidden rounded-[1.6rem] border-2 border-[#4a1600] bg-white shadow-[0_8px_0_rgba(70,20,0,0.30)]">
      <div className="border-b-2 border-[#a00000] bg-[#ffffff] px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-4xl font-black leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">{getDisplayOrderNumber(order)}</p>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black uppercase ${getStatusStyle(order.status)}`}>{getStatusIcon(order.status)}{order.status === "Nuevo" ? "Por confirmar" : order.status}</span>
              <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black uppercase ${getPaymentStatusStyle(payment.status)}`}>{payment.status}</span>
              {isDelivery && <span className="inline-flex items-center gap-2 rounded-full bg-[#a00000] px-3 py-1.5 text-xs font-black uppercase text-white"><Truck size={15} />Delivery</span>}
              {deliveryReported && <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-black uppercase text-green-700"><PackageCheck size={15} />Entrega reportada</span>}
            </div>
            <p className="mt-2 text-xs font-bold text-[#3a0000]/80">{formatDate(order.createdAt)} · {getDisplayOrderType(order)} · {getDisplayLocation(order)}</p>
          </div>

          <div className="rounded-2xl border-2 border-[#a00000] bg-white px-4 py-3 text-right">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#a00000]">Total</p>
            <p className="mt-1 text-2xl font-black text-[#220000]">{formatUSD(orderTotals.totalUSD)}</p>
            {payment.pendingUSD > 0 && <p className="mt-1 text-xs font-black text-red-700">Pendiente {formatUSD(payment.pendingUSD)}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {deliveryReported && (
          <div className="rounded-[1.4rem] border-2 border-green-600 bg-green-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">Delivery por confirmar</p>
            <p className="mt-2 text-sm font-bold leading-6 text-[#234000]">
              Entrega reportada por {order.deliveryReportedBy || "Delivery"}. Caja debe revisar cobro/estado y presionar “Confirmar entregado”.
            </p>
            {order.deliveryReportedAt && (
              <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-green-700">
                Reportado: {formatDate(order.deliveryReportedAt)}
              </p>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoBox label="Cliente" value={order.customerName || "Cliente"} />
          <InfoBox label={isDelivery ? "Zona" : "Mesa / ubicación"} value={getDisplayLocation(order)} />
          <InfoBox label="Cobrado equiv." value={formatUSD(payment.receivedEquivalentUSD)} />
          <InfoBox label="Pendiente" value={formatUSD(payment.pendingUSD)} />
        </div>

        {isDelivery && (
          <div className="rounded-[1.4rem] border-2 border-[#a00000]/30 bg-[#fff7e8] p-4">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#a00000]"><Truck size={16} />Datos delivery</p>
            <div className="mt-3 grid gap-2 text-sm font-bold leading-6 text-[#3a0000]/90">
              <p className="rounded-2xl bg-white px-3 py-2"><strong>Teléfono:</strong> {order.customerPhone || "Sin teléfono"}</p>
              <p className="rounded-2xl bg-white px-3 py-2"><strong>Dirección:</strong> {order.deliveryAddress || "Sin dirección"}</p>
              <p className="rounded-2xl bg-white px-3 py-2"><strong>Referencia:</strong> {order.deliveryReference || "Sin referencia"}</p>
              <p className="rounded-2xl bg-white px-3 py-2"><strong>Delivery:</strong> {formatUSD(orderTotals.deliveryCostUSD)} / Bs {formatVES(orderTotals.deliveryCostUSD * Number(order.exchangeRate || 0))}</p>
            </div>

            {phone ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <WhatsAppButton href={buildDeliveryWhatsAppUrl(order, "confirm")} label="Confirmar" />
                <WhatsAppButton href={buildDeliveryWhatsAppUrl(order, "preparing")} label="Preparación" />
                <WhatsAppButton href={buildDeliveryWhatsAppUrl(order, "onTheWay")} label="Va saliendo" dark />
              </div>
            ) : (
              <p className="mt-3 rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-3 py-2 text-xs font-black text-[#8a5a00]">Este delivery no tiene teléfono válido para WhatsApp.</p>
            )}
          </div>
        )}

        <div className="rounded-[1.4rem] border-2 border-[#a00000]/30 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">Productos</p>
          <div className="mt-3 space-y-2">
            {comboItems.length > 0 && <ProductGroup title="Combos" items={comboItems} exchangeRate={order.exchangeRate} onlyCurrency />}
            {regularItems.length > 0 && <ProductGroup title="Productos normales" items={regularItems} exchangeRate={order.exchangeRate} />}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={onOpenPayment} className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200">
            <CreditCard size={17} /> Registrar cobro
          </button>

          {order.status === "Nuevo" && (
            <button type="button" onClick={onSendToKitchen} className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-[#a00000] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#7a0000]">
              <Send size={17} /> Pedido confirmado / enviar a cocina
            </button>
          )}

          {order.status === "Preparando" && (
            <div className="rounded-full border-2 border-orange-400 bg-orange-100 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-[#8a5a00]">
              En cocina
            </div>
          )}

          {order.status === "Listo" && (
            <button type="button" onClick={onMarkDelivered} className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-green-600 bg-green-500 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#220000] transition hover:bg-green-400">
              <CheckCircle2 size={17} /> Confirmar entregado
            </button>
          )}

          {order.status === "Entregado" && (
            <div className="rounded-full border-2 border-green-600 bg-green-50 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-green-700">
              Pedido entregado
            </div>
          )}

          {order.status === "Cancelado" && (
            <div className="rounded-full border-2 border-[#220000] bg-[#220000] px-5 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-white">
              Pedido cancelado
            </div>
          )}

          {order.status !== "Cancelado" && order.status !== "Entregado" && (
            <button
              type="button"
              onClick={() => {
                const shouldCancel = window.confirm(
                  "¿Seguro que quieres cancelar este pedido? Quedará registrado como Cancelado para el cierre del día."
                )

                if (shouldCancel) {
                  onCancelOrder()
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#220000] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#220000] transition hover:bg-red-50 hover:text-red-700"
            >
              <XCircle size={17} />
              Cancelar pedido
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function WhatsAppButton({ href, label, dark, green }: { href: string; label: string; dark?: boolean; green?: boolean }) {
  const className = green
    ? "border-green-600 bg-green-500 text-[#220000] hover:bg-green-400"
    : dark
      ? "border-[#a00000] bg-[#a00000] text-white hover:bg-[#7a0000]"
      : "border-[#a00000] bg-white text-[#a00000] hover:bg-yellow-100"

  return (
    <a href={href} target="_blank" rel="noreferrer" className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${className}`}>
      <MessageCircle size={16} /> {label}
    </a>
  )
}

function ProductGroup({ title, items, exchangeRate, onlyCurrency }: { title: string; items: CartItem[]; exchangeRate: number; onlyCurrency?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#a00000]/25 bg-[#fff7e8] p-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#a00000]">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => {
          const subtotal = Number(item.price || 0) * Number(item.quantity || 0)
          const subtotalVES = subtotal * Number(exchangeRate || 0)
          return (
            <div key={`${item.id}-${item.name}-${index}`} className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#220000]">
              <div className="flex items-start justify-between gap-3">
                <p>{item.name} x{item.quantity}</p>
                <p className="shrink-0 font-black text-[#a00000]">{formatUSD(subtotal)}</p>
              </div>
              <p className="mt-1 text-xs font-bold text-[#3a0000]/70">Bs {formatVES(subtotalVES)}</p>
              {item.noteEnabled && item.note && <p className="mt-1 text-xs font-bold text-[#3a0000]/80">Nota: {item.note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InputBox({ label, value, onChange, placeholder, helper }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; helper?: string }) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">{label}</label>
      <input type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/30 bg-white px-4 py-4 text-base font-bold text-[#3a0000] outline-none focus:border-[#a00000]" />
      {helper && <p className="mt-2 text-xs font-bold leading-5 text-[#3a0000]/70">{helper}</p>}
    </div>
  )
}

function SelectBox({ label, value, onChange, options, emptyLabel = "Sin registrar" }: { label: string; value: string; onChange: (value: string) => void; options: string[]; emptyLabel?: string }) {
  return (
    <div>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-2xl border-2 border-[#a00000]/30 bg-white px-4 py-4 text-base font-bold text-[#3a0000] outline-none focus:border-[#a00000]">
        {value && !options.includes(value) && <option value={value}>{value}</option>}
        {options.map((option) => <option key={option || `${label}-empty`} value={option}>{option || emptyLabel}</option>)}
      </select>
    </div>
  )
}

function MetricCard({ label, value, tone = "red" }: { label: string; value: string | number; tone?: "red" | "yellow" | "soft" }) {
  const style = tone === "yellow" ? "border-yellow-400 bg-yellow-100 text-[#8a5a00]" : tone === "soft" ? "border-[#a00000]/30 bg-white text-[#3a0000]" : "border-[#a00000] bg-[#fff7e8] text-[#a00000]"
  return <div className={`rounded-[1.2rem] border-2 p-3 ${style}`}><p className="text-[0.62rem] font-black uppercase tracking-[0.16em]">{label}</p><p className="mt-1 text-2xl font-black">{value}</p></div>
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-[#a00000]/25 bg-[#fff7e8] px-3 py-2"><p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#a00000]">{label}</p><p className="mt-1 break-words text-sm font-black text-[#220000]">{value}</p></div>
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[1.2rem] border-2 border-[#a00000]/30 bg-[#fff7e8] p-3"><p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#a00000]">{label}</p><p className="mt-1 break-words text-sm font-black text-[#220000]">{value || "—"}</p></div>
}

function ModalShell({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#220000]/60 px-4 py-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border-4 border-[#a00000] bg-[#fff7e8] text-[#220000] shadow-2xl shadow-black/45">
        <div className="h-5 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#ffbb00]" />
        <div className="flex items-start justify-between gap-4 border-b-2 border-[#a00000] bg-white px-6 py-5">
          <h2 className="text-3xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#a00000] bg-yellow-300 text-[#4a0000]"><X size={24} /></button>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  )
}

function LoginShell({ title, subtitle, passwordInput, setPasswordInput, showPassword, setShowPassword, handleLogin, errorMessage }: { title: string; subtitle: string; passwordInput: string; setPasswordInput: (value: string) => void; showPassword: boolean; setShowPassword: (value: boolean) => void; handleLogin: () => void; errorMessage: string | null }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff7e8] px-4 py-8 text-[#220000]">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-[#a00000] bg-white shadow-[0_12px_0_rgba(70,20,0,0.35)]">
        <div className="h-6 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#ffbb00]" />
        <div className="px-6 py-6">
          <a href="/local-santo" className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#a00000]"><ArrowLeft size={16} />Volver</a>
          <img src="/logo-bambucha.png" alt="La Bambucha Grill Burger" className="mx-auto mt-6 h-28 w-28 object-contain" />
          <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.28em] text-[#a00000]">Acceso privado</p>
          <h1 className="mt-2 text-center text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">{title}</h1>
          <p className="mt-3 text-center text-sm font-bold leading-6 text-[#3a0000]/85">{subtitle}</p>
        </div>
        <div className="space-y-4 px-6 pb-6">
          <div>
            <label className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">Clave de acceso</label>
            <div className="relative mt-2">
              <input type={showPassword ? "text" : "password"} value={passwordInput} onChange={(event) => setPasswordInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleLogin() }} placeholder="Ingresa la clave del local" className="w-full rounded-2xl border-2 border-[#a00000]/30 bg-[#fff7e8] px-4 py-4 pr-12 text-base font-bold text-[#3a0000] outline-none placeholder:text-[#3a0000]/45 focus:border-[#a00000]" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#a00000]/10 text-[#4a0000]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          {errorMessage && <div className="rounded-2xl border-2 border-red-500/35 bg-red-100 px-4 py-3"><p className="text-sm font-bold leading-6 text-red-800">{errorMessage}</p></div>}
          <button type="button" onClick={handleLogin} className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] shadow-[0_6px_0_rgba(160,0,0,0.18)] transition hover:scale-[1.02]"><LogIn size={21} />Entrar</button>
        </div>
      </div>
    </main>
  )
}
