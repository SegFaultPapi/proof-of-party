"use client"

import { ChevronLeft, Wallet, Calendar, MapPin, Loader2, PartyPopper, ExternalLink } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/lib/store"
import { TxHashBadge } from "./tx-hash-badge"
import { cn } from "@/lib/utils"

export function ScreenCheckInConfirm() {
  const { selectedEvent, wallet, goTo, confirmCheckIn } = useApp()
  const [loading, setLoading] = useState(false)

  const handleSign = () => {
    setLoading(true)
    setTimeout(() => {
      confirmCheckIn()
      setLoading(false)
    }, 2000)
  }

  if (!selectedEvent) return null

  return (
    <main className="min-h-screen pt-20 pb-10 px-5 max-w-md mx-auto" style={{ background: "#0a0514" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => goTo("events")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#e8e0ff]"
          style={{ background: "var(--surface-1)", border: "1px solid #d8ccfa" }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "#ffffff" }} />
        </button>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "#ffffff" }}>Confirmar Check-In</h1>
          <p className="text-xs" style={{ color: "#a594fb" }}>Firma la transaccion para registrarte</p>
        </div>
      </div>

      {/* Event card */}
      <div
        className="rounded-2xl p-5 mb-4 card-shadow"
        style={{ background: "var(--surface-1)", border: "1px solid rgba(131,110,249,0.2)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px" style={{ background: "rgba(131, 110, 249, 0.2)" }} />
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#b0a0d8" }}>Evento</span>
          <div className="flex-1 h-px" style={{ background: "rgba(131, 110, 249, 0.2)" }} />
        </div>
        <h2 className="font-bold text-lg mb-3" style={{ color: "#ffffff" }}>{selectedEvent.name}</h2>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5 text-sm" style={{ color: "#a594fb" }}>
            <Calendar className="w-4 h-4" style={{ color: "#a594fb" }} />
            {selectedEvent.date}
          </div>
          <div className="flex items-center gap-2.5 text-sm" style={{ color: "#a594fb" }}>
            <MapPin className="w-4 h-4" style={{ color: "#a594fb" }} />
            {selectedEvent.venue}
          </div>
          <div className="flex items-center gap-2.5 text-sm" style={{ color: "#a594fb" }}>
            <Wallet className="w-4 h-4" style={{ color: "#a594fb" }} />
            <span className="font-mono text-xs">{wallet}</span>
          </div>
        </div>
      </div>

      {/* Deposit info */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{ background: "rgba(131,110,249,0.06)", border: "1px solid rgba(131,110,249,0.18)" }}
      >
        <div className="flex justify-between items-center">
          <span className="text-sm" style={{ color: "#a594fb" }}>Deposito simbolico</span>
          <span className="font-bold text-sm" style={{ color: "#ffffff" }}>0.001 MON</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm" style={{ color: "#a594fb" }}>Red</span>
          <span className="text-sm font-semibold" style={{ color: "#836ef9" }}>Monad Testnet</span>
        </div>
      </div>

      {/* Sign button */}
      <button
        onClick={handleSign}
        disabled={loading}
        className={cn(
          "w-full flex items-center justify-center gap-3 font-bold rounded-2xl py-4 text-base transition-all text-white",
          loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90 active:scale-95 glow-purple bg-gradient-purple"
        )}
        style={loading ? { background: "#a594fb" } : {}}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Firmando en Monad...
          </>
        ) : (
          "Firmar Check-In"
        )}
      </button>

      <p className="mt-4 text-xs text-center" style={{ color: "#b0a0d8" }}>
        Se abrira tu wallet para confirmar la transaccion
      </p>
    </main>
  )
}

export function ScreenCheckInSuccess() {
  const { checkIn, goTo } = useApp()

  if (!checkIn) return null

  return (
    <main className="min-h-screen pt-20 pb-10 px-5 max-w-md mx-auto flex flex-col" style={{ background: "#0a0514" }}>
      {/* Success area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div className="relative mb-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(131,110,249,0.1)",
              border: "2px solid rgba(131,110,249,0.3)",
              boxShadow: "0 0 40px rgba(131,110,249,0.2)",
            }}
          >
            <PartyPopper className="w-12 h-12" style={{ color: "#836ef9" }} />
          </div>
          <div
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 flex items-center justify-center"
            style={{ background: "#22c55e", borderColor: "#0a0514" }}
          >
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        </div>

        <h1 className="font-bold text-2xl mb-2">
          <span className="text-gradient-purple">Check-In</span>{" "}
          <span style={{ color: "#ffffff" }}>exitoso</span>
        </h1>
        <p className="text-sm text-balance mb-8 max-w-xs leading-relaxed" style={{ color: "#a594fb" }}>
          Tu participacion quedo registrada on-chain en{" "}
          <span className="font-semibold" style={{ color: "#ffffff" }}>{checkIn.eventName}</span>
        </p>

        {/* Tx details */}
        <div
          className="w-full rounded-2xl p-4 mb-4 text-left card-shadow"
          style={{ background: "var(--surface-1)", border: "1px solid #e8e0ff" }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: "#a594fb" }}>Transaccion confirmada</p>
          <TxHashBadge txHash={checkIn.txHash} />
          <div
            className="mt-3 pt-3 flex items-center justify-between"
            style={{ borderTop: "1px solid #e8e0ff" }}
          >
            <span className="text-xs" style={{ color: "#b0a0d8" }}>{checkIn.timestamp}</span>
            <a href="#" className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#836ef9" }}>
              Monad Explorer
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Reminder */}
        <div
          className="w-full rounded-2xl p-4 text-center"
          style={{ background: "rgba(131,110,249,0.06)", border: "1px solid rgba(131,110,249,0.18)" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "#ffffff" }}>Vuelve manana</p>
          <p className="text-xs" style={{ color: "#a594fb" }}>
            Despues de la fiesta, reporta tus metricas y cobra tu recompensa.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={() => goTo("metrics")}
          className="w-full font-bold rounded-2xl py-4 text-base transition-all hover:opacity-90 active:scale-95 text-white bg-gradient-purple glow-purple"
        >
          Reportar mi cruda ahora
        </button>
        <button
          onClick={() => goTo("events")}
          className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-colors hover:bg-[#e8e0ff]"
          style={{ background: "var(--surface-1)", border: "1px solid #d8ccfa", color: "rgba(131, 110, 249, 0.3)" }}
        >
          Volver a eventos
        </button>
      </div>
    </main>
  )
}
