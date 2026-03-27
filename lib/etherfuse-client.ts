/** Cliente: llama a rutas Next `/api/etherfuse/*` (la clave Etherfuse solo vive en el servidor). */

export type EtherfuseKycStatus =
  | "not_started"
  | "proposed"
  | "approved"
  | "approved_chain_deploying"
  | "rejected"

export interface KycStatusResponse {
  customerId?: string
  walletPublicKey?: string
  status?: EtherfuseKycStatus
  currentRejectionReason?: string | null
  approvedAt?: string | null
}

export interface CreateOrgResult {
  organizationId: string
  displayName?: string
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function pickOrganizationId(data: Record<string, unknown>): string | undefined {
  const candidates: unknown[] = [
    data.organizationId,
    data.organization_id,
    data.id,
    data.customerId,
    data.customer_id,
    (data.organization as Record<string, unknown> | undefined)?.id,
    (data.organization as Record<string, unknown> | undefined)?.organizationId,
    (data.organization as Record<string, unknown> | undefined)?.organization_id,
    (data.data as Record<string, unknown> | undefined)?.organizationId,
    (data.data as Record<string, unknown> | undefined)?.organization_id,
    (data.data as Record<string, unknown> | undefined)?.id,
  ]
  for (const c of candidates) {
    if (typeof c === "string" && UUID_RE.test(c.trim())) return c.trim()
  }
  return undefined
}

export async function apiCreateOrganization(params: {
  publicKey: string
  customerId?: string
  displayName?: string
}): Promise<CreateOrgResult> {
  const res = await fetch("/api/etherfuse/organization", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: params.publicKey,
      id: params.customerId,
      displayName: params.displayName,
    }),
  })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  const requestedId =
    typeof params.customerId === "string" && UUID_RE.test(params.customerId.trim())
      ? params.customerId.trim()
      : undefined
  let orgId = pickOrganizationId(data)
  // Solo si Etherfuse no devolvió id en el cuerpo pero el POST fue OK con id explícito (misma petición).
  if (res.ok && !orgId && requestedId) {
    orgId = requestedId
  }

  if (res.ok && orgId) {
    return { organizationId: orgId, displayName: data.displayName as string | undefined }
  }

  if (res.ok && !orgId) {
    throw new Error(
      "Etherfuse respondió OK al crear organización pero sin organizationId reconocible. Revisa la pestaña Red la respuesta de POST /api/etherfuse/organization o actualiza la app."
    )
  }

  // Algunas respuestas de conflicto / duplicado siguen devolviendo el UUID de organización.
  if (!res.ok && orgId) {
    return { organizationId: orgId, displayName: data.displayName as string | undefined }
  }

  if (!res.ok && requestedId && res.status === 409) {
    return { organizationId: requestedId, displayName: data.displayName as string | undefined }
  }

  if (!res.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : typeof data.message === "string"
          ? data.message
          : res.statusText || "Error al crear organización"
    const hint = typeof data.hint === "string" ? data.hint : ""
    const details = typeof data.details === "string" ? data.details.trim().slice(0, 400) : ""
    const parts = [msg, details || undefined, hint || undefined].filter(Boolean)
    throw new Error(parts.join(" — "))
  }

  throw new Error("Respuesta inesperada al crear organización")
}

export async function apiSubmitKyc(params: {
  customerId: string
  pubkey: string
  identity: Record<string, unknown>
}): Promise<{ status?: string; message?: string }> {
  const res = await fetch("/api/etherfuse/kyc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: params.customerId,
      pubkey: params.pubkey,
      identity: params.identity,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : res.statusText || "Error al enviar KYC")
  }
  return data
}

export async function apiGetKycStatus(customerId: string, pubkey: string): Promise<KycStatusResponse> {
  const q = new URLSearchParams({ customerId, pubkey })
  const res = await fetch(`/api/etherfuse/kyc-status?${q.toString()}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : res.statusText || "Error al consultar KYC")
  }
  return data as KycStatusResponse
}
