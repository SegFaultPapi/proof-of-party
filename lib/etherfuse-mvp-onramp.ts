/**
 * Onramp MVP — Monad Testnet + Etherfuse sandbox.
 * Flujo oficial: https://docs.etherfuse.com/guides/testing-onramps#onramp-flow
 * (activos → quote → orden → simulate fiat → estado)
 */

import {
  clearBankAccountIdCache,
  createOrder,
  createQuote,
  fetchRampAssets,
  getOrder,
  requireBankAccountUuid,
  resolveBankAccountId,
  simulateFiatReceived,
} from "@/lib/etherfuse-onramp-api"
import { isEtherfuseUuid, isMexicanClabe18 } from "@/lib/etherfuse-uuid"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const MVP_ONRAMP_DEFAULT_MXN = "100"

export interface MvpMonadOnrampResult {
  bankAccountId: string
  targetAssetId: string
  targetSymbol: string
  quoteId: string
  orderId: string
  sourceAmountMxn: string
  quote: Record<string, unknown>
  order: Record<string, unknown>
  orderStatus: unknown
}

function bumpMxnAmount(current: string): string {
  const n = parseFloat(String(current).replace(",", "."))
  if (Number.isFinite(n) && n > 0) return String(n + 1)
  return String(100 + Math.floor(Math.random() * 50))
}

/**
 * Ejecuta el onramp sandbox completo para la wallet y el customerId del usuario (MVP).
 * Reintenta con otro monto MXN si Etherfuse rechaza por orden duplicada (misma cuenta + importe).
 */
export async function runMvpMonadTestnetOnramp(args: {
  walletAddress: string
  customerId: string
  sourceAmountMxn: string
}): Promise<MvpMonadOnrampResult> {
  const cid = args.customerId.trim()
  if (!UUID_RE.test(cid)) {
    throw new Error("Necesitas un customerId UUID. Haz KYC en la app (Etherfuse) y vuelve aquí.")
  }

  const addr = args.walletAddress.trim()
  if (!addr.startsWith("0x") || addr.length < 42) {
    throw new Error("Conecta una wallet EVM en Monad Testnet.")
  }

  const rawMxn = args.sourceAmountMxn.trim()
  if (!rawMxn) {
    throw new Error("Indica cuántos MXN quieres usar en el onramp.")
  }
  const parsedMxn = parseFloat(rawMxn.replace(",", "."))
  if (!Number.isFinite(parsedMxn) || parsedMxn <= 0) {
    throw new Error("El monto debe ser un número mayor que cero.")
  }

  async function resolveBankField(): Promise<string> {
    const resolved = await resolveBankAccountId(cid)
    return resolved?.bankAccountId ?? ""
  }

  let bank = await resolveBankField()
  let bankAccountId: string
  try {
    bankAccountId = requireBankAccountUuid(bank)
  } catch (e) {
    const looksLikeClabe = isMexicanClabe18(bank) || /^\d{18}$/.test(bank.trim())
    if (looksLikeClabe) {
      clearBankAccountIdCache(cid)
      bank = await resolveBankField()
      bankAccountId = requireBankAccountUuid(bank)
    } else {
      throw e
    }
  }

  const { assets } = await fetchRampAssets(addr)
  if (!assets.length) {
    throw new Error(
      "No hay activos ramp en Monad para tu wallet. Revisa ETHERFUSE_CETES_MONAD_CONTRACT o el sandbox Etherfuse (GET /ramp/assets)."
    )
  }

  const first = assets[0]
  const targetAssetId = first.identifier
  const targetSymbol = first.symbol

  let sourceAmount = String(parsedMxn)
  let lastErr: Error = new Error("Onramp no disponible")

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const quoteId = crypto.randomUUID()
      const q = await createQuote({
        quoteId,
        customerId: cid,
        blockchain: "monad",
        quoteAssets: {
          type: "onramp",
          sourceAsset: "MXN",
          targetAsset: targetAssetId,
        },
        sourceAmount,
      })
      const qRec = q as Record<string, unknown>
      const apiQ = typeof qRec.quoteId === "string" ? qRec.quoteId.trim() : ""
      const effectiveQuoteId = isEtherfuseUuid(apiQ) ? apiQ : quoteId

      const orderUuid = crypto.randomUUID()
      const o = await createOrder({
        orderId: orderUuid,
        bankAccountId,
        quoteId: effectiveQuoteId,
        publicKey: addr,
      })
      const oRec = o as Record<string, unknown>
      const onr = oRec.onramp as { orderId?: string } | undefined
      const orderId = onr?.orderId ?? orderUuid

      await simulateFiatReceived(orderId)
      const orderStatus = await getOrder(orderId)

      return {
        bankAccountId,
        targetAssetId,
        targetSymbol,
        quoteId: effectiveQuoteId,
        orderId,
        sourceAmountMxn: sourceAmount,
        quote: qRec,
        order: oRec,
        orderStatus,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      lastErr = e instanceof Error ? e : new Error(msg)
      if (/duplicate|same amount|open order|rejected/i.test(msg) && attempt < 3) {
        sourceAmount = bumpMxnAmount(sourceAmount)
        continue
      }
      throw lastErr
    }
  }

  throw lastErr
}
