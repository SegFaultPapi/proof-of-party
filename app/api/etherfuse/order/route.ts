import { NextResponse } from "next/server"
import { etherfuseFetch } from "@/lib/etherfuse-server"
import { explainInvalidEtherfuseUuid, isEtherfuseUuid } from "@/lib/etherfuse-uuid"

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>
    const bid = typeof b.bankAccountId === "string" ? b.bankAccountId.trim() : ""
    const qid = typeof b.quoteId === "string" ? b.quoteId.trim() : ""
    if (bid && !isEtherfuseUuid(bid)) {
      return NextResponse.json(
        { error: `bankAccountId: ${explainInvalidEtherfuseUuid(bid)}` },
        { status: 400 }
      )
    }
    if (qid && !isEtherfuseUuid(qid)) {
      return NextResponse.json(
        { error: "quoteId debe ser un UUID válido (vuelve a crear la cotización)." },
        { status: 400 }
      )
    }
  }

  const res = await etherfuseFetch("/ramp/order", {
    method: "POST",
    json: body,
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
