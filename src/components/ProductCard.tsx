"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Plus, ShoppingCart } from "lucide-react"
import { formatUSD, formatVES } from "@/utils/formatCurrency"
import type { ProductToAdd } from "@/hooks/useCart"

type ProductCardProps = {
  id: number
  name: string
  category: string
  description: string
  price: number
  image: string
  exchangeRate: number
  index?: number
  onAddToCart: (product: ProductToAdd) => void
}

export default function ProductCard({
  id,
  name,
  category,
  description,
  price,
  image,
  exchangeRate,
  index = 0,
  onAddToCart,
}: ProductCardProps) {
  const [added, setAdded] = useState(false)

  function handleAddToCart() {
    onAddToCart({
      id,
      name,
      category,
      price,
      image,
    })

    setAdded(true)

    setTimeout(() => {
      setAdded(false)
    }, 900)
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 26, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.96 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-[1.8rem] border border-[#5a2a00]/20 bg-[#4a1f00]/92 shadow-2xl shadow-[#6b2a00]/20 backdrop-blur"
    >
      <div className="relative h-64 overflow-hidden bg-[#120800] sm:h-72">
        <motion.img
          src={image || "/logo-bambucha.png"}
          alt={name}
          className="h-full w-full object-cover"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.45 }}
          onError={(event) => {
            event.currentTarget.src = "/logo-bambucha.png"
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        <span className="absolute left-4 top-4 rounded-full border border-yellow-300/25 bg-black/72 px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300 backdrop-blur">
          {category}
        </span>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="max-w-[58%]">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-yellow-300">
              La Bambucha
            </p>

            <h3 className="mt-1 text-[1.95rem] font-black uppercase leading-[0.95] tracking-[-0.05em] text-white sm:text-[2.2rem]">
              {name}
            </h3>
          </div>

          <div className="min-w-[110px] rounded-[1.4rem] bg-[#f1d42f] px-4 py-3 text-right text-[#1f1100] shadow-xl shadow-yellow-950/20">
            <p className="text-2xl font-black leading-none">
              {formatUSD(price)}
            </p>

            <div className="mt-2 border-t border-[#6b4a00]/20 pt-2">
              <p className="text-sm font-black leading-none sm:text-base">
                Bs {formatVES(price * exchangeRate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="min-h-[56px] text-sm leading-relaxed text-yellow-50/85 sm:text-base">
          {description}
        </p>

        <button
          type="button"
          onClick={handleAddToCart}
          className={`mt-6 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-4 font-black uppercase transition active:scale-[0.98] ${
            added
              ? "bg-green-500 text-white"
              : "bg-gradient-to-r from-red-700 via-orange-500 to-yellow-300 text-black hover:from-red-600 hover:via-orange-400 hover:to-yellow-200"
          }`}
        >
          {added ? (
            <>
              <ShoppingCart size={18} />
              Agregado
            </>
          ) : (
            <>
              <Plus size={18} />
              Agregar al carrito
            </>
          )}
        </button>
      </div>
    </motion.article>
  )
}