"use client"

import { useState } from "react"
import { useExchangeRate } from "@/hooks/useExchangeRate"
import { useCart } from "@/hooks/useCart"

import Navbar from "@/components/Navbar"
import Hero from "@/components/Hero"
import Products from "@/components/Products"
import CartDrawer from "@/components/CartDrawer"
import BottomInfoSections from "@/components/BottomInfoSections"

export default function Home() {
  const cart = useCart()
  const exchange = useExchangeRate()
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[#d08a00] text-white">
      <Navbar
        totalItems={cart.totalItems}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <Hero />

      <Products onAddToCart={cart.addItem} exchangeRate={exchange.rate} />

      <BottomInfoSections />

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
        exchangeRate={exchange.rate}
      />
    </main>
  )
}