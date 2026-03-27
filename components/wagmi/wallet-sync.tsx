"use client"

import { useEffect } from "react"
import { useAccount } from "wagmi"
import { useApp } from "@/lib/store"

/** Sincroniza la dirección de wagmi con el estado global de la app. */
export function WalletSync() {
  const { status, address } = useAccount()
  const { syncWalletFromChain } = useApp()

  useEffect(() => {
    if (status === "connected" && address) {
      syncWalletFromChain(address)
      return
    }
    if (status === "disconnected") {
      syncWalletFromChain(null)
    }
  }, [status, address, syncWalletFromChain])

  return null
}
