"use client"

import { Mic, Volume2, VolumeX, ChevronDown, ChevronRight, Banknote, Globe } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/lib/store"
import { useRef, useState } from "react"
import { useAccount } from "wagmi"

import { toast } from "sonner"

export function ScreenHome() {
  const { wallet, goTo } = useApp()
  const { isConnected } = useAccount()
  const [isListening, setIsListening] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleClick = () => {
    if (!isConnected || !wallet) {
      toast.error("Por favor, conecta tu wallet con el botón superior derecho primero.")
    } else {
      goTo("events")
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }

  return (
    <main className="w-full relative" style={{ background: "#0a0514" }}>
      
      {/* Background Video (Fixed so it stays while scrolling) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-60 pointer-events-none z-0"
      >
        <source src="/VideoLanding.mp4" type="video/mp4" />
      </video>

      {/* Sound Toggle Button (Fixed) */}
      <button 
        onClick={toggleMute} 
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-md transition-all hover:bg-black/60 text-white"
        aria-label={isMuted ? "Activar sonido" : "Silenciar sonido"}
      >
        {isMuted ? <VolumeX className="w-5 h-5 opacity-70" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* ====== SECTION 1: AI ORB ====== */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center relative z-10">
        
        {/* Background glow for the orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-40 blur-[80px]"
          style={{
            background: "radial-gradient(circle, rgba(131,110,249,0.5) 0%, rgba(0,0,0,0) 70%)"
          }}
        />

        <div className="relative flex items-center justify-center group cursor-pointer" onClick={handleClick}>
          
          {/* Animated Rings */}
          <div className="absolute w-[120px] h-[120px] rounded-full bg-[rgba(131,110,249,0.7)] animate-ping opacity-80" />
          <div className="absolute w-[180px] h-[180px] rounded-full bg-[rgba(131,110,249,0.4)] animate-ping" style={{ animationDelay: '0.5s', animationDuration: '3s' }} />
          <div className="absolute w-[240px] h-[240px] rounded-full bg-[rgba(131,110,249,0.2)] animate-ping" style={{ animationDelay: '1s', animationDuration: '3s' }} />

          {/* Central Orb / Button */}
          <button className="relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-300 ease-out group-hover:scale-110 group-active:scale-95 shadow-[0_0_60px_rgba(131,110,249,0.9)]"
            style={{ 
              background: "linear-gradient(135deg, #836ef9 0%, #4b3f72 100%)",
              border: "2px solid rgba(255,255,255,0.3)",
              backdropFilter: "blur(10px)"
            }}>
            <div className="absolute inset-0 rounded-full border border-white/40 blur-[2px]" />
            <Mic className="w-10 h-10 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse" />
          </button>

        </div>

        <div className="mt-16 text-center z-10 p-4 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
          <p className="text-sm font-bold tracking-[0.2em] uppercase mb-2 animate-pulse" style={{ color: "#ffffff", textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
            {isListening ? "Escuchando..." : "Proof of Party"}
          </p>
          <p className="text-xs opacity-80 max-w-[200px] mx-auto leading-relaxed" style={{ color: "#d8ccfa", textShadow: "0 1px 5px rgba(0,0,0,0.5)" }}>
            {!wallet ? "Fiesta vs Cruda" : "Toca para ir a tus eventos"}
          </p>
        </div>

        {/* Scroll indicator */}
        <button onClick={scrollToBottom} className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-70 hover:opacity-100 transition-opacity p-2">
          <ChevronDown className="w-8 h-8 text-white drop-shadow-lg" />
        </button>

      </section>

      {/* ====== SECTION 2: INICIAR BUTTON ====== */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center relative z-10 bg-gradient-to-t from-[#0a0514] via-[#0a0514]/40 to-transparent gap-8">
        <button 
          onClick={handleClick}
          className="relative overflow-hidden group px-14 py-6 rounded-full bg-[#836ef9] text-white font-black text-2xl tracking-[0.2em] uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(131,110,249,0.4)] hover:shadow-[0_0_80px_rgba(131,110,249,0.7)]"
        >
          <span className="relative z-10">Iniciar</span>
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
        </button>

        {/* Links from remote main */}
        <div className="flex flex-col gap-4 w-full max-w-sm px-6">
          <Link
            href="/onramp"
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-md"
            style={{ background: "rgba(20, 10, 35, 0.6)", border: "1px solid rgba(131, 110, 249, 0.2)", boxShadow: "0 2px 8px rgba(131,110,249,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)" }}
              >
                <Banknote className="w-4 h-4" style={{ color: "#16a34a" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>Fondos al seguro (onramp)</p>
                <p className="text-xs" style={{ color: "#a594fb" }}>Probar Etherfuse sandbox · Monad</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "#836ef9" }} />
          </Link>

          <button
            onClick={() => goTo("dashboard")}
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-md"
            style={{ background: "rgba(20, 10, 35, 0.6)", border: "1px solid rgba(131, 110, 249, 0.2)", boxShadow: "0 2px 8px rgba(131,110,249,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.2)" }}
              >
                <Globe className="w-4 h-4" style={{ color: "#836ef9" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>Dashboard publico</p>
                <p className="text-xs" style={{ color: "#a594fb" }}>Ver pagos liquidados</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "#836ef9" }} />
          </button>
        </div>
      </section>

    </main>
  )
}
