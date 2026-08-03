"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { useVisiblePolling } from "@/hooks/useVisiblePolling"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CookingPot,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  Volume2,
  VolumeX,
  X,
  XCircle,
} from "lucide-react"
import { formatUSD, formatVES } from "@/utils/formatCurrency"
import ModuleAccessGuard from "@/components/ModuleAccessGuard"
import {
  useOperationalSounds,
  useOrderSoundAlerts,
} from "@/hooks/useOperationalSounds"

const ADMIN_STORAGE_KEY = "la_bambucha_premium_owner_session"

type ProductPaymentMode = "divisa" | "mixto"
type OrderStatus = "Nuevo" | "Preparando" | "Listo" | "Entregado" | "Cancelado"
type PaymentStatus = "Pendiente" | "Pago parcial" | "Pagado"
type OrderType = "Comer aquí" | "Para llevar" | "Delivery"
type DeliveryPaymentIn = "Divisas" | "Bolívares" | "Mixto" | "Sin registrar"
type KitchenFilter = "En cocina" | "Listos" | "Completos" | "Todos"

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

function getDisplayOrderNumber(order: LocalOrder) {
  if (order.rowNumber && order.rowNumber > 1) {
    return `#${String(order.rowNumber - 1).padStart(2, "0")}`
  }

  const parts = order.id.split("-")
  const lastPart = parts[parts.length - 1] || order.id

  return `#${lastPart.slice(-3)}`
}

function cleanDeliveryLocation(value: string) {
  return value.replace(/^delivery\s*-\s*/i, "").trim()
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

  const totalRegularVES = hasReadableItems
    ? totalRegularUSD * exchangeRate
    : Number(order.totalRegularVES ?? order.totalVES ?? totalRegularUSD * exchangeRate)

  const totalBeforeDeliveryUSD = totalCombosUSD + totalRegularUSD
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
  if (status === "Preparando") return "bg-orange-400 text-[#3a0000]"
  if (status === "Listo") return "bg-yellow-300 text-[#3a0000]"
  if (status === "Entregado") return "bg-green-500 text-[#220000]"
  if (status === "Cancelado") return "bg-[#220000] text-[#220000]"

  return "bg-red-500 text-[#220000]"
}

function getStatusIcon(status: OrderStatus) {
  if (status === "Preparando") return <CookingPot size={16} />
  if (status === "Listo") return <PackageCheck size={16} />
  if (status === "Entregado") return <CheckCircle2 size={16} />
  if (status === "Cancelado") return <XCircle size={16} />

  return <Clock size={16} />
}

function shouldShowInKitchen(order: LocalOrder) {
  return (
    order.status === "Preparando" ||
    order.status === "Listo" ||
    order.status === "Entregado"
  )
}

function shouldShowAsPreparing(order: LocalOrder) {
  return order.status === "Preparando"
}

function shouldShowAsReady(order: LocalOrder) {
  return order.status === "Listo"
}

function shouldShowAsCompleted(order: LocalOrder) {
  return order.status === "Entregado"
}

function normalizeComparableText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function matchesSearch(order: LocalOrder, query: string) {
  const cleanQuery = normalizeComparableText(query)

  if (!cleanQuery) return true

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
      order.status,
      productsText,
    ]
      .filter(Boolean)
      .join(" ")
  )

  return searchableText.includes(cleanQuery)
}

function readApiResponse(response: Response) {
  return response.text().then((text) => {
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(
        "El servidor respondió con una página HTML en vez de datos. Revisa que la API de pedidos y el Apps Script estén funcionando correctamente."
      )
    }
  })
}

function ProductGroup({
  title,
  items,
  exchangeRate,
}: {
  title: string
  items: CartItem[]
  exchangeRate: number
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
                <p>
                  {item.name} x{item.quantity}
                </p>

                <p className="shrink-0 font-black text-[#a00000]">
                  {formatUSD(subtotal)}
                </p>
              </div>

              <p className="mt-1 text-xs font-bold text-[#3a0000]/60">
                Bs {formatVES(subtotalVES)}
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

export default function CocinaPage() {
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [orders, setOrders] = useState<LocalOrder[]>([])
  const [activeFilter, setActiveFilter] = useState<KitchenFilter>("En cocina")
  const [searchText, setSearchText] = useState("")
  const [areFiltersVisible, setAreFiltersVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const pendingStatusRef = useRef<Map<string, OrderStatus>>(new Map())
  const isLoggedIn = adminPassword.length > 0
  const soundControls = useOperationalSounds({ adminPassword })

  useOrderSoundAlerts(orders, {
    module: "kitchen",
    enabled: isLoggedIn && soundControls.isSoundEnabled,
    playSound: soundControls.playSound,
  })

  async function loadOrders(password = adminPassword, silent = false) {
    if (!password) return

    if (!silent) setIsLoading(true)
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

      let nextOrders: LocalOrder[] = Array.isArray(data.orders) ? data.orders : []

      nextOrders = nextOrders
        .filter(shouldShowInKitchen)
        .map((order) => {
          const pendingStatus = pendingStatusRef.current.get(order.id)

          if (!pendingStatus) return order

          return {
            ...order,
            status: pendingStatus,
          }
        })

      setOrders(nextOrders)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los pedidos"
      )
    } finally {
      if (!silent) setIsLoading(false)
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
    pendingStatusRef.current = new Map()
  }

  async function updateStatus(orderId: string, status: OrderStatus) {
    if (!adminPassword) return

    const previousOrder = orders.find((order) => order.id === orderId)

    setErrorMessage(null)
    pendingStatusRef.current.set(orderId, status)

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
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
          status,
        }),
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo actualizar el pedido")
      }

      window.setTimeout(() => {
        if (pendingStatusRef.current.get(orderId) === status) {
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

  useEffect(() => {
    const savedPassword = window.sessionStorage.getItem(ADMIN_STORAGE_KEY)

    if (savedPassword) {
      setAdminPassword(savedPassword)
      setPasswordInput(savedPassword)
      loadOrders(savedPassword)
    }
  }, [])

  useVisiblePolling(
    () => loadOrders(adminPassword, true),
    2500,
    Boolean(adminPassword)
  )

  const preparingOrders = orders.filter(shouldShowAsPreparing)
  const readyOrders = orders.filter(shouldShowAsReady)
  const completedOrders = orders.filter(shouldShowAsCompleted)
  const deliveryOrders = orders.filter(isDeliveryOrder)

  const filteredOrders = useMemo(() => {
    let nextOrders = orders

    if (activeFilter === "En cocina") {
      nextOrders = nextOrders.filter(shouldShowAsPreparing)
    } else if (activeFilter === "Listos") {
      nextOrders = nextOrders.filter(shouldShowAsReady)
    } else if (activeFilter === "Completos") {
      nextOrders = nextOrders.filter(shouldShowAsCompleted)
    }

    return nextOrders.filter((order) => matchesSearch(order, searchText))
  }, [activeFilter, orders, searchText])

  const visibleDeliveryCount = filteredOrders.filter(isDeliveryOrder).length

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
              Panel
            </a>

            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="mx-auto mt-6 h-28 w-28 object-contain"
            />

            <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.28em] text-[#a00000]">
              Acceso cocina
            </p>

            <h1 className="mt-2 text-center text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)]">
              Cocina
            </h1>

            <p className="mt-3 text-center text-sm font-bold leading-6 text-[#3a0000]/75">
              Solo muestra pedidos que caja ya envió a preparación.
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
                  placeholder="Ingresa la clave autorizada"
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
              <div className="rounded-2xl border-2 border-red-500/30 bg-red-50 px-4 py-3">
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
              Entrar
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <ModuleAccessGuard moduleKey="kitchen" moduleName="Cocina">
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
                      Panel
                    </a>

                    <button
                      type="button"
                      onClick={() => loadOrders()}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
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
                      onClick={
                        soundControls.isSoundEnabled
                          ? soundControls.deactivateSound
                          : soundControls.activateSound
                      }
                      disabled={!soundControls.businessAllowsSound}
                      className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        soundControls.isSoundEnabled
                          ? "border-green-700 bg-green-50 text-green-700 hover:bg-green-100"
                          : "border-[#a00000] bg-white text-[#a00000] hover:bg-yellow-200"
                      }`}
                    >
                      {soundControls.isSoundEnabled ? (
                        <Volume2 size={16} />
                      ) : (
                        <VolumeX size={16} />
                      )}
                      {soundControls.isSoundEnabled
                        ? "Avisos permitidos"
                        : soundControls.businessAllowsSound
                          ? "Permitir avisos en este equipo"
                          : "Sonidos desactivados por configuración"}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-200"
                    >
                      Salir
                    </button>
                  </div>

                  <p className="mt-5 text-xs font-black uppercase tracking-[0.32em] text-[#a00000]">
                    La Bambucha
                  </p>

                  <h1 className="mt-1 text-4xl font-black uppercase leading-none text-[#a00000] drop-shadow-[0_3px_0_rgba(255,211,0,0.75)] sm:text-5xl">
                    Módulo cocina
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#3a0000]/70">
                    Aquí aparecen los pedidos cuando caja los confirma y los envía a cocina. Cocina puede revisar preparación, listos y completos sin cerrar ventas.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-4 lg:w-[680px]">
                  <InfoBox label="En cocina" value={String(preparingOrders.length)} />
                  <InfoBox label="Listos" value={String(readyOrders.length)} />
                  <InfoBox label="Completos" value={String(completedOrders.length)} />
                  <InfoBox label="Delivery" value={String(deliveryOrders.length)} />
                </div>
              </div>
            </div>
          </header>

          <section className="sticky top-0 z-30 mt-4 rounded-[1.4rem] border-2 border-[#a00000] bg-white p-3 shadow-[0_8px_0_rgba(160,0,0,0.10)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#a00000]">
                  Controles de cocina
                </p>

                <p className="mt-1 text-xs font-bold text-[#3a0000]/65">
                  {filteredOrders.length} pedido(s) en pantalla · {activeFilter}
                </p>

                {!areFiltersVisible && (
                  <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#a00000]/70">
                    Filtros ocultos · {activeFilter}
                    {searchText.trim() ? ` · ${searchText.trim()}` : ""}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => loadOrders()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200"
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
                  onClick={() => setAreFiltersVisible((value) => !value)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#a00000] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-yellow-200"
                >
                  {areFiltersVisible ? <EyeOff size={17} /> : <Eye size={17} />}
                  {areFiltersVisible ? "Ocultar filtros" : "Mostrar filtros"}
                </button>
              </div>
            </div>

            {areFiltersVisible && (
              <>
                <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a00000]"
                    />

                    <input
                      value={searchText}
                      onChange={(event) => setSearchText(event.target.value)}
                      placeholder="Buscar por pedido, mesa, zona, cliente o producto"
                      className="w-full rounded-full border-2 border-[#a00000]/25 bg-[#fff7e8] px-11 py-3 text-sm font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#a00000]"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {(["En cocina", "Listos", "Completos", "Todos"] as KitchenFilter[]).map(
                      (filter) => {
                        const isActive = activeFilter === filter

                        return (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={`shrink-0 rounded-full border-2 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                              isActive
                                ? "border-[#a00000] bg-yellow-300 text-[#4a0000]"
                                : "border-[#a00000] bg-white text-[#a00000] hover:bg-yellow-200"
                            }`}
                          >
                            {filter}
                          </button>
                        )
                      }
                    )}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <InfoBox label="En pantalla" value={String(filteredOrders.length)} />
                  <InfoBox label="Filtro" value={activeFilter} />
                  <InfoBox label="Completos" value={String(completedOrders.length)} />
                  <InfoBox label="Delivery visible" value={String(visibleDeliveryCount)} />
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
                Sin pedidos en cocina
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-[#3a0000]/70">
                Cuando caja confirme un pedido y lo envíe a preparación, aparecerá en esta pantalla. Los pedidos completos quedan como consulta para cocina.
              </p>
            </section>
          ) : (
            <section className="mt-5 grid gap-4 xl:grid-cols-2">
              {filteredOrders.map((order) => {
                const orderTotals = getOrderTotals(order)
                const comboItems = order.items.filter(isComboItem)
                const regularItems = order.items.filter((item) => !isComboItem(item))
                const isDelivery = isDeliveryOrder(order)
                const displayTableNumber = getDisplayTableNumber(order)

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-[1.6rem] border-2 border-[#a00000] bg-white shadow-[0_8px_0_rgba(160,0,0,0.12)]"
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

                            {isDelivery && (
                              <span className="inline-flex items-center gap-2 rounded-full bg-yellow-300 px-3 py-1.5 text-xs font-black uppercase text-[#220000]">
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
                              Ref. normales Bs {formatVES(orderTotals.totalRegularVES)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoBox label="Cliente" value={order.customerName || "Cliente"} />
                        <InfoBox
                          label={isDelivery ? "Zona delivery" : "Mesa / ubicación"}
                          value={displayTableNumber}
                        />
                        <InfoBox label="Tipo" value={isDelivery ? "Delivery" : order.orderType} />
                        <InfoBox label="Tasa" value={`Bs ${formatVES(order.exchangeRate)}`} />
                      </div>

                      {isDelivery && (
                        <div className="space-y-3 rounded-[1.4rem] border-2 border-[#a00000]/25 bg-[#fff7e8] p-4">
                          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#a00000]">
                            <Truck size={16} />
                            Datos de delivery
                          </p>

                          <div className="grid gap-2 text-sm font-bold leading-6 text-[#3a0000]/80">
                            <p className="rounded-2xl bg-white px-3 py-2">
                              <strong>Teléfono:</strong> {order.customerPhone || "Sin teléfono"}
                            </p>

                            <p className="rounded-2xl bg-white px-3 py-2">
                              <strong>Dirección:</strong> {order.deliveryAddress || "Sin dirección"}
                            </p>

                            <p className="rounded-2xl bg-white px-3 py-2">
                              <strong>Referencia:</strong> {order.deliveryReference || "Sin referencia"}
                            </p>

                            <p className="rounded-2xl bg-white px-3 py-2">
                              <strong>Delivery:</strong> {formatUSD(orderTotals.deliveryCostUSD)} / Bs {formatVES(orderTotals.deliveryCostUSD * Number(order.exchangeRate || 0))}
                            </p>
                          </div>
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
                        {order.status === "Preparando" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, "Listo")}
                            className="rounded-full bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#3a0000] transition hover:bg-yellow-200"
                          >
                            Marcar listo
                          </button>
                        )}

                        {order.status === "Listo" && (
                          <div className="rounded-2xl border-2 border-yellow-400 bg-yellow-100 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#8a5a00]">
                            Pedido listo. Caja o Delivery continúan el flujo.
                          </div>
                        )}

                        {order.status === "Entregado" && (
                          <div className="rounded-2xl border-2 border-green-500/35 bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-green-700">
                            Pedido completo. Solo consulta para cocina.
                          </div>
                        )}

                        {order.status !== "Cancelado" && order.status !== "Entregado" && (
                          <button
                            type="button"
                            onClick={() => updateStatus(order.id, "Cancelado")}
                            className="rounded-full border-2 border-[#a00000] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#a00000] transition hover:bg-red-50 hover:text-red-700"
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
      </main>
    </ModuleAccessGuard>
  )
}
