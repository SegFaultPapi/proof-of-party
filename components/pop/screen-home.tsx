"use client"

import { Mic } from "lucide-react"
import { useApp } from "@/lib/store"
import { useEffect, useState } from "react"

export function ScreenHome() {
  const { wallet, connectWallet, goTo } = useApp()
  const [isListening, setIsListening] = useState(true)

  const handleClick = () => {
    if (!wallet) {
      connectWallet()
    } else {
      goTo("events")
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: "#0a0514" }}>
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-40 blur-[80px]"
        style={{
          background: "radial-gradient(circle, rgba(131,110,249,0.4) 0%, rgba(0,0,0,0) 70%)"
        }}
      />

      <div className="relative flex items-center justify-center group cursor-pointer" onClick={handleClick}>
        
        {/* Animated Rings */}
        <div className="absolute w-[120px] h-[120px] rounded-full bg-[rgba(131,110,249,0.6)] animate-ping opacity-75" />
        <div className="absolute w-[180px] h-[180px] rounded-full bg-[rgba(131,110,249,0.3)] animate-ping" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
        <div className="absolute w-[240px] h-[240px] rounded-full bg-[rgba(131,110,249,0.15)] animate-ping" style={{ animationDelay: '1s', animationDuration: '3s' }} />

        {/* Central Orb / Button */}
        <button className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95 shadow-[0_0_60px_rgba(131,110,249,0.8)]"
          style={{ 
            background: "linear-gradient(135deg, #836ef9 0%, #4b3f72 100%)",
            border: "2px solid rgba(255,255,255,0.2)"
          }}>
          <div className="absolute inset-0 rounded-full border border-white/40 blur-[2px]" />
          <Mic className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
        </button>

      </div>

      <div className="mt-16 text-center z-10">
        <p className="text-sm font-medium tracking-[0.2em] uppercase mb-2 animate-pulse" style={{ color: "#d8ccfa" }}>
          {isListening ? "Escuchando..." : "Proof of Party"}
        </p>
        <p className="text-xs opacity-60 max-w-[200px] mx-auto leading-relaxed" style={{ color: "#a594fb" }}>
          {!wallet ? "Conecta tu wallet para hablar con la IA" : "Toca para ir a tus eventos"}
        </p>
      </div>

    </main>
  )
}
