"use client"

import { Clock, MapPin, MessageCircle, Send, Star } from "lucide-react"
import {
  DEFAULT_PUBLIC_BUSINESS_CONFIG,
  buildWhatsappUrl,
  type PublicBusinessConfig,
} from "@/types/publicBusinessConfig"

type BottomInfoSectionsProps = {
  businessConfig?: PublicBusinessConfig
}

export default function BottomInfoSections({
  businessConfig = DEFAULT_PUBLIC_BUSINESS_CONFIG,
}: BottomInfoSectionsProps) {
  const whatsappUrl = buildWhatsappUrl(
    businessConfig.deliveryWhatsapp || businessConfig.mainWhatsapp
  )

  return (
    <section
      id="ubicacion"
      className="relative overflow-hidden bg-[#d8a116] px-4 pb-16 pt-10 text-yellow-50"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,232,96,0.30),transparent_30%),radial-gradient(circle_at_82%_78%,rgba(138,43,0,0.30),transparent_36%)]" />

      <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-yellow-300/25 bg-[#572000] shadow-[0_24px_70px_rgba(72,28,0,0.36)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="border-b border-yellow-300/18 p-7 lg:border-b-0 lg:border-r">
          <span className="inline-flex rounded-full bg-yellow-300 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#4a1600] shadow-[0_8px_0_rgba(0,0,0,0.18)]">
            {businessConfig.publicSectionTitle}
          </span>

          <h2 className="mt-7 max-w-xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-white drop-shadow-[0_5px_0_rgba(111,34,0,0.85)] sm:text-6xl">
            {businessConfig.publicWelcomeTitle}
          </h2>

          <p className="mt-6 max-w-2xl text-base font-bold leading-relaxed text-yellow-50/88 sm:text-lg">
            {businessConfig.publicWelcomeText}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href={businessConfig.googleMapsUrl || "#ubicacion"}
              target={businessConfig.googleMapsUrl ? "_blank" : undefined}
              rel={businessConfig.googleMapsUrl ? "noreferrer" : undefined}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#e50914_0%,#ff7a00_60%,#ffd400_100%)] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-[#240800] shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:scale-105"
            >
              <MapPin size={18} />
              {businessConfig.locationButtonText}
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-yellow-300/35 bg-[#2b0d00] px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-yellow-200 shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:scale-105 hover:bg-[#3d1400]"
            >
              <MessageCircle size={18} />
              {businessConfig.whatsappButtonText}
            </a>
          </div>
        </div>

        <div className="grid gap-4 bg-[#3d1400]/35 p-7">
          <InfoCard
            icon={<Clock size={23} />}
            title={businessConfig.scheduleTitle}
          >
            <p>{businessConfig.scheduleLine1}</p>
            {businessConfig.scheduleLine2 && (
              <p className="mt-2">{businessConfig.scheduleLine2}</p>
            )}
          </InfoCard>

          <InfoCard
            icon={<Star size={23} />}
            title={businessConfig.reviewsTitle}
          >
            <p>{businessConfig.reviewsText}</p>
          </InfoCard>

          <InfoCard
            icon={<Send size={23} />}
            title={businessConfig.quickOrderTitle}
          >
            <p>{businessConfig.quickOrderText}</p>
          </InfoCard>

          <article className="rounded-[1.4rem] border border-yellow-300/25 bg-[#2b0d00]/70 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
              Contacto y redes
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-yellow-300 px-5 py-3 text-xs font-black uppercase tracking-[0.1em] text-[#4a1600] transition hover:scale-[1.02] hover:bg-yellow-200"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>

              <a
                href={businessConfig.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-yellow-300/35 bg-[#4a1600] px-5 py-3 text-xs font-black uppercase tracking-[0.1em] text-yellow-200 transition hover:scale-[1.02] hover:bg-[#5c1c00]"
              >
                Instagram
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <article className="rounded-[1.4rem] border border-yellow-300/25 bg-[#2b0d00]/70 p-5 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
      <div className="flex gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-yellow-300/45 bg-yellow-300 text-[#4a1600]">
          {icon}
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.24em] text-yellow-300">
            {title}
          </h3>
          <div className="mt-3 text-sm font-bold leading-relaxed text-yellow-50/88 sm:text-base">
            {children}
          </div>
        </div>
      </div>
    </article>
  )
}
