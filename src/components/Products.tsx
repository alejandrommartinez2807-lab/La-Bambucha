"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Search, X } from "lucide-react"
import ProductCard from "./ProductCard"
import { categories, products } from "@/data/products"
import type { ProductToAdd } from "@/hooks/useCart"

type ProductsProps = {
  onAddToCart: (product: ProductToAdd) => void
  exchangeRate: number
}

export default function Products({
  onAddToCart,
  exchangeRate,
}: ProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "Todos" || product.category === selectedCategory

      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchTerm])

  return (
    <section
      id="menu"
      className="relative overflow-hidden bg-[#d69a00] px-4 pb-20 pt-12 text-white sm:px-6 sm:pb-28 sm:pt-18"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,238,90,0.50),transparent_34%),radial-gradient(circle_at_right,rgba(255,79,0,0.34),transparent_34%),linear-gradient(to_bottom,#f1c21b_0%,#d69a00_34%,#b85d00_100%)]" />

      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#d69a00] via-[#d69a00]/70 to-transparent" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-200/35 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55 }}
          className="mb-8 max-w-3xl sm:mb-12"
        >
          <div className="mb-5 inline-flex rounded-full border border-[#2a1200]/25 bg-[#2a1200]/15 px-4 py-2 shadow-lg shadow-yellow-950/10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#2a1200] sm:text-sm">
              Menú La Bambucha
            </p>
          </div>

          <h2 className="text-5xl font-black uppercase leading-[0.88] tracking-[-0.08em] text-white drop-shadow-[0_4px_0_rgba(80,20,0,0.35)] sm:text-6xl lg:text-7xl">
            Elige tu próximo{" "}
            <span className="text-[#2a1200] drop-shadow-none">antojo</span>
          </h2>

          <p className="mt-5 max-w-2xl text-base font-bold leading-relaxed text-[#2a1200]/85 sm:text-lg">
            Arma tu pedido con perritos, hamburguesas, bebidas y extras. Revisa
            el precio en dólares y bolívares, agrega al carrito y pide directo
            por WhatsApp.
          </p>
        </motion.div>

        <div className="mb-5 rounded-[1.7rem] border border-[#2a1200]/18 bg-[#2a1200]/18 p-3 shadow-2xl shadow-[#5a1a00]/20 backdrop-blur-xl">
          <div className="relative">
            <Search
              size={20}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2a1200]/70"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-2xl border border-[#2a1200]/20 bg-yellow-100/75 py-4 pl-12 pr-12 text-base font-bold text-[#2a1200] outline-none placeholder:text-[#2a1200]/55 focus:border-[#2a1200] focus:bg-yellow-50"
            />

            {searchTerm.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl bg-[#2a1200] text-yellow-300 transition hover:scale-105"
                aria-label="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="mb-10 rounded-[1.7rem] border border-[#2a1200]/18 bg-[#2a1200]/18 p-3 shadow-2xl shadow-[#5a1a00]/20 backdrop-blur-xl">
          <div className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
              const isActive = selectedCategory === category

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full border px-5 py-3 text-sm font-black uppercase transition ${
                    isActive
                      ? "border-[#2a1200] bg-[#2a1200] text-yellow-300 shadow-lg shadow-[#5a1a00]/30"
                      : "border-[#2a1200]/20 bg-yellow-300/40 text-[#2a1200] hover:border-[#2a1200] hover:bg-yellow-200"
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  category={product.category}
                  description={product.description}
                  price={product.price}
                  image={product.image}
                  exchangeRate={exchangeRate}
                  onAddToCart={onAddToCart}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="rounded-[2rem] border border-[#2a1200]/20 bg-[#2a1200]/20 p-8 text-center shadow-2xl shadow-[#5a1a00]/20">
            <p className="text-2xl font-black uppercase text-[#2a1200]">
              No encontramos ese producto
            </p>

            <p className="mx-auto mt-3 max-w-xl font-semibold text-[#2a1200]/75">
              Prueba buscando otro nombre o cambia la categoría para ver más
              opciones del menú.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("")
                setSelectedCategory("Todos")
              }}
              className="mt-6 rounded-full bg-[#2a1200] px-6 py-3 text-sm font-black uppercase text-yellow-300 transition hover:scale-105"
            >
              Ver todo el menú
            </button>
          </div>
        )}
      </div>
    </section>
  )
}