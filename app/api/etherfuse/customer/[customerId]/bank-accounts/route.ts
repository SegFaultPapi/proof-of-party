import { NextResponse } from "next/server"
import { etherfuseFetch } from "@/lib/etherfuse-server"

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(_req: Request, ctx: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await ctx.params
  if (!uuidRe.test(customerId)) {
    return NextResponse.json({ error: "customerId UUID inválido" }, { status: 400 })
  }

  const res = await etherfuseFetch(`/ramp/customer/${customerId}/bank-accounts`, { method: "GET" })
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
