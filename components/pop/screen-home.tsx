"use client"

import { ArrowRight, Zap, Moon, DollarSign, ChevronRight, Globe } from "lucide-react"
import { useApp } from "@/lib/store"
import { WalletButton } from "./wallet-button"

const steps = [
  {
    icon: Zap,
    label: "Check-in",
    desc: "Escanea el QR del evento con tu wallet",
    iconBg: "rgba(131, 110, 249, 0.12)",
    iconBorder: "rgba(131, 110, 249, 0.25)",
    iconColor: "#836ef9",
  },
  {
    icon: Moon,
    label: "Reporta",
    desc: "Dinos como amaneciste al dia siguiente",
    iconBg: "rgba(131, 110, 249, 0.08)",
    iconBorder: "rgba(131, 110, 249, 0.18)",
    iconColor: "#a594fb",
  },
  {
    icon: DollarSign,
    label: "Cobra",
    desc: "Recibe tu recompensa automatica en USDC",
    iconBg: "rgba(34, 197, 94, 0.08)",
    iconBorder: "rgba(34, 197, 94, 0.2)",
    iconColor: "#16a34a",
  },
]

export function ScreenHome() {
  const { wallet, goTo } = useApp()

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#f8f5ff" }}>
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10 relative overflow-hidden">
        {/* Soft glow orbs */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(131,110,249,0.12) 0%, transparent 70%)", filter: "blur(40px)" }}
        />

        {/* Live badge */}
        <div
          className="mb-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full"
          style={{ background: "#ffffff", border: "1px solid #d8ccfa", boxShadow: "0 2px 8px rgba(131,110,249,0.1)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium" style={{ color: "#7c6bb5" }}>En vivo en Monad Testnet</span>
        </div>

        {/* Logo */}
        <div
          className="mb-4 w-16 h-16 rounded-2xl flex items-center justify-center glow-purple"
          style={{ background: "linear-gradient(135deg, #836ef9 0%, #6b56e8 100%)" }}
        >
          <Zap className="w-8 h-8 text-white" fill="white" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center leading-tight text-balance mb-3">
          <span className="text-gradient-purple">Proof</span>
          <span style={{ color: "#1a0f3c" }}> of </span>
          <span className="text-gradient-purple">Party</span>
        </h1>
        <p className="text-base text-center text-balance mb-2 leading-relaxed max-w-xs" style={{ color: "#4b3f72" }}>
          Tu cruda,{" "}
          <span className="font-bold" style={{ color: "#1a0f3c" }}>tu recompensa.</span>
        </p>
        <p className="text-sm text-center text-balance mb-8 max-w-[260px]" style={{ color: "#7c6bb5" }}>
          Check-in on-chain en eventos Web3 y cobra en USDC.
        </p>

        {/* CTA */}
        {wallet ? (
          <button
            onClick={() => goTo("events")}
            className="flex items-center gap-2.5 font-bold rounded-2xl px-8 py-4 text-base transition-all w-full max-w-xs justify-center text-white bg-gradient-purple glow-purple hover:opacity-90 active:scale-95"
          >
            Ver eventos
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <WalletButton className="w-full max-w-xs justify-center py-4 text-base rounded-2xl font-bold" />
        )}

        <p className="mt-4 text-xs text-center" style={{ color: "#b0a0d8" }}>
          Sin registro. Solo tu wallet.
        </p>
      </section>

      {/* How it works */}
      <section className="px-5 pb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-center mb-5" style={{ color: "#b0a0d8" }}>
          Como funciona
        </h2>
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="rounded-2xl p-4 flex items-center gap-4 card-shadow"
              style={{ background: "#ffffff", border: "1px solid #e8e0ff" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: step.iconBg, border: `1px solid ${step.iconBorder}` }}
              >
                <step.icon className="w-5 h-5" style={{ color: step.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono" style={{ color: "#c4b5fd" }}>0{i + 1}</span>
                  <span className="font-semibold text-sm" style={{ color: "#1a0f3c" }}>{step.label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#7c6bb5" }}>{step.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#c4b5fd" }} />
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard link */}
      <section className="px-5 pb-10 max-w-md mx-auto w-full">
        <button
          onClick={() => goTo("dashboard")}
          className="w-full rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-md"
          style={{ background: "#ffffff", border: "1px solid #d8ccfa", boxShadow: "0 2px 8px rgba(131,110,249,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.2)" }}
            >
              <Globe className="w-4 h-4" style={{ color: "#836ef9" }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: "#1a0f3c" }}>Dashboard publico</p>
              <p className="text-xs" style={{ color: "#7c6bb5" }}>5 pagos liquidados</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: "#b0a0d8" }} />
        </button>
      </section>
    </main>
  )
}
