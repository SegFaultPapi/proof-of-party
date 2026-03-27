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
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : res.statusText || "Error al crear organización")
  }
  const orgId = data.organizationId as string | undefined
  if (!orgId) throw new Error("Respuesta sin organizationId")
  return { organizationId: orgId, displayName: data.displayName }
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
