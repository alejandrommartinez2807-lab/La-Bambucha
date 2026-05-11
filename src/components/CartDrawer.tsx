"use client"

import { motion } from "motion/react"
import {
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  MessageCircle,
} from "lucide-react"
import { CartItem } from "@/hooks/useCart"
import { siteConfig } from "@/config/site"
import { formatUSD, formatVES } from "@/utils/formatCurrency"

type CartDrawerProps = {
  items: CartItem[]
  totalPrice: number
  isOpen: boolean
  onClose: () => void
  increaseQuantity: (id: number) => void
  decreaseQuantity: (id: number) => void
  removeItem: (id: number) => void
  exchangeRate: number
}

export default function CartDrawer({
  items,
  totalPrice,
  isOpen,
  onClose,
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  exchangeRate,
}: CartDrawerProps) {
  if (!isOpen) return null

  const safeExchangeRate =
    Number(exchangeRate) || siteConfig.currency.fallbackRate

  const totalBs = Number((totalPrice * safeExchangeRate).toFixed(2))

  const whatsappMessage = encodeURIComponent(
    `Hola Burger Club, me gustaría hacer este pedido:

${items
  .map((item) => {
    const unitBs = item.price * safeExchangeRate
    const usdTotal = item.price * item.quantity
    const bsTotal = usdTotal * safeExchangeRate

    return `• ${item.name}
Cantidad: ${item.quantity}
Precio unitario: ${formatUSD(item.price)} / Bs ${formatVES(unitBs)}
Subtotal: ${formatUSD(usdTotal)} / Bs ${formatVES(bsTotal)}`
  })
  .join("\n\n")}

Total USD: ${formatUSD(totalPrice)}
Total Bs: Bs ${formatVES(totalBs)}

Tasa usada: 1 USD = Bs ${safeExchangeRate.toFixed(2)}

Muchas gracias.`
  )

  const whatsappUrl = `https://wa.me/${siteConfig.business.whatsapp}?text=${whatsappMessage}`

  return (
    <div className="fixed inset-0 z-[100]">
      <motion.div
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      />

      <motion.aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-zinc-950 shadow-2xl shadow-black"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
              Tu pedido
            </p>

            <h2 className="mt-1 text-3xl font-black uppercase text-white">
              Carrito
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-zinc-300 transition hover:bg-white/15 hover:text-white"
            aria-label="Cerrar carrito"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-yellow-400">
                <ShoppingCart size={38} />
              </div>

              <h3 className="text-xl font-black text-white">
                Tu carrito está vacío
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
                Agrega hamburguesas, perros, bebidas o extras para armar tu
                pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => {
                const itemTotalUsd = item.price * item.quantity
                const itemTotalBs = itemTotalUsd * safeExchangeRate

                return (
                  <motion.div
                    key={item.id}
                    layout
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-24 rounded-xl object-cover"
                      />

                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-white">
                              {item.name}
                            </h3>

                            <p className="mt-1 text-sm font-bold text-yellow-400">
                              {formatUSD(item.price)}
                            </p>

                            <p className="text-xs text-zinc-400">
                              Bs {formatVES(item.price * safeExchangeRate)}
                            </p>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => decreaseQuantity(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-white transition hover:bg-zinc-700"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="w-7 text-center font-black text-white">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => increaseQuantity(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-white transition hover:bg-zinc-700"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-black text-white">
                              {formatUSD(itemTotalUsd)}
                            </p>

                            <p className="text-xs text-zinc-500">
                              Bs {formatVES(itemTotalBs)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-black/35 p-6">
          <div className="mb-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-bold text-zinc-300">
                Tasa usada
              </span>

              <span className="text-sm font-black text-yellow-400">
                1 USD = Bs {safeExchangeRate.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-zinc-400">
                Total USD
              </span>

              <span className="text-2xl font-black text-yellow-400">
                {formatUSD(totalPrice)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-zinc-400">
                Total Bs
              </span>

              <span className="text-xl font-black text-white">
                Bs {formatVES(totalBs)}
              </span>
            </div>
          </div>

          <a
            href={items.length === 0 ? undefined : whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex w-full items-center justify-center gap-3 rounded-xl py-4 text-center font-black uppercase transition ${
              items.length === 0
                ? "pointer-events-none bg-zinc-800 text-zinc-500"
                : "bg-green-500 text-white shadow-xl shadow-green-950/40 hover:-translate-y-1 hover:bg-green-400"
            }`}
          >
            <MessageCircle size={20} />
            Pedir por WhatsApp
          </a>
        </div>
      </motion.aside>
    </div>
  )
}