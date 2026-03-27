import { keccak256, stringToBytes } from "viem"

/**
 * UUID v5-like determinista por dirección EVM (Monad).
 * Misma wallet → mismo organizationId en sandbox, para reutilizar KYC/cliente aunque se borre sessionStorage.
 */
export function organizationIdFromEvmAddress(address: string): string {
  const a = address.trim().toLowerCase()
  if (!a.startsWith("0x") || a.length < 42) {
    throw new Error("Se requiere una dirección EVM 0x…")
  }
  const h = keccak256(stringToBytes(`proof-of-party:etherfuse:monad:org:${a}`))
  const raw = h.slice(2, 34)
  const p1 = raw.slice(0, 8)
  const p2 = raw.slice(8, 12)
  const third = (0x5000 | (parseInt(raw.slice(12, 16), 16) & 0x0fff)).toString(16).padStart(4, "0")
  const fourth = (0x8000 | (parseInt(raw.slice(16, 20), 16) & 0x3fff)).toString(16).padStart(4, "0")
  const p5 = raw.slice(20, 32)
  return `${p1}-${p2}-${third}-${fourth}-${p5}`.toLowerCase()
}
