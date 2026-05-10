import { siteConfig } from "@/config/site"

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-black px-4 pb-10 pt-24 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#7f1d1d,transparent_35%),linear-gradient(to_bottom,#050505,#111)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-b-[2rem] border border-red-900/40 bg-zinc-950 shadow-2xl shadow-black/70">
          <img
            src="/burger-club/hero-firulais-con-clase.png"
            alt="Firulais con Clase - Burger Club"
            className="h-auto w-full object-cover"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <a
            href="#menu"
            className="rounded-xl bg-yellow-400 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-black transition active:scale-[0.97]"
          >
            Ver menú
          </a>

          <a
            href={`https://wa.me/${siteConfig.business.whatsapp}?text=${encodeURIComponent(
              "Hola, me gustaría hacer un pedido en Burger Club."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-red-600 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-white transition active:scale-[0.97]"
          >
            Pedir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}