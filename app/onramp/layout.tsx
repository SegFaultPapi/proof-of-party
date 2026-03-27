import type { ReactNode } from "react"
import { Web3Providers } from "@/components/providers/web3-providers"
import { AppProvider } from "@/lib/store"
import { WalletSync } from "@/components/wagmi/wallet-sync"

export default function OnrampLayout({ children }: { children: ReactNode }) {
  return (
    <Web3Providers>
      <AppProvider>
        <WalletSync />
        {children}
      </AppProvider>
    </Web3Providers>
  )
}
