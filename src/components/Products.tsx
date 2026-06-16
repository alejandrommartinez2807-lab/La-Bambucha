"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Sparkles } from "lucide-react"
import ProductCard from "@/components/ProductCard"
import {
  categories as fallbackCategories,
  products as fallbackProducts,
  type Product,
} from "@/data/products"
import type { ProductToAdd } from "@/hooks/useCart"

type ProductsProps = {
  exchangeRate: number
  onAddToCart: (product: ProductToAdd) => void
  products?: Product[]
  categories?: string[]
  warning?: string | null
  isLoading?: boolean
}

function buildCategories(products: Product[], apiCategories?: string[]) {
  const fromApi = Array.isArray(apiCategories)
    ? apiCategories.map((category) => String(category || "").trim()).filter(Boolean)
    : []

  const merged = [
    "Todos",
    ...fallbackCategories.filter((category) => category !== "Todos"),
    ...fromApi.filter((category) => category !== "Todos"),
    ...products.map((product) => product.category).filter(Boolean),
  ]

  return Array.from(new Set(merged)).filter(Boolean)
}

export default function Products({
  exchangeRate,
  onAddToCart,
  products = fallbackProducts,
  categories = fallbackCategories,
  warning = null,
  isLoading = false,
}: ProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")

  const menuProducts = useMemo(() => {
    return products.length ? products : fallbackProducts
  }, [products])

  const menuCategories = useMemo(() => {
    return buildCategories(menuProducts, categories)
  }, [menuProducts, categories])

  useEffect(() => {
    if (!menuCategories.includes(selectedCategory)) {
      setSelectedCategory("Todos")
    }
  }, [menuCategories, selectedCategory])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return menuProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "Todos" || product.category === selectedCategory

      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [menuProducts, searchTerm, selectedCategory])

  return (
    <section
      id="menu"
      className="relative overflow-hidden bg-[#d8a116] px-4 py-16 text-[#210a00] sm:px-6 lg:px-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,243,166,0.62),transparent_32%),radial-gradient(circle_at_80%_30%,rgba(255,128,0,0.24),transparent_36%),linear-gradient(180deg,#e4ad19_0%,#ffdd32_42%,#d28d00_100%)]" />
      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#7a2700]/18 to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#5c1c00]/25 bg-[#f0cb55]/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#5c1c00] shadow-[0_4px_0_rgba(92,28,0,0.12)]">
              <Sparkles size={16} />
              Menú La Bambucha
            </p>
            <h2 className="mt-5 max-w-3xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-[#fff8e8] drop-shadow-[0_6px_0_rgba(91,48,0,0.35)] sm:text-6xl lg:text-7xl">
              Elige tu próximo antojo
            </h2>
            <p className="mt-5 max-w-2xl text-base font-black leading-7 text-[#3d2200] sm:text-lg">
              Arma tu pedido con hamburguesas, perritos, pepitos, shawarmas,
              parrillas, combos y bebidas. Revisa el precio en Ref. y bolívares,
              agrega al carrito y pide directo por WhatsApp.
            </p>
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-[#5c1c00]"
            />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-[#5c1c00]/18 bg-yellow-50/90 px-14 py-5 text-sm font-black text-[#3a1600] shadow-[0_10px_24px_rgba(92,28,0,0.12)] outline-none placeholder:text-[#5c1c00]/45 focus:border-[#5c1c00]"
            />
          </div>
        </div>

        {warning && (
          <div className="mt-7 rounded-2xl border border-[#5c1c00]/20 bg-[#fff1a6] px-5 py-4 text-sm font-black leading-6 text-[#5c1c00] shadow-[0_8px_18px_rgba(92,28,0,0.08)]">
            {warning}
          </div>
        )}

        {isLoading && (
          <div className="mt-7 rounded-2xl border border-[#5c1c00]/15 bg-yellow-100/70 px-5 py-4 text-sm font-black leading-6 text-[#5c1c00] shadow-[0_8px_18px_rgba(92,28,0,0.06)]">
            Actualizando menú...
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-[1.6rem] border border-[#8d5a00]/25 bg-[#d9a50f]/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_24px_rgba(92,28,0,0.14)] backdrop-blur-sm">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {menuCategories.map((category) => {
              const isActive = selectedCategory === category

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
                    isActive
                      ? "bg-[#4a1f00] text-yellow-200 shadow-[0_5px_0_rgba(0,0,0,0.16)]"
                      : "bg-yellow-300/80 text-[#3a1600] hover:bg-yellow-200"
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="mt-8 rounded-[1.7rem] border border-[#5c1c00]/18 bg-[#4a1f00]/92 px-5 py-12 text-center text-yellow-50 shadow-xl shadow-[#6b2a00]/20">
            <p className="text-xl font-black uppercase text-yellow-200">
              No encontramos productos con ese filtro
            </p>
            <p className="mt-2 text-sm font-bold text-yellow-50/75">
              Limpia la búsqueda o cambia de categoría para ver el menú.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                {...product}
                exchangeRate={exchangeRate}
                index={index}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
