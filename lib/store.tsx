"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { EtherfuseKycStatus } from "@/lib/etherfuse-client"

export type Screen =
  | "home"
  | "events"
  | "kyc"
  | "checkin-confirm"
  | "checkin-success"
  | "metrics"
  | "calculating"
  | "result"
  | "dashboard"

export interface Event {
  id: string
  name: string
  date: string
  venue: string
  status: "active" | "closed" | "checked"
}

export interface CheckIn {
  eventId: string
  eventName: string
  wallet: string
  txHash: string
  timestamp: string
}

export interface Metrics {
  sleep: number
  steps: number
  bpm: number
}

export type Verdict = "cruda" | "survivor"

export interface HangoverResult {
  score: number
  verdict: Verdict
  sleep: number
  steps: number
  bpm: number
  payout: number
  fee: number
  net: number
  txHash: string
}

export interface DashboardEntry {
  wallet: string
  event: string
  hangover: boolean
  amount: number
  txHash: string
  timestamp: string
}

interface AppState {
  screen: Screen
  wallet: string | null
  /** Dirección EVM completa (0x…) cuando hay wallet real; se muestra acortada en UI */
  walletIsDemo: boolean
  etherfuseCustomerId: string | null
  kycStatus: EtherfuseKycStatus | null
  checkIn: CheckIn | null
  metrics: Metrics | null
  result: HangoverResult | null
  dashboard: DashboardEntry[]
  selectedEvent: Event | null
}

interface AppContextType extends AppState {
  setScreen: (s: Screen) => void
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  setEtherfuseCustomerId: (id: string | null) => void
  setKycStatus: (s: EtherfuseKycStatus | null) => void
  selectEvent: (e: Event) => void
  confirmCheckIn: () => void
  submitMetrics: (m: Metrics) => void
  claimPayout: () => void
  goTo: (s: Screen) => void
}

const MOCK_EVENTS: Event[] = [
  { id: "1", name: "Monad Hackathon Night", date: "27 Mar 2026", venue: "La Mona CDMX", status: "active" },
  { id: "2", name: "DeFi Fiesta Bogota", date: "28 Mar 2026", venue: "Club Andrés", status: "active" },
  { id: "3", name: "NFT Club Monterrey", date: "20 Mar 2026", venue: "Arena Rey", status: "closed" },
]

const MOCK_DASHBOARD: DashboardEntry[] = [
  { wallet: "0xAna...4f2E", event: "Monad Hackathon Night", hangover: true, amount: 7.6, txHash: "0xabc...001", timestamp: "28 Mar 08:21" },
  { wallet: "0xCarlos...9b1A", event: "DeFi Fiesta Bogota", hangover: false, amount: 0.475, txHash: "0xabc...002", timestamp: "28 Mar 09:05" },
  { wallet: "0xLuis...3c8D", event: "Monad Hackathon Night", hangover: true, amount: 7.6, txHash: "0xabc...003", timestamp: "28 Mar 09:44" },
  { wallet: "0xSofia...7e2F", event: "NFT Club Monterrey", hangover: false, amount: 0.475, txHash: "0xabc...004", timestamp: "21 Mar 10:12" },
  { wallet: "0xMike...1a9B", event: "DeFi Fiesta Bogota", hangover: true, amount: 7.6, txHash: "0xabc...005", timestamp: "29 Mar 07:55" },
]

function calcHangoverScore(m: Metrics): { score: number; verdict: Verdict; payout: number; fee: number; net: number } {
  let score = 100
  if (m.sleep < 5) score -= 40
  else if (m.sleep < 7) score -= 20
  if (m.bpm > 100) score -= 25
  else if (m.bpm > 90) score -= 10
  if (m.steps < 2000) score -= 15
  const verdict: Verdict = score < 60 ? "cruda" : "survivor"
  const payout = verdict === "cruda" ? 8 : 0.5
  const fee = payout * 0.05
  const net = payout - fee
  return { score, verdict, payout, fee, net }
}

const AppContext = createContext<AppContextType | null>(null)

const DEMO_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" as const
const STORAGE_EF_CUSTOMER = "pop_ef_customer_id"
const STORAGE_EF_WALLET = "pop_ef_wallet"

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    screen: "home",
    wallet: null,
    walletIsDemo: false,
    etherfuseCustomerId: null,
    kycStatus: null,
    checkIn: null,
    metrics: null,
    result: null,
    dashboard: MOCK_DASHBOARD,
    selectedEvent: null,
  })

  useEffect(() => {
    try {
      const cid = sessionStorage.getItem(STORAGE_EF_CUSTOMER)
      const w = sessionStorage.getItem(STORAGE_EF_WALLET)
      if (cid && w) {
        setState(s => ({ ...s, etherfuseCustomerId: cid }))
      }
    } catch {
      /* ignore */
    }
  }, [])

  const setScreen = useCallback((screen: Screen) => {
    setState(s => ({ ...s, screen }))
  }, [])

  const goTo = useCallback((screen: Screen) => {
    setState(s => ({ ...s, screen }))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const connectWallet = useCallback(async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({ method: "eth_requestAccounts" })) as string[]
        const addr = accounts?.[0]
        if (addr && /^0x[a-fA-F0-9]{40}$/.test(addr)) {
          let restoredCustomer: string | null = null
          try {
            const sw = sessionStorage.getItem(STORAGE_EF_WALLET)
            const c = sessionStorage.getItem(STORAGE_EF_CUSTOMER)
            if (sw && c && sw.toLowerCase() === addr.toLowerCase()) restoredCustomer = c
          } catch {
            /* ignore */
          }
          setState(s => ({
            ...s,
            wallet: addr,
            walletIsDemo: false,
            etherfuseCustomerId: restoredCustomer ?? s.etherfuseCustomerId,
            screen: "events",
          }))
          return
        }
      } catch {
        /* usuario rechazó o error */
      }
    }
    setState(s => ({
      ...s,
      wallet: DEMO_WALLET,
      walletIsDemo: true,
      screen: "events",
    }))
  }, [])

  const setEtherfuseCustomerId = useCallback((id: string | null) => {
    setState(s => ({ ...s, etherfuseCustomerId: id }))
  }, [])

  const setKycStatus = useCallback((kycStatus: EtherfuseKycStatus | null) => {
    setState(s => ({ ...s, kycStatus }))
  }, [])

  const disconnectWallet = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_EF_CUSTOMER)
      sessionStorage.removeItem(STORAGE_EF_WALLET)
    } catch {
      /* ignore */
    }
    setState(s => ({
      ...s,
      wallet: null,
      walletIsDemo: false,
      etherfuseCustomerId: null,
      kycStatus: null,
      screen: "home",
      checkIn: null,
      metrics: null,
      result: null,
      selectedEvent: null,
    }))
  }, [])

  const selectEvent = useCallback((event: Event) => {
    setState(s => ({ ...s, selectedEvent: event, screen: "checkin-confirm" }))
  }, [])

  const confirmCheckIn = useCallback(() => {
    setState(s => {
      if (!s.selectedEvent || !s.wallet) return s
      const checkIn: CheckIn = {
        eventId: s.selectedEvent.id,
        eventName: s.selectedEvent.name,
        wallet: s.wallet,
        txHash: "0x7f3a2b...c9e1d4",
        timestamp: new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }),
      }
      const updatedEvents = MOCK_EVENTS.map(e =>
        e.id === s.selectedEvent!.id ? { ...e, status: "checked" as const } : e
      )
      return { ...s, checkIn, screen: "checkin-success" }
    })
  }, [])

  const submitMetrics = useCallback((metrics: Metrics) => {
    setState(s => ({ ...s, metrics, screen: "calculating" }))
    setTimeout(() => {
      const { score, verdict, payout, fee, net } = calcHangoverScore(metrics)
      const result: HangoverResult = {
        score,
        verdict,
        sleep: metrics.sleep,
        steps: metrics.steps,
        bpm: metrics.bpm,
        payout,
        fee,
        net,
        txHash: "",
      }
      setState(s => ({ ...s, result, screen: "result" }))
    }, 2500)
  }, [])

  const claimPayout = useCallback(() => {
    setState(s => {
      if (!s.result || !s.wallet || !s.checkIn) return s
      const txHash = "0x9c4e1a...f82b7d"
      const result = { ...s.result, txHash }
      const entry: DashboardEntry = {
        wallet: s.wallet,
        event: s.checkIn.eventName,
        hangover: result.verdict === "cruda",
        amount: result.net,
        txHash,
        timestamp: new Date().toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }),
      }
      return {
        ...s,
        result,
        dashboard: [entry, ...s.dashboard],
        screen: "dashboard",
      }
    })
  }, [])

  return (
    <AppContext.Provider
      value={{
        ...state,
        setScreen,
        connectWallet,
        disconnectWallet,
        setEtherfuseCustomerId,
        setKycStatus,
        selectEvent,
        confirmCheckIn,
        submitMetrics,
        claimPayout,
        goTo,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be inside AppProvider")
  return ctx
}

export { MOCK_EVENTS }
