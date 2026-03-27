"use client"

import { Mic, Volume2, VolumeX, ChevronDown, ChevronRight, Banknote, Globe } from "lucide-react"
import Link from "next/link"
import { useApp } from "@/lib/store"
import { monadTestnet } from "@/lib/monad-testnet"
import { useRef, useState } from "react"
import { useAccount, useConnect, useSwitchChain } from "wagmi"
import { injected } from "wagmi/connectors"

export function ScreenHome() {
  const { goTo } = useApp()
  const { isConnected } = useAccount()
  const { connectAsync, isPending: isConnecting } = useConnect()
  const { switchChainAsync } = useSwitchChain()
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleClick = () => {
    void (async () => {
      if (!isConnected) {
        if (isConnecting) return
        try {
          await connectAsync({ connector: injected(), chainId: monadTestnet.id })
          try { await switchChainAsync({ chainId: monadTestnet.id }) } catch { /* ignorar */ }
        } catch { /* usuario canceló */ }
        return
      }
      goTo("events")
    })()
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
  }

  return (
    <main className="w-full relative" style={{ background: "#0a0514" }}>

      {/* Background Video */}
      <video ref={videoRef} autoPlay loop muted playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-60 pointer-events-none z-0">
        <source src="/VideoLanding.mp4" type="video/mp4" />
      </video>

      {/* Sound Toggle */}
      <button onClick={toggleMute}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-md transition-all hover:bg-black/60 text-white"
        aria-label={isMuted ? "Activar sonido" : "Silenciar"}>
        {isMuted ? <VolumeX className="w-5 h-5 opacity-70" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* ── SECTION 1: Hero ─────────────────────────────────── */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center relative z-10 px-6">

        {/* Logo with stronger glow */}
        <img 
          src="/LogoPOP.png" 
          alt="Proof of Party" 
          className="h-24 w-auto object-contain mb-8 drop-shadow-[0_0_40px_rgba(131,110,249,0.7)] hover:scale-105 transition-transform" 
        />

        {/* Title: High Impact Copy (Summarized in Spanish) */}
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-5xl md:text-8xl font-black leading-[1] tracking-tighter drop-shadow-[0_4px_15px_rgba(0,0,0,0.9)]">
            <span className="text-gradient-purple uppercase">Fiesta</span>
            <span style={{ color: "#ffffff" }}> HOY,</span>
            <br />
            <span className="text-gradient-purple uppercase">Cura</span>
            <span style={{ color: "#ffffff" }}> MAÑANA.</span>
          </h1>
          
          <p 
            className="text-lg md:text-2xl font-bold max-w-[450px] mx-auto leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,1)] uppercase tracking-wide"
            style={{ color: "#d8ccfa" }}
          >
            Bloquea USDC de noche. <br />
            Probamos tu cruda con IA de día.
          </p>
        </div>

        {/* CTA: Short and direct */}
        <button
          onClick={handleClick}
          className="relative overflow-hidden group px-14 py-6 rounded-full font-black text-2xl tracking-[0.25em] uppercase transition-all hover:scale-105 active:scale-95 mt-6"
          style={{
            background: "linear-gradient(135deg, #836ef9 0%, #5b4ad4 100%)",
            boxShadow: "0 0 50px rgba(131,110,249,0.6), 0 10px 40px rgba(0,0,0,0.6)",
            color: "#ffffff",
          }}
        >
          <span className="relative z-10">Unirse</span>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors rounded-full" />
        </button>

        {/* Scroll down hint */}
        <button onClick={scrollToBottom}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-40 hover:opacity-100 transition-opacity p-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-white mb-1">Explore</span>
            <ChevronDown className="w-6 h-6 text-white" />
          </div>
        </button>

      </section>

      {/* ── SECTION 2: Links ─────────────────────────────────── */}
      <section className="min-h-screen w-full flex flex-col items-center justify-center relative z-10 bg-gradient-to-t from-[#0a0514] via-[#0a0514]/60 to-transparent px-6 gap-4">

        <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: "#a594fb" }}>Explorar</p>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <Link href="/onramp"
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-lg"
            style={{ background: "rgba(20, 10, 35, 0.7)", border: "1px solid rgba(131, 110, 249, 0.2)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
                <Banknote className="w-4 h-4" style={{ color: "#16a34a" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>Fondos al seguro (onramp)</p>
                <p className="text-xs" style={{ color: "#a594fb" }}>Etherfuse sandbox · Monad</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: "#836ef9" }} />
          </Link>

          <button onClick={() => goTo("dashboard")}
            className="w-full rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-lg"
            style={{ background: "rgba(20, 10, 35, 0.7)", border: "1px solid rgba(131, 110, 249, 0.2)", backdropFilter: "blur(12px)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.2)" }}>
                <Globe className="w-4 h-4" style={{ color: "#836ef9" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "#ffffff" }}>Dashboard público</p>
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
