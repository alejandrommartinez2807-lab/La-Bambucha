"use client"

import { useState } from "react"
import { useCart } from "@/hooks/useCart"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { usePublicBusinessConfig } from "@/hooks/usePublicBusinessConfig"
import { usePublicProducts } from "@/hooks/usePublicProducts"

import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import FeaturedProducts from "@/components/FeaturedProducts"
import Products from "@/components/Products"
import PublicPromotion from "@/components/PublicPromotion"
import BottomInfoSections from "@/components/BottomInfoSections"
import CartDrawer from "@/components/CartDrawer"

export default function Home() {
  const cart = useCart()
  const exchange = useExchangeRate()
  const publicConfigState = usePublicBusinessConfig()
  const publicProductsState = usePublicProducts()
  const businessConfig = publicConfigState.config
  const [isCartOpen, setIsCartOpen] = useState(false)

  const effectiveExchangeRate =
    businessConfig.exchangeRateMode === "manual" &&
    Number.isFinite(businessConfig.manualExchangeRate) &&
    businessConfig.manualExchangeRate > 0
      ? businessConfig.manualExchangeRate
      : exchange.rate

  return (
    <main className="bambucha-public-page min-h-screen text-white">
      <Navbar
        totalItems={cart.totalItems}
        onOpenCart={() => setIsCartOpen(true)}
        businessConfig={businessConfig}
      />

      <Hero businessConfig={businessConfig} />

      <FeaturedProducts
        products={publicProductsState.products}
        businessConfig={businessConfig}
        onAddToCart={cart.addItem}
        exchangeRate={effectiveExchangeRate}
      />

      <Products
        products={publicProductsState.products}
        categories={publicProductsState.categories}
        warning={publicProductsState.warning}
        isLoading={publicProductsState.isLoading}
        onAddToCart={cart.addItem}
        exchangeRate={effectiveExchangeRate}
      />

      <PublicPromotion />

      <BottomInfoSections businessConfig={businessConfig} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart.items}
        totalPrice={cart.totalPrice}
        removeItem={cart.removeItem}
        increaseQuantity={cart.increaseQuantity}
        decreaseQuantity={cart.decreaseQuantity}
        updateItemNote={cart.updateItemNote}
        updateItemNoteEnabled={cart.updateItemNoteEnabled}
        exchangeRate={effectiveExchangeRate}
        exchangeSource={exchange.source}
        exchangeValueDate={exchange.valueDate ?? undefined}
        exchangeFallback={exchange.fallback}
        exchangeWarning={exchange.warning ?? undefined}
      />
    </main>
  )
}
