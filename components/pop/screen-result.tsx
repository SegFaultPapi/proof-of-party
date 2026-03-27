"use client"

import { BedDouble, Footprints, Heart, Loader2, ExternalLink, BarChart2 } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/lib/store"
import { TxHashBadge } from "./tx-hash-badge"
import { cn } from "@/lib/utils"

export function ScreenResult() {
  const { result, claimPayout, goTo } = useApp()
  const [claiming, setClaiming] = useState(false)

  if (!result) return null

  const isCruda = result.verdict === "cruda"

  const handleClaim = () => {
    if (result.txHash) return
    setClaiming(true)
    setTimeout(() => {
      claimPayout()
      setClaiming(false)
    }, 2000)
  }

  return (
    <main className="min-h-screen pt-20 pb-10 px-5 max-w-md mx-auto flex flex-col" style={{ background: "#0a0514" }}>
      {/* Verdict hero */}
      <div className="flex flex-col items-center text-center py-6">
        <div
          className="w-24 h-24 rounded-full border-2 flex items-center justify-center mb-4"
          style={
            isCruda
              ? {
                  background: "rgba(220, 38, 38, 0.06)",
                  borderColor: "rgba(220, 38, 38, 0.25)",
                  boxShadow: "0 0 36px rgba(220,38,38,0.12)",
                }
              : {
                  background: "rgba(22, 163, 74, 0.06)",
                  borderColor: "rgba(22, 163, 74, 0.25)",
                  boxShadow: "0 0 36px rgba(22,163,74,0.12)",
                }
          }
        >
          <span className="text-4xl" role="img" aria-label={isCruda ? "cruda" : "superviviente"}>
            {isCruda ? "🤕" : "💪"}
          </span>
        </div>

        <h1
          className="font-bold text-2xl mb-1"
          style={{ color: isCruda ? "#dc2626" : "#16a34a" }}
        >
          {isCruda ? "Cruda Confirmada" : "Superviviente"}
        </h1>
        <p className="text-sm max-w-xs text-balance leading-relaxed" style={{ color: "#a594fb" }}>
          {isCruda
            ? "El oraculo confirmo que tu cuerpo necesita recuperacion on-chain."
            : "Resististe la noche como todo un DeFi degen. Aqui tu bonus fitness."}
        </p>
      </div>

      {/* Score breakdown */}
      <div
        className="rounded-2xl p-4 mb-4 card-shadow"
        style={{ background: "var(--surface-1)", border: "1px solid #e8e0ff" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4" style={{ color: "#836ef9" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#a594fb" }}>
            Score: {result.score}/100
          </span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden ml-2" style={{ background: "rgba(131, 110, 249, 0.2)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${result.score}%`,
                background: result.score < 60 ? "#dc2626" : "#16a34a",
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {[
            {
              icon: BedDouble,
              label: "Sueno",
              value: `${result.sleep}h`,
              color: result.sleep < 5 ? "#dc2626" : result.sleep < 7 ? "#d97706" : "#16a34a",
            },
            {
              icon: Footprints,
              label: "Pasos",
              value: result.steps.toLocaleString(),
              color: result.steps < 2000 ? "#dc2626" : "#16a34a",
            },
            {
              icon: Heart,
              label: "Pulso",
              value: `${result.bpm} BPM`,
              color: result.bpm > 100 ? "#dc2626" : result.bpm > 90 ? "#d97706" : "#16a34a",
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm">
                <Icon className="w-4 h-4" style={{ color: "#a594fb" }} />
                <span style={{ color: "#a594fb" }}>{label}</span>
              </div>
              <span className="font-bold text-sm tabular-nums" style={{ color }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout card */}
      <div
        className="rounded-2xl p-5 mb-4 card-shadow"
        style={{ background: "var(--surface-1)", border: "1px solid rgba(131,110,249,0.22)" }}
      >
        <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: "#a594fb" }}>
          Tu recompensa
        </p>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs mb-1" style={{ color: "#a594fb" }}>Recibiras</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: "#ffffff" }}>
              {result.net.toFixed(3)}{" "}
              <span className="text-lg font-medium" style={{ color: "#a594fb" }}>USDC</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: "#a594fb" }}>Fee PoP (5%)</p>
            <p className="text-sm tabular-nums" style={{ color: "#b0a0d8" }}>{result.fee.toFixed(3)} USDC</p>
          </div>
        </div>

        {result.txHash ? (
          <TxHashBadge txHash={result.txHash} />
        ) : (
          <button
            onClick={handleClaim}
            disabled={claiming}
            className={cn(
              "w-full flex items-center justify-center gap-3 font-bold rounded-xl py-3.5 text-base transition-all text-white",
              claiming ? "opacity-70 cursor-not-allowed" : "hover:opacity-90 active:scale-95 bg-gradient-purple glow-purple"
            )}
            style={claiming ? { background: "#a594fb" } : {}}
          >
            {claiming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ejecutando payout...
              </>
            ) : (
              "Reclamar Recompensa"
            )}
          </button>
        )}
      </div>

      {/* Post-claim tx */}
      {result.txHash && (
        <div
          className="rounded-2xl p-4 mb-4 card-shadow"
          style={{ background: "var(--surface-1)", border: "1px solid rgba(22,163,74,0.25)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold text-green-600">Payout enviado</span>
          </div>
          <TxHashBadge txHash={result.txHash} />
          <a
            href="#"
            className="flex items-center gap-1.5 text-xs hover:underline mt-3"
            style={{ color: "#836ef9" }}
          >
            <ExternalLink className="w-3 h-3" />
            Ver transaccion en Monad Explorer
          </a>
        </div>
      )}

      {/* Navigation */}
      {result.txHash && (
        <button
          onClick={() => goTo("dashboard")}
          className="w-full font-semibold rounded-2xl py-3.5 text-sm transition-colors hover:bg-[#e8e0ff]"
          style={{ background: "var(--surface-1)", border: "1px solid #d8ccfa", color: "rgba(131, 110, 249, 0.3)" }}
        >
          Ver dashboard
        </button>
      )}
    </main>
  )
}
