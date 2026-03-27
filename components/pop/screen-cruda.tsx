"use client"

import { ChevronLeft, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useApp } from "@/lib/store"

type Phase = "listening" | "processing" | "done"

// Animated sound bars to simulate real-time audio detection
function SoundBars({ active }: { active: boolean }) {
  const heights = [3, 5, 8, 12, 16, 20, 16, 12, 8, 5, 3]
  return (
    <div className="flex items-center gap-[3px] h-8">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: active ? `${h * (0.5 + Math.random() * 0.8)}px` : "3px",
            background: "rgba(131,110,249,0.8)",
            transition: active ? `height ${80 + i * 20}ms ease-in-out` : "height 300ms ease",
            animation: active ? `pulse-bar ${0.4 + i * 0.07}s ease-in-out infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  )
}

export function ScreenCruda() {
  const { goTo, checkIn } = useApp()
  const [phase, setPhase] = useState<Phase>("listening")
  const [transcript, setTranscript] = useState("")
  const [barTick, setBarTick] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const barRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Elapsed time counter while listening
  useEffect(() => {
    if (phase === "listening") {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
      barRef.current = setInterval(() => setBarTick(t => t + 1), 120)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      if (barRef.current) clearInterval(barRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (barRef.current) clearInterval(barRef.current)
    }
  }, [phase])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`

  // Simulate: user clicks "Listo" → processing → done
  const handleDone = () => {
    setPhase("processing")
    setTranscript("Me duele la cabeza, no dormí nada, tomé como 8 cervezas...")
    setTimeout(() => setPhase("done"), 2500)
  }

  const handleRetry = () => {
    setPhase("listening")
    setTranscript("")
    setElapsed(0)
  }

  return (
    <main className="min-h-screen flex flex-col items-center pt-20 pb-10 relative overflow-hidden" style={{ background: "#0a0514" }}>

      {/* Pulsing ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(131,110,249,0.12) 0%, transparent 65%)" }} />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 h-14"
        style={{ background: "rgba(10,5,20,0.9)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(131,110,249,0.15)" }}>
        <button onClick={() => goTo("checkin-success")}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.2)" }}>
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div>
          <p className="font-bold text-sm text-white">Agente IA escuchando</p>
          {checkIn && <p className="text-xs" style={{ color: "#a594fb" }}>{checkIn.eventName}</p>}
        </div>

        {/* Live indicator */}
        {phase === "listening" && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.3)" }}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-400">EN VIVO</span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 z-10 gap-8">

        {/* Title */}
        {phase === "listening" && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.25em] mb-1" style={{ color: "#836ef9" }}>El agente te escucha</p>
            <h1 className="text-xl font-black text-white">Cuéntale cómo amaneciste</h1>
          </div>
        )}

        {/* ── AI ORB ── */}
        <div className="relative flex items-center justify-center">

          {/* Outer animated rings — always on when listening */}
          {phase === "listening" && <>
            <div className="absolute rounded-full animate-ping"
              style={{ width: 180, height: 180, background: "rgba(131,110,249,0.15)", animationDuration: "1.2s" }} />
            <div className="absolute rounded-full animate-ping"
              style={{ width: 230, height: 230, background: "rgba(131,110,249,0.09)", animationDuration: "1.8s", animationDelay: "0.3s" }} />
            <div className="absolute rounded-full animate-ping"
              style={{ width: 290, height: 290, background: "rgba(131,110,249,0.05)", animationDuration: "2.4s", animationDelay: "0.6s" }} />
          </>}

          {/* Processing ring */}
          {phase === "processing" && (
            <div className="absolute rounded-full"
              style={{ width: 180, height: 180, border: "2px solid rgba(131,110,249,0.3)", boxShadow: "0 0 40px rgba(131,110,249,0.2)" }} />
          )}

          {/* Done ring */}
          {phase === "done" && (
            <div className="absolute rounded-full animate-ping"
              style={{ width: 180, height: 180, background: "rgba(34,197,94,0.1)", animationDuration: "2s" }} />
          )}

          {/* Central Orb */}
          <div
            className="relative z-10 flex items-center justify-center rounded-full"
            style={{
              width: 140, height: 140,
              background: phase === "done"
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                : "linear-gradient(135deg, #836ef9 0%, #4b3f72 100%)",
              border: "2px solid rgba(255,255,255,0.15)",
              boxShadow: phase === "listening"
                ? "0 0 60px rgba(131,110,249,0.8), 0 0 120px rgba(131,110,249,0.3)"
                : phase === "done"
                ? "0 0 60px rgba(34,197,94,0.6)"
                : "0 0 40px rgba(131,110,249,0.4)",
              transition: "box-shadow 0.5s ease, background 0.5s ease",
            }}
          >
            {phase === "processing" ? (
              <Loader2 className="w-14 h-14 text-white animate-spin" />
            ) : phase === "done" ? (
              <span className="text-4xl">🤕</span>
            ) : (
              /* Mic SVG with inner glow */
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.9)]">
                <rect x="9" y="2" width="6" height="12" rx="3" fill="white"/>
                <path d="M5 11a7 7 0 0 0 14 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="20" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="9" y1="23" x2="15" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </div>
        </div>

        {/* Sound bars + timer */}
        {phase === "listening" && (
          <div className="flex flex-col items-center gap-3">
            {/* Animated bars — re-render every tick so heights randomize */}
            <div className="flex items-center gap-[4px] h-10" key={barTick}>
              {Array.from({ length: 13 }).map((_, i) => {
                const base = [4, 7, 10, 16, 22, 28, 32, 28, 22, 16, 10, 7, 4][i]
                const h = base * (0.5 + Math.random() * 0.9)
                return (
                  <div key={i} className="w-[3px] rounded-full"
                    style={{ height: `${h}px`, background: `rgba(131,110,249,${0.5 + Math.random() * 0.5})`, transition: "height 0.1s ease" }} />
                )
              })}
            </div>
            {/* Timer */}
            <span className="font-mono text-sm" style={{ color: "#a594fb" }}>{formatTime(elapsed)}</span>
          </div>
        )}

        {/* Status text */}
        <div className="text-center">
          {phase === "listening" && (
            <p className="text-sm animate-pulse" style={{ color: "#d8ccfa" }}>
              Habla con confianza, el agente procesa tu voz en tiempo real...
            </p>
          )}
          {phase === "processing" && (
            <p className="text-sm" style={{ color: "#a594fb" }}>Analizando lo que dijiste...</p>
          )}
          {phase === "done" && (
            <p className="text-sm font-semibold" style={{ color: "#22c55e" }}>¡Score calculado! Continúa para verlo.</p>
          )}
        </div>

        {/* Transcript bubble */}
        {transcript && (
          <div className="w-full max-w-sm rounded-2xl p-4 text-sm leading-relaxed"
            style={{ background: "rgba(131,110,249,0.08)", border: "1px solid rgba(131,110,249,0.2)", color: "#d8ccfa" }}>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#836ef9" }}>Tú dijiste:</p>
            <p>"{transcript}"</p>
          </div>
        )}

        {/* Action buttons */}
        {phase === "listening" && (
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button onClick={handleDone}
              className="w-full font-black rounded-2xl py-4 text-base text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg, #836ef9 0%, #5b4ad4 100%)", boxShadow: "0 0 30px rgba(131,110,249,0.4)" }}>
              Ya terminé de hablar ✓
            </button>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button onClick={() => goTo("metrics")}
              className="w-full font-black rounded-2xl py-4 text-base text-white transition-all hover:opacity-90 active:scale-95 glow-purple bg-gradient-purple">
              Ver mi score de cruda →
            </button>
            <button onClick={handleRetry}
              className="w-full font-semibold rounded-2xl py-3 text-sm transition-all"
              style={{ background: "rgba(131,110,249,0.08)", border: "1px solid rgba(131,110,249,0.2)", color: "#a594fb" }}>
              Grabar de nuevo
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
