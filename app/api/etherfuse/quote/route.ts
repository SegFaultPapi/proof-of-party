import { NextResponse } from "next/server"
import {
  normalizeEvmRampTargetAsset,
  shouldNormalizeQuoteTargetForBlockchain,
} from "@/lib/etherfuse-evm-target"
import { etherfuseFetch } from "@/lib/etherfuse-server"

function normalizeQuoteBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body
  const b = body as Record<string, unknown>
  if (!shouldNormalizeQuoteTargetForBlockchain(b.blockchain)) return body
  const qa = b.quoteAssets
  if (!qa || typeof qa !== "object") return body
  const q = qa as Record<string, unknown>
  if (typeof q.targetAsset !== "string") return body
  q.targetAsset = normalizeEvmRampTargetAsset(q.targetAsset)
  return body
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  body = normalizeQuoteBody(body)

  const res = await etherfuseFetch("/ramp/quote", {
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
