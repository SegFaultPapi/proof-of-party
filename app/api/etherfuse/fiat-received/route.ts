import { NextResponse } from "next/server"
import { etherfuseFetch } from "@/lib/etherfuse-server"

export async function POST(req: Request) {
  let body: { orderId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : ""
  if (!orderId) {
    return NextResponse.json({ error: "orderId requerido" }, { status: 400 })
  }

  const res = await etherfuseFetch("/ramp/order/fiat_received", {
    method: "POST",
    json: { orderId },
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
