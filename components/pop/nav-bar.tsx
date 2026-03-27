"use client"

import { Zap, Shield } from "lucide-react"
import { useAccount } from "wagmi"
import { useApp } from "@/lib/store"
import { WalletButton } from "./wallet-button"

export function NavBar() {
  const { isConnected } = useAccount()
  const { goTo } = useApp()

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(248, 245, 255, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(216, 204, 250, 0.8)",
        boxShadow: "0 2px 12px rgba(131, 110, 249, 0.07)",
      }}
    >
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => goTo("home")}
          className="flex items-center gap-2"
          aria-label="Ir a inicio"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #836ef9 0%, #6b56e8 100%)" }}
          >
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="font-bold text-sm tracking-tight" style={{ color: "#1a0f3c" }}>
            Proof<span style={{ color: "#836ef9" }}>of</span>Party
          </span>
        </button>
        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              type="button"
              onClick={() => goTo("kyc")}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors"
              style={{ background: "#ede9fe", color: "#5b4fc9" }}
              aria-label="KYC Etherfuse"
              title="KYC Etherfuse"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
          <WalletButton compact />
        </div>
      </div>
    </header>
  )
}
