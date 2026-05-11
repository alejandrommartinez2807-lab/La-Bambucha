"use client"

import { motion } from "motion/react"
import { siteConfig } from "@/config/site"

export default function Hero() {
  const whatsappText = encodeURIComponent(
    "Hola, me gustaría hacer un pedido en Burger Club."
  )

  return (
    <section className="relative overflow-hidden bg-black px-4 pb-12 pt-24 text-white sm:px-6 sm:pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,0.45),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(250,204,21,0.18),transparent_30%),linear-gradient(to_bottom,#050505,#111)]" />

      <motion.div
        className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-red-600/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute -left-24 bottom-10 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-8 max-w-4xl text-center"
        >
          <p className="mb-4 text-xs font-black uppercase tracking-[0.35em] text-yellow-400 sm:text-sm">
            {siteConfig.business.tagline || "Sabor callejero, estilo premium"}
          </p>

          <h1 className="text-5xl font-black uppercase leading-[0.9] tracking-[-0.08em] text-white sm:text-7xl lg:text-8xl">
            Burger{" "}
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Club
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Hamburguesas, perros calientes, bebidas y combos con precios en USD
            y bolívares. Haz tu pedido directo por WhatsApp.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="overflow-hidden rounded-[2rem] border border-red-900/50 bg-zinc-950 shadow-2xl shadow-red-950/40"
        >
          <motion.img
            src="/burger-club/hero-firulais-con-clase.png"
            alt="Firulais con Clase - Burger Club"
            className="h-auto w-full object-cover"
            whileHover={{ scale: 1.025 }}
            transition={{ duration: 0.45 }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35 }}
          className="mt-6 grid gap-3 sm:grid-cols-2"
        >
          <a
            href="#menu"
            className="rounded-xl bg-yellow-400 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-black transition hover:-translate-y-1 hover:bg-yellow-300 active:scale-[0.97]"
          >
            Ver menú
          </a>

          <a
            href={`https://wa.me/${siteConfig.business.whatsapp}?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-red-600 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.15em] text-white transition hover:-translate-y-1 hover:bg-red-500 active:scale-[0.97]"
          >
            Pedir por WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  )
}