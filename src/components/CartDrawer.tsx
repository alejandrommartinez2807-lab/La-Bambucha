"use client"

import { FileText, MessageCircle, Minus, Plus, Trash2, X } from "lucide-react"

type CartItem = {
  id: number
  name: string
  price: number
  image: string
  quantity: number
  category?: string
  note?: string
  noteEnabled?: boolean
}

type CartDrawerProps = {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  totalPrice: number
  removeItem: (id: number) => void
  increaseQuantity: (id: number) => void
  decreaseQuantity: (id: number) => void
  updateItemNote?: (id: number, note: string) => void
  updateItemNoteEnabled?: (id: number, enabled: boolean) => void
  exchangeRate: number | null
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatBs(value: number) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function buildWhatsAppMessage(items: CartItem[], totalPrice: number, exchangeRate: number | null) {
  const lines = items.map((item) => {
    const subtotal = item.price * item.quantity
    const noteText =
      item.noteEnabled && item.note?.trim()
        ? `\n   Nota: ${item.note.trim()}`
        : ""

    return `• ${item.name} x${item.quantity} — $${formatUsd(subtotal)}${noteText}`
  })

  const bsTotal = exchangeRate ? totalPrice * exchangeRate : null

  return encodeURIComponent(
    [
      "Hola, quiero hacer este pedido en La Bambucha:",
      "",
      ...lines,
      "",
      `Total: $${formatUsd(totalPrice)}`,
      bsTotal ? `Aprox. Bs. ${formatBs(bsTotal)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  )
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  totalPrice,
  removeItem,
  increaseQuantity,
  decreaseQuantity,
  updateItemNote,
  updateItemNoteEnabled,
  exchangeRate,
}: CartDrawerProps) {
  const hasItems = items.length > 0
  const totalBs = exchangeRate ? totalPrice * exchangeRate : 0

  const whatsappHref = `https://wa.me/584244721722?text=${buildWhatsAppMessage(
    items,
    totalPrice,
    exchangeRate,
  )}`

  return (
    <>
      {isOpen && (
        <button
          aria-label="Cerrar carrito"
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]"
        />
      )}

      <aside
        className={[
          "fixed right-0 top-0 z-[90] flex h-dvh w-full max-w-[520px] flex-col overflow-hidden border-l border-yellow-500/20",
          "bg-[linear-gradient(180deg,#2b0802_0%,#120100_38%,#050000_100%)] text-white shadow-[-18px_0_55px_rgba(0,0,0,0.55)]",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="relative overflow-hidden border-b border-yellow-500/15 bg-[linear-gradient(90deg,#5b1205_0%,#2a0501_48%,#7b1706_100%)] px-7 py-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,198,43,0.18),transparent_38%)]" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.38em] text-yellow-400">
                La Bambucha
              </p>
              <h2 className="mt-1 flex items-center gap-3 text-4xl font-black uppercase leading-none text-white">
                <span className="text-yellow-400">
                  <ShoppingCartIcon />
                </span>
                Tu pedido
              </h2>
            </div>

            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-yellow-400/25 bg-black/25 text-yellow-100 transition hover:bg-yellow-400 hover:text-[#431000]"
            >
              <X size={26} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {!hasItems ? (
            <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
              <img
                src="/logo-bambucha.png"
                alt="La Bambucha"
                className="mb-8 h-28 w-28 object-contain drop-shadow-[0_0_35px_rgba(255,119,0,0.35)]"
              />
              <h3 className="text-3xl font-black uppercase text-white">
                Tu carrito está vacío
              </h3>
              <p className="mt-4 max-w-sm text-lg font-medium leading-7 text-yellow-50/65">
                Agrega combos, hamburguesas, perritos o pepitos para preparar tu pedido.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((item) => {
                const subtotal = item.price * item.quantity
                const subtotalBs = exchangeRate ? subtotal * exchangeRate : 0

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-[1.7rem] border border-yellow-500/18 bg-[linear-gradient(135deg,#2a0702_0%,#160100_48%,#3f0b03_100%)] p-4 shadow-[0_14px_34px_rgba(0,0,0,0.35)]"
                  >
                    <div className="grid grid-cols-[92px_1fr] gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-[92px] w-[92px] rounded-2xl object-cover"
                      />

                      <div className="min-w-0">
                        <h3 className="line-clamp-2 text-xl font-black uppercase leading-tight text-white">
                          {item.name}
                        </h3>

                        <p className="mt-1 text-lg font-black text-yellow-300">
                          Ref. {formatUsd(item.price)}
                        </p>

                        <div className="mt-3 rounded-2xl border border-yellow-500/12 bg-black/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
                              Subtotal
                            </span>
                            <span className="text-lg font-black text-yellow-300">
                              Ref. {formatUsd(subtotal)}
                            </span>
                          </div>

                          {exchangeRate && (
                            <div className="mt-2 flex items-center justify-between gap-3 text-sm font-bold text-yellow-50/70">
                              <span>En bolívares</span>
                              <span>Bs. {formatBs(subtotalBs)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center rounded-full border border-yellow-500/18 bg-black/25">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="flex h-10 w-12 items-center justify-center text-yellow-200 transition hover:text-yellow-400"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={18} />
                        </button>

                        <span className="min-w-10 text-center text-lg font-black text-white">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="flex h-10 w-12 items-center justify-center text-yellow-200 transition hover:text-yellow-400"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={18} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-red-950/70 text-red-200 transition hover:bg-red-700 hover:text-white"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    {updateItemNoteEnabled && updateItemNote && (
                      <div className="mt-4 rounded-2xl border border-yellow-500/14 bg-black/20 p-4">
                        <label className="flex cursor-pointer items-center justify-between gap-3">
                          <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-orange-300">
                            <FileText size={18} />
                            Agregar nota
                          </span>

                          <input
                            type="checkbox"
                            checked={Boolean(item.noteEnabled)}
                            onChange={(event) =>
                              updateItemNoteEnabled(item.id, event.target.checked)
                            }
                            className="h-6 w-6 accent-yellow-400"
                          />
                        </label>

                        {item.noteEnabled && (
                          <textarea
                            value={item.note ?? ""}
                            onChange={(event) =>
                              updateItemNote(item.id, event.target.value)
                            }
                            placeholder="Ej: sin cebolla, sin pepinillo, salsa aparte..."
                            className="mt-4 min-h-[88px] w-full resize-none rounded-2xl border border-yellow-500/15 bg-[#170301] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-yellow-50/35 focus:border-yellow-400"
                          />
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-yellow-500/15 bg-[linear-gradient(180deg,#1b0301_0%,#090000_100%)] px-5 py-5">
          <div className="rounded-[1.6rem] border border-yellow-500/18 bg-[linear-gradient(135deg,#2e0803_0%,#170100_60%,#431003_100%)] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black uppercase text-yellow-50/85">
                  Total
                </p>
                {exchangeRate && (
                  <p className="mt-2 text-sm font-bold text-yellow-50/55">
                    Aprox. Bs. {formatBs(totalBs)}
                  </p>
                )}
              </div>

              <p className="text-4xl font-black text-yellow-300">
                Ref. {formatUsd(totalPrice)}
              </p>
            </div>

            {exchangeRate && (
              <div className="mt-4 rounded-2xl border border-yellow-500/12 bg-black/20 p-4 text-right">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">
                  Tasa usada
                </p>
                <p className="mt-1 text-lg font-black text-yellow-300">
                  Bs. {formatBs(exchangeRate)}
                </p>
              </div>
            )}
          </div>

          <a
            href={hasItems ? whatsappHref : undefined}
            target={hasItems ? "_blank" : undefined}
            rel={hasItems ? "noreferrer" : undefined}
            className={[
              "mt-5 flex h-16 items-center justify-center gap-3 rounded-full text-lg font-black uppercase transition",
              hasItems
                ? "bg-[linear-gradient(90deg,#e50914_0%,#ff7a00_48%,#ffd400_100%)] text-black shadow-[0_16px_35px_rgba(0,0,0,0.32)] hover:scale-[1.02]"
                : "pointer-events-none bg-white/12 text-white/35",
            ].join(" ")}
          >
            <MessageCircle size={27} />
            Enviar pedido
          </a>
        </div>
      </aside>
    </>
  )
}

function ShoppingCartIcon() {
  return <span className="text-yellow-400">🛒</span>
}