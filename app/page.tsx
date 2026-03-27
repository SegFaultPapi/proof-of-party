"use client"

import { AppProvider, useApp } from "@/lib/store"
import { Web3Providers } from "@/components/providers/web3-providers"
import { WalletSync } from "@/components/wagmi/wallet-sync"
import { NavBar } from "@/components/pop/nav-bar"
import { ScreenHome } from "@/components/pop/screen-home"
import { ScreenEvents } from "@/components/pop/screen-events"
import { ScreenCheckInConfirm, ScreenCheckInSuccess } from "@/components/pop/screen-checkin"
import { ScreenMetrics, ScreenCalculating } from "@/components/pop/screen-metrics"
import { ScreenResult } from "@/components/pop/screen-result"
import { ScreenDashboard } from "@/components/pop/screen-dashboard"
import { ScreenKyc } from "@/components/pop/screen-kyc"

function AppRouter() {
  const { screen } = useApp()

  const showNav = screen !== "home"

  return (
    <div className="min-h-screen" style={{ background: "#f8f5ff" }}>
      {showNav && <NavBar />}
      {screen === "home" && <ScreenHome />}
      {screen === "events" && <ScreenEvents />}
      {screen === "kyc" && <ScreenKyc />}
      {screen === "checkin-confirm" && <ScreenCheckInConfirm />}
      {screen === "checkin-success" && <ScreenCheckInSuccess />}
      {screen === "metrics" && <ScreenMetrics />}
      {screen === "calculating" && <ScreenCalculating />}
      {screen === "result" && <ScreenResult />}
      {screen === "dashboard" && <ScreenDashboard />}
    </div>
  )
}

export default function Home() {
  return (
    <Web3Providers>
      <AppProvider>
        <WalletSync />
        <AppRouter />
      </AppProvider>
    </Web3Providers>
  )
}
