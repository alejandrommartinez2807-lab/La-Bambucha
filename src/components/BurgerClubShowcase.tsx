"use client"

import { motion } from "motion/react"
import { siteConfig } from "@/config/site"

const showcaseImages = [
  {
    src: "/burger-club/menu-perros-burger-club.png",
    alt: "Menú Burger Club",
    label: "Menú brutal",
    title: "Perros calientes con actitud Burger Club",
    description:
      "Una selección callejera, cargada y lista para matar cualquier antojo.",
    border: "border-red-900/50",
  },
  {
    src: "/burger-club/galeria-queso.png",
    alt: "Ingredientes de calidad Burger Club",
    label: "Ingredientes",
    title: "Queso, salsas y toppings sin miedo",
    description:
      "Texturas, sabor y combinaciones pensadas para que cada mordida se sienta premium.",
    border: "border-yellow-500/30",
  },
  {
    src: "/burger-club/equipo-burger-club.png",
    alt: "Equipo Burger Club",
    label: "La casa",
    title: "Hecho con energía de barrio",
    description:
      "Burger Club mezcla comida rápida, identidad urbana y atención cercana.",
    border: "border-red-900/50",
  },
  {
    src: "/burger-club/footer-whatsapp-instagram.png",
    alt: "Contacto Burger Club",
    label: "Contacto",
    title: "Pide fácil por WhatsApp",
    description:
      "Arma tu carrito, revisa el total en USD y bolívares, y envía tu pedido directo.",
    border: "border-red-900/50",
  },
]

export default function BurgerClubShowcase() {
  const whatsappText = encodeURIComponent(
    "Hola, quiero hacer un pedido en Burger Club."
  )

  return (
    <section
      id="combos"
      className="relative overflow-hidden bg-black px-4 py-16 text-white sm:px-6 sm:py-24"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_35%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mb-10 max-w-3xl"
        >
          <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-yellow-400 sm:text-sm">
            Experiencia Burger Club
          </p>

          <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-6xl">
            No es solo comida.{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Es antojo serio.
            </span>
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Un vistazo al estilo, los productos y la personalidad de Burger
            Club antes de elegir tu pedido.
          </p>
        </motion.div>

        <div className="grid gap-6">
          {showcaseImages.map((item, index) => (
            <motion.article
              key={item.src}
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className={`group overflow-hidden rounded-[2rem] border ${item.border} bg-zinc-950 shadow-2xl shadow-black/60`}
            >
              <div className="grid items-center gap-0 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="overflow-hidden">
                  <motion.img
                    src={item.src}
                    alt={item.alt}
                    className="w-full object-cover transition duration-500 group-hover:scale-[1.025]"
                  />
                </div>

                <div className="p-6 sm:p-8 lg:p-10">
                  <span className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-yellow-400">
                    {item.label}
                  </span>

                  <h3 className="mt-5 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-white sm:text-4xl">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65 }}
          className="mt-8 overflow-hidden rounded-[2rem] border border-yellow-500/30 bg-gradient-to-br from-red-950 via-black to-black p-8 text-center shadow-2xl shadow-red-950/30 sm:p-12"
        >
          <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-yellow-400 sm:text-sm">
            {siteConfig.business.location}
          </p>

          <h2 className="mx-auto max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-yellow-400 sm:text-6xl">
            ¿Listo para probar algo brutal?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-200 sm:text-lg">
            Haz tu pedido por WhatsApp y disfruta los perros y hamburguesas más
            brutales de la ciudad.
          </p>

          <a
            href={`https://wa.me/${siteConfig.business.whatsapp}?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-xl bg-green-500 px-8 py-4 font-black uppercase text-white shadow-xl shadow-green-950/40 transition hover:-translate-y-1 hover:bg-green-400 active:scale-[0.97]"
          >
            Escribir por WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  )
}
