import { Flame, MapPin, Star, UtensilsCrossed } from "lucide-react"

const GOOGLE_MAPS_REVIEW_URL = "https://maps.app.goo.gl/r4QXeRTgXuRJTqvU8"

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-[#d69a00] px-4 pb-14 pt-10 text-white sm:pt-16 md:py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,238,90,0.55),transparent_34%),radial-gradient(circle_at_center,rgba(255,106,0,0.40),transparent_42%),linear-gradient(180deg,#f1c21b_0%,#d69a00_42%,#b85d00_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(201,0,0,0.24),transparent_46%,rgba(255,111,0,0.32))]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-9 md:grid-cols-[1fr_0.9fr]">
        <div className="text-center md:text-left">
          <div className="relative mx-auto mb-7 flex h-64 w-64 items-center justify-center md:hidden">
            <div className="absolute inset-0 rounded-full bg-yellow-200/50 blur-3xl" />
            <div className="absolute h-52 w-52 rounded-full bg-[#2a1200]/20 blur-2xl" />

            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="relative h-full w-full object-contain drop-shadow-[0_0_45px_rgba(80,20,0,0.45)]"
            />
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#2a1200]/25 bg-[#2a1200]/18 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#2a1200] shadow-[0_0_22px_rgba(80,20,0,0.12)] sm:text-sm">
            <Flame size={16} />
            La mejor manera de comer carne
          </div>

          <h1 className="text-5xl font-black uppercase leading-none tracking-[-0.05em] text-white drop-shadow-[0_4px_0_rgba(80,20,0,0.35)] sm:text-6xl md:text-8xl lg:text-9xl">
            La{" "}
            <span className="text-[#2a1200] drop-shadow-none">
              Bambucha
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg font-black uppercase tracking-[0.16em] text-[#2a1200] md:mx-0">
            Grill Burger
          </p>

          <p className="mx-auto mt-5 max-w-2xl text-base font-bold leading-relaxed text-[#2a1200]/85 sm:text-lg md:mx-0 md:text-xl">
            Hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y
            bebidas al estilo Bambucha Grill Burger.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#2a1200] px-7 py-4 text-center text-sm font-black uppercase text-yellow-300 shadow-[0_0_28px_rgba(80,20,0,0.30)] transition hover:scale-105 sm:text-base"
            >
              <UtensilsCrossed size={20} />
              Ver menú
            </a>

            <a
              href="#ubicacion"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#2a1200]/35 bg-yellow-300/35 px-7 py-4 text-center text-sm font-black uppercase text-[#2a1200] transition hover:bg-[#2a1200] hover:text-yellow-300 sm:text-base"
            >
              <MapPin size={19} />
              Ubicación
            </a>

            <a
              href={GOOGLE_MAPS_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#2a1200]/35 bg-orange-500/30 px-7 py-4 text-center text-sm font-black uppercase text-[#2a1200] transition hover:bg-[#2a1200] hover:text-yellow-300 sm:text-base"
            >
              <Star size={19} />
              Reseña
            </a>
          </div>
        </div>

        <div className="relative mx-auto hidden max-w-md items-center justify-center md:flex">
          <div className="absolute h-96 w-96 rounded-full bg-yellow-200/45 blur-3xl" />
          <div className="absolute h-72 w-72 rounded-full bg-orange-500/25 blur-2xl" />

          <img
            src="/logo-bambucha.png"
            alt="La Bambucha Grill Burger"
            className="relative w-full max-w-md object-contain drop-shadow-[0_0_45px_rgba(80,20,0,0.45)]"
          />
        </div>
      </div>
    </section>
  )
}