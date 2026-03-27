"use client"

import Link from "next/link"
import { Zap, Shield, Banknote } from "lucide-react"
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
        background: "rgba(10, 5, 20, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(131, 110, 249, 0.2)",
        boxShadow: "0 2px 12px rgba(131, 110, 249, 0.07)",
      }}
    >
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => goTo("home")}
          className="flex items-center gap-2"
          aria-label="Ir a inicio"
        >
          <img 
            src="/LogoPOP.png" 
            alt="Logo POP" 
            className="h-8 w-auto object-contain" 
          />
          <span className="font-bold text-sm tracking-tight" style={{ color: "#ffffff" }}>
            Proof<span style={{ color: "#836ef9" }}>of</span>Party
          </span>
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {isConnected && (
            <>
              <Link
                href="/onramp"
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-colors hover:opacity-90"
                style={{ background: "#dcfce7", color: "#15803d" }}
                aria-label="Onramp Etherfuse"
                title="Onramp (fondos al seguro)"
              >
                <Banknote className="w-4 h-4" />
              </Link>
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
            </>
          )}
          <WalletButton compact />
        </div>
      </div>
    </header>
  )
}
