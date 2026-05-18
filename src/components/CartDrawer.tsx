"use client"

import {
  FileText,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react"

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

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function buildWhatsAppMessage(
  items: CartItem[],
  totalPrice: number,
  exchangeRate: number | null,
) {
  const lines = items.map((item) => {
    const subtotal = item.price * item.quantity
    const note =
      item.noteEnabled && item.note?.trim()
        ? `\n   Nota: ${item.note.trim()}`
        : ""

    return `• ${item.name} x${item.quantity} — $${formatMoney(subtotal)}${note}`
  })

  const totalBs = exchangeRate ? totalPrice * exchangeRate : null

  return encodeURIComponent(
    [
      "Hola, quiero hacer este pedido en La Bambucha:",
      "",
      ...lines,
      "",
      `Total: $${formatMoney(totalPrice)}`,
      totalBs ? `Total Bs. ${formatMoney(totalBs)}` : "",
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

  const whatsappHref = `https://wa.me/584121317635?text=${buildWhatsAppMessage(
    items,
    totalPrice,
    exchangeRate,
  )}`

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar carrito"
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-[#2b1200]/55 backdrop-blur-[3px]"
        />
      )}

      <aside
        className={[
          "fixed right-0 top-0 z-[90] flex h-dvh w-full max-w-[520px] flex-col overflow-hidden",
          "border-l border-yellow-300/25",
          "bg-[linear-gradient(180deg,#d79b08_0%,#b86800_24%,#6d2600_58%,#260900_100%)]",
          "text-white shadow-[-20px_0_60px_rgba(0,0,0,0.48)]",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="relative overflow-hidden border-b border-yellow-200/20 bg-[linear-gradient(90deg,#8d2f00_0%,#b45c00_45%,#d79b08_100%)] px-6 py-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,239,149,0.28),transparent_45%)]" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.36em] text-yellow-100">
                La Bambucha
              </p>

              <h2 className="mt-1 flex items-center gap-3 text-4xl font-black uppercase leading-none text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]">
                <ShoppingCart className="h-9 w-9 text-yellow-300" />
                Tu pedido
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-yellow-100/30 bg-[#4b1700]/45 text-yellow-50 transition hover:bg-yellow-300 hover:text-[#5c2100]"
            >
              <X size={26} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!hasItems ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-yellow-200/20 bg-[linear-gradient(135deg,rgba(255,224,96,0.18),rgba(78,24,0,0.34))] px-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
              <img
                src="/logo-bambucha.png"
                alt="La Bambucha"
                className="mb-6 h-24 w-24 object-contain drop-shadow-[0_0_35px_rgba(255,128,0,0.45)]"
              />

              <h3 className="text-3xl font-black uppercase leading-tight text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.2)]">
                Tu carrito está vacío
              </h3>

              <p className="mt-4 max-w-sm text-base font-bold leading-7 text-yellow-50/85">
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
                    className="overflow-hidden rounded-[1.7rem] border border-yellow-200/25 bg-[linear-gradient(135deg,#fff0a8_0%,#e6a90b_20%,#7a2a00_72%,#3c1000_100%)] p-[1px] shadow-[0_18px_38px_rgba(0,0,0,0.34)]"
                  >
                    <div className="rounded-[1.65rem] bg-[linear-gradient(135deg,#4a1600_0%,#6f2400_45%,#2b0900_100%)] p-4">
                      <div className="grid grid-cols-[96px_1fr] gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-24 w-24 rounded-2xl border border-yellow-200/20 object-cover shadow-[0_8px_20px_rgba(0,0,0,0.26)]"
                        />

                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-xl font-black uppercase leading-tight text-white">
                            {item.name}
                          </h3>

                          <p className="mt-1 text-lg font-black text-yellow-300">
                            Ref. {formatMoney(item.price)}
                          </p>

                          <div className="mt-3 rounded-2xl border border-yellow-200/18 bg-[#2c0a00]/55 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
                                Subtotal
                              </span>

                              <span className="text-lg font-black text-yellow-300">
                                Ref. {formatMoney(subtotal)}
                              </span>
                            </div>

                            {exchangeRate && (
                              <div className="mt-2 flex items-center justify-between gap-3 text-sm font-bold text-yellow-50/80">
                                <span>En bolívares</span>
                                <span>Bs. {formatMoney(subtotalBs)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className="flex items-center rounded-full border border-yellow-200/25 bg-[#2b0900]/60">
                          <button
                            type="button"
                            onClick={() => decreaseQuantity(item.id)}
                            className="flex h-10 w-12 items-center justify-center text-yellow-100 transition hover:text-yellow-300"
                            aria-label="Disminuir cantidad"
                          >
                            <Minus size={18} />
                          </button>

                          <span className="min-w-10 text-center text-lg font-black text-white">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => increaseQuantity(item.id)}
                            className="flex h-10 w-12 items-center justify-center text-yellow-100 transition hover:text-yellow-300"
                            aria-label="Aumentar cantidad"
                          >
                            <Plus size={18} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6f1608] text-red-100 transition hover:bg-red-600 hover:text-white"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      {updateItemNoteEnabled && updateItemNote && (
                        <div className="mt-4 rounded-2xl border border-yellow-200/18 bg-[#2c0a00]/55 p-4">
                          <label className="flex cursor-pointer items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-yellow-200">
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
                              className="mt-4 min-h-[88px] w-full resize-none rounded-2xl border border-yellow-200/20 bg-[#421300] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-yellow-50/45 focus:border-yellow-300"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-yellow-200/20 bg-[linear-gradient(180deg,#8c3a00_0%,#552000_100%)] px-5 py-4">
          <div className="rounded-[1.4rem] border border-yellow-200/25 bg-[linear-gradient(135deg,#3b1000_0%,#6c2400_60%,#2a0900_100%)] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-black uppercase text-yellow-50">
                  Total
                </p>

                {exchangeRate && (
                  <p className="mt-1 text-sm font-bold text-yellow-50/75">
                    Total Bs. {formatMoney(totalBs)}
                  </p>
                )}
              </div>

              <p className="text-3xl font-black leading-none text-yellow-300">
                Ref. {formatMoney(totalPrice)}
              </p>
            </div>

            {exchangeRate && (
              <div className="mt-3 rounded-xl border border-yellow-200/18 bg-[#2b0900]/55 px-4 py-3 text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-yellow-200">
                  Tasa usada
                </p>

                <p className="mt-1 text-base font-black leading-none text-yellow-300">
                  Bs. {formatMoney(exchangeRate)}
                </p>
              </div>
            )}
          </div>

          <a
            href={hasItems ? whatsappHref : undefined}
            target={hasItems ? "_blank" : undefined}
            rel={hasItems ? "noreferrer" : undefined}
            className={[
              "mt-4 flex h-14 items-center justify-center gap-3 rounded-full text-base font-black uppercase transition",
              hasItems
                ? "bg-[linear-gradient(90deg,#e50914_0%,#ff7a00_48%,#ffd400_100%)] text-[#240800] shadow-[0_16px_35px_rgba(0,0,0,0.32)] hover:scale-[1.02]"
                : "pointer-events-none bg-white/18 text-white/45",
            ].join(" ")}
          >
            <MessageCircle size={24} />
            Enviar pedido
          </a>
        </div>
      </aside>
    </>
  )
}