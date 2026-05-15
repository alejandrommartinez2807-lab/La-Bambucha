import { Flame, MapPin, Star, UtensilsCrossed } from "lucide-react"

const GOOGLE_MAPS_REVIEW_URL = "https://maps.app.goo.gl/r4QXeRTgXuRJTqvU8"

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-black px-4 pb-14 pt-10 text-white sm:pt-16 md:py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,82,0,0.32),transparent_35%),linear-gradient(180deg,#170505_0%,#050101_58%,#000_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,0,0,0.22),transparent_45%,rgba(255,138,0,0.22))] opacity-50" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-9 md:grid-cols-[1fr_0.9fr]">
        <div className="text-center md:text-left">
          <div className="relative mx-auto mb-7 flex h-60 w-60 items-center justify-center md:hidden">
            <div className="absolute inset-0 rounded-full bg-orange-500/25 blur-3xl" />

            <img
              src="/logo-bambucha.png"
              alt="La Bambucha Grill Burger"
              className="relative h-full w-full object-contain drop-shadow-[0_0_45px_rgba(255,90,0,0.95)]"
            />
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-black/65 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-300 shadow-[0_0_22px_rgba(255,90,0,0.18)] sm:text-sm">
            <Flame size={16} />
            La mejor manera de comer carne
          </div>

          <h1 className="text-5xl font-black uppercase leading-none tracking-[-0.05em] text-white sm:text-6xl md:text-8xl lg:text-9xl">
            La{" "}
            <span className="bg-gradient-to-r from-red-600 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
              Bambucha
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg font-black uppercase tracking-[0.16em] text-orange-300 md:mx-0">
            Grill Burger
          </p>

          <p className="mx-auto mt-5 max-w-2xl text-base font-semibold leading-relaxed text-zinc-300 sm:text-lg md:mx-0 md:text-xl">
            Hamburguesas, perritos, pepitos, shawarmas, parrillas, combos y
            bebidas al estilo Bambucha Grill Burger.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 px-7 py-4 text-center text-sm font-black uppercase text-black shadow-[0_0_28px_rgba(255,90,0,0.4)] transition hover:scale-105 sm:text-base"
            >
              <UtensilsCrossed size={20} />
              Ver menú
            </a>

            <a
              href="#ubicacion"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-orange-500/50 bg-black/60 px-7 py-4 text-center text-sm font-black uppercase text-orange-300 transition hover:bg-orange-500 hover:text-black sm:text-base"
            >
              <MapPin size={19} />
              Ubicación
            </a>

            <a
              href={GOOGLE_MAPS_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-7 py-4 text-center text-sm font-black uppercase text-yellow-300 transition hover:bg-yellow-400 hover:text-black sm:text-base"
            >
              <Star size={19} />
              Reseña
            </a>
          </div>
        </div>

        <div className="relative mx-auto hidden max-w-md items-center justify-center md:flex">
          <div className="absolute h-96 w-96 rounded-full bg-orange-500/30 blur-3xl" />

          <img
            src="/logo-bambucha.png"
            alt="La Bambucha Grill Burger"
            className="relative w-full max-w-md object-contain drop-shadow-[0_0_45px_rgba(255,90,0,0.95)]"
          />
        </div>
      </div>
    </section>
  )
}