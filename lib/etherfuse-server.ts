/**
 * Servidor: llamadas a Etherfuse FX API (sandbox = devnet de pruebas).
 * Docs: https://docs.etherfuse.com — autenticación: header Authorization sin prefijo Bearer.
 */

export const ETHERFUSE_SANDBOX_URL = "https://api.sand.etherfuse.com"

export function getEtherfuseBaseUrl(): string {
  const raw = process.env.ETHERFUSE_API_BASE_URL?.trim() || ETHERFUSE_SANDBOX_URL
  return raw.replace(/\/+$/, "")
}

/** Clave tal como la espera Etherfuse: sin «Bearer », sin comillas ni saltos de línea. */
export function getEtherfuseApiKey(): string | undefined {
  let k = process.env.ETHERFUSE_API_KEY?.trim()
  if (!k) return undefined
  k = k.replace(/^Bearer\s+/i, "").trim()
  if ((k.startsWith('"') && k.endsWith('"')) || (k.startsWith("'") && k.endsWith("'"))) {
    k = k.slice(1, -1).trim()
  }
  k = k.replace(/\r?\n/g, "").trim()
  return k || undefined
}

export async function etherfuseFetch(
  path: string,
  init: RequestInit & { json?: unknown } = {}
): Promise<Response> {
  const key = getEtherfuseApiKey()
  if (!key) {
    return new Response(JSON.stringify({ error: "ETHERFUSE_API_KEY no está configurada" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { json, headers: h, ...rest } = init
  const headers = new Headers(h)
  headers.set("Authorization", key)
  if (json !== undefined) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(`${getEtherfuseBaseUrl()}${path}`, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
}
