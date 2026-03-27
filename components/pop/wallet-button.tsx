"use client"

import { Wallet, ChevronDown, LogOut, Copy } from "lucide-react"
import { useState } from "react"
import { useApp } from "@/lib/store"
import { cn, formatShortAddress } from "@/lib/utils"

interface WalletButtonProps {
  compact?: boolean
  className?: string
}

export function WalletButton({ compact, className }: WalletButtonProps) {
  const { wallet, walletIsDemo, connectWallet, disconnectWallet } = useApp()
  const [open, setOpen] = useState(false)

  if (!wallet) {
    return (
      <button
        onClick={() => void connectWallet()}
        className={cn(
          "flex items-center gap-2 font-semibold rounded-xl px-4 py-2 text-sm transition-all active:scale-95 text-white bg-gradient-purple glow-purple-sm hover:opacity-90",
          compact && "px-3 py-1.5 text-xs",
          className
        )}
      >
        <Wallet className={cn("w-4 h-4", compact && "w-3.5 h-3.5")} />
        {compact ? "Conectar" : "Conectar Wallet"}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex items-center gap-2 font-medium rounded-xl px-3 py-1.5 text-sm transition-all",
          className
        )}
        style={{
          background: "#ffffff",
          border: "1px solid #d8ccfa",
          color: "#1a0f3c",
          boxShadow: "0 1px 4px rgba(131,110,249,0.1)",
        }}
      >
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #836ef9, #6b56e8)" }}
        >
          <div className="w-2 h-2 rounded-full bg-white" />
        </div>
        <span className="font-mono text-xs" style={{ color: "#1a0f3c" }}>
          {formatShortAddress(wallet)}
          {walletIsDemo && (
            <span className="ml-1 text-[10px] font-sans font-normal" style={{ color: "#a78bfa" }}>
              (demo)
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
          style={{ color: "#7c6bb5" }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl z-20 p-1"
            style={{ background: "#ffffff", border: "1px solid #d8ccfa" }}
          >
            <button
              onClick={() => { navigator.clipboard.writeText(wallet); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors"
              style={{ color: "#4b3f72" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f0ebff")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Copy className="w-4 h-4" />
              Copiar address
            </button>
            <button
              onClick={() => { disconnectWallet(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors text-red-500"
              onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <LogOut className="w-4 h-4" />
              Desconectar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
