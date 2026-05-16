"use client"

import { Flame, UtensilsCrossed, MessageCircle } from "lucide-react"

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden px-4 pb-14 pt-10 text-white sm:pt-16 md:py-24"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1b0d00_0%,#2a1200_8%,#cf7a00_24%,#e6b11a_48%,#f0cf42_70%,#d98b00_100%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,241,170,0.45),transparent_28%),radial-gradient(circle_at_center,rgba(255,170,0,0.22),transparent_42%),radial-gradient(circle_at_bottom,rgba(255,88,0,0.18),transparent_35%)]" />

      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-[1fr_0.9fr]">
        <div className="text-center md:text-left">
          <img
            src="/logo-bambucha.png"
            alt="La Bambucha Grill Burger"
            className="mx-auto mb-6 h-44 w-44 object-contain drop-shadow-[0_0_35px_rgba(255,110,0,0.55)] md:hidden"
          />

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#6b3a00]/20 bg-[#d7af45]/45 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#2b1200] shadow-[0_8px_24px_rgba(90,40,0,0.12)] backdrop-blur sm:text-sm">
            <Flame size={16} />
            La mejor manera de comer carne
          </div>

          <h1 className="text-5xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-white drop-shadow-[0_4px_0_rgba(90,40,0,0.25)]">
              La Bambucha
            </span>
          </h1>

          <p className="mt-3 text-xl font-black uppercase tracking-[0.22em] text-[#2b1200] sm:text-2xl md:text-3xl">
            Grill Burger
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base font-bold leading-relaxed text-[#2b1200]/92 sm:text-lg md:mx-0 md:text-xl">
            Hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y
            bebidas al estilo Bambucha Grill Burger.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3a1700] px-7 py-4 text-center text-sm font-black uppercase text-yellow-300 shadow-[0_14px_34px_rgba(80,30,0,0.25)] transition hover:scale-[1.02] hover:bg-[#2b1200] sm:text-base"
            >
              <UtensilsCrossed size={20} />
              Ver menú
            </a>

            <a
              href="https://wa.me/584244721722"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#5d2a00]/25 bg-[#f1d467]/65 px-7 py-4 text-center text-sm font-black uppercase text-[#2b1200] shadow-[0_14px_34px_rgba(80,30,0,0.10)] transition hover:scale-[1.02] hover:bg-[#f5dd7d] sm:text-base"
            >
              <MessageCircle size={20} />
              Hacer pedido
            </a>
          </div>
        </div>

        <div className="relative mx-auto hidden max-w-md items-center justify-center md:flex">
          <div className="absolute h-72 w-72 rounded-full bg-yellow-200/35 blur-3xl" />
          <div className="absolute h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />

          <img
            src="/logo-bambucha.png"
            alt="La Bambucha Grill Burger"
            className="relative w-full max-w-sm object-contain drop-shadow-[0_0_30px_rgba(255,110,0,0.4)]"
          />
        </div>
      </div>
    </section>
  )
}