"use client"

import {
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
  StickyNote,
} from "lucide-react"
import type { CartItem } from "@/hooks/useCart"

type CartDrawerProps = {
  items: CartItem[]
  totalPrice: number
  isOpen: boolean
  onClose: () => void
  increaseQuantity: (id: number) => void
  decreaseQuantity: (id: number) => void
  removeItem: (id: number) => void
  updateItemNote: (id: number, note: string) => void
  updateItemNoteEnabled: (id: number, noteEnabled: boolean) => void
  exchangeRate: number
}

const NON_CUSTOMIZABLE_CATEGORIES = ["bebidas"]

function canCustomizeItem(item: CartItem) {
  return !NON_CUSTOMIZABLE_CATEGORIES.includes(item.category.toLowerCase())
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatRef(value: number) {
  return formatNumber(value)
}

function formatBs(value: number) {
  return formatNumber(value)
}

function buildItemLine(item: CartItem, index: number, exchangeRate: number) {
  const subtotalRef = item.price * item.quantity
  const subtotalBs =
    exchangeRate && exchangeRate > 0 ? subtotalRef * exchangeRate : null

  const note = item.note?.trim()

  return `${index + 1}. ${item.name}
Cantidad: ${item.quantity}
Precio unitario: Ref. ${formatRef(item.price)}
Subtotal: Ref. ${formatRef(subtotalRef)}${
    subtotalBs ? `\nSubtotal Bs.: ${formatBs(subtotalBs)}` : ""
  }${
    canCustomizeItem(item) && item.noteEnabled && note
      ? `\nNota: ${note}`
      : ""
  }`
}

export default function CartDrawer({
  items,
  totalPrice,
  isOpen,
  onClose,
  increaseQuantity,
  decreaseQuantity,
  removeItem,
  updateItemNote,
  updateItemNoteEnabled,
  exchangeRate,
}: CartDrawerProps) {
  const totalBs =
    exchangeRate && exchangeRate > 0 ? totalPrice * exchangeRate : null

  const whatsappMessage = encodeURIComponent(
    `LA BAMBUCHA GRILL BURGER
Nuevo pedido

------------------------------
Productos

${items
  .map((item, index) => buildItemLine(item, index, exchangeRate))
  .join("\n\n")}

------------------------------
Total: Ref. ${formatRef(totalPrice)}${
      totalBs ? `\nTotal aprox. Bs.: ${formatBs(totalBs)}` : ""
    }${
      exchangeRate && exchangeRate > 0
        ? `\nTasa usada: Bs. ${formatBs(exchangeRate)}`
        : ""
    }`
  )

  return (
    <>
      {isOpen && (
        <button
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          aria-label="Cerrar carrito"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-[90] h-full w-full max-w-md border-l border-orange-500/25 bg-[#080101] text-white shadow-[-20px_0_60px_rgba(0,0,0,0.65)] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-orange-500/20 bg-gradient-to-r from-red-950 via-black to-red-950 px-5 py-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">
                La Bambucha
              </p>

              <h2 className="flex items-center gap-2 text-2xl font-black uppercase">
                <ShoppingCart className="text-yellow-400" size={24} />
                Tu pedido
              </h2>
            </div>

            <button
              onClick={onClose}
              className="rounded-full border border-orange-500/30 bg-black/60 p-2 text-orange-300 transition hover:bg-orange-500 hover:text-black"
              aria-label="Cerrar carrito"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <img
                  src="/logo-bambucha.png"
                  alt="La Bambucha Grill Burger"
                  className="mb-6 h-32 w-32 object-contain opacity-80 drop-shadow-[0_0_25px_rgba(255,90,0,0.6)]"
                />

                <h3 className="text-2xl font-black uppercase text-white">
                  Tu carrito está vacío
                </h3>

                <p className="mt-3 max-w-xs text-sm text-zinc-400">
                  Agrega combos, hamburguesas, perritos o pepitos para preparar
                  tu pedido.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => {
                  const showNoteOption = canCustomizeItem(item)
                  const noteIsOpen = Boolean(item.noteEnabled)
                  const itemSubtotalRef = item.price * item.quantity
                  const itemSubtotalBs =
                    exchangeRate && exchangeRate > 0
                      ? itemSubtotalRef * exchangeRate
                      : null

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-orange-500/20 bg-gradient-to-b from-[#170505] to-black p-4"
                    >
                      <div className="flex gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-xl bg-black">
                          <img
                            src={item.image || "/logo-bambucha.png"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.onerror = null
                              event.currentTarget.src = "/logo-bambucha.png"
                              event.currentTarget.className =
                                "h-full w-full object-contain p-3"
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 font-black uppercase text-white">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-sm font-black text-yellow-400">
                            Ref. {formatRef(item.price)}
                          </p>

                          <div className="mt-2 rounded-xl border border-orange-500/15 bg-black/40 px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-400">
                                Subtotal
                              </span>

                              <span className="text-sm font-black text-yellow-400">
                                Ref. {formatRef(itemSubtotalRef)}
                              </span>
                            </div>

                            {itemSubtotalBs && (
                              <div className="mt-1 flex items-center justify-between gap-3">
                                <span className="text-[11px] font-bold text-zinc-500">
                                  En bolívares
                                </span>

                                <span className="text-sm font-black text-zinc-200">
                                  Bs. {formatBs(itemSubtotalBs)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div className="flex items-center rounded-full border border-orange-500/25 bg-black/60">
                              <button
                                onClick={() => {
                                  if (item.quantity <= 1) {
                                    removeItem(item.id)
                                  } else {
                                    decreaseQuantity(item.id)
                                  }
                                }}
                                className="p-2 text-orange-300 transition hover:text-yellow-300"
                                aria-label="Disminuir cantidad"
                              >
                                <Minus size={16} />
                              </button>

                              <span className="min-w-8 text-center text-sm font-black">
                                {item.quantity}
                              </span>

                              <button
                                onClick={() => increaseQuantity(item.id)}
                                className="p-2 text-orange-300 transition hover:text-yellow-300"
                                aria-label="Aumentar cantidad"
                              >
                                <Plus size={16} />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="rounded-full border border-red-500/30 bg-red-950/40 p-2 text-red-300 transition hover:bg-red-600 hover:text-white"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {showNoteOption && (
                        <div className="mt-4 rounded-2xl border border-orange-500/20 bg-black/45 p-3">
                          <label
                            htmlFor={`note-check-${item.id}`}
                            className="flex cursor-pointer items-center justify-between gap-3"
                          >
                            <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-orange-400">
                              <StickyNote size={15} />
                              Agregar nota
                            </span>

                            <input
                              id={`note-check-${item.id}`}
                              type="checkbox"
                              checked={noteIsOpen}
                              onChange={(event) =>
                                updateItemNoteEnabled(
                                  item.id,
                                  event.target.checked
                                )
                              }
                              className="h-5 w-5 cursor-pointer accent-orange-500"
                            />
                          </label>

                          {noteIsOpen && (
                            <div className="mt-3">
                              <textarea
                                id={`note-${item.id}`}
                                value={item.note ?? ""}
                                onChange={(event) =>
                                  updateItemNote(item.id, event.target.value)
                                }
                                maxLength={140}
                                rows={3}
                                placeholder="Ej: Sin cebolla, sin tomate, poca salsa, sin picante..."
                                className="w-full resize-none rounded-xl border border-orange-500/20 bg-[#050101] px-3 py-3 text-sm font-semibold text-white outline-none placeholder:text-zinc-600 focus:border-orange-400"
                              />

                              <div className="mt-2 flex items-center justify-between gap-3">
                                <p className="text-[11px] font-semibold text-zinc-500">
                                  Indica ingredientes que quieras quitar o
                                  ajustar.
                                </p>

                                <span className="shrink-0 text-[11px] font-black text-zinc-500">
                                  {(item.note ?? "").length}/140
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-orange-500/20 bg-black px-5 py-5">
            <div className="mb-4 rounded-2xl border border-orange-500/25 bg-[#150505] p-4">
              <div className="flex items-center justify-between">
                <span className="font-black uppercase text-zinc-300">
                  Total
                </span>

                <span className="text-2xl font-black text-yellow-400">
                  Ref. {formatRef(totalPrice)}
                </span>
              </div>

              {totalBs && (
                <div className="mt-3 space-y-2">
                  <p className="text-right text-sm font-bold text-zinc-400">
                    Aprox. Bs. {formatBs(totalBs)}
                  </p>

                  <div className="rounded-xl border border-orange-500/20 bg-black/45 px-3 py-2 text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-400">
                      Tasa usada
                    </p>

                    <p className="mt-1 text-sm font-black text-yellow-400">
                      Bs. {formatBs(exchangeRate)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <a
              href={
                items.length > 0
                  ? `https://wa.me/584244721722?text=${whatsappMessage}`
                  : "https://wa.me/584244721722"
              }
              target="_blank"
              rel="noreferrer"
              className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-center font-black uppercase shadow-[0_0_25px_rgba(255,90,0,0.3)] transition ${
                items.length > 0
                  ? "bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 text-black hover:scale-[1.02]"
                  : "cursor-not-allowed bg-zinc-800 text-zinc-500"
              }`}
            >
              <MessageCircle size={22} />
              Enviar pedido
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}