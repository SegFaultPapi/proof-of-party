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
  /** Dirección EVM (0x…) sincronizada con wagmi en Monad Testnet */
  wallet: string | null
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
  /** Actualiza la dirección desde wagmi (o null al desconectar). */
  syncWalletFromChain: (address: string | null) => void
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

const STORAGE_EF_CUSTOMER = "pop_ef_customer_id"
const STORAGE_EF_WALLET = "pop_ef_wallet"
const LOCAL_EF_CUSTOMER = "pop_ef_customer_id"
const LOCAL_EF_WALLET = "pop_ef_wallet"

function readEtherfusePairFromBrowser(): { customerId: string; wallet: string } | null {
  try {
    let c = sessionStorage.getItem(STORAGE_EF_CUSTOMER)
    let w = sessionStorage.getItem(STORAGE_EF_WALLET)
    if (c && w) return { customerId: c, wallet: w }
    c = localStorage.getItem(LOCAL_EF_CUSTOMER)
    w = localStorage.getItem(LOCAL_EF_WALLET)
    if (c && w) return { customerId: c, wallet: w }
  } catch {
    /* ignore */
  }
  return null
}

function clearEtherfuseSessionStorage() {
  try {
    sessionStorage.removeItem(STORAGE_EF_CUSTOMER)
    sessionStorage.removeItem(STORAGE_EF_WALLET)
    localStorage.removeItem(LOCAL_EF_CUSTOMER)
    localStorage.removeItem(LOCAL_EF_WALLET)
  } catch {
    /* ignore */
  }
}

/** Persiste par wallet–customer para recuperar KYC tras cerrar pestaña o sesión. */
export function persistEtherfuseCustomerWallet(customerId: string, wallet: string) {
  try {
    sessionStorage.setItem(STORAGE_EF_CUSTOMER, customerId)
    sessionStorage.setItem(STORAGE_EF_WALLET, wallet)
    localStorage.setItem(LOCAL_EF_CUSTOMER, customerId)
    localStorage.setItem(LOCAL_EF_WALLET, wallet)
  } catch {
    /* ignore */
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    screen: "home",
    wallet: null,
    etherfuseCustomerId: null,
    kycStatus: null,
    checkIn: null,
    metrics: null,
    result: null,
    dashboard: MOCK_DASHBOARD,
    selectedEvent: null,
  })

  useEffect(() => {
    const pair = readEtherfusePairFromBrowser()
    if (pair) {
      setState(s => ({ ...s, etherfuseCustomerId: pair.customerId }))
    }
  }, [])

  const setScreen = useCallback((screen: Screen) => {
    setState(s => ({ ...s, screen }))
  }, [])

  const goTo = useCallback((screen: Screen) => {
    setState(s => ({ ...s, screen }))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const syncWalletFromChain = useCallback((address: string | null) => {
    setState(s => {
      if (address === null) {
        clearEtherfuseSessionStorage()
        return {
          ...s,
          wallet: null,
          etherfuseCustomerId: null,
          kycStatus: null,
        }
      }
      try {
        const pair = readEtherfusePairFromBrowser()
        if (pair && pair.wallet.toLowerCase() === address.toLowerCase()) {
          return { ...s, wallet: address, etherfuseCustomerId: pair.customerId }
        }
      } catch {
        /* ignore */
      }
      const prev = s.wallet?.toLowerCase() ?? null
      const next = address.toLowerCase()
      const sameAccount = prev !== null && prev === next
      const firstWalletAttach = prev === null
      const nextCustomerId =
        sameAccount || firstWalletAttach ? s.etherfuseCustomerId : null
      return {
        ...s,
        wallet: address,
        etherfuseCustomerId: nextCustomerId,
      }
    })
  }, [])

  const setEtherfuseCustomerId = useCallback((id: string | null) => {
    setState(s => ({ ...s, etherfuseCustomerId: id }))
  }, [])

  const setKycStatus = useCallback((kycStatus: EtherfuseKycStatus | null) => {
    setState(s => ({ ...s, kycStatus }))
  }, [])

  const disconnectWallet = useCallback(() => {
    clearEtherfuseSessionStorage()
    setState(s => ({
      ...s,
      wallet: null,
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
        syncWalletFromChain,
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
