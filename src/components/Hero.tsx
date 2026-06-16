import {
  Flame,
  MapPin,
  MessageCircle,
  Star,
  UtensilsCrossed,
} from "lucide-react"
import {
  DEFAULT_PUBLIC_BUSINESS_CONFIG,
  buildWhatsappUrl,
  type PublicBusinessConfig,
} from "@/types/publicBusinessConfig"

type HeroProps = {
  businessConfig?: PublicBusinessConfig
}

export default function Hero({
  businessConfig = DEFAULT_PUBLIC_BUSINESS_CONFIG,
}: HeroProps) {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-[#d8a116] px-4 pb-16 pt-10 sm:pt-16 md:py-24"
    >
      <div className="absolute inset-0 bg-[#d8a116]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,242,172,0.62),transparent_30%),radial-gradient(circle_at_70%_55%,rgba(255,183,28,0.45),transparent_38%),radial-gradient(circle_at_20%_78%,rgba(198,74,0,0.20),transparent_36%)]" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#c97900]/45 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[1fr_0.85fr]">
        <div className="text-center md:text-left">
          <img
            src="/logo-bambucha.png"
            alt={businessConfig.businessName}
            className="mx-auto mb-8 h-72 w-72 object-contain drop-shadow-[0_0_38px_rgba(255,80,0,0.48)] sm:h-80 sm:w-80 md:hidden"
          />

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7c3f00]/18 bg-[#e8bd47]/72 px-5 py-3 text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#2b1600] shadow-[0_8px_22px_rgba(120,70,0,0.16)] sm:text-sm">
            <Flame size={16} />
            {businessConfig.heroBadgeText || businessConfig.publicTagline}
          </div>

          <h1 className="mx-auto max-w-3xl text-6xl font-black uppercase leading-[0.86] tracking-[-0.08em] text-[#fff8e8] drop-shadow-[0_5px_0_rgba(91,48,0,0.35)] sm:text-7xl md:mx-0 md:text-8xl lg:text-9xl">
            {businessConfig.businessName}
          </h1>

          <p className="mt-5 text-2xl font-black uppercase tracking-[0.28em] text-[#5c1c00] sm:text-3xl">
            {businessConfig.heroSubtitle || businessConfig.businessShortDescription}
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base font-bold leading-relaxed text-[#3d2200] sm:text-lg md:mx-0 md:text-xl">
            {businessConfig.heroDescription}
          </p>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 md:max-w-2xl">
            <a
              href="#menu"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-700 via-orange-500 to-yellow-400 px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_0_24px_rgba(190,70,0,0.32)] transition hover:scale-105"
            >
              <UtensilsCrossed size={19} />
              Ver menú
            </a>

            <a
              href={buildWhatsappUrl(businessConfig.mainWhatsapp)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c1c00] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-yellow-200 shadow-[0_0_22px_rgba(92,28,0,0.22)] transition hover:scale-105"
            >
              <MessageCircle size={19} />
              Pedir ahora
            </a>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:max-w-2xl">
            <a
              href={businessConfig.googleMapsUrl || "#ubicacion"}
              target={businessConfig.googleMapsUrl ? "_blank" : undefined}
              rel={businessConfig.googleMapsUrl ? "noreferrer" : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#5c1c00]/25 bg-[#f0cb55]/80 px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#3a1600] shadow-[0_0_22px_rgba(92,28,0,0.10)] transition hover:scale-105 hover:bg-yellow-200"
            >
              <MapPin size={19} />
              {businessConfig.locationButtonText || "Ubicación"}
            </a>

            <a
              href="#ubicacion"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#5c1c00]/25 bg-[#f0cb55]/80 px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#3a1600] shadow-[0_0_22px_rgba(92,28,0,0.10)] transition hover:scale-105 hover:bg-yellow-200"
            >
              <Star size={19} />
              Agregar reseña
            </a>
          </div>
        </div>

        <div className="relative mx-auto hidden max-w-md items-center justify-center md:flex">
          <div className="absolute h-96 w-96 rounded-full bg-yellow-200/35 blur-3xl" />
          <div className="absolute h-72 w-72 rounded-full bg-orange-500/20 blur-2xl" />

          <img
            src="/logo-bambucha.png"
            alt={businessConfig.businessName}
            className="relative w-full max-w-sm object-contain drop-shadow-[0_0_34px_rgba(255,90,0,0.32)]"
          />
        </div>
      </div>
    </section>
  )
}
