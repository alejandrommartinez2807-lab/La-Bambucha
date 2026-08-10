"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useVisiblePolling } from "@/hooks/useVisiblePolling"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MapPin,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from "lucide-react"
import { formatUSD, formatVES } from "@/utils/formatCurrency"
import ModuleAccessGuard from "@/components/ModuleAccessGuard"
import { useVisiblePolling } from "@/hooks/useVisiblePolling"

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
type DeliveryReportStatus = "Sin reportar" | "Entrega reportada"
type DeliveryFilter = "Activos" | "Listos" | "Reportados" | "Todos"
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

const ADMIN_STORAGE_KEY = "santo_perrito_owner_session"

const deliveryFilters: DeliveryFilter[] = [
  "Activos",
  "Listos",
  "Reportados",
  "Todos",
]

function roundMoney(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue)) {
    return 0
  }

  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function isComboItem(item: CartItem) {
  return item.paymentMode === "divisa" || item.category === "Combos"
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

function getDisplayTableNumber(order: LocalOrder) {
  const cleanZone = String(order.deliveryZone || "").trim()
  const cleanTableNumber = cleanDeliveryLocation(String(order.tableNumber || ""))

  return cleanZone || cleanTableNumber || "Delivery"
}

function getOrderDeliveryCost(order: LocalOrder) {
  const savedCost = Number(order.deliveryCostUSD || 0)

  if (savedCost > 0) return savedCost

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

  const totalRegularVES = hasReadableItems
    ? totalRegularUSD * exchangeRate
    : Number(order.totalRegularVES ?? order.totalVES ?? totalRegularUSD * exchangeRate)

  const totalBeforeDeliveryUSD = totalCombosUSD + totalRegularUSD
  const totalUSD = totalBeforeDeliveryUSD + deliveryCostUSD

  return {
    totalUSD: roundMoney(totalUSD),
    totalCombosUSD: roundMoney(totalCombosUSD),
    totalRegularUSD: roundMoney(totalRegularUSD),
    totalRegularVES: roundMoney(totalRegularVES),
    deliveryCostUSD: roundMoney(deliveryCostUSD),
    totalBeforeDeliveryUSD: roundMoney(totalBeforeDeliveryUSD),
  }
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
  if (normalized.includes("binance")) return "Binance"
  if (normalized.includes("usdt") || normalized.includes("tether")) return "USDT"

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

function normalizePhoneForWhatsApp(value: string) {
  const digits = String(value || "").replace(/\D/g, "")

  if (!digits) return ""

  if (digits.startsWith("0") && digits.length === 11) {
    return `58${digits.slice(1)}`
  }

  if (digits.startsWith("4") && digits.length === 10) {
    return `58${digits}`
  }

  if (digits.startsWith("58") && digits.length === 12) {
    return digits
  }

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

      if (isComboItem(item)) {
        return `- ${item.name} x${item.quantity} - ${formatUSD(subtotalUSD)} | Base en divisas${note}`
      }

      return `- ${item.name} x${item.quantity} - ${formatUSD(
        subtotalUSD
      )} / Ref. Bs ${formatVES(subtotalUSD * exchangeRate)}${note}`
    })
    .join("\n")
}

type DeliveryWhatsAppMessageType = "confirm" | "preparing" | "onTheWay" | "arrived"

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
      "Hola, somos Santo Perrito.",
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
      "Hola, somos Santo Perrito.",
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
      `Hola, ${customerName}. Soy el delivery de Santo Perrito. Ya estoy en la ubicación que nos indicaste para entregarte tu pedido. Cuando puedas, por favor acércate para recibirlo. ¡Gracias por tu compra!`,
    ].join("\n")
  }

  return [
    "Hola, somos Santo Perrito.",
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
    `Productos normales: ${formatUSD(
      orderTotals.totalRegularUSD
    )} / Ref. Bs ${formatVES(orderTotals.totalRegularVES)}`,
    `Delivery: ${formatUSD(orderTotals.deliveryCostUSD)} / Ref. Bs ${formatVES(
      deliveryCostVES
    )}`,
    `Total final: ${formatUSD(orderTotals.totalUSD)}`,
    `Referencia en Bs de productos normales + delivery: Bs ${formatVES(
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

function getPaymentStatusStyle(status: PaymentStatus) {
  if (status === "Pagado") return "bg-green-500 text-white"
  if (status === "Pago parcial") return "bg-yellow-300 text-[#3a0000]"

  return "bg-red-100 text-red-700 border border-red-300"
}

function getStatusIcon(status: OrderStatus) {
  if (status === "Nuevo") return <Clock size={16} />
  if (status === "Preparando") return <Truck size={16} />
  if (status === "Listo") return <PackageCheck size={16} />
  if (status === "Entregado") return <CheckCircle2 size={16} />

  return <XCircle size={16} />
}

function shouldShowAsActive(order: LocalOrder) {
  return order.status !== "Entregado" && order.status !== "Cancelado"
}

function isDeliveryReported(order: LocalOrder) {
  return order.deliveryReportStatus === "Entrega reportada"
}

function getDeliveryStageLabel(order: LocalOrder) {
  if (order.status === "Nuevo") return "Esperando confirmación de caja"
  if (order.status === "Preparando") return "En preparación"
  if (order.status === "Listo" && isDeliveryReported(order)) return "Entrega reportada a caja"
  if (order.status === "Listo") return "Listo para coordinar salida"
  if (order.status === "Entregado") return "Entregado"
  if (order.status === "Cancelado") return "Cancelado"

  return "Delivery"
}

function buildSearchText(order: LocalOrder) {
  return [
    order.id,
    getDisplayOrderNumber(order),
    order.customerName,
    order.customerPhone,
    order.deliveryAddress,
    order.deliveryReference,
    order.deliveryZone,
    order.tableNumber,
    order.paymentMethod,
    order.status,
    order.deliveryReportStatus,
    order.deliveryReportedAt,
    order.deliveryReportedBy,
    getDeliveryStageLabel(order),
    order.items.map((item) => item.name).join(" "),
  ]
    .join(" ")
    .toLowerCase()
}


export default function DeliveryPage() {
  return (
    <ModuleAccessGuard moduleKey="delivery" moduleName="Delivery">
      <DeliveryPageContent />
    </ModuleAccessGuard>
  )
}

function DeliveryPageContent() {
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [orders, setOrders] = useState<LocalOrder[]>([])
  const [activeFilter, setActiveFilter] = useState<DeliveryFilter>("Activos")
  const [searchTerm, setSearchTerm] = useState("")
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [highlightedIds, setHighlightedIds] = useState<string[]>([])
  const [reportingOrderIds, setReportingOrderIds] = useState<string[]>([])

  const knownReadyIdsRef = useRef<Set<string>>(new Set())
  const hasLoadedOnceRef = useRef(false)
  const pendingStatusRef = useRef<Map<string, OrderStatus>>(new Map())

  const isLoggedIn = adminPassword.length > 0
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

      const nextDeliveryOrders = nextOrders.filter(isDeliveryOrder)
      const nextReadyIds = new Set(
        nextDeliveryOrders
          .filter((order) => order.status === "Listo")
          .map((order) => order.id)
      )

      if (hasLoadedOnceRef.current) {
        const previousReadyIds = knownReadyIdsRef.current
        const newReadyOrders = nextDeliveryOrders.filter(
          (order) => order.status === "Listo" && !previousReadyIds.has(order.id)
        )

        if (newReadyOrders.length > 0) {
          const newestOrder = newReadyOrders[0]
          const newIds = newReadyOrders.map((order) => order.id)

          setHighlightedIds(newIds)
          setToastMessage(
            `${getDisplayOrderNumber(newestOrder)} está listo para coordinar salida.`
          )
          window.setTimeout(() => {
            setHighlightedIds([])
          }, 12000)

          window.setTimeout(() => {
            setToastMessage(null)
          }, 9000)
        }
      }

      knownReadyIdsRef.current = nextReadyIds
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
    setToastMessage(null)
    setSearchTerm("")
    setActiveFilter("Activos")
    setShowControls(true)
    knownReadyIdsRef.current = new Set()
    hasLoadedOnceRef.current = false
    pendingStatusRef.current = new Map()
    setReportingOrderIds([])
  }

  async function reportDeliveryToCashier(order: LocalOrder) {
    if (!adminPassword) return

    if (order.status !== "Listo") {
      setErrorMessage("Solo puedes reportar a caja pedidos que estén en estado Listo.")
      return
    }

    if (isDeliveryReported(order)) {
      setToastMessage("Esta entrega ya fue reportada a caja.")
      return
    }

    const now = new Date().toISOString()

    setErrorMessage(null)
    setReportingOrderIds((currentIds) =>
      currentIds.includes(order.id) ? currentIds : [...currentIds, order.id]
    )

    setOrders((currentOrders) =>
      currentOrders.map((currentOrder) =>
        currentOrder.id === order.id
          ? {
              ...currentOrder,
              deliveryReportStatus: "Entrega reportada",
              deliveryReportedAt: now,
              deliveryReportedBy: "Delivery",
            }
          : currentOrder
      )
    )

    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ action: "reportDelivery" }),
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo reportar la entrega a caja")
      }

      const updatedOrder = data.order as LocalOrder

      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === updatedOrder.id ? updatedOrder : currentOrder
        )
      )

      setToastMessage("Entrega reportada a caja. El pedido sigue como Listo hasta que Caja confirme Entregado.")
      window.setTimeout(() => loadOrders(adminPassword, true), 600)
    } catch (error) {
      setOrders((currentOrders) =>
        currentOrders.map((currentOrder) =>
          currentOrder.id === order.id ? order : currentOrder
        )
      )
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo reportar la entrega a caja"
      )
    } finally {
      setReportingOrderIds((currentIds) => currentIds.filter((id) => id !== order.id))
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

  // Delivery no tiene avisos sonoros: con la pestaña oculta se detiene del
  // todo y refresca al instante al volver al frente.
  useVisiblePolling(
    () => loadOrders(adminPassword, true),
    2500,
    Boolean(adminPassword)
  )

  const deliveryOrders = useMemo(() => orders.filter(isDeliveryOrder), [orders])

  const filteredOrders = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase()

    return deliveryOrders.filter((order) => {
      if (activeFilter === "Activos" && !shouldShowAsActive(order)) return false
      if (activeFilter === "Listos" && order.status !== "Listo") return false
      if (activeFilter === "Reportados" && !isDeliveryReported(order)) return false

      if (!cleanSearch) return true

      return buildSearchText(order).includes(cleanSearch)
    })
  }, [deliveryOrders, activeFilter, searchTerm])

  const metrics = useMemo(() => {
    const active = deliveryOrders.filter(shouldShowAsActive)
    const ready = deliveryOrders.filter((order) => order.status === "Listo")
    const preparing = deliveryOrders.filter((order) => order.status === "Preparando")
    const unconfirmed = deliveryOrders.filter((order) => order.status === "Nuevo")
    const delivered = deliveryOrders.filter((order) => order.status === "Entregado")
    const pendingPayment = deliveryOrders.filter((order) => {
      const payment = getOrderPayment(order)

      return payment.status !== "Pagado"
    })
    const withoutPhone = deliveryOrders.filter(
      (order) => !normalizePhoneForWhatsApp(order.customerPhone || "")
    )

    const filteredTotal = filteredOrders.reduce(
      (total, order) => total + getOrderTotals(order).totalUSD,
      0
    )

    const filteredDelivery = filteredOrders.reduce(
      (total, order) => total + getOrderTotals(order).deliveryCostUSD,
      0
    )

    return {
      active: active.length,
      ready: ready.length,
      preparing: preparing.length,
      unconfirmed: unconfirmed.length,
      delivered: delivered.length,
      pendingPayment: pendingPayment.length,
      withoutPhone: withoutPhone.length,
      filteredTotal: roundMoney(filteredTotal),
      filteredDelivery: roundMoney(filteredDelivery),
    }
  }, [deliveryOrders, filteredOrders])



  if (!isLoggedIn) {
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
              src="/logoremovebg.png"
              alt="Santo Perrito"
              className="mx-auto mt-6 h-28 w-28 object-contain"
            />

            <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.28em] text-[#a00000]">
              Acceso privado
            </p>

            <h1 className="mt-2 text-center text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
              Delivery
            </h1>

            <p className="mt-3 text-center text-sm font-bold leading-6 text-[#3a0000]/75">
              Ingresa la clave autorizada para coordinar pedidos delivery del local.
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

            <button
              type="button"
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#a00000] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] shadow-[0_6px_0_rgba(160,0,0,0.18)] transition hover:scale-[1.02]"
            >
              <LogIn size={21} />
              Entrar a delivery
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fff7e8] px-3 py-4 text-[#220000] sm:px-6 lg:px-8">
      {toastMessage && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-[1.4rem] border-2 border-[#a00000] bg-white p-4 shadow-2xl shadow-black/20">
          <div className="flex gap-3">
            <Truck className="mt-1 text-[#a00000]" size={24} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Delivery
              </p>
              <p className="mt-1 text-sm font-black leading-6 text-[#220000]">
                {toastMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[1.6rem] border-4 border-[#a00000] bg-white shadow-[0_10px_0_rgba(160,0,0,0.12)]">
          <div className="h-5 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#fff7e8]" />

          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
                  >
                    Salir
                  </button>
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.32em] text-[#a00000]">
                  Santo Perrito
                </p>

                <h1 className="mt-1 text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)] sm:text-5xl">
                  Módulo delivery
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#3a0000]/75">
                  Aquí solo aparecen pedidos delivery. Coordina datos del cliente,
                  WhatsApp y ruta sin acceso a caja, cocina ni panel general.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-4 lg:w-[650px]">
                <MetricCard label="Activos" value={metrics.active} />
                <MetricCard label="Entregados" value={metrics.delivered} />
                <MetricCard label="Listos" value={metrics.ready} tone="yellow" />
                <MetricCard label="Sin teléfono" value={metrics.withoutPhone} />
              </div>
            </div>
          </div>
        </header>

        <section className="sticky top-0 z-30 mt-4 rounded-[1.4rem] border-2 border-[#a00000] bg-white p-3 shadow-[0_8px_0_rgba(160,0,0,0.10)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                Controles de delivery
              </p>
              <p className="mt-1 text-xs font-bold text-[#3a0000]/65">
                {filteredOrders.length} delivery(s) en pantalla · Total {formatUSD(metrics.filteredTotal)} · Delivery {formatUSD(metrics.filteredDelivery)} · {activeFilter}
                {searchTerm.trim() ? ` · Búsqueda: ${searchTerm.trim()}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadOrders()}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:scale-105"
              >
                {isLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <RefreshCw size={17} />
                )}
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
                <div className="relative w-full lg:max-w-xl">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a00000]" size={18} />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar por cliente, teléfono, zona, dirección, pedido o producto"
                    className="w-full rounded-full border-2 border-[#a00000]/25 bg-[#fff7e8] px-12 py-3 text-sm font-black text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#a00000]"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {deliveryFilters.map((filter) => {
                    const isActive = activeFilter === filter

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={`shrink-0 rounded-full border-2 px-4 py-2.5 text-xs font-black uppercase transition ${
                          isActive
                            ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
                            : "border-[#a00000] bg-white text-[#a00000] hover:bg-yellow-100"
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-4">
                <InfoBox label="En pantalla" value={String(filteredOrders.length)} />
                <InfoBox label="Total pantalla" value={formatUSD(metrics.filteredTotal)} />
                <InfoBox label="Delivery pantalla" value={formatUSD(metrics.filteredDelivery)} />
                <InfoBox label="Pendientes pago" value={String(metrics.pendingPayment)} />
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-2xl border-2 border-[#a00000]/15 bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#3a0000]/70">
              Filtros ocultos · {filteredOrders.length} delivery(s) en pantalla · Total {formatUSD(metrics.filteredTotal)} · Delivery {formatUSD(metrics.filteredDelivery)} · {activeFilter}
              {searchTerm.trim() ? ` · Búsqueda: ${searchTerm.trim()}` : ""}
            </div>
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
              src="/logoremovebg.png"
              alt="Santo Perrito"
              className="mx-auto h-28 w-28 object-contain"
            />

            <h2 className="mt-5 text-3xl font-black uppercase text-[#a00000]">
              Sin deliveries para mostrar
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-[#3a0000]/70">
              Los pedidos delivery aparecerán aquí cuando el cliente los registre
              o cuando coincidan con el filtro seleccionado.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 xl:grid-cols-2">
            {filteredOrders.map((order) => {
              const orderTotals = getOrderTotals(order)
              const orderPayment = getOrderPayment(order)
              const displayNumber = getDisplayOrderNumber(order)
              const displayZone = getDisplayTableNumber(order)
              const phone = normalizePhoneForWhatsApp(order.customerPhone || "")
              const hasAddress = Boolean(String(order.deliveryAddress || "").trim())
              const isHighlighted = highlightedIds.includes(order.id)
              const deliveryReported = isDeliveryReported(order)
              const isReporting = reportingOrderIds.includes(order.id)
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
                            {displayNumber}
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
                        </div>

                        <p className="mt-2 text-xs font-bold text-[#3a0000]/70">
                          {formatDate(order.createdAt)} · {getDeliveryStageLabel(order)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-black leading-none text-[#220000]">
                          {formatUSD(orderTotals.totalUSD)}
                        </p>
                        <p className="mt-1 text-xs font-black text-[#a00000]">
                          Delivery {formatUSD(orderTotals.deliveryCostUSD)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoBox label="Cliente" value={order.customerName || "Cliente"} />
                      <InfoBox label="Zona" value={displayZone} />
                      <InfoBox label="Teléfono" value={order.customerPhone || "Sin teléfono"} />
                      <InfoBox label="Método indicado" value={order.paymentMethod || "Por confirmar"} />
                    </div>

                    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
                      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                        <MapPin size={16} />
                        Dirección de entrega
                      </p>
                      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-[#3a0000]/80">
                        <strong>Dirección:</strong> {order.deliveryAddress || "Sin dirección registrada"}
                      </p>
                      <p className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-[#3a0000]/80">
                        <strong>Referencia:</strong> {order.deliveryReference || "Sin referencia registrada"}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {!phone && (
                        <WarningBox
                          title="Teléfono no válido"
                          text="Este pedido no puede abrir WhatsApp hasta corregir o confirmar el número del cliente."
                        />
                      )}

                      {!hasAddress && (
                        <WarningBox
                          title="Dirección incompleta"
                          text="Revisa la dirección antes de coordinar la salida del delivery."
                        />
                      )}

                      {order.status === "Listo" && orderPayment.status !== "Pagado" && (
                        <WarningBox
                          title="Listo, pero falta pago"
                          text="Antes de despachar, caja debería confirmar el cobro o autorizar la salida."
                        />
                      )}

                      {orderTotals.deliveryCostUSD > 0 &&
                        orderPayment.deliveryPaymentIn === "Sin registrar" && (
                          <WarningBox
                            title="Delivery sin forma de cobro"
                            text="Caja todavía no marcó si el delivery fue cobrado en divisas, bolívares o mixto."
                          />
                        )}
                    </div>

                    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                        Productos
                      </p>

                      <div className="mt-3 space-y-2">
                        {order.items.map((item, index) => {
                          const subtotal = Number(item.price || 0) * Number(item.quantity || 0)

                          return (
                            <div
                              key={`${item.id}-${item.name}-${index}`}
                              className="rounded-2xl bg-[#fff7e8] px-4 py-3 text-sm font-bold text-[#220000]"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p>{item.name} x{item.quantity}</p>
                                <p className="shrink-0 font-black text-[#a00000]">
                                  {formatUSD(subtotal)}
                                </p>
                              </div>
                              <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                                {isComboItem(item)
                                  ? "Solo divisas"
                                  : `Bs ${formatVES(subtotal * Number(order.exchangeRate || 0))}`}
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

                    <div className="rounded-[1.4rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                        Estado de caja
                      </p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <InfoBox label="Total" value={formatUSD(orderPayment.totalOrderUSD)} />
                        <InfoBox label="Cobrado" value={formatUSD(orderPayment.receivedEquivalentUSD)} />
                        <InfoBox label="Pendiente" value={formatUSD(orderPayment.pendingUSD)} />
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <InfoBox label="Delivery pagado en" value={orderPayment.deliveryPaymentIn} />
                        <InfoBox
                          label="Métodos"
                          value={[
                            orderPayment.paymentMethodUSD,
                            orderPayment.paymentMethodVES,
                          ]
                            .filter(Boolean)
                            .join(" / ") || "Sin método registrado"}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {phone ? (
                        <WhatsAppButton
                          href={buildDeliveryWhatsAppUrl(order, "arrived")}
                          label="Llegué"
                          success
                        />
                      ) : (
                        <div className="rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3 text-xs font-black text-[#8a5a00]">
                          No se muestra WhatsApp porque el teléfono no es válido.
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => reportDeliveryToCashier(order)}
                        disabled={order.status !== "Listo" || deliveryReported || isReporting}
                        className={`flex w-full items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          deliveryReported
                            ? "border-green-600 bg-green-100 text-green-700"
                            : "border-[#a00000] bg-yellow-300 text-[#4a0000] hover:scale-[1.01]"
                        }`}
                      >
                        {isReporting ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : deliveryReported ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          <PackageCheck size={17} />
                        )}
                        {deliveryReported ? "Reportado a caja" : "Reportar entrega a caja"}
                      </button>

                      {deliveryReported && (
                        <div className="rounded-2xl border-2 border-green-500 bg-green-50 px-4 py-3 text-xs font-black leading-5 text-green-800">
                          Entrega reportada. Caja debe revisar y confirmar finalmente como Entregado.
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border-2 border-[#a00000]/20 bg-white px-4 py-3 text-xs font-black leading-5 text-[#3a0000]/70">
                      El botón “Llegué” solo envía WhatsApp. El botón “Reportar entrega a caja” no cambia el estado principal; Caja confirma Entregado.
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </div>
    </main>
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
    <div className={`rounded-[1.2rem] border-2 p-3 ${style}`}>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
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

function WarningBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.2rem] border-2 border-yellow-400 bg-yellow-100 p-4">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 shrink-0 text-[#8a5a00]" size={21} />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8a5a00]">
            {title}
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-[#3a0000]/75">
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}

function WhatsAppButton({
  href,
  label,
  strong,
  success,
}: {
  href: string
  label: string
  strong?: boolean
  success?: boolean
}) {
  const className = success
    ? "border-green-600 bg-green-500 text-white hover:bg-green-400"
    : strong
      ? "border-[#a00000] bg-[#a00000] text-white hover:bg-red-800"
      : "border-[#a00000] bg-yellow-300 text-[#4a0000] hover:bg-yellow-200"

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-4 py-3 text-center text-[0.68rem] font-black uppercase tracking-[0.1em] transition ${className}`}
    >
      {label === "Llegué" ? <MapPin size={16} /> : <MessageCircle size={16} />}
      {label}
    </a>
  )
}
