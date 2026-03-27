import { defineChain } from "viem"

/**
 * Monad Testnet — documentación oficial:
 * https://docs.monad.xyz/developer-essentials/testnets
 * Chain ID 10143 · RPC público (QuickNode) — mismo host que usa el MCP de Monad para balances.
 */
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Vision", url: "https://testnet.monadvision.com" },
  },
})
