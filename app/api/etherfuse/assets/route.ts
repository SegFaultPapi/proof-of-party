import { NextResponse } from "next/server"
import { enrichMonadRampAssetsPayload } from "@/lib/etherfuse-monad-ramp-assets"
import { etherfuseFetch } from "@/lib/etherfuse-server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const blockchain = searchParams.get("blockchain") || "monad"
  const currency = searchParams.get("currency") || "mxn"
  const wallet = searchParams.get("wallet") || ""

  if (!wallet.startsWith("0x") || wallet.length < 42) {
    return NextResponse.json({ error: "wallet (dirección 0x) requerido" }, { status: 400 })
  }

  const q = new URLSearchParams({ blockchain, currency, wallet })
  const res = await etherfuseFetch(`/ramp/assets?${q.toString()}`, { method: "GET" })
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    return NextResponse.json(
      typeof data === "object" && data !== null ? data : { error: text || res.statusText },
      { status: res.status }
    )
  }
  data = await enrichMonadRampAssetsPayload(data, blockchain)
  return NextResponse.json(data)
}
