"use client"

import { useEffect } from "react"
import { useAccount } from "wagmi"
import { getAddress, isAddress } from "viem"
import { useApp } from "@/lib/store"

/** Sincroniza la dirección de wagmi con el estado global de la app. */
export function WalletSync() {
  const { status, address, isConnected } = useAccount()
  const { syncWalletFromChain } = useApp()

  useEffect(() => {
    if (isConnected && address && isAddress(address)) {
      try {
        syncWalletFromChain(getAddress(address))
      } catch {
        syncWalletFromChain(address)
      }
      return
    }
    // No limpiar en `connecting` / `reconnecting` para evitar parpadeos al hidratar o reconectar.
    if (status === "disconnected") {
      syncWalletFromChain(null)
      return
    }
    if (status === "connected" && !address) {
      syncWalletFromChain(null)
    }
  }, [status, address, isConnected, syncWalletFromChain])

  return null
}
