import { Flame, MapPin, Star, UtensilsCrossed } from "lucide-react"

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/r4QXeRTgXuRJTqvU8"

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-[#d8a116] px-4 pb-16 pt-14 sm:pt-16 md:py-24"
    >
      <div className="absolute inset-0 bg-[#d8a116]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(255,236,147,0.55),transparent_34%),radial-gradient(circle_at_20%_65%,rgba(255,123,0,0.24),transparent_36%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#c97900]/45 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[1fr_0.85fr]">
        <div className="text-center md:text-left">
          <img
            src="/logo-bambucha.png"
            alt="La Bambucha Grill Burger"
            className="mx-auto mb-7 h-44 w-44 object-contain drop-shadow-[0_0_28px_rgba(255,80,0,0.38)] md:hidden"
          />

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7c3f00]/20 bg-[#e7bb42]/70 px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-[#2b1600] shadow-[0_8px_22px_rgba(120,70,0,0.16)] sm:text-sm">
            <Flame size={16} />
            La mejor manera de comer carne
          </div>

          <h1 className="max-w-3xl text-6xl font-black uppercase leading-[0.86] tracking-[-0.08em] text-[#fff8e8] drop-shadow-[0_5px_0_rgba(91,48,0,0.35)] sm:text-7xl md:text-8xl lg:text-9xl">
            La Bambucha
          </h1>

          <p className="mt-5 text-2xl font-black uppercase tracking-[0.28em] text-[#5c1c00] sm:text-3xl">
            Grill Burger
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base font-bold leading-relaxed text-[#3d2200] sm:text-lg md:mx-0 md:text-xl">
            Hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y
            bebidas al estilo Bambucha Grill Burger.
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-3 md:max-w-2xl">
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_0_24px_rgba(190,70,0,0.32)] transition hover:scale-105"
            >
              <UtensilsCrossed size={19} />
              Ver menú
            </a>

            <a
              href="#ubicacion"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c1c00] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-yellow-200 shadow-[0_0_22px_rgba(92,28,0,0.22)] transition hover:scale-105"
            >
              <MapPin size={19} />
              Ubicación
            </a>

            <a
              href="#reseña"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#5c1c00]/30 bg-[#f0cb55] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#3a1600] shadow-[0_0_22px_rgba(92,28,0,0.12)] transition hover:scale-105 hover:bg-yellow-200"
            >
              <Star size={19} />
              Reseña
            </a>
          </div>
        </div>

        <div className="relative mx-auto hidden max-w-md items-center justify-center md:flex">
          <div className="absolute h-96 w-96 rounded-full bg-yellow-200/35 blur-3xl" />
          <div className="absolute h-72 w-72 rounded-full bg-orange-500/20 blur-2xl" />

          <img
            src="/logo-bambucha.png"
            alt="La Bambucha Grill Burger"
            className="relative w-full max-w-sm object-contain drop-shadow-[0_0_34px_rgba(255,90,0,0.32)]"
          />
        </div>
      </div>
    </section>
  )
}