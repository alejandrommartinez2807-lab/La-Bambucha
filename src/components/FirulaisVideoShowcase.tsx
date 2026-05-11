"use client"

import { motion } from "motion/react"
import { Flame, Play, ShoppingCart, Sparkles } from "lucide-react"

export default function FirulaisVideoShowcase() {
  return (
    <section
      id="firulais"
      className="relative overflow-hidden bg-black px-4 py-20 text-white sm:px-6 sm:py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.20),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_35%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
        <motion.div
          initial={{ opacity: 0, x: -35 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-yellow-400 sm:text-sm">
            Producto estrella
          </p>

          <h2 className="text-5xl font-black uppercase leading-[0.88] tracking-[-0.08em] sm:text-7xl">
            Mira cómo nace el{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Firulais con Clase
            </span>
          </h2>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Un video corto estilo anuncio para mostrar el armado completo del
            producto. Esto hace que el Firulais se vea más premium, más
            apetitoso y más fácil de vender a mejor precio.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <Flame size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-black uppercase text-white">
                    Más apetitoso
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                    El cliente ve el queso, las papitas, la salsa y el acabado
                    final en movimiento.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <Sparkles size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-black uppercase text-white">
                    Sensación de marca
                  </h3>

                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                    Se siente más como una campaña de producto que como una
                    simple lista de ingredientes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <a
            href="#producto-firulais"
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-red-600 to-yellow-400 px-8 py-4 text-sm font-black uppercase tracking-[0.18em] text-black shadow-xl shadow-red-950/40 transition hover:-translate-y-1 active:scale-[0.97]"
          >
            <ShoppingCart size={18} />
            Pedir el Firulais
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 35, scale: 0.96 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-red-900/50 bg-zinc-950 p-4 shadow-2xl shadow-red-950/30 sm:p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.12),transparent_45%)]" />

            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-black">
              <video
                className="aspect-[9/16] w-full object-cover sm:aspect-video"
                src="/videos/mp_.mp4"
                autoPlay
                muted
                loop
                playsInline
                controls={false}
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-yellow-400/30 bg-black/70 px-4 py-2 text-yellow-400 backdrop-blur">
                <Play size={15} />

                <span className="text-xs font-black uppercase tracking-[0.2em]">
                  Armado en video
                </span>
              </div>

              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-400">
                  Firulais con Clase
                </p>

                <h3 className="mt-2 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-white sm:text-4xl">
                  De antojo simple a producto premium
                </h3>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}