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
const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/r4QXeRTgXuRJTqvU8"

export default function Home() {
  const cart = useCart()
  const exchange = useExchangeRate()
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#d8a116] text-[#2b1600]">
      <Navbar
        totalItems={cart.totalItems}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Hero />

      <Products onAddToCart={cart.addItem} exchangeRate={exchange.rate} />

      <section
        id="ubicacion"
        className="relative overflow-hidden border-t border-[#9b5d00]/25 bg-[#d8a116] px-4 py-16 text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,240,150,0.42),transparent_34%),radial-gradient(circle_at_bottom,rgba(199,57,0,0.22),transparent_36%)]" />

        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#7a1200]">
            Encuéntranos
          </p>

          <h2 className="mx-auto mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white drop-shadow-[0_4px_0_rgba(91,48,0,0.35)] md:text-7xl">
            Visita La Bambucha
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base font-bold leading-relaxed text-[#3d2200] md:text-lg">
            Abre la ubicación en Google Maps y ven por hamburguesas, perritos,
            pepitos, shawarmas, parrillas, combos y bebidas al estilo Bambucha.
          </p>

          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-[#5c1c00] px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-yellow-200 shadow-[0_0_28px_rgba(92,28,0,0.30)] transition hover:scale-105"
          >
            <MapPin size={21} />
            Abrir ubicación
          </a>
        </div>
      </section>

      <section
        id="reseña"
        className="relative overflow-hidden border-t border-[#9b5d00]/25 bg-[#c98500] px-4 py-16 text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,210,80,0.38),transparent_35%),linear-gradient(135deg,rgba(157,0,0,0.20),transparent_48%,rgba(255,115,0,0.26))]" />

        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[#7a1200]">
            Tu opinión cuenta
          </p>

          <h2 className="mx-auto mt-4 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white drop-shadow-[0_4px_0_rgba(91,48,0,0.35)] md:text-7xl">
            Agrega tu reseña
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base font-bold leading-relaxed text-[#3d2200] md:text-lg">
            Si ya probaste La Bambucha, déjanos tu reseña en Google Maps y
            ayúdanos a seguir creciendo.
          </p>

          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.1em] text-white shadow-[0_0_28px_rgba(190,70,0,0.34)] transition hover:scale-105"
          >
            <Star size={21} />
            Escribir reseña
          </a>
        </div>
      </section>

      <section
        id="contacto"
        className="border-t border-[#9b5d00]/25 bg-[#b87400] px-4 py-14 text-center"
      >
        <p className="text-sm font-black uppercase tracking-[0.35em] text-[#5c1c00]">
          La Bambucha Grill Burger
        </p>

        <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-[-0.04em] text-white drop-shadow-[0_3px_0_rgba(91,48,0,0.32)] md:text-6xl">
          Haz tu pedido por WhatsApp
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base font-bold text-[#3d2200] md:text-lg">
          Combos, hamburguesas, perritos, pepitos, shawarmas, parrillas,
          delicias y bebidas.
        </p>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#5c1c00] px-8 py-4 font-black uppercase tracking-[0.1em] text-yellow-200 shadow-[0_0_28px_rgba(92,28,0,0.35)] transition hover:scale-105"
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