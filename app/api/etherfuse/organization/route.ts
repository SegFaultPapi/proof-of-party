import { NextResponse } from "next/server"
import { etherfuseFetch, getEtherfuseBaseUrl } from "@/lib/etherfuse-server"
import { normalizeMonadWalletPublicKey } from "@/lib/etherfuse-evm-address"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function pickOrgIdFromPayload(d: Record<string, unknown>): string | undefined {
  for (const k of ["organizationId", "organization_id", "id", "customerId", "customer_id"] as const) {
    const v = d[k]
    if (typeof v === "string" && UUID_RE.test(v.trim())) return v.trim()
  }
  return undefined
}

const SANDBOX_HINT =
  "Comprueba ETHERFUSE_API_KEY (sandbox, sin Bearer), ETHERFUSE_API_BASE_URL=https://api.sand.etherfuse.com y que la key sea la del panel sandbox. Si sigue fallando, contacta a Etherfuse con el cuerpo de error (details)."

export async function POST(req: Request) {
  try {
    let body: {
      id?: string
      displayName?: string
      publicKey?: string
    }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    const rawPk = typeof body.publicKey === "string" ? body.publicKey.trim() : ""
    if (!rawPk.startsWith("0x") || rawPk.length < 42) {
      return NextResponse.json(
        { error: "publicKey debe ser una dirección EVM (0x…) de Monad Testnet" },
        { status: 400 }
      )
    }

    let publicKey: string
    try {
      publicKey = normalizeMonadWalletPublicKey(rawPk)
    } catch {
      return NextResponse.json(
        { error: "publicKey no es una dirección EVM válida (checksum / longitud)." },
        { status: 400 }
      )
    }

    const id =
      typeof body.id === "string" && UUID_RE.test(body.id)
        ? body.id
        : crypto.randomUUID()

    const displayName =
      typeof body.displayName === "string" && body.displayName.trim()
        ? body.displayName.trim().slice(0, 200)
        : `Proof of Party - ${publicKey.slice(0, 8)}...`

    const fullPayload = {
      id,
      displayName,
      wallets: [{ publicKey, blockchain: "monad" as const }],
    }

    async function postOrganization(json: Record<string, unknown>) {
      return etherfuseFetch("/ramp/organization", { method: "POST", json })
    }

    let res: Response
    try {
      res = await postOrganization(fullPayload)
    } catch (err) {
      console.error("[api/etherfuse/organization] fetch error", getEtherfuseBaseUrl(), err)
      return NextResponse.json(
        {
          error: "No se pudo conectar con Etherfuse. Revisa red, firewall y ETHERFUSE_API_BASE_URL.",
          hint: SANDBOX_HINT,
        },
        { status: 502 }
      )
    }

    let text = await res.text()
    let data: unknown
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { raw: text }
    }

    // Algunos entornos Etherfuse fallan con 500 si se envía un id de organización explícito; reintentar sin id.
    const hadCustomId = typeof body.id === "string" && body.id.length > 0
    if (!res.ok && res.status >= 500 && hadCustomId) {
      console.warn("[api/etherfuse/organization] upstream 500 with custom id, retrying without id")
      try {
        const retryRes = await postOrganization({
          displayName,
          wallets: fullPayload.wallets,
        })
        const retryText = await retryRes.text()
        if (retryRes.ok) {
          res = retryRes
          text = retryText
          try {
            data = retryText ? JSON.parse(retryText) : {}
          } catch {
            data = { raw: retryText }
          }
        } else {
          try {
            data = retryText ? JSON.parse(retryText) : { error: retryText }
          } catch {
            data = { error: retryText || retryRes.statusText, firstAttemptBody: text.slice(0, 500) }
          }
          res = retryRes
          text = retryText
        }
      } catch (e) {
        console.error("[api/etherfuse/organization] retry failed", e)
      }
    }

    if (!res.ok) {
      const base: Record<string, unknown> =
        typeof data === "object" && data !== null && !Array.isArray(data)
          ? { ...(data as Record<string, unknown>) }
          : { error: text || res.statusText }
      if (typeof text === "string" && text.length > 0) {
        base.details = text.length > 2000 ? `${text.slice(0, 2000)}...` : text
      }
      if (res.status >= 500) {
        base.hint = SANDBOX_HINT
        console.error("[api/etherfuse/organization] upstream", res.status, getEtherfuseBaseUrl(), text.slice(0, 800))
      }
      return NextResponse.json(base, { status: res.status })
    }

    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      const d = data as Record<string, unknown>
      const canonical = pickOrgIdFromPayload(d)
      if (canonical && typeof d.organizationId !== "string") {
        return NextResponse.json({ ...d, organizationId: canonical }, { status: res.status === 201 ? 201 : 200 })
      }
    }

    return NextResponse.json(data, { status: res.status === 201 ? 201 : 200 })
  } catch (e) {
    console.error("[api/etherfuse/organization] unhandled", e)
    return NextResponse.json(
      { error: "Error interno al crear organización", hint: SANDBOX_HINT },
      { status: 500 }
    )
  }
}
