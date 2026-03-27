/** Cliente: onramp Etherfuse vía `/api/etherfuse/*` (sandbox). */

const BANK_CACHE_PREFIX = "pop_ef_bank_"

export function bankAccountCacheKey(customerId: string): string {
  return `${BANK_CACHE_PREFIX}${customerId}`
}

/** Extrae el primer id de cuenta en la respuesta paginada de Etherfuse. */
export function pickBankAccountIdFromResponse(data: unknown): string | undefined {
  const d = data as { items?: unknown[] }
  if (!Array.isArray(d.items)) return undefined
  for (const item of d.items) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>
      const id = o.id ?? o.bankAccountId
      if (typeof id === "string" && id.length >= 32) return id
    }
  }
  return undefined
}

export async function fetchCustomerBankAccounts(customerId: string): Promise<unknown> {
  const res = await fetch(`/api/etherfuse/customer/${customerId}/bank-accounts`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(typeof (data as { error?: string }).error === "string" ? (data as { error: string }).error : "Error al listar cuentas")
  }
  return data
}

/** Mock opcional (solo sandbox): NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID */
export function getMockBankAccountIdFromEnv(): string | undefined {
  if (typeof process === "undefined") return undefined
  const v = process.env.NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID?.trim()
  return v || undefined
}

export interface RampableAsset {
  symbol: string
  identifier: string
  name: string
  currency: string
  balance?: string | null
}

export async function fetchRampAssets(wallet: string): Promise<{ assets: RampableAsset[] }> {
  const q = new URLSearchParams({ blockchain: "monad", currency: "mxn", wallet })
  const res = await fetch(`/api/etherfuse/assets?${q}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Error al cargar activos")
  return data as { assets: RampableAsset[] }
}

export async function createQuote(body: Record<string, unknown>) {
  const res = await fetch("/api/etherfuse/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data))
  return data
}

export async function createOrder(body: Record<string, unknown>) {
  const res = await fetch("/api/etherfuse/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data))
  return data
}

export async function getOrder(orderId: string) {
  const res = await fetch(`/api/etherfuse/order/${orderId}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data))
  return data
}

export async function simulateFiatReceived(orderId: string) {
  const res = await fetch("/api/etherfuse/fiat-received", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : JSON.stringify(data))
  return data
}
