"use client"

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  LogIn,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react"
import { formatUSD } from "@/utils/formatCurrency"
import {
  categories as baseCategories,
  type Product,
  type ProductPaymentMode,
} from "@/data/products"

const ADMIN_STORAGE_KEY = "la_bambucha_premium_owner_session"
const PUBLIC_MENU_UPDATED_STORAGE_KEY = "la_bambucha_menu_updated_at"
const PUBLIC_MENU_SNAPSHOT_STORAGE_KEY = "la_bambucha_public_menu_snapshot_v1"
const PUBLIC_MENU_UPDATED_EVENT = "la-bambucha-menu-updated"
const PUBLIC_MENU_BROADCAST_CHANNEL = "la-bambucha-public-menu"

function publicMenuProductToSnapshotProduct(product: MenuProduct): Product {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.description,
    price: product.price,
    image: product.image,
    paymentMode: product.paymentMode,
    isActive: product.isActive !== false,
    isFeatured: product.isFeatured === true,
    sortOrder: product.sortOrder,
  }
}

function buildPublicMenuSnapshot(products: MenuProduct[]) {
  const updatedAt = String(Date.now())
  const cleanProducts = normalizeMenuProducts(products).map(
    publicMenuProductToSnapshotProduct
  )

  return {
    type: "menu-products-updated",
    updatedAt,
    products: cleanProducts,
    categories: Array.from(
      new Set([
        "Todos",
        ...baseCategories.filter((category) => category !== "Todos"),
        ...cleanProducts.map((product) => product.category).filter(Boolean),
      ])
    ),
    fallback: false,
    source: "Actualización local del panel",
  }
}

function notifyPublicMenuUpdated(products: MenuProduct[]) {
  const snapshot = buildPublicMenuSnapshot(products)

  try {
    window.localStorage.setItem(PUBLIC_MENU_UPDATED_STORAGE_KEY, snapshot.updatedAt)
    window.localStorage.setItem(
      PUBLIC_MENU_SNAPSHOT_STORAGE_KEY,
      JSON.stringify(snapshot)
    )
    window.dispatchEvent(
      new CustomEvent(PUBLIC_MENU_UPDATED_EVENT, {
        detail: snapshot,
      })
    )

    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel(PUBLIC_MENU_BROADCAST_CHANNEL)
      channel.postMessage(snapshot)
      channel.close()
    }
  } catch {
    window.dispatchEvent(new Event(PUBLIC_MENU_UPDATED_EVENT))
  }
}

const EMPTY_FORM = {
  id: "",
  name: "",
  category: "Perritos",
  customCategory: "",
  description: "",
  price: "",
  image: "",
  paymentMode: "mixto" as ProductPaymentMode,
  isActive: true,
  isFeatured: false,
  sortOrder: "",
}

type MenuProduct = Product & {
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

type MenuForm = typeof EMPTY_FORM

type ApiResponse = {
  ok?: boolean
  error?: string
  message?: string
  warning?: string
  access?: {
    allowed?: boolean
    moduleKey?: string
    moduleLabel?: string
    reason?: string
    requiredPlan?: string
    currentPlan?: string
    message?: string
  }
  menuProducts?: MenuProduct[]
  menuProduct?: MenuProduct
  importedCount?: number
  skippedCount?: number
  totalProducts?: number
  image?: {
    imageUrl?: string
    thumbnailUrl?: string
    viewUrl?: string
    fileName?: string
    fileId?: string
    uploadedAt?: string
  }
}

const CATEGORY_OPTIONS = Array.from(
  new Set([...baseCategories.filter((category) => category !== "Todos"), "Otros"])
)

function normalizeNumber(value: unknown) {
  const numberValue = Number(value || 0)

  if (!Number.isFinite(numberValue) || numberValue < 0) return 0

  return Math.round((numberValue + Number.EPSILON) * 100) / 100
}

function normalizePaymentMode(value: unknown): ProductPaymentMode {
  return value === "divisa" ? "divisa" : "mixto"
}

function normalizeMenuProduct(value: unknown): MenuProduct | null {
  const source = (value || {}) as Partial<MenuProduct>
  const id = Number(source.id || 0)

  if (!Number.isFinite(id) || id <= 0 || !source.name) return null

  return {
    id: Math.round(id),
    name: String(source.name || "").trim(),
    category: String(source.category || "Otros").trim() || "Otros",
    description: String(source.description || "").trim(),
    price: normalizeNumber(source.price),
    image: String(source.image || "").trim(),
    paymentMode: normalizePaymentMode(source.paymentMode),
    isActive: source.isActive !== false,
    isFeatured: source.isFeatured === true,
    sortOrder: normalizeNumber(source.sortOrder || source.id || 9999),
    createdAt: String(source.createdAt || "").trim(),
    updatedAt: String(source.updatedAt || "").trim(),
  }
}

function normalizeMenuProducts(value: unknown): MenuProduct[] {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizeMenuProduct)
    .filter((product): product is MenuProduct => Boolean(product))
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
      return a.name.localeCompare(b.name)
    })
}

function buildFormFromProduct(product: MenuProduct): MenuForm {
  return {
    id: String(product.id),
    name: product.name,
    category: CATEGORY_OPTIONS.includes(product.category) ? product.category : "Otros",
    customCategory: CATEGORY_OPTIONS.includes(product.category) ? "" : product.category,
    description: product.description,
    price: String(product.price || ""),
    image: product.image,
    paymentMode: "mixto",
    isActive: product.isActive !== false,
    isFeatured: product.isFeatured === true,
    sortOrder: String(product.sortOrder || ""),
  }
}

function formatDate(value?: string) {
  if (!value) return "Sin actualización"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Caracas",
  }).format(date)
}

async function readApiResponse(response: Response) {
  const text = await response.text()

  try {
    return JSON.parse(text) as ApiResponse
  } catch {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 180)

    if (response.status === 404 || preview.toLowerCase().includes("<!doctype")) {
      throw new Error(
        "La ruta /api/menu-products no está respondiendo como API. Revisa que exista src/app/api/menu-products/route.ts y reinicia npm run dev."
      )
    }

    throw new Error(
      preview
        ? `El servidor no devolvió JSON válido. Respuesta: ${preview}`
        : "El servidor no devolvió datos válidos."
    )
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result || ""))
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada"))
    reader.readAsDataURL(file)
  })
}

function loadImageElement(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("La imagen no pudo procesarse. Prueba con JPG, PNG o WEBP."))
    image.src = dataUrl
  })
}

async function prepareMenuImageForUpload(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecciona una imagen válida.")
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error("La imagen es muy pesada. Usa una foto menor a 8 MB.")
  }

  const originalDataUrl = await readFileAsDataUrl(file)
  const image = await loadImageElement(originalDataUrl)
  const maxSide = 1400
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("No se pudo preparar la imagen para subirla.")
  }

  canvas.width = width
  canvas.height = height
  context.fillStyle = "#fff7e8"
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.84),
    mimeType: "image/jpeg",
    fileName: file.name.replace(/\.[^.]+$/, "") + ".jpg",
  }
}

export default function LocalMenuPage() {
  const [adminPassword, setAdminPassword] = useState("")
  const [passwordInput, setPasswordInput] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [menuProducts, setMenuProducts] = useState<MenuProduct[]>([])
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM)
  const [searchText, setSearchText] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("Todas")
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [isHeaderSummaryVisible, setIsHeaderSummaryVisible] = useState(false)
  const [areProductFiltersVisible, setAreProductFiltersVisible] = useState(false)
  const [isFormVisible, setIsFormVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const isLoggedIn = adminPassword.length > 0

  const activeProducts = menuProducts.filter((product) => product.isActive !== false)
  const inactiveProducts = menuProducts.filter((product) => product.isActive === false)
  const featuredProducts = activeProducts.filter((product) => product.isFeatured)

  const categories = useMemo(() => {
    return [
      "Todas",
      ...Array.from(
        new Set(
          menuProducts
            .map((product) => product.category)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    ]
  }, [menuProducts])

  const filteredProducts = useMemo(() => {
    const query = searchText.trim().toLowerCase()

    return menuProducts.filter((product) => {
      if (showOnlyActive && product.isActive === false) return false
      if (categoryFilter !== "Todas" && product.category !== categoryFilter) return false

      if (!query) return true

      return [product.name, product.category, product.description, product.image]
        .join(" ")
        .toLowerCase()
        .includes(query)
    })
  }, [categoryFilter, menuProducts, searchText, showOnlyActive])

  const hasProductFilters =
    searchText.trim().length > 0 || categoryFilter !== "Todas" || showOnlyActive

  const productFilterSummary = hasProductFilters
    ? `${filteredProducts.length} de ${menuProducts.length} producto(s) mostrados · filtros activos`
    : `${filteredProducts.length} de ${menuProducts.length} producto(s) mostrados · sin filtros activos`

  function clearProductFilters() {
    setSearchText("")
    setCategoryFilter("Todas")
    setShowOnlyActive(false)
  }


  async function validateMenuProductsAccess(password: string) {
    const response = await fetch("/api/local-auth?moduleKey=menuProducts", {
      headers: {
        "x-admin-password": password,
      },
      cache: "no-store",
    })

    const data = await readApiResponse(response)

    if (!response.ok || !data.ok || !data.access?.allowed) {
      throw new Error(
        data.error ||
          "El módulo de productos del menú no está activo para este negocio."
      )
    }

    return data
  }

  async function loadMenuProducts(password = adminPassword) {
    if (!password) return

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const response = await fetch("/api/menu-products", {
        headers: {
          "x-admin-password": password,
        },
        cache: "no-store",
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar el menú editable")
      }

      setMenuProducts(normalizeMenuProducts(data.menuProducts || []))
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo cargar el menú editable"
      )
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogin() {
    const password = passwordInput.trim()

    if (!password) return

    try {
      setIsLoading(true)
      setErrorMessage(null)
      await validateMenuProductsAccess(password)
      window.sessionStorage.setItem(ADMIN_STORAGE_KEY, password)
      setAdminPassword(password)
      setPasswordInput(password)
      await loadMenuProducts(password)
    } catch (error) {
      window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
      setAdminPassword("")
      setMenuProducts([])
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo validar el acceso"
      )
    } finally {
      setIsLoading(false)
    }
  }

  function handleLogout() {
    window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
    setAdminPassword("")
    setPasswordInput("")
    setMenuProducts([])
    setForm(EMPTY_FORM)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  useEffect(() => {
    const storedPassword = window.sessionStorage.getItem(ADMIN_STORAGE_KEY)
    const savedPassword = typeof storedPassword === "string" ? storedPassword.trim() : ""

    if (!savedPassword) return

    async function restoreSession() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        await validateMenuProductsAccess(savedPassword)
        setAdminPassword(savedPassword)
        setPasswordInput(savedPassword)
        await loadMenuProducts(savedPassword)
      } catch (error) {
        window.sessionStorage.removeItem(ADMIN_STORAGE_KEY)
        setAdminPassword("")
        setPasswordInput("")
        setMenuProducts([])
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No se pudo restaurar el acceso al menú editable"
        )
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  function updateForm<K extends keyof MenuForm>(field: K, value: MenuForm[K]) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setSuccessMessage(null)
    setErrorMessage(null)
  }


  async function handleImageUpload(file?: File) {
    if (!adminPassword) {
      setErrorMessage("Debes iniciar sesión antes de subir una imagen.")
      return
    }

    if (!file) {
      setErrorMessage("No se seleccionó ninguna imagen.")
      return
    }

    try {
      setIsUploadingImage(true)
      setErrorMessage(null)
      setSuccessMessage("Preparando imagen para subir...")

      const preparedImage = await prepareMenuImageForUpload(file)
      setSuccessMessage("Subiendo imagen. Espera unos segundos antes de guardar el producto.")

      const response = await fetch("/api/menu-products/upload-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          ...preparedImage,
          productName: form.name || "producto-menu",
        }),
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo subir la imagen")
      }

      const imageUrl = String(data.image?.imageUrl || data.image?.thumbnailUrl || "").trim()

      if (!imageUrl) {
        throw new Error("La imagen subió, pero el servidor no devolvió un enlace válido")
      }

      updateForm("image", imageUrl)
      setSuccessMessage("Imagen subida correctamente. Ahora guarda el producto para aplicarla al menú público.")
    } catch (error) {
      setSuccessMessage(null)
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo subir la imagen"
      )
    } finally {
      setIsUploadingImage(false)
    }
  }

  async function saveProduct(customInput?: Partial<MenuProduct>) {
    if (!adminPassword) return null

    const category =
      form.category === "Otros" && form.customCategory.trim()
        ? form.customCategory.trim()
        : form.category
    const input = customInput || {
      id: form.id ? Number(form.id) : undefined,
      name: form.name.trim(),
      category,
      description: form.description.trim(),
      price: normalizeNumber(form.price),
      image: form.image.trim(),
      paymentMode: "mixto",
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      sortOrder: normalizeNumber(form.sortOrder),
    }

    if (!input.name) {
      setErrorMessage("Escribe el nombre del producto.")
      return null
    }

    if (normalizeNumber(input.price) <= 0) {
      setErrorMessage("Escribe un precio válido mayor a cero.")
      return null
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      const response = await fetch("/api/menu-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(input),
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar el producto")
      }

      const savedProduct = normalizeMenuProduct(data.menuProduct)

      if (!savedProduct) {
        throw new Error("El servidor no devolvió el producto guardado")
      }

      const nextProducts = normalizeMenuProducts([
        savedProduct,
        ...menuProducts.filter((product) => product.id !== savedProduct.id),
      ])

      setMenuProducts(nextProducts)
      notifyPublicMenuUpdated(nextProducts)

      if (!customInput) {
        setForm(EMPTY_FORM)
        setIsFormVisible(false)
        setSuccessMessage("Producto del menú guardado correctamente.")
      }

      return savedProduct
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo guardar el producto"
      )
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function importBaseMenu() {
    if (!adminPassword) return

    try {
      setIsImporting(true)
      setSuccessMessage(null)
      setErrorMessage(null)

      const response = await fetch("/api/menu-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          action: "syncBaseProducts",
        }),
      })

      const data = await readApiResponse(response)

      if (!response.ok || data.error) {
        throw new Error(data.error || "No se pudo sincronizar el menú base")
      }

      const nextProducts = normalizeMenuProducts(data.menuProducts || [])

      setMenuProducts(nextProducts)
      notifyPublicMenuUpdated(nextProducts)
      setSuccessMessage(
        data.message || "Menú base sincronizado correctamente."
      )
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo sincronizar el menú base"
      )
    } finally {
      setIsImporting(false)
    }
  }

  async function deactivateProduct(productId: number) {
    if (!adminPassword) return

    try {
      setDeletingProductId(productId)
      setErrorMessage(null)
      setSuccessMessage(null)

      const response = await fetch(`/api/menu-products?id=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": adminPassword,
        },
      })

      const data = await readApiResponse(response)

      if (!response.ok) {
        throw new Error(data.error || "No se pudo desactivar el producto")
      }

      const nextProducts = normalizeMenuProducts(
        menuProducts.map((product) =>
          product.id === productId ? { ...product, isActive: false } : product
        )
      )

      setMenuProducts(nextProducts)
      notifyPublicMenuUpdated(nextProducts)
      setSuccessMessage(data.error || "Producto desactivado correctamente.")
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo desactivar el producto"
      )
    } finally {
      setDeletingProductId(null)
    }
  }

  function editProduct(product: MenuProduct) {
    setForm(buildFormFromProduct(product))
    setIsFormVisible(true)
    setSuccessMessage("Producto cargado para editar.")
    setErrorMessage(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#d08a00] px-4 py-8 text-[#220000]">
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border-4 border-[#5c1c00] bg-[#ffe08a] shadow-[0_12px_0_rgba(92,28,0,0.18)]">
          <div className="h-6 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#d08a00]" />

          <div className="px-6 py-6">
            <a
              href="/local-santo"
              className="inline-flex items-center gap-2 rounded-full border-2 border-[#5c1c00] bg-[#ffe08a] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5c1c00]"
            >
              <ArrowLeft size={16} />
              Volver
            </a>

            <img
              src="/logo-bambucha.png"
              alt="La Bambucha"
              className="mx-auto mt-6 h-28 w-28 object-contain"
            />

            <p className="mt-5 text-center text-xs font-black uppercase tracking-[0.28em] text-[#5c1c00]">
              Menú editable
            </p>

            <h1 className="mt-2 text-center text-4xl font-black uppercase leading-none text-[#5c1c00] drop-shadow-[0_3px_0_rgba(92,28,0,0.35)]">
              Productos del menú
            </h1>

            <p className="mt-3 text-center text-sm font-bold leading-6 text-[#3a0000]/75">
              Ingresa la clave autorizada. El acceso depende de que el módulo Productos del menú esté activo para este negocio.
            </p>
          </div>

          <div className="space-y-4 px-6 pb-6">
            <div>
              <label className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00]">
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
                  className="w-full rounded-2xl border-2 border-[#5c1c00]/25 bg-[#d08a00] px-4 py-4 pr-12 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#5c1c00]"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#5c1c00]/10 text-[#4a0000]"
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
              className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-[#5c1c00] bg-yellow-300 px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-[#4a0000] shadow-[0_6px_0_rgba(92,28,0,0.20)] transition hover:scale-[1.02] disabled:opacity-60"
            >
              {isLoading ? <Loader2 size={21} className="animate-spin" /> : <LogIn size={21} />}
              {isLoading ? "Validando acceso" : "Entrar al menú"}
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#d08a00] px-3 py-4 text-[#220000] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[1.6rem] border-4 border-[#5c1c00] bg-[#ffe08a] shadow-[0_10px_0_rgba(92,28,0,0.18)]">
          <div className="h-5 bg-[linear-gradient(45deg,#a00000_25%,transparent_25%),linear-gradient(-45deg,#a00000_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#a00000_75%),linear-gradient(-45deg,transparent_75%,#a00000_75%)] bg-[length:32px_32px] bg-[position:0_0,0_16px,16px_-16px,0] bg-[#d08a00]" />

          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href="/local-santo"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#5c1c00] bg-[#ffe08a] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#5c1c00] transition hover:bg-yellow-200"
                  >
                    <ArrowLeft size={16} />
                    Volver al panel
                  </a>

                  <button
                    type="button"
                    onClick={() => loadMenuProducts()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#5c1c00] bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Actualizar
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-[#5c1c00] bg-[#ffe08a] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#5c1c00] transition hover:bg-yellow-200"
                  >
                    Cerrar sesión
                  </button>
                </div>

                <p className="mt-4 text-xs font-black uppercase tracking-[0.32em] text-[#5c1c00]">
                  La Bambucha
                </p>

                <h1 className="mt-1 text-4xl font-black uppercase leading-none text-[#5c1c00] drop-shadow-[0_3px_0_rgba(92,28,0,0.35)] sm:text-5xl">
                  Menú editable
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#3a0000]/70">
                  Crea y actualiza productos del menú público sin tocar código. Puedes subir una foto, pegar una URL, cambiar categoría, descripción, precio y destacar productos.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:w-[560px]">
                <button
                  type="button"
                  onClick={() => setIsHeaderSummaryVisible((value) => !value)}
                  className="inline-flex w-fit items-center justify-center gap-2 self-start rounded-full border-2 border-[#5c1c00] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] transition hover:bg-yellow-200 lg:self-end"
                >
                  {isHeaderSummaryVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  {isHeaderSummaryVisible ? "Ocultar resumen" : "Ver resumen"}
                </button>

                {isHeaderSummaryVisible && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <MetricCard label="Activos" value={activeProducts.length} />
                    <MetricCard label="Inactivos" value={inactiveProducts.length} tone={inactiveProducts.length > 0 ? "warning" : "soft"} />
                    <MetricCard label="Destacados" value={featuredProducts.length} />
                    <MetricCard label="Total menú" value={menuProducts.length} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="mt-4 rounded-[1.5rem] border-2 border-[#5c1c00] bg-[#ffe08a] p-4 shadow-[0_8px_0_rgba(92,28,0,0.16)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00]">
                Crear o editar producto
              </p>
              <p className="mt-2 text-sm font-bold leading-6 text-[#3a0000]/70">
                Los productos activos son los que podrá cargar la página pública desde Google Sheets. Si no hay productos activos, la página mantiene el menú base como respaldo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsFormVisible((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#5c1c00] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000]"
              >
                {isFormVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                {isFormVisible ? "Ocultar formulario" : "Mostrar formulario"}
              </button>

              <button
                type="button"
                onClick={importBaseMenu}
                disabled={isImporting || isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#5c1c00] bg-[#ffe08a] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#5c1c00] disabled:opacity-50"
              >
                {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Sincronizar menú base
              </button>
            </div>
          </div>

          {isFormVisible && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <InputField label="Nombre" value={form.name} onChange={(value) => updateForm("name", value)} placeholder="Ej: Salchicha polaca especial" full />

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00]">
                  Categoría
                </label>
                <select
                  value={form.category}
                  onChange={(event) => updateForm("category", event.target.value)}
                  className="mt-2 w-full rounded-2xl border-2 border-[#5c1c00]/25 bg-[#d08a00] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#5c1c00]"
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {form.category === "Otros" && (
                <InputField label="Nueva categoría" value={form.customCategory} onChange={(value) => updateForm("customCategory", value)} placeholder="Ej: Hamburguesas" />
              )}

              <InputField label="Precio USD" value={form.price} onChange={(value) => updateForm("price", value)} placeholder="Ej: 4.50" inputMode="decimal" />

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00]">
                  Modo de pago
                </label>
                <select
                  value={form.paymentMode}
                  onChange={(event) => updateForm("paymentMode", normalizePaymentMode(event.target.value))}
                  className="mt-2 w-full rounded-2xl border-2 border-[#5c1c00]/25 bg-[#d08a00] px-4 py-4 text-base font-bold text-[#4a0000] outline-none focus:border-[#5c1c00]"
                >
                  <option value="mixto">Mixto · USD y referencia Bs</option>
                  <option value="divisa">Divisas y bolívares</option>
                </select>
              </div>

              <InputField label="Orden" value={form.sortOrder} onChange={(value) => updateForm("sortOrder", value)} placeholder="Ej: 13" inputMode="numeric" />

              <div className="lg:col-span-2 rounded-[1.25rem] border-2 border-[#5c1c00]/20 bg-[#d08a00] p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00]">
                      Imagen del producto
                    </p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#3a0000]/65">
                      Sube una foto desde el teléfono o pega una URL. La imagen guardada se verá en el menú público con la misma tarjeta del resto de productos.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ""
                        handleImageUpload(file)
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border-2 border-[#5c1c00] px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.12em] transition disabled:cursor-not-allowed ${
                        isUploadingImage
                          ? "bg-yellow-100 text-[#5c1c00]/60"
                          : "bg-yellow-300 text-[#4a0000] hover:bg-yellow-200"
                      }`}
                    >
                      {isUploadingImage ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <UploadCloud size={15} />
                      )}
                      {isUploadingImage ? "Subiendo" : "Subir foto"}
                    </button>
                    <p className="max-w-[230px] text-right text-[0.68rem] font-bold leading-4 text-[#4a0000]/55">
                      Al terminar verás la URL y la vista previa. Luego presiona Guardar producto.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px]">
                  <InputField
                    label="Imagen URL"
                    value={form.image}
                    onChange={(value) => updateForm("image", value)}
                    placeholder="Sube una foto o pega /producto.png o https://..."
                    full
                  />

                  <div className="overflow-hidden rounded-2xl border-2 border-[#5c1c00]/20 bg-[#ffe08a]">
                    {form.image ? (
                      <img
                        src={form.image}
                        alt="Vista previa del producto"
                        className="h-36 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-36 flex-col items-center justify-center gap-2 text-center text-[#5c1c00]/55">
                        <ImageIcon size={24} />
                        <span className="px-3 text-xs font-black uppercase tracking-[0.12em]">
                          Sin imagen
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00]">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  placeholder="Describe ingredientes, presentación o condición especial del producto"
                  rows={4}
                  className="mt-2 w-full rounded-2xl border-2 border-[#5c1c00]/25 bg-[#d08a00] px-4 py-4 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#5c1c00]"
                />
              </div>

              <div className="lg:col-span-2 grid gap-2 sm:grid-cols-2">
                <ToggleCard
                  title="Producto activo"
                  description="Aparece en el menú público y puede agregarse al carrito."
                  checked={form.isActive}
                  onChange={(value) => updateForm("isActive", value)}
                  activeLabel="Visible"
                  inactiveLabel="Pausado"
                  icon={<CheckCircle2 size={18} />}
                />

                <ToggleCard
                  title="Producto destacado"
                  description="Puede mostrarse en Favoritos de la casa cuando el módulo esté activo."
                  checked={form.isFeatured}
                  onChange={(value) => updateForm("isFeatured", value)}
                  activeLabel="Destacado"
                  inactiveLabel="Normal"
                  icon={<Star size={18} />}
                />
              </div>

              <div className="lg:col-span-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => saveProduct()}
                  disabled={isSaving || isUploadingImage}
                  className="inline-flex min-h-[48px] w-full max-w-[280px] items-center justify-center gap-2 rounded-2xl border-2 border-[#5c1c00] bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#4a0000] disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <PackageCheck size={18} />}
                  Guardar producto
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="min-h-[48px] w-full max-w-[280px] rounded-2xl border-2 border-[#5c1c00] bg-[#ffe08a] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#5c1c00] disabled:opacity-50"
                >
                  Limpiar formulario
                </button>
              </div>
            </div>
          )}
        </section>

        {(errorMessage || successMessage) && (
          <section className="mt-4 space-y-3">
            {errorMessage && (
              <div className="rounded-2xl border-2 border-red-500/35 bg-red-100 px-4 py-3">
                <p className="text-sm font-black text-red-800">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border-2 border-green-500/35 bg-green-50 px-4 py-3">
                <p className="text-sm font-black text-green-800">{successMessage}</p>
              </div>
            )}
          </section>
        )}

        <section className="sticky top-0 z-30 mt-4 overflow-hidden rounded-[1.4rem] border-2 border-[#5c1c00] bg-[#ffe08a] shadow-[0_8px_0_rgba(92,28,0,0.16)]">
          <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00]">
                Productos del menú
              </p>
              <p className="mt-1 text-xs font-bold text-[#3a0000]/65">
                {productFilterSummary}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAreProductFiltersVisible((value) => !value)}
                className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                  areProductFiltersVisible
                    ? "border-[#5c1c00] bg-yellow-300 text-[#4a0000]"
                    : "border-[#5c1c00] bg-[#ffe08a] text-[#5c1c00] hover:bg-yellow-200"
                }`}
              >
                {areProductFiltersVisible ? <EyeOff size={16} /> : <Search size={16} />}
                {areProductFiltersVisible ? "Ocultar filtros" : "Buscar / filtrar"}
              </button>

              {hasProductFilters && (
                <button
                  type="button"
                  onClick={clearProductFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#5c1c00] bg-[#ffe08a] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#5c1c00] transition hover:bg-yellow-200"
                >
                  <XCircle size={16} />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {areProductFiltersVisible && (
            <div className="border-t-2 border-[#5c1c00]/15 bg-[#d08a00] p-3">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-center">
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5c1c00]" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Buscar producto, categoría, descripción o imagen"
                    className="w-full rounded-full border-2 border-[#5c1c00]/25 bg-[#ffe08a] px-11 py-3 text-sm font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#5c1c00]"
                  />
                </div>

                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-full border-2 border-[#5c1c00]/25 bg-[#ffe08a] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#5c1c00] outline-none focus:border-[#5c1c00]"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setShowOnlyActive((value) => !value)}
                  className={`rounded-full border-2 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                    showOnlyActive
                      ? "border-[#5c1c00] bg-yellow-300 text-[#4a0000]"
                      : "border-[#5c1c00] bg-[#ffe08a] text-[#5c1c00] hover:bg-yellow-200"
                  }`}
                >
                  Solo activos
                </button>
              </div>
            </div>
          )}
        </section>

        {filteredProducts.length === 0 ? (
          <section className="mt-5 rounded-[2rem] border-2 border-[#5c1c00] bg-[#ffe08a] px-6 py-14 text-center shadow-[0_8px_0_rgba(92,28,0,0.16)]">
            <PackageCheck className="mx-auto text-[#5c1c00]" size={54} />
            <h2 className="mt-5 text-3xl font-black uppercase text-[#5c1c00]">
              Sin productos del menú
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-[#3a0000]/70">
              Carga el menú actual o registra un producto nuevo desde el formulario superior.
            </p>
          </section>
        ) : (
          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredProducts.map((product) => {
              const activeClasses = product.isActive
                ? "border-green-500/40 bg-green-50 text-green-800"
                : "border-red-500/45 bg-red-50 text-red-800"

              return (
                <article key={product.id} className="overflow-hidden rounded-[1.6rem] border-2 border-[#5c1c00] bg-[#ffe08a] shadow-[0_8px_0_rgba(92,28,0,0.16)]">
                  <div className="border-b-2 border-[#5c1c00] bg-[#d08a00] px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#5c1c00]">
                          {product.category} · Orden {product.sortOrder || product.id}
                        </p>
                        <h2 className="mt-1 text-2xl font-black uppercase leading-none text-[#5c1c00] drop-shadow-[0_2px_0_rgba(92,28,0,0.35)]">
                          {product.name}
                        </h2>
                      </div>

                      <span className={`inline-flex w-fit items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-black uppercase ${activeClasses}`}>
                        {product.isActive ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                        {product.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
                      <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-[1.2rem] border-2 border-[#5c1c00]/20 bg-[#d08a00]">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <ImageIcon className="text-[#5c1c00]/45" size={34} />
                        )}
                      </div>

                      <div className="space-y-2">
                        <InfoBox label="Precio" value={formatUSD(product.price)} />
                        <InfoBox label="Pago" value={product.paymentMode === "divisa" ? "Divisas y bolívares" : "Mixto"} />
                        <InfoBox label="Destacado" value={product.isFeatured ? "Sí" : "No"} icon={product.isFeatured ? <Star size={14} /> : undefined} />
                      </div>
                    </div>

                    {product.description && (
                      <p className="rounded-[1.2rem] border-2 border-[#5c1c00]/20 bg-[#d08a00] p-3 text-sm font-bold leading-6 text-[#3a0000]/75">
                        {product.description}
                      </p>
                    )}

                    <p className="text-xs font-bold text-[#3a0000]/55">
                      Actualizado: {formatDate(product.updatedAt)}
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => editProduct(product)}
                        className="min-h-[44px] rounded-2xl border-2 border-[#5c1c00] bg-yellow-300 px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-[#4a0000]"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => saveProduct({ ...product, isFeatured: !product.isFeatured })}
                        disabled={isSaving}
                        className="min-h-[44px] rounded-2xl border-2 border-[#5c1c00] bg-[#ffe08a] px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-[#5c1c00] disabled:opacity-50"
                      >
                        {product.isFeatured ? "Quitar destacado" : "Destacar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => saveProduct({ ...product, isActive: !product.isActive })}
                        disabled={isSaving}
                        className="min-h-[44px] rounded-2xl border-2 border-[#5c1c00] bg-[#ffe08a] px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-[#5c1c00] disabled:opacity-50"
                      >
                        {product.isActive ? "Pausar" : "Activar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => deactivateProduct(product.id)}
                        disabled={deletingProductId === product.id}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-red-100 px-4 py-2.5 text-xs font-black uppercase tracking-[0.1em] text-red-700 disabled:opacity-50"
                      >
                        {deletingProductId === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Desactivar
                      </button>
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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  full = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  inputMode?: "text" | "decimal" | "numeric"
  full?: boolean
}) {
  return (
    <div className={full ? "lg:col-span-2" : ""}>
      <label className="text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00]">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-2 w-full rounded-2xl border-2 border-[#5c1c00]/25 bg-[#d08a00] px-4 py-4 text-base font-bold text-[#4a0000] outline-none placeholder:text-[#4a0000]/45 focus:border-[#5c1c00]"
      />
    </div>
  )
}

function ToggleCard({
  title,
  description,
  checked,
  onChange,
  activeLabel,
  inactiveLabel,
  icon,
}: {
  title: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  activeLabel: string
  inactiveLabel: string
  icon: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`group flex min-h-[48px] items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left transition active:scale-[0.99] ${
        checked
          ? "border-[#5c1c00] bg-yellow-300 text-[#4a0000] shadow-[0_3px_0_rgba(160,0,0,0.10)]"
          : "border-[#5c1c00]/35 bg-[#ffe08a] text-[#5c1c00] hover:border-[#5c1c00] hover:bg-yellow-50"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
            checked
              ? "border-[#5c1c00] bg-[#ffe08a] text-[#5c1c00]"
              : "border-[#5c1c00]/35 bg-[#d08a00] text-[#5c1c00]/70"
          }`}
        >
          {icon}
        </span>

        <span className="min-w-0">
          <span className="block text-[0.64rem] font-black uppercase leading-tight tracking-[0.13em]">
            {title}
          </span>
          <span className="mt-0.5 hidden text-[0.66rem] font-bold leading-4 text-[#3a0000]/58 sm:line-clamp-1 sm:block">
            {description}
          </span>
        </span>
      </span>

      <span
        className={`inline-flex h-7 shrink-0 items-center rounded-lg border-2 px-2 text-[0.54rem] font-black uppercase tracking-[0.09em] ${
          checked
            ? "border-[#5c1c00] bg-[#ffe08a] text-[#5c1c00]"
            : "border-[#5c1c00]/30 bg-[#d08a00] text-[#5c1c00]/65"
        }`}
      >
        {checked ? activeLabel : inactiveLabel}
      </span>
    </button>
  )
}

function MetricCard({
  label,
  value,
  tone = "soft",
}: {
  label: string
  value: string | number
  tone?: "soft" | "warning" | "danger"
}) {
  const style =
    tone === "danger"
      ? "border-red-500/45 bg-red-50 text-red-800"
      : tone === "warning"
        ? "border-yellow-400 bg-yellow-100 text-[#8a5a00]"
        : "border-[#5c1c00] bg-[#d08a00] text-[#5c1c00]"

  return (
    <div className={`min-w-0 overflow-hidden rounded-[1.2rem] border-2 p-3 ${style}`}>
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 break-words text-xl font-black leading-tight sm:text-2xl">
        {value}
      </p>
    </div>
  )
}

function InfoBox({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-[1.2rem] border-2 border-[#5c1c00]/25 bg-[#d08a00] p-3">
      <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-[#5c1c00]">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-2 break-words text-sm font-black text-[#220000]">
        {icon}
        {value || "—"}
      </p>
    </div>
  )
}
