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

        {/* Logo */}
        <img src="/LogoPOP.png" alt="Proof of Party" className="h-20 w-auto object-contain mb-6 drop-shadow-[0_0_30px_rgba(131,110,249,0.6)]" />

        {/* Title */}
        <h1 className="text-4xl font-black text-center leading-tight mb-3 tracking-tight">
          <span className="text-gradient-purple">Proof</span>
          <span style={{ color: "#ffffff" }}> of </span>
          <span className="text-gradient-purple">Party</span>
        </h1>
        <p className="text-base text-center mb-10 max-w-[260px] leading-relaxed" style={{ color: "#a594fb" }}>
          Demuestra tu cruda. Ordena tu desayuno. Cobra on-chain.
        </p>

        {/* CTA */}
        <button
          onClick={handleClick}
          className="relative overflow-hidden group px-12 py-5 rounded-full font-black text-xl tracking-[0.15em] uppercase transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #836ef9 0%, #5b4ad4 100%)",
            boxShadow: "0 0 40px rgba(131,110,249,0.45), 0 0 80px rgba(131,110,249,0.15)",
            color: "#ffffff",
          }}
        >
          <span className="relative z-10">Iniciar</span>
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors rounded-full" />
        </button>

        {/* Scroll down */}
        <button onClick={scrollToBottom}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50 hover:opacity-100 transition-opacity p-2">
          <ChevronDown className="w-7 h-7 text-white" />
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
