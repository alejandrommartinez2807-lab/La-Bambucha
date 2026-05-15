"use client"

import { useState } from "react"
import { MapPin, MessageCircle, Star } from "lucide-react"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { useCart } from "@/hooks/useCart"

import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import Products from "@/components/Products"
import CartDrawer from "@/components/CartDrawer"

const WHATSAPP_URL = "https://wa.me/584244721722"
const GOOGLE_MAPS_REVIEW_URL = "https://maps.app.goo.gl/r4QXeRTgXuRJTqvU8"

export default function Home() {
  const cart = useCart()
  const exchange = useExchangeRate()
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#050101] text-white">
      <Navbar
        totalItems={cart.totalItems}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Hero />

      <Products onAddToCart={cart.addItem} exchangeRate={exchange.rate} />

      <section
        id="ubicacion"
        className="relative overflow-hidden border-t border-orange-500/20 bg-[#070101] px-4 py-16 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,90,0,0.22),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(255,191,0,0.10),transparent_34%)]" />

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
              Ubicación
            </p>

            <h2 className="mt-4 text-4xl font-black uppercase leading-none text-white md:text-6xl">
              Ven a probar{" "}
              <span className="bg-gradient-to-r from-red-600 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
                La Bambucha
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
              Encuéntranos en Google Maps y ven por hamburguesas, perritos,
              pepitos, shawarmas, parrillas, combos y bebidas al estilo
              Bambucha Grill Burger.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <a
              href={GOOGLE_MAPS_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[2rem] border border-orange-500/25 bg-black/60 p-6 shadow-2xl shadow-black/40 transition hover:-translate-y-1 hover:border-orange-400/60"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 text-black shadow-[0_0_28px_rgba(255,90,0,0.35)]">
                  <MapPin size={25} />
                </div>

                <div>
                  <h3 className="text-2xl font-black uppercase text-white">
                    Ver ubicación
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
                    Abre Google Maps, revisa cómo llegar y visítanos para
                    probar el sabor Bambucha.
                  </p>

                  <span className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black uppercase text-black transition group-hover:bg-yellow-400">
                    Abrir Google Maps
                  </span>
                </div>
              </div>
            </a>

            <a
              href={GOOGLE_MAPS_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="group rounded-[2rem] border border-yellow-400/25 bg-black/60 p-6 shadow-2xl shadow-black/40 transition hover:-translate-y-1 hover:border-yellow-400/60"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-[0_0_28px_rgba(255,191,0,0.30)]">
                  <Star size={25} />
                </div>

                <div>
                  <h3 className="text-2xl font-black uppercase text-white">
                    Agregar reseña
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-zinc-400 md:text-base">
                    Si ya probaste La Bambucha, déjanos tu reseña en Google
                    Maps y cuéntanos qué tal estuvo.
                  </p>

                  <span className="mt-5 inline-flex rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 px-5 py-3 text-sm font-black uppercase text-black transition group-hover:scale-105">
                    Escribir reseña
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section
        id="contacto"
        className="border-t border-orange-500/20 bg-black px-4 py-12 text-center"
      >
        <p className="text-sm font-black uppercase tracking-[0.35em] text-orange-400">
          La Bambucha Grill Burger
        </p>

        <h2 className="mt-3 text-3xl font-black uppercase text-white md:text-5xl">
          Haz tu pedido por WhatsApp
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-zinc-300">
          Combos, hamburguesas, perritos, pepitos, shawarmas, parrillas,
          delicias y bebidas.
        </p>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 px-8 py-4 font-black uppercase text-black shadow-[0_0_28px_rgba(255,90,0,0.35)] transition hover:scale-105"
        >
          <MessageCircle size={20} />
          Pedir ahora
        </a>
      </section>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart.items}
        totalPrice={cart.totalPrice}
        removeItem={cart.removeItem}
        increaseQuantity={cart.increaseQuantity}
        decreaseQuantity={cart.decreaseQuantity}
        updateItemNote={cart.updateItemNote}
        updateItemNoteEnabled={cart.updateItemNoteEnabled}
        exchangeRate={exchange.rate}
      />
    </main>
  )
}