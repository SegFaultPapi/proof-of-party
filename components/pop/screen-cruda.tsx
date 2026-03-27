"use client"

import { Mic, MicOff, ChevronLeft, Loader2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useApp } from "@/lib/store"

type Phase = "idle" | "listening" | "processing" | "done"

export function ScreenCruda() {
  const { goTo, checkIn } = useApp()
  const [phase, setPhase] = useState<Phase>("idle")
  const [transcript, setTranscript] = useState("")
  const [dots, setDots] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Dot animation while listening
  useEffect(() => {
    if (phase === "listening") {
      intervalRef.current = setInterval(() => setDots(d => (d + 1) % 4), 500)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setDots(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase])

  const handleOrbClick = () => {
    if (phase === "idle") {
      setPhase("listening")
      setTranscript("")
      // Simulate listening for 4s then processing
      setTimeout(() => {
        setTranscript("Me duele la cabeza, no dormí nada, tomé como 8 cervezas...")
        setPhase("processing")
        setTimeout(() => {
          setPhase("done")
        }, 2500)
      }, 4000)
    } else if (phase === "listening") {
      setPhase("idle")
      setTranscript("")
    }
  }

  const handleContinue = () => {
    goTo("metrics")
  }

  const phaseLabel = {
    idle: "Toca para hablar",
    listening: `Escuchando${"·".repeat(dots)}`,
    processing: "Analizando tu cruda...",
    done: "¡Listo! Continúa para ver tu score",
  }

  const ringColors = {
    idle: "rgba(131,110,249,0.25)",
    listening: "rgba(131,110,249,0.6)",
    processing: "rgba(131,110,249,0.4)",
    done: "rgba(34,197,94,0.5)",
  }

  const orbGlow = {
    idle: "rgba(131,110,249,0.3)",
    listening: "rgba(131,110,249,0.9)",
    processing: "rgba(131,110,249,0.6)",
    done: "rgba(34,197,94,0.7)",
  }

  return (
    <main className="min-h-screen flex flex-col items-center pt-20 pb-10 relative" style={{ background: "#0a0514" }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse at center, rgba(131,110,249,0.08) 0%, transparent 70%)" }} />

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 h-14"
        style={{ background: "rgba(10,5,20,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(131,110,249,0.12)" }}>
        <button onClick={() => goTo("checkin-success")}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.2)" }}>
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <div>
          <p className="font-bold text-sm text-white">Reportar Cruda</p>
          {checkIn && <p className="text-xs" style={{ color: "#a594fb" }}>{checkIn.eventName}</p>}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-6 z-10 gap-10">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-black mb-1" style={{ color: "#ffffff" }}>
            ¿Cómo amaneciste? 🤕
          </h1>
          <p className="text-sm" style={{ color: "#a594fb" }}>
            Cuéntale al agente lo que sientes
          </p>
        </div>

        {/* ── AI ORB ── */}
        <div className="relative flex items-center justify-center" onClick={handleOrbClick}>

          {/* Outer rings — only animate when listening */}
          {phase === "listening" && <>
            <div className="absolute w-[200px] h-[200px] rounded-full animate-ping"
              style={{ background: ringColors.listening, animationDuration: "1.5s", opacity: 0.4 }} />
            <div className="absolute w-[260px] h-[260px] rounded-full animate-ping"
              style={{ background: "rgba(131,110,249,0.2)", animationDuration: "2s", animationDelay: "0.4s", opacity: 0.3 }} />
            <div className="absolute w-[320px] h-[320px] rounded-full animate-ping"
              style={{ background: "rgba(131,110,249,0.1)", animationDuration: "2.5s", animationDelay: "0.8s", opacity: 0.2 }} />
          </>}

          {/* Done ring */}
          {phase === "done" && (
            <div className="absolute w-[160px] h-[160px] rounded-full animate-ping"
              style={{ background: "rgba(34,197,94,0.2)", animationDuration: "2s" }} />
          )}

          {/* Central Orb */}
          <button
            className="relative z-10 w-[120px] h-[120px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-500 active:scale-90"
            style={{
              background: phase === "done"
                ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                : "linear-gradient(135deg, #836ef9 0%, #4b3f72 100%)",
              border: "2px solid rgba(255,255,255,0.2)",
              boxShadow: `0 0 60px ${orbGlow[phase]}, 0 0 120px ${orbGlow[phase].replace("0.9","0.3")}`,
              backdropFilter: "blur(10px)",
            }}
            aria-label={phase === "listening" ? "Detener" : "Hablar con el agente"}
          >
            {phase === "processing" ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : phase === "listening" ? (
              <MicOff className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-white" style={{ filter: "drop-shadow(0 0 12px rgba(255,255,255,0.6))" }} />
            )}
          </button>
        </div>

        {/* Phase label */}
        <p className="text-sm font-semibold tracking-wide text-center min-h-[24px]"
          style={{ color: phase === "done" ? "#22c55e" : "#d8ccfa" }}>
          {phaseLabel[phase]}
        </p>

        {/* Transcript bubble */}
        {transcript && (
          <div className="w-full max-w-sm rounded-2xl p-4 text-sm leading-relaxed"
            style={{
              background: "rgba(131,110,249,0.08)",
              border: "1px solid rgba(131,110,249,0.2)",
              color: "#d8ccfa",
            }}>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "#836ef9" }}>
              Tú dijiste:
            </p>
            <p>"{transcript}"</p>
          </div>
        )}

        {/* Action buttons */}
        {phase === "done" && (
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button onClick={handleContinue}
              className="w-full font-black rounded-2xl py-4 text-base text-white transition-all hover:opacity-90 active:scale-95 glow-purple bg-gradient-purple">
              Ver mi score de cruda →
            </button>
            <button onClick={() => { setPhase("idle"); setTranscript("") }}
              className="w-full font-semibold rounded-2xl py-3 text-sm transition-all"
              style={{ background: "rgba(131,110,249,0.08)", border: "1px solid rgba(131,110,249,0.2)", color: "#a594fb" }}>
              Grabar de nuevo
            </button>
          </div>
        )}

        {phase === "idle" && (
          <p className="text-xs text-center max-w-[240px]" style={{ color: "#836ef9" }}>
            El agente AI analizará tu voz y evaluará tu nivel de cruda para liberar tu pedido de delivery
          </p>
        )}

      </div>
    </main>
  )
}
