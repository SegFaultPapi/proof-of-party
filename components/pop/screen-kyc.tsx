"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Shield, ChevronLeft, Loader2, RefreshCw, CheckCircle2, X, Copy } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import {
  apiCreateOrganization,
  apiGetKycStatus,
  apiSubmitKyc,
  type EtherfuseKycStatus,
} from "@/lib/etherfuse-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const STORAGE_CUSTOMER = "pop_ef_customer_id"
const STORAGE_WALLET = "pop_ef_wallet"

function statusLabel(s: EtherfuseKycStatus | undefined): string {
  switch (s) {
    case "approved":
      return "Aprobado"
    case "proposed":
      return "En revisión"
    case "rejected":
      return "Rechazado"
    case "approved_chain_deploying":
      return "Aprobado (despliegue en cadena)"
    case "not_started":
    default:
      return "Sin iniciar"
  }
}

export function ScreenKyc() {
  const { goTo, wallet, etherfuseCustomerId, setEtherfuseCustomerId, kycStatus, setKycStatus } = useApp()
  const [loadingOrg, setLoadingOrg] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollTick, setPollTick] = useState(0)
  /** Confirmaciones en pantalla tras acciones exitosas */
  const [showOrgSuccess, setShowOrgSuccess] = useState(false)
  const [showKycSentSuccess, setShowKycSentSuccess] = useState(false)

  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [occupation, setOccupation] = useState("")
  const [givenName, setGivenName] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [region, setRegion] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [country, setCountry] = useState("MX")
  const [curp, setCurp] = useState("")
  const [rfc, setRfc] = useState("")

  const refreshStatus = useCallback(async () => {
    if (!wallet || !etherfuseCustomerId) return
    try {
      const data = await apiGetKycStatus(etherfuseCustomerId, wallet)
      if (data.status) setKycStatus(data.status)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el estado KYC")
    }
  }, [wallet, etherfuseCustomerId, setKycStatus])

  useEffect(() => {
    try {
      const w = sessionStorage.getItem(STORAGE_WALLET)
      const c = sessionStorage.getItem(STORAGE_CUSTOMER)
      if (w && c && !etherfuseCustomerId) setEtherfuseCustomerId(c)
    } catch {
      /* ignore */
    }
  }, [etherfuseCustomerId, setEtherfuseCustomerId])

  useEffect(() => {
    if (wallet && etherfuseCustomerId) void refreshStatus()
  }, [wallet, etherfuseCustomerId, refreshStatus, pollTick])

  useEffect(() => {
    if (!wallet || !etherfuseCustomerId) return
    if (kycStatus === "proposed" || kycStatus === "approved_chain_deploying" || kycStatus === "not_started") {
      const t = window.setInterval(() => setPollTick(x => x + 1), 8000)
      return () => window.clearInterval(t)
    }
  }, [wallet, etherfuseCustomerId, kycStatus])

  const handleCreateOrg = async () => {
    if (!wallet?.startsWith("0x")) {
      setError("Conecta una wallet EVM (Monad) con dirección 0x completa.")
      return
    }
    setError(null)
    setLoadingOrg(true)
    try {
      const { organizationId } = await apiCreateOrganization({ publicKey: wallet })
      setEtherfuseCustomerId(organizationId)
      try {
        sessionStorage.setItem(STORAGE_CUSTOMER, organizationId)
        sessionStorage.setItem(STORAGE_WALLET, wallet)
      } catch {
        /* ignore */
      }
      await refreshStatus()
      setShowOrgSuccess(true)
      setShowKycSentSuccess(false)
      toast.success("Cliente creado en Etherfuse", {
        description: "Tu wallet quedó registrada en Monad. Completa el formulario KYC.",
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al registrar en Etherfuse")
    } finally {
      setLoadingOrg(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet?.startsWith("0x") || !etherfuseCustomerId) {
      setError("Primero crea el cliente Etherfuse con tu wallet.")
      return
    }
    setError(null)
    setLoadingSubmit(true)
    try {
      await apiSubmitKyc({
        customerId: etherfuseCustomerId,
        pubkey: wallet,
        identity: {
          id: wallet,
          email,
          phoneNumber,
          occupation,
          name: { givenName, familyName },
          dateOfBirth,
          address: {
            street,
            city,
            region,
            postalCode,
            country,
          },
          idNumbers: [
            { value: curp, type: "CURP" },
            { value: rfc, type: "RFC" },
          ],
        },
      })
      await refreshStatus()
      setShowKycSentSuccess(true)
      toast.success("KYC enviado a Etherfuse", {
        description: "Etherfuse revisará los datos. Puedes actualizar el estado arriba.",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar datos")
    } finally {
      setLoadingSubmit(false)
    }
  }

  const approved = kycStatus === "approved"

  return (
    <main className="min-h-screen pt-14 pb-10 px-4 max-w-md mx-auto">
      <button
        type="button"
        onClick={() => goTo("events")}
        className="flex items-center gap-1 text-sm font-medium mb-6"
        style={{ color: "#6b56e8" }}
      >
        <ChevronLeft className="w-4 h-4" />
        Eventos
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #836ef9, #6b56e8)" }}
        >
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1a0f3c" }}>
            KYC Etherfuse
          </h1>
          <p className="text-sm" style={{ color: "#7c6bb5" }}>
            Sandbox · red Monad (devnet)
          </p>
        </div>
      </div>

      <p className="text-sm mb-6 leading-relaxed" style={{ color: "#4b3f72" }}>
        Los datos se envían a la API de pruebas{" "}
        <code className="text-xs bg-violet-100/80 px-1 rounded">api.sand.etherfuse.com</code> con tu clave en el
        servidor. En sandbox puedes usar datos de prueba.
      </p>

      {etherfuseCustomerId && (
        <div
          className="rounded-xl p-3 mb-4 flex flex-col gap-2"
          style={{ background: "#f4f0ff", border: "1px solid #ddd6fe" }}
        >
          <p className="text-xs font-medium" style={{ color: "#5b4fc9" }}>
            Tu <strong>customerId</strong> (UUID) — se usa solo en onramp y APIs:
          </p>
          <div className="flex items-center gap-2">
            <code className="text-[11px] font-mono break-all flex-1" style={{ color: "#1a0f3c" }}>
              {etherfuseCustomerId}
            </code>
            <button
              type="button"
              className="shrink-0 p-2 rounded-lg transition-colors"
              style={{ background: "#ede9fe" }}
              aria-label="Copiar customerId"
              onClick={() => {
                void navigator.clipboard.writeText(etherfuseCustomerId)
                toast.success("customerId copiado")
              }}
            >
              <Copy className="w-4 h-4" style={{ color: "#5b4fc9" }} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-4"
          style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}
        >
          {error}
        </div>
      )}

      {showOrgSuccess && (
        <div
          className="rounded-2xl p-4 mb-4 relative"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.08), rgba(131,110,249,0.06))",
            border: "1px solid rgba(34,197,94,0.35)",
          }}
          role="status"
        >
          <button
            type="button"
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/50"
            aria-label="Cerrar"
            onClick={() => setShowOrgSuccess(false)}
          >
            <X className="w-4 h-4" style={{ color: "#166534" }} />
          </button>
          <div className="flex gap-3 pr-8">
            <CheckCircle2 className="w-8 h-8 shrink-0" style={{ color: "#16a34a" }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "#14532d" }}>
                Confirmación: cliente registrado
              </p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "#166534" }}>
                Etherfuse creó la organización y vinculó tu dirección en Monad. El siguiente paso es enviar el
                formulario de identidad.
              </p>
            </div>
          </div>
        </div>
      )}

      {showKycSentSuccess && !approved && (
        <div
          className="rounded-2xl p-4 mb-4 relative"
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
          }}
          role="status"
        >
          <button
            type="button"
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/60"
            aria-label="Cerrar"
            onClick={() => setShowKycSentSuccess(false)}
          >
            <X className="w-4 h-4" style={{ color: "#166534" }} />
          </button>
          <div className="flex gap-3 pr-8">
            <CheckCircle2 className="w-8 h-8 shrink-0" style={{ color: "#22c55e" }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "#14532d" }}>
                Confirmación: datos KYC recibidos
              </p>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: "#166534" }}>
                Tu información se envió correctamente a la sandbox de Etherfuse. El estado puede pasar a{" "}
                <strong>En revisión</strong> y luego a <strong>Aprobado</strong> (en sandbox a veces es
                automático tras acuerdos). Usa «Actualizar» para ver cambios.
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-3"
        style={{ background: "#fff", border: "1px solid #e8e0ff" }}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#7c6bb5" }}>
            Estado KYC
          </p>
          <p className="text-lg font-semibold" style={{ color: "#1a0f3c" }}>
            {statusLabel(kycStatus ?? undefined)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => void refreshStatus()}
          disabled={!etherfuseCustomerId || !wallet}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </Button>
      </div>

      {!etherfuseCustomerId && (
        <div className="mb-6">
          <p className="text-sm mb-3" style={{ color: "#4b3f72" }}>
            Crea la organización cliente en Etherfuse y registra tu wallet en <strong>Monad</strong>.
          </p>
          <Button
            type="button"
            className="w-full"
            style={{ background: "linear-gradient(135deg, #836ef9, #6b56e8)" }}
            onClick={() => void handleCreateOrg()}
            disabled={loadingOrg || !wallet}
          >
            {loadingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear cliente en Etherfuse"}
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={cn("space-y-4", approved && "opacity-60 pointer-events-none")}>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Teléfono (E.164)</Label>
          <Input
            id="phone"
            required
            placeholder="+521234567890"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="occupation">Ocupación</Label>
          <Input id="occupation" required value={occupation} onChange={e => setOccupation(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="given">Nombre</Label>
            <Input id="given" required value={givenName} onChange={e => setGivenName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="family">Apellido</Label>
            <Input id="family" required value={familyName} onChange={e => setFamilyName(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dob">Fecha de nacimiento</Label>
          <Input id="dob" type="date" required value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="street">Calle</Label>
          <Input id="street" required value={street} onChange={e => setStreet(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" required value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="region">Estado / región</Label>
            <Input id="region" required value={region} onChange={e => setRegion(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="cp">Código postal</Label>
            <Input id="cp" required value={postalCode} onChange={e => setPostalCode(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">País (ISO)</Label>
            <Input id="country" required maxLength={2} value={country} onChange={e => setCountry(e.target.value.toUpperCase())} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="curp">CURP</Label>
            <Input id="curp" required value={curp} onChange={e => setCurp(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rfc">RFC</Label>
            <Input id="rfc" required value={rfc} onChange={e => setRfc(e.target.value)} />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          style={{ background: "linear-gradient(135deg, #836ef9, #6b56e8)" }}
          disabled={loadingSubmit || !etherfuseCustomerId || approved}
        >
          {loadingSubmit ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar datos KYC"}
        </Button>
      </form>

      {approved && (
        <div
          className="mt-6 rounded-2xl p-5 text-center space-y-3"
          style={{
            background: "linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)",
            border: "1px solid #6ee7b7",
          }}
          role="status"
        >
          <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: "#059669" }} />
          <p className="font-bold text-base" style={{ color: "#065f46" }}>
            KYC aprobado
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "#047857" }}>
            Etherfuse marcó tu verificación como aprobada. Ya puedes usar onramps y el resto del flujo según tu
            cuenta bancaria en sandbox.
          </p>
          <Link
            href="/onramp"
            className="inline-flex items-center justify-center font-semibold rounded-xl px-5 py-3 text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #16a34a, #059669)" }}
          >
            Ir a probar onramp →
          </Link>
        </div>
      )}
    </main>
  )
}
