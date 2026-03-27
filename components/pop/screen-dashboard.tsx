"use client"

import { RefreshCw, ExternalLink, ChevronLeft, Users, DollarSign, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"

export function ScreenDashboard() {
  const { dashboard, goTo } = useApp()
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | "cruda" | "survivor">("all")

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1200)
  }

  const totalCheckins = dashboard.length
  const totalPayouts = dashboard.length
  const totalUsdc = dashboard.reduce((acc, e) => acc + e.amount, 0)

  const filtered =
    filter === "all"
      ? dashboard
      : filter === "cruda"
        ? dashboard.filter(e => e.hangover)
        : dashboard.filter(e => !e.hangover)

  const stats = [
    {
      icon: Users,
      value: totalCheckins,
      label: "Check-ins",
      iconBg: "rgba(131,110,249,0.1)",
      iconBorder: "rgba(131,110,249,0.22)",
      iconColor: "#836ef9",
      valueColor: "#ffffff",
    },
    {
      icon: CheckCircle,
      value: totalPayouts,
      label: "Liquidados",
      iconBg: "rgba(131,110,249,0.1)",
      iconBorder: "rgba(131,110,249,0.22)",
      iconColor: "#836ef9",
      valueColor: "#ffffff",
    },
    {
      icon: DollarSign,
      value: totalUsdc.toFixed(1),
      label: "USDC dist.",
      iconBg: "rgba(22,163,74,0.08)",
      iconBorder: "rgba(22,163,74,0.22)",
      iconColor: "#16a34a",
      valueColor: "#16a34a",
    },
  ]

  return (
    <main className="min-h-screen pt-20 pb-10 max-w-md mx-auto" style={{ background: "#0a0514" }}>
      {/* Header */}
      <div className="px-5 flex items-center gap-3 mb-6">
        <button
          onClick={() => goTo("home")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#e8e0ff]"
          style={{ background: "var(--surface-1)", border: "1px solid #d8ccfa" }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "#ffffff" }} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-xl" style={{ color: "#ffffff" }}>Dashboard</h1>
          <p className="text-xs" style={{ color: "#a594fb" }}>Actividad en tiempo real</p>
        </div>
        <button
          onClick={handleRefresh}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#e8e0ff]"
          style={{ background: "var(--surface-1)", border: "1px solid #d8ccfa" }}
        >
          <RefreshCw
            className={cn("w-4 h-4 transition-colors", refreshing ? "animate-spin" : "")}
            style={{ color: refreshing ? "#836ef9" : "#a594fb" }}
          />
        </button>
      </div>

      {/* Stats */}
      <div className="px-5 grid grid-cols-3 gap-3 mb-6">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="rounded-2xl p-3.5 text-center card-shadow"
            style={{ background: "var(--surface-1)", border: "1px solid #e8e0ff" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{ background: stat.iconBg, border: `1px solid ${stat.iconBorder}` }}
            >
              <stat.icon className="w-4 h-4" style={{ color: stat.iconColor }} />
            </div>
            <p className="text-xl font-bold tabular-nums" style={{ color: stat.valueColor }}>{stat.value}</p>
            <p className="text-[10px] leading-tight" style={{ color: "#a594fb" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="px-5 flex gap-2 mb-4">
        {(["all", "cruda", "survivor"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-semibold transition-all",
              filter === f ? "text-white bg-gradient-purple glow-purple-sm" : ""
            )}
            style={
              filter !== f
                ? { background: "var(--surface-1)", border: "1px solid #d8ccfa", color: "#a594fb" }
                : {}
            }
          >
            {f === "all" ? "Todos" : f === "cruda" ? "Con cruda" : "Survivors"}
          </button>
        ))}
      </div>

      {/* Entries */}
      <div className="px-5 flex flex-col gap-2">
        {filtered.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center card-shadow"
            style={{ background: "var(--surface-1)", border: "1px solid #e8e0ff" }}
          >
            <p className="text-sm" style={{ color: "#a594fb" }}>Sin actividad aun</p>
          </div>
        )}
        {filtered.map((entry, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 flex flex-col gap-2.5 card-shadow"
            style={{ background: "var(--surface-1)", border: "1px solid #e8e0ff" }}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-xs mb-0.5" style={{ color: "#b0a0d8" }}>{entry.wallet}</p>
                <p className="font-semibold text-sm leading-tight" style={{ color: "#ffffff" }}>{entry.event}</p>
              </div>
              <span
                className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full"
                style={
                  entry.hangover
                    ? { background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626" }
                    : { background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)", color: "#16a34a" }
                }
              >
                {entry.hangover ? "Cruda" : "Survivor"}
              </span>
            </div>

            {/* Bottom row */}
            <div
              className="flex items-center justify-between gap-2 pt-2.5"
              style={{ borderTop: "1px solid #e8e0ff" }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tabular-nums" style={{ color: "#ffffff" }}>
                  {entry.amount.toFixed(3)} USDC
                </span>
                <span className="text-[10px]" style={{ color: "#836ef9" }}>{entry.timestamp}</span>
              </div>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline"
                style={{ color: "#836ef9" }}
              >
                <span className="font-mono truncate max-w-[70px]">{entry.txHash}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Monad footer */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: "#836ef9" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#836ef9" }} />
          Datos en vivo desde Monad Testnet
        </div>
      </div>
    </main>
  )
}
