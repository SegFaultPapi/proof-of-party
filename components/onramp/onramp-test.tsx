"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useAccount, useChainId } from "wagmi"
import { ArrowLeft, Banknote, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { WalletButton } from "@/components/pop/wallet-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { monadTestnet } from "@/lib/monad-testnet"
import { runMvpMonadTestnetOnramp, type MvpMonadOnrampResult } from "@/lib/etherfuse-mvp-onramp"
import { getEnvMockBankAccountConfigError } from "@/lib/etherfuse-onramp-api"
import { formatShortAddress } from "@/lib/utils"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function OnrampTest() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { etherfuseCustomerId, wallet } = useApp()

  const [customerId, setCustomerId] = useState("")
  const [amountMxn, setAmountMxn] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MvpMonadOnrampResult | null>(null)

  useEffect(() => {
    const cfgErr = getEnvMockBankAccountConfigError()
    if (cfgErr) toast.error(cfgErr, { duration: 12_000 })
  }, [])

  useEffect(() => {
    if (etherfuseCustomerId) {
      setCustomerId(etherfuseCustomerId)
      return
    }
    try {
      const s = sessionStorage.getItem("pop_ef_customer_id")
      if (s) setCustomerId(s)
    } catch {
      /* ignore */
    }
  }, [etherfuseCustomerId])

  const onMonadTestnet = chainId === monadTestnet.id
  const hasCustomer = UUID_RE.test(customerId.trim())
  const parsedMxn = parseFloat(amountMxn.trim().replace(",", "."))
  const hasValidAmount = Number.isFinite(parsedMxn) && parsedMxn > 0
  const canRun = isConnected && onMonadTestnet && hasCustomer && !!address && hasValidAmount

  const runOnramp = async () => {
    if (!address) {
      toast.error("Conecta tu wallet")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const r = await runMvpMonadTestnetOnramp({
        walletAddress: address,
        customerId: customerId.trim(),
        sourceAmountMxn: amountMxn.trim(),
      })
      setResult(r)
      toast.success(
        `Onramp sandbox listo: ${r.targetSymbol} · orden ${r.orderId.slice(0, 8)}… · MXN ${r.sourceAmountMxn}`
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error en onramp")
    } finally {
      setLoading(false)
    }
  }

  const displayWallet = address ?? wallet ?? ""

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
        <Link href="/" className="flex items-center gap-1 text-sm font-semibold" style={{ color: "#6b56e8" }}>
          <ArrowLeft className="w-4 h-4" />
          App
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium hidden sm:inline" style={{ color: "#7c6bb5" }}>
            MVP · Monad Testnet
          </span>
          <WalletButton compact />
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-8 space-y-6">
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #836ef9, #6b56e8)" }}
          >
            <Banknote className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#1a0f3c" }}>
              Onramp MVP
            </h1>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "#4b3f72" }}>
              Un solo paso: MXN → crypto en{" "}
              <strong>Monad Testnet</strong> (Etherfuse sandbox). Misma secuencia que la documentación oficial: activos,{" "}
              <a
                href="https://docs.etherfuse.com/guides/testing-onramps#onramp-flow"
                className="underline"
                style={{ color: "#6b56e8" }}
                target="_blank"
                rel="noreferrer"
              >
                cotización, orden y simular SPEI
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
            Conecta tu wallet en <strong>Monad Testnet</strong> (chain {monadTestnet.id}).
          </div>
        )}

        {isConnected && !onMonadTestnet && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}
          >
            Cambia la red a <strong>Monad Testnet</strong> en tu wallet (chain id {monadTestnet.id}). Red actual:{" "}
            {chainId}.
          </div>
        )}

        {isConnected && onMonadTestnet && !hasCustomer && (
          <div
            className="rounded-xl px-4 py-3 text-sm space-y-2"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}
          >
            <p>
              No hay <code className="text-[10px] bg-white/80 px-1 rounded">customerId</code> de Etherfuse en esta
              sesión. En la app principal abre <strong>KYC Etherfuse</strong> y crea el cliente con tu wallet.
            </p>
            <Link
              href="/"
              className="inline-block text-sm font-semibold underline"
              style={{ color: "#2563eb" }}
            >
              Volver a la app → KYC
            </Link>
          </div>
        )}

        <section
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "linear-gradient(145deg, #f4f0ff 0%, #fff 55%)",
            border: "1px solid #c4b5fd",
            boxShadow: "0 4px 20px rgba(131, 110, 249, 0.12)",
          }}
        >
          <div className="space-y-1 text-xs" style={{ color: "#4b3f72" }}>
            <p>
              <span className="font-semibold" style={{ color: "#1a0f3c" }}>
                Wallet:
              </span>{" "}
              {displayWallet ? (
                <span className="font-mono">{formatShortAddress(displayWallet)}</span>
              ) : (
                "—"
              )}
            </p>
            <p>
              <span className="font-semibold" style={{ color: "#1a0f3c" }}>
                Customer (Etherfuse):
              </span>{" "}
              <span className="font-mono break-all">{hasCustomer ? customerId : "pendiente de KYC"}</span>
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mxn">Monto en MXN (obligatorio)</Label>
            <Input
              id="mxn"
              inputMode="decimal"
              placeholder="Ej. 500"
              value={amountMxn}
              onChange={e => setAmountMxn(e.target.value)}
              className="text-sm"
            />
            <p className="text-xs" style={{ color: "#7c6bb5" }}>
              Introduce el importe que quieres cotizar. Si Etherfuse rechaza por orden duplicada, el flujo suma +1 MXN
              automáticamente (hasta 4 intentos).
            </p>
          </div>

          <Button
            type="button"
            className="w-full h-14 text-base font-bold rounded-xl"
            style={{ background: "linear-gradient(135deg, #7c3aed, #5b21b6)", color: "#fff" }}
            disabled={!canRun || loading}
            onClick={() => void runOnramp()}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2 inline" />
                Ejecutando onramp sandbox…
              </>
            ) : (
              "Ejecutar onramp (sandbox)"
            )}
          </Button>
        </section>

        {result && (
          <section className="rounded-2xl p-4 space-y-3" style={{ background: "#ecfdf5", border: "1px solid #6ee7b7" }}>
            <p className="text-sm font-bold" style={{ color: "#065f46" }}>
              Resultado
            </p>
            <ul className="text-xs space-y-1" style={{ color: "#047857" }}>
              <li>
                Activo: <strong>{result.targetSymbol}</strong> ({result.targetAssetId.slice(0, 14)}…)
              </li>
              <li>
                Orden: <span className="font-mono">{result.orderId}</span>
              </li>
              <li>MXN usados en la cotización: {result.sourceAmountMxn}</li>
              <li>
                Estado API:{" "}
                <strong>{String((result.orderStatus as Record<string, unknown> | null)?.status ?? "—")}</strong>
              </li>
            </ul>
            {"statusPage" in (result.orderStatus as object) &&
            (result.orderStatus as { statusPage?: string }).statusPage ? (
              <a
                href={(result.orderStatus as { statusPage: string }).statusPage}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold underline block"
                style={{ color: "#059669" }}
              >
                Abrir status page (devnet Etherfuse)
              </a>
            ) : null}
          </section>
        )}

        <details className="rounded-2xl border border-[#e8e0ff] bg-white p-4 text-xs">
          <summary className="cursor-pointer font-semibold" style={{ color: "#1a0f3c" }}>
            Respuestas JSON (depuración)
          </summary>
          <pre
            className="mt-3 text-[10px] leading-relaxed overflow-x-auto p-3 rounded-xl max-h-64 overflow-y-auto"
            style={{ background: "#faf8ff", color: "#362465" }}
          >
            {result
              ? JSON.stringify(
                  { quote: result.quote, order: result.order, orderStatus: result.orderStatus },
                  null,
                  2
                )
              : "Ejecuta el onramp para ver quote, orden y estado."}
          </pre>
        </details>
      </main>
    </div>
  )
}
