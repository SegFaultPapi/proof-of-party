import { normalizeEvmRampTargetAsset } from "@/lib/etherfuse-evm-target"
import { getEtherfuseBaseUrl } from "@/lib/etherfuse-server"

export type RampAssetRow = {
  symbol: string
  identifier: string
  name: string
  currency: string
  balance?: string | null
}

function hasCetesSymbol(assets: RampAssetRow[]): boolean {
  return assets.some(a => String(a.symbol).toUpperCase() === "CETES")
}

function hasIdentifier(assets: RampAssetRow[], addr: string): boolean {
  const n = addr.toLowerCase()
  return assets.some(a => normalizeEvmRampTargetAsset(a.identifier).toLowerCase() === n)
}

function pushCetes(assets: RampAssetRow[], contract: string) {
  const id = normalizeEvmRampTargetAsset(contract)
  if (!/^0x[a-fA-F0-9]{40}$/i.test(id) || hasIdentifier(assets, id)) return
  assets.push({
    symbol: "CETES",
    identifier: id,
    name: "CETES (Monad)",
    currency: "MXN",
  })
}

async function fetchCetesContractFromStablebonds(): Promise<string | undefined> {
  const url = `${getEtherfuseBaseUrl()}/lookup/stablebonds`
  const res = await fetch(url)
  if (!res.ok) return undefined
  const data = (await res.json()) as {
    stablebonds?: Array<{
      symbol?: string
      blockchains?: Array<{ blockchain?: string; tokenIdentifier?: string }>
    }>
  }
  const bonds = data.stablebonds
  if (!Array.isArray(bonds)) return undefined
  const cetes = bonds.find(b => String(b.symbol).toUpperCase() === "CETES")
  const chains = cetes?.blockchains
  if (!Array.isArray(chains)) return undefined
  const monad = chains.find(c => String(c.blockchain).toLowerCase() === "monad")
  const tid = monad?.tokenIdentifier
  if (typeof tid !== "string" || !tid.trim()) return undefined
  const norm = normalizeEvmRampTargetAsset(tid.trim())
  if (!/^0x[a-fA-F0-9]{40}$/i.test(norm)) return undefined
  return norm
}

/** Normaliza identificadores EVM y, si falta CETES en Monad, intenta lookup público o env. */
export async function enrichMonadRampAssetsPayload(
  data: unknown,
  blockchain: string
): Promise<unknown> {
  if (blockchain.toLowerCase() !== "monad" || !data || typeof data !== "object") return data
  const o = data as { assets?: unknown }
  if (!Array.isArray(o.assets)) return data

  const assets = o.assets as RampAssetRow[]
  for (const a of assets) {
    if (a && typeof a.identifier === "string") {
      a.identifier = normalizeEvmRampTargetAsset(a.identifier)
    }
  }

  const env = process.env.ETHERFUSE_CETES_MONAD_CONTRACT?.trim()
  if (env) pushCetes(assets, env)

  if (!hasCetesSymbol(assets)) {
    const fromLookup = await fetchCetesContractFromStablebonds()
    if (fromLookup) pushCetes(assets, fromLookup)
  }

  return data
}
