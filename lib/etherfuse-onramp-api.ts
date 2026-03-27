/** Cliente: onramp Etherfuse vía `/api/etherfuse/*` (sandbox). */

import { normalizeEvmRampTargetAsset } from "@/lib/etherfuse-evm-target"
import { explainInvalidEtherfuseUuid, isEtherfuseUuid, isMexicanClabe18 } from "@/lib/etherfuse-uuid"

const BANK_CACHE_PREFIX = "pop_ef_bank_"

/** Etherfuse GET/POST …/customer/{id}/… devuelve 404 si ese UUID no es un cliente ramp en sandbox. */
export const ETHERFUSE_CUSTOMER_NOT_FOUND_MESSAGE =
  "Etherfuse no reconoce este customerId (404). Debe ser el mismo organizationId que devuelve «Crear cliente Etherfuse» en KYC (no un UUID inventado ni uno de otra API key). Vuelve a KYC, crea el cliente otra vez y guarda el UUID mostrado; si sigue fallando, borra datos del sitio para localhost (Application → Storage) y repite."

/** Una vez por customerId y carga de página: evita spamear POST de registro si falla. */
const sandboxBankRegisterAttempted = new Set<string>()

export function resetSandboxBankRegisterAttempt(customerId: string) {
  sandboxBankRegisterAttempted.delete(customerId.trim())
}

function formatEtherfuseClientError(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>
    const msg =
      typeof o.message === "string"
        ? o.message
        : typeof o.error === "string"
          ? o.error
          : ""
    const code = typeof o.code === "string" ? o.code : ""
    if (code && msg) return `${code}: ${msg}`
    if (msg) return msg
    if (code) return code
  }
  try {
    return JSON.stringify(data)
  } catch {
    return fallback
  }
}

export function bankAccountCacheKey(customerId: string): string {
  return `${BANK_CACHE_PREFIX}${customerId}`
}

/** UUID de entidad cuenta; ignora CLABE aunque venga en campos mal nombrados. */
function coerceBankEntityUuid(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const t = value.trim()
  if (isMexicanClabe18(t)) return undefined
  return isEtherfuseUuid(t) ? t : undefined
}

export function clearBankAccountIdCache(customerId: string) {
  const cid = customerId.trim()
  if (!cid) return
  try {
    sessionStorage.removeItem(bankAccountCacheKey(cid))
  } catch {
    /* ignore */
  }
  resetSandboxBankRegisterAttempt(cid)
}

function pickFromItems(items: unknown): string | undefined {
  if (!Array.isArray(items)) return undefined
  for (const item of items) {
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>
      const nested = o.bankAccount
      const nestedId =
        nested && typeof nested === "object" && "id" in nested ? (nested as { id: unknown }).id : undefined
      const accountNested = o.account
      const accountId =
        accountNested && typeof accountNested === "object" && "id" in accountNested
          ? (accountNested as { id: unknown }).id
          : undefined
      for (const cand of [o.id, accountId, nestedId, o.bankAccountUuid, o.cryptoBankAccountId]) {
        const u = coerceBankEntityUuid(cand)
        if (u) return u
      }
      const baid = coerceBankEntityUuid(o.bankAccountId)
      if (baid) return baid
    }
  }
  return undefined
}

/** Extrae el primer id de cuenta en la respuesta de Etherfuse (varias formas posibles). */
export function pickBankAccountIdFromResponse(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined
  const d = data as Record<string, unknown>
  const ba = d.bankAccount
  if (ba && typeof ba === "object") {
    const bid = coerceBankEntityUuid((ba as Record<string, unknown>).id)
    if (bid) return bid
  }
  const acc = d.account
  if (acc && typeof acc === "object") {
    const aid = coerceBankEntityUuid((acc as Record<string, unknown>).id)
    if (aid) return aid
  }
  const direct =
    coerceBankEntityUuid(d.id) ?? coerceBankEntityUuid(d.bankAccountId) ?? coerceBankEntityUuid(d.bankAccountUuid)
  if (direct) return direct
  const nested = pickFromItems(d.items) ?? pickFromItems(d.bankAccounts) ?? pickFromItems(d.data) ?? pickFromItems(d.results)
  if (nested) return nested
  if (Array.isArray(data)) return pickFromItems(data)
  return undefined
}

/**
 * GET cuentas. Devuelve null si la API falla sin 404 (red, 403, etc.).
 * 404 → el cliente no existe en Etherfuse para esta API key; lanza con mensaje accionable.
 */
export async function tryFetchCustomerBankAccounts(customerId: string): Promise<unknown | null> {
  const res = await fetch(`/api/etherfuse/customer/${customerId}/bank-accounts`)
  const data = await res.json().catch(() => ({}))
  if (res.status === 404) {
    throw new Error(ETHERFUSE_CUSTOMER_NOT_FOUND_MESSAGE)
  }
  if (!res.ok) return null
  return data
}

/** @deprecated Usa tryFetchCustomerBankAccounts o resolveBankAccountId. */
export async function fetchCustomerBankAccounts(customerId: string): Promise<unknown> {
  const data = await tryFetchCustomerBankAccounts(customerId)
  if (data === null) {
    throw new Error("Error al listar cuentas")
  }
  return data
}

/**
 * Caché → API (silenciosa) → NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID.
 */
export async function resolveBankAccountId(
  customerId: string
): Promise<{ bankAccountId: string; source: "cache" | "api" | "mock" } | undefined> {
  const cacheKey = bankAccountCacheKey(customerId)
  try {
    const cached = sessionStorage.getItem(cacheKey)?.trim()
    if (cached) {
      if (isMexicanClabe18(cached) || !isEtherfuseUuid(cached)) {
        sessionStorage.removeItem(cacheKey)
      } else {
        return { bankAccountId: cached, source: "cache" }
      }
    }
  } catch {
    /* ignore */
  }

  const data = await tryFetchCustomerBankAccounts(customerId)
  if (data !== null) {
    const bid = pickBankAccountIdFromResponse(data)
    if (bid) {
      try {
        sessionStorage.setItem(cacheKey, bid)
      } catch {
        /* ignore */
      }
      return { bankAccountId: bid, source: "api" }
    }
  }

  const mock = getMockBankAccountIdFromEnv()
  if (mock) return { bankAccountId: mock, source: "mock" }

  const cid = customerId.trim()
  if (cid && !sandboxBankRegisterAttempted.has(cid)) {
    sandboxBankRegisterAttempted.add(cid)
    try {
      const created = await registerSandboxBankAccount(cid)
      if (created) {
        try {
          sessionStorage.setItem(cacheKey, created)
        } catch {
          /* ignore */
        }
        return { bankAccountId: created, source: "api" }
      }
    } catch (e) {
      if (e instanceof Error && e.message === ETHERFUSE_CUSTOMER_NOT_FOUND_MESSAGE) {
        throw e
      }
      /* CLABE duplicada, 400 de validación, etc. */
    }
  }

  return undefined
}

/**
 * Registra una cuenta personal de ejemplo en sandbox (docs Etherfuse).
 * Devuelve el UUID de la cuenta (bankAccountId), no la CLABE.
 */
export async function registerSandboxBankAccount(customerId: string): Promise<string | undefined> {
  const cid = customerId.trim()
  const res = await fetch(`/api/etherfuse/customer/${cid}/bank-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account: {
        transactionId: crypto.randomUUID(),
        firstName: "Sandbox",
        paternalLastName: "ProofOfParty",
        maternalLastName: "Test",
        birthDate: "19900101",
        birthCountryIsoCode: "MX",
        curp: "GALJ900101HDFRRN09",
        rfc: "GALJ9001016V3",
        clabe: "012345678901234567",
      },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(ETHERFUSE_CUSTOMER_NOT_FOUND_MESSAGE)
    }
    throw new Error(formatEtherfuseClientError(data, "No se pudo registrar la cuenta bancaria en sandbox"))
  }
  const fromPost = pickBankAccountIdFromResponse(data)
  if (fromPost) return fromPost
  const list = await tryFetchCustomerBankAccounts(cid)
  if (list) return pickBankAccountIdFromResponse(list)
  return undefined
}

/** Mock opcional (solo sandbox): UUID de cuenta en Etherfuse, no CLABE de 18 dígitos. */
export function getMockBankAccountIdFromEnv(): string | undefined {
  if (typeof process === "undefined") return undefined
  const v = process.env.NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID?.trim()
  if (!v) return undefined
  if (isEtherfuseUuid(v)) return v
  return undefined
}

/** Si .env tiene valor no-UUID (p. ej. CLABE), aviso corto para toast (evita el párrafo largo de CLABE en cada carga). */
export function getEnvMockBankAccountConfigError(): string | undefined {
  if (typeof process === "undefined") return undefined
  const v = process.env.NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID?.trim()
  if (!v) return undefined
  if (isEtherfuseUuid(v)) return undefined
  return "NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID debe ser un UUID de cuenta Etherfuse (GET …/bank-accounts o panel), no una CLABE de 18 dígitos. Quítalo o corrígelo en .env.local."
}

/** Valida bankAccountId antes de crear orden; evita el error Rust «expected length 32… found 18». */
export function requireBankAccountUuid(bankAccountId: string): string {
  const t = bankAccountId.trim()
  if (isMexicanClabe18(t) || (t.length > 0 && !isEtherfuseUuid(t))) {
    throw new Error(explainInvalidEtherfuseUuid(t))
  }
  if (isEtherfuseUuid(t)) return t
  throw new Error(
    "Falta el UUID de cuenta bancaria (bankAccountId). Completa el registro sandbox en la app o define NEXT_PUBLIC_ETHERFUSE_MOCK_BANK_ACCOUNT_ID con un UUID válido."
  )
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
  if (!res.ok) {
    throw new Error(formatEtherfuseClientError(data, "Error al cargar activos"))
  }
  const out = data as { assets: RampableAsset[] }
  if (Array.isArray(out.assets)) {
    out.assets = out.assets.map(a => ({
      ...a,
      identifier: normalizeEvmRampTargetAsset(a.identifier),
    }))
  }
  return out
}

export async function createQuote(body: Record<string, unknown>) {
  const res = await fetch("/api/etherfuse/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(formatEtherfuseClientError(data, "Error en quote"))
  return data
}

export async function createOrder(body: Record<string, unknown>) {
  const res = await fetch("/api/etherfuse/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(formatEtherfuseClientError(data, "Error en orden"))
  return data
}

export async function getOrder(orderId: string) {
  const res = await fetch(`/api/etherfuse/order/${orderId}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(formatEtherfuseClientError(data, "Error al leer orden"))
  return data
}

export async function simulateFiatReceived(orderId: string) {
  const res = await fetch("/api/etherfuse/fiat-received", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(formatEtherfuseClientError(data, "Error al simular fiat"))
  return data
}
