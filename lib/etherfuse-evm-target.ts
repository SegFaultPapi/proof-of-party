/** Cotizaciones onramp EVM: Etherfuse espera solo la dirección 0x, no "SYMBOL:0x…" (UnsupportedBlockchain). */

const PREFIXED_EVM = /^[A-Za-z0-9_-]+:(0x[a-fA-F0-9]{40})$/i

const EVM_QUOTE_BLOCKCHAINS = new Set(["monad", "base", "polygon"])

export function normalizeEvmRampTargetAsset(identifier: string): string {
  const t = identifier.trim()
  const m = t.match(PREFIXED_EVM)
  if (m) return m[1]
  return t
}

export function shouldNormalizeQuoteTargetForBlockchain(blockchain: unknown): boolean {
  return typeof blockchain === "string" && EVM_QUOTE_BLOCKCHAINS.has(blockchain.toLowerCase())
}
