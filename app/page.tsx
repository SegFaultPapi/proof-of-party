"use client"

import { AppProvider, useApp } from "@/lib/store"
import { NavBar } from "@/components/pop/nav-bar"
import { ScreenHome } from "@/components/pop/screen-home"
import { ScreenEvents } from "@/components/pop/screen-events"
import { ScreenCheckInConfirm, ScreenCheckInSuccess } from "@/components/pop/screen-checkin"
import { ScreenMetrics, ScreenCalculating } from "@/components/pop/screen-metrics"
import { ScreenResult } from "@/components/pop/screen-result"
import { ScreenDashboard } from "@/components/pop/screen-dashboard"

function AppRouter() {
  const { screen } = useApp()

  const showNav = screen !== "home"

  return (
    <div className="min-h-screen" style={{ background: "#f8f5ff" }}>
      {showNav && <NavBar />}
      {screen === "home" && <ScreenHome />}
      {screen === "events" && <ScreenEvents />}
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
    <AppProvider>
      <AppRouter />
    </AppProvider>
  )
}
