"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
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

  const filteredProducts =
    selectedCategory === "Todos"
      ? products
      : products.filter((product) => product.category === selectedCategory)

  return (
    <section
      id="menu"
      className="relative overflow-hidden bg-black px-4 py-20 text-white sm:px-6 sm:py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.10),transparent_30%),linear-gradient(to_bottom,#120505_0%,#050505_28%,#030303_100%)]" />

      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-red-950/25 via-black/40 to-transparent" />
      <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />
      <div className="absolute -right-28 top-40 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55 }}
          className="mb-10 max-w-3xl sm:mb-14"
        >
          <div className="mb-5 inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400 sm:text-sm">
              Menú Burger Club
            </p>
          </div>

          <h2 className="text-5xl font-black uppercase leading-[0.88] tracking-[-0.08em] sm:text-6xl lg:text-7xl">
            Elige tu próximo{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              antojo
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Arma tu pedido con perros, hamburguesas, bebidas y extras. Revisa
            el precio en dólares y bolívares, agrega al carrito y pide directo
            por WhatsApp.
          </p>
        </motion.div>

        <div className="sticky top-[74px] z-20 -mx-4 mb-10 border-y border-white/5 bg-black/75 px-4 py-4 backdrop-blur-xl sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => {
              const isActive = selectedCategory === category

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full border px-5 py-3 text-sm font-black uppercase transition ${
                    isActive
                      ? "border-yellow-400 bg-yellow-400 text-black shadow-lg shadow-yellow-950/30"
                      : "border-white/10 bg-zinc-950/90 text-zinc-300 hover:border-yellow-400 hover:text-yellow-400"
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>

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
      </div>
    </section>
  )
}