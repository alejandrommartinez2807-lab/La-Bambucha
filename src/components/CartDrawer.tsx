"use client"

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

  console.log("EXCHANGE RAW EN DRAWER:", exchangeRate)

  const safeExchangeRate = Number(exchangeRate) || siteConfig.currency.fallbackRate

  const totalBs = Number((totalPrice * safeExchangeRate).toFixed(2))

  console.log("USD:", totalPrice)
  console.log("RATE USADA:", safeExchangeRate)
  console.log("TOTAL BS EXACTO 2 DECIMALES:", totalBs)
  const whatsappMessage = encodeURIComponent(
    `Hola, me gustaría hacer un pedido con los siguientes productos:

${items
  .map((item) => {
    const usdTotal = item.price * item.quantity
    const bsTotal = usdTotal * safeExchangeRate

    return `• ${item.name}
Cantidad: ${item.quantity}
USD: $${usdTotal.toFixed(2)}
Bs: ${bsTotal.toFixed(2)}`
  })
  .join("\n\n")}

Total USD: $${totalPrice.toFixed(2)}
Total Bs: ${totalBs.toFixed(2)}

Muchas gracias.`
  )

  const whatsappUrl = `https://wa.me/${siteConfig.business.whatsapp}?text=${whatsappMessage}`

  return (
    <div className="fixed inset-0 z-[100]">
      <div onClick={onClose} className="absolute inset-0 bg-black/70" />

      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-2xl font-semibold text-white">Your Cart</h2>

          <button
            onClick={onClose}
            className="text-2xl text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <p className="text-zinc-500">Your cart is empty.</p>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-white/10 pb-6"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 rounded-xl object-cover"
                  />

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-yellow-500">
                        {formatUSD(item.price)}
                        </p>
                        <p className="text-sm text-zinc-400">
                          Bs {formatVES(item.price * safeExchangeRate)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-auto flex items-center gap-3 pt-4">
                      <button
                        onClick={() => decreaseQuantity(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-white"
                      >
                        -
                      </button>

                      <span className="w-6 text-center text-white">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-6">
          <div className="mb-6 flex items-center justify-between">
            <span className="text-lg text-zinc-400">Total</span>

            <div className="text-right">
              <span className="block text-2xl font-bold text-yellow-500">
                {formatUSD(totalPrice)}
              </span>
              <span className="text-sm text-zinc-400">
                Bs {formatVES(totalBs)}
              </span>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-xl bg-yellow-500 py-4 text-center font-semibold text-black transition hover:bg-yellow-400"
          >
            Checkout on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}