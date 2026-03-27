"use client"

import { Wallet, ChevronDown, LogOut, Copy, Loader2 } from "lucide-react"
import { useState } from "react"
import { useConnect, useDisconnect, useAccount, useChainId, useSwitchChain } from "wagmi"
import { injected } from "wagmi/connectors"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { cn, formatShortAddress } from "@/lib/utils"
import { monadTestnet } from "@/lib/monad-testnet"

interface WalletButtonProps {
  compact?: boolean
  className?: string
}

export function WalletButton({ compact, className }: WalletButtonProps) {
  const { goTo, disconnectWallet } = useApp()
  const [open, setOpen] = useState(false)

  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { connectAsync, isPending: isConnecting } = useConnect()
  const { disconnectAsync, isPending: isDisconnecting } = useDisconnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()

  const wallet = address ?? null
  const busy = isConnecting || isSwitching || isDisconnecting

  async function handleConnect() {
    try {
      await connectAsync({
        connector: injected(),
        chainId: monadTestnet.id,
      })
      try {
        await switchChainAsync({ chainId: monadTestnet.id })
      } catch {
        /* ya en Monad Testnet o wallet rechazó un segundo prompt */
      }
      goTo("events")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo conectar"
      toast.error(msg)
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectAsync()
    } finally {
      disconnectWallet()
      setOpen(false)
    }
  }

  if (!isConnected || !wallet) {
    return (
      <button
        type="button"
        onClick={() => void handleConnect()}
        disabled={busy}
        className={cn(
          "flex items-center gap-2 font-semibold rounded-xl px-4 py-2 text-sm transition-all active:scale-95 text-white bg-gradient-purple glow-purple-sm hover:opacity-90 disabled:opacity-60",
          compact && "px-3 py-1.5 text-xs",
          className
        )}
      >
        {busy ? <Loader2 className={cn("w-4 h-4 animate-spin", compact && "w-3.5 h-3.5")} /> : <Wallet className={cn("w-4 h-4", compact && "w-3.5 h-3.5")} />}
        {compact ? "Conectar" : "Conectar Wallet"}
      </button>
    )
  }

  const wrongChain = chainId !== monadTestnet.id

  return (
    <div className="relative flex items-center gap-2">
      {wrongChain && (
        <button
          type="button"
          onClick={() =>
            void switchChainAsync({ chainId: monadTestnet.id }).catch(e =>
              toast.error(e instanceof Error ? e.message : "Cambia a Monad Testnet en tu wallet")
            )
          }
          disabled={isSwitching}
          className="text-xs font-semibold px-2 py-1 rounded-lg"
          style={{ background: "#fef3c7", color: "#b45309", border: "1px solid #fcd34d" }}
        >
          {isSwitching ? "…" : "Monad Testnet"}
        </button>
      )}
      <div className="relative">
        <button
          type="button"
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
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(wallet)
                  setOpen(false)
                  toast.success("Dirección copiada")
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors"
                style={{ color: "#4b3f72" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f0ebff")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <Copy className="w-4 h-4" />
                Copiar address
              </button>
              <button
                type="button"
                onClick={() => void handleDisconnect()}
                disabled={busy}
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
    </div>
  )
}
