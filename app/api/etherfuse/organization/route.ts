import { NextResponse } from "next/server"
import { etherfuseFetch } from "@/lib/etherfuse-server"

export async function POST(req: Request) {
  let body: {
    id?: string
    displayName?: string
    publicKey?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const publicKey = typeof body.publicKey === "string" ? body.publicKey.trim() : ""
  if (!publicKey.startsWith("0x") || publicKey.length < 42) {
    return NextResponse.json(
      { error: "publicKey debe ser una dirección EVM (0x…) de Monad" },
      { status: 400 }
    )
  }

  const id =
    typeof body.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)
      ? body.id
      : crypto.randomUUID()

  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 200)
      : `Proof of Party — ${publicKey.slice(0, 8)}…`

  const res = await etherfuseFetch("/ramp/organization", {
    method: "POST",
    json: {
      id,
      displayName,
      wallets: [{ publicKey, blockchain: "monad" }],
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

  return NextResponse.json(data, { status: res.status === 201 ? 201 : 200 })
}
