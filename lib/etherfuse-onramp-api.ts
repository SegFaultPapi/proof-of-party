/** Cliente: onramp Etherfuse vía `/api/etherfuse/*` (sandbox). */

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
