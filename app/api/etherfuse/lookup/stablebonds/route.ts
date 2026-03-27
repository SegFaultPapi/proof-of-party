import { NextResponse } from "next/server"
import { getEtherfuseBaseUrl } from "@/lib/etherfuse-server"

/** Proxy al lookup público (sin API key). Útil para depurar CETES multi-chain. */
export async function GET() {
  const res = await fetch(`${getEtherfuseBaseUrl()}/lookup/stablebonds`, {
    next: { revalidate: 300 },
  })
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
  return NextResponse.json(data)
}
