import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Acorta dirección EVM para UI (0x + 4 últimos). */
export function formatShortAddress(address: string, head = 6, tail = 4): string {
  if (!address.startsWith("0x") || address.length < 12) return address
  return `${address.slice(0, head)}…${address.slice(-tail)}`
}
