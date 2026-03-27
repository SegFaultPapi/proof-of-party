import { getAddress, isAddress } from "viem"

/** Dirección EIP-55 para payloads Etherfuse en cadena Monad (EVM). */
export function normalizeMonadWalletPublicKey(address: string): string {
  const t = address.trim()
  if (!isAddress(t)) {
    throw new Error("Dirección EVM inválida")
  }
  return getAddress(t)
}
