"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { ArrowLeft, Banknote, Loader2, RefreshCw, FlaskConical } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { WalletButton } from "@/components/pop/wallet-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  fetchRampAssets,
  fetchCustomerBankAccounts,
  pickBankAccountIdFromResponse,
  bankAccountCacheKey,
  getMockBankAccountIdFromEnv,
  createQuote,
  createOrder,
  getOrder,
  simulateFiatReceived,
  type RampableAsset,
} from "@/lib/etherfuse-onramp-api"
import { cn } from "@/lib/utils"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function OnrampTest() {
  const { address, isConnected } = useAccount()
  const { etherfuseCustomerId } = useApp()

  const [customerId, setCustomerId] = useState("")
  const [bankAccountId, setBankAccountId] = useState("")
  const [loadingIds, setLoadingIds] = useState(false)
  const [idsNonce, setIdsNonce] = useState(0)
  const [sourceAmount, setSourceAmount] = useState("100")
  const [assets, setAssets] = useState<RampableAsset[]>([])
  const [targetId, setTargetId] = useState("")
  const [quoteJson, setQuoteJson] = useState<Record<string, unknown> | null>(null)
  const [orderJson, setOrderJson] = useState<Record<string, unknown> | null>(null)
  const [orderIdState, setOrderIdState] = useState<string | null>(null)
  const [orderStatus, setOrderStatus] = useState<Record<string, unknown> | null>(null)

  const [loadingAssets, setLoadingAssets] = useState(false)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [loadingOrder, setLoadingOrder] = useState(false)
  const [loadingSim, setLoadingSim] = useState(false)
  const [polling, setPolling] = useState(false)

  /** customerId: store KYC → sessionStorage → editable */
  useEffect(() => {
    setCustomerId(prev => {
      if (prev.trim()) return prev
      if (etherfuseCustomerId) return etherfuseCustomerId
      try {
        return sessionStorage.getItem("pop_ef_customer_id") || ""
      } catch {
        return ""
      }
    })
  }, [etherfuseCustomerId])

  /** bankAccountId: caché por cliente → GET /ramp/customer/{id}/bank-accounts (docs Etherfuse) → mock .env */
  useEffect(() => {
    const trimmed = customerId.trim()
    if (!trimmed) {
      setBankAccountId("")
      return
    }
    if (!UUID_RE.test(trimmed)) return

    let cancelled = false
    setLoadingIds(true)
    ;(async () => {
      try {
        const cacheKey = bankAccountCacheKey(trimmed)
        let bid: string | undefined
        try {
          const cached = sessionStorage.getItem(cacheKey)?.trim()
          if (cached) bid = cached
        } catch {
          /* ignore */
        }
        if (!bid) {
          const data = await fetchCustomerBankAccounts(trimmed)
          bid = pickBankAccountIdFromResponse(data)
          if (bid) {
            try {
              sessionStorage.setItem(cacheKey, bid)
            } catch {
              /* ignore */
            }
          }
        }
        if (cancelled) return
        if (bid) {
          setBankAccountId(bid)
          toast.success("bankAccountId cargado automáticamente")
        } else {
          const mock = getMockBankAccountIdFromEnv()
          if (mock) {
            setBankAccountId(mock)
            toast.message("Sin cuentas en API: usando NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID")
          } else {
            toast.message("No hay cuentas para este cliente. Registra CLABE en Etherfuse o define MOCK en .env")
          }
        }
      } catch (e) {
        if (cancelled) return
        const mock = getMockBankAccountIdFromEnv()
        if (mock) {
          setBankAccountId(mock)
          toast.message("Listado de cuentas falló; usando mock del .env")
        } else {
          toast.error(e instanceof Error ? e.message : "No se pudieron cargar las cuentas")
        }
      } finally {
        if (!cancelled) setLoadingIds(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [customerId, idsNonce])

  const reloadIds = () => {
    const trimmed = customerId.trim()
    if (trimmed && UUID_RE.test(trimmed)) {
      try {
        sessionStorage.removeItem(bankAccountCacheKey(trimmed))
      } catch {
        /* ignore */
      }
    }
    setIdsNonce(n => n + 1)
  }

  const loadAssets = useCallback(async () => {
    if (!address) {
      toast.error("Conecta tu wallet en Monad Testnet")
      return
    }
    setLoadingAssets(true)
    try {
      const { assets: list } = await fetchRampAssets(address)
      setAssets(list)
      if (list.length && !targetId) {
        setTargetId(list[0].identifier)
      }
      toast.success(`${list.length} activos disponibles`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setLoadingAssets(false)
    }
  }, [address, targetId])

  const handleQuote = async () => {
    if (!address || !customerId || !targetId) {
      toast.error("Completa customer ID, activo y conecta wallet")
      return
    }
    setLoadingQuote(true)
    setQuoteJson(null)
    try {
      const quoteId = crypto.randomUUID()
      const q = await createQuote({
        quoteId,
        customerId,
        blockchain: "monad",
        quoteAssets: {
          type: "onramp",
          sourceAsset: "MXN",
          targetAsset: targetId,
        },
        sourceAmount: sourceAmount.trim(),
      })
      setQuoteJson(q as Record<string, unknown>)
      toast.success("Cotización creada (válida ~2 min)")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en quote")
    } finally {
      setLoadingQuote(false)
    }
  }

  const handleOrder = async () => {
    const qid = quoteJson?.quoteId as string | undefined
    if (!qid || !bankAccountId || !address) {
      toast.error("Necesitas quote, bankAccountId y wallet")
      return
    }
    setLoadingOrder(true)
    setOrderJson(null)
    try {
      const orderId = crypto.randomUUID()
      const o = await createOrder({
        orderId,
        bankAccountId,
        quoteId: qid,
        publicKey: address,
      })
      setOrderJson(o as Record<string, unknown>)
      const onramp = (o as { onramp?: { orderId?: string } }).onramp
      const oid = onramp?.orderId || orderId
      setOrderIdState(oid)
      toast.success("Orden creada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en orden")
    } finally {
      setLoadingOrder(false)
    }
  }

  const refreshOrder = useCallback(async () => {
    if (!orderIdState) return
    try {
      const d = await getOrder(orderIdState)
      setOrderStatus(d as Record<string, unknown>)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    }
  }, [orderIdState])

  useEffect(() => {
    if (!orderIdState || !polling) return
    const t = window.setInterval(() => void refreshOrder(), 4000)
    return () => window.clearInterval(t)
  }, [orderIdState, polling, refreshOrder])

  const handleSimulateFiat = async () => {
    if (!orderIdState) {
      toast.error("No hay orderId")
      return
    }
    setLoadingSim(true)
    try {
      await simulateFiatReceived(orderIdState)
      toast.success("Fiat simulado (sandbox)")
      await refreshOrder()
      setPolling(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error")
    } finally {
      setLoadingSim(false)
    }
  }

  const onramp = orderJson?.onramp as
    | { depositClabe?: string; depositAmount?: number; orderId?: string }
    | undefined

  return (
    <div className="min-h-screen pb-12" style={{ background: "#f8f5ff" }}>
      <header
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between gap-3"
        style={{
          background: "rgba(248, 245, 255, 0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(216, 204, 250, 0.8)",
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-semibold"
          style={{ color: "#6b56e8" }}
        >
          <ArrowLeft className="w-4 h-4" />
          App
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium hidden sm:inline" style={{ color: "#7c6bb5" }}>
            Onramp test · Etherfuse sandbox
          </span>
          <WalletButton compact />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #836ef9, #6b56e8)" }}
          >
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1a0f3c" }}>
              Fondos al seguro (onramp)
            </h1>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "#4b3f72" }}>
              Prueba MXN → crypto en <strong>Monad</strong> vía Etherfuse. Requiere API sandbox, cliente
              onboarded, cuenta CLABE y KYC según{" "}
              <a
                href="https://docs.etherfuse.com/guides/testing-onramps"
                className="underline"
                style={{ color: "#6b56e8" }}
                target="_blank"
                rel="noreferrer"
              >
                Testing onramps
              </a>
              .
            </p>
          </div>
        </div>

        {!isConnected && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" }}
          >
            Conecta una wallet en <strong>Monad Testnet</strong> para cargar activos y crear la orden.
          </div>
        )}

        <section className="rounded-2xl p-4 space-y-4" style={{ background: "#fff", border: "1px solid #e8e0ff" }}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-sm font-bold" style={{ color: "#1a0f3c" }}>
              Identificadores
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1 shrink-0"
              disabled={loadingIds || !UUID_RE.test(customerId.trim())}
              onClick={() => reloadIds()}
            >
              {loadingIds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refrescar UUIDs
            </Button>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#7c6bb5" }}>
            El <strong>customerId</strong> se toma del KYC (sesión). El <strong>bankAccountId</strong> se obtiene de la API
            Etherfuse (<code className="text-[10px]">GET …/bank-accounts</code>) o del mock{" "}
            <code className="text-[10px]">NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID</code> si no hay cuentas.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="cust">customerId (org / hijo Etherfuse)</Label>
            <Input
              id="cust"
              placeholder="UUID — se rellena solo tras crear cliente en KYC"
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank" className="flex items-center gap-2">
              bankAccountId (CLABE registrada)
              {loadingIds && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#836ef9" }} />}
            </Label>
            <Input
              id="bank"
              placeholder="UUID — carga automática desde Etherfuse"
              value={bankAccountId}
              onChange={e => setBankAccountId(e.target.value)}
              className="font-mono text-xs"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amt">Monto fuente (MXN)</Label>
            <Input
              id="amt"
              type="text"
              inputMode="decimal"
              value={sourceAmount}
              onChange={e => setSourceAmount(e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-2xl p-4 space-y-3" style={{ background: "#fff", border: "1px solid #e8e0ff" }}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold" style={{ color: "#1a0f3c" }}>
              Activo destino (Monad)
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={loadingAssets || !address}
              onClick={() => void loadAssets()}
            >
              {loadingAssets ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Cargar activos
            </Button>
          </div>
          {assets.length > 0 ? (
            <select
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-sm",
                "border-[#e8e0ff] bg-white"
              )}
              style={{ color: "#1a0f3c" }}
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
            >
              {assets.map(a => (
                <option key={a.identifier} value={a.identifier}>
                  {a.symbol} — {a.name} ({a.identifier.slice(0, 18)}…)
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs" style={{ color: "#7c6bb5" }}>
              Pulsa «Cargar activos» con la wallet conectada (identificador 0x según docs EVM).
            </p>
          )}
          <Button
            type="button"
            className="w-full"
            style={{ background: "linear-gradient(135deg, #836ef9, #6b56e8)" }}
            disabled={loadingQuote}
            onClick={() => void handleQuote()}
          >
            {loadingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : "1. Crear cotización (quote)"}
          </Button>
          {quoteJson && (
            <pre
              className="text-[10px] leading-relaxed overflow-x-auto p-3 rounded-xl max-h-40 overflow-y-auto"
              style={{ background: "#f4f0ff", color: "#362465" }}
            >
              {JSON.stringify(quoteJson, null, 2)}
            </pre>
          )}
        </section>

        <section className="rounded-2xl p-4 space-y-3" style={{ background: "#fff", border: "1px solid #e8e0ff" }}>
          <h2 className="text-sm font-bold" style={{ color: "#1a0f3c" }}>
            Orden de onramp
          </h2>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={loadingOrder || !quoteJson}
            onClick={() => void handleOrder()}
          >
            {loadingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : "2. Crear orden"}
          </Button>
          {onramp && (
            <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
              <p style={{ color: "#065f46" }}>
                <strong>CLABE depósito (producción):</strong> {onramp.depositClabe ?? "—"}
              </p>
              <p style={{ color: "#065f46" }}>
                <strong>Monto MXN:</strong> {onramp.depositAmount ?? "—"}
              </p>
            </div>
          )}
          {orderJson && (
            <pre
              className="text-[10px] leading-relaxed overflow-x-auto p-3 rounded-xl max-h-48 overflow-y-auto"
              style={{ background: "#f4f0ff", color: "#362465" }}
            >
              {JSON.stringify(orderJson, null, 2)}
            </pre>
          )}
        </section>

        <section className="rounded-2xl p-4 space-y-3" style={{ background: "#fff", border: "1px solid #e8e0ff" }}>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4" style={{ color: "#7c3aed" }} />
            <h2 className="text-sm font-bold" style={{ color: "#1a0f3c" }}>
              Sandbox: simular SPEI
            </h2>
          </div>
          <p className="text-xs" style={{ color: "#7c6bb5" }}>
            Solo en <code className="text-[10px]">api.sand.etherfuse.com</code>. Simula que el usuario envió MXN a
            la CLABE.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!orderIdState || loadingSim}
              onClick={() => void handleSimulateFiat()}
            >
              {loadingSim ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "3. Simular fiat recibido"}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!orderIdState} onClick={() => void refreshOrder()}>
              Estado orden
            </Button>
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#4b3f72" }}>
              <input type="checkbox" checked={polling} onChange={e => setPolling(e.target.checked)} />
              Auto-refresco 4s
            </label>
          </div>
          {orderStatus && (
            <div className="space-y-2">
              <p className="text-sm font-semibold" style={{ color: "#1a0f3c" }}>
                status:{" "}
                <span style={{ color: "#836ef9" }}>{String(orderStatus.status ?? "—")}</span>
              </p>
              {"statusPage" in orderStatus && orderStatus.statusPage ? (
                <a
                  href={String(orderStatus.statusPage)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline break-all"
                  style={{ color: "#6b56e8" }}
                >
                  Abrir status page
                </a>
              ) : null}
              <pre
                className="text-[10px] leading-relaxed overflow-x-auto p-3 rounded-xl max-h-40 overflow-y-auto"
                style={{ background: "#faf8ff", color: "#362465" }}
              >
                {JSON.stringify(orderStatus, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
