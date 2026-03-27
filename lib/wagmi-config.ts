import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import { monadTestnet } from "@/lib/monad-testnet"

/** Una sola instancia de fábrica; `connect` debe usar el connector resuelto vía `useConfig()`. */
const injectedConnector = injected({ shimDisconnect: true })

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injectedConnector],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
})
