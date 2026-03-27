import { NextResponse } from "next/server"
import { etherfuseFetch } from "@/lib/etherfuse-server"

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(req: Request) {
  let body: {
    customerId?: string
    pubkey?: string
    identity?: Record<string, unknown>
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const customerId = typeof body.customerId === "string" ? body.customerId.trim() : ""
  if (!uuidRe.test(customerId)) {
    return NextResponse.json({ error: "customerId debe ser un UUID válido" }, { status: 400 })
  }

  const pubkey = typeof body.pubkey === "string" ? body.pubkey.trim() : ""
  if (!pubkey.startsWith("0x")) {
    return NextResponse.json({ error: "pubkey debe ser la dirección 0x de la wallet en Monad" }, { status: 400 })
  }

  if (!body.identity || typeof body.identity !== "object") {
    return NextResponse.json({ error: "identity es requerido" }, { status: 400 })
  }

  const res = await etherfuseFetch(`/ramp/customer/${customerId}/kyc`, {
    method: "POST",
    json: {
      pubkey,
      identity: body.identity,
    },
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
