import { createConfig, http } from "wagmi"
import { injected } from "wagmi/connectors"
import { monadTestnet } from "@/lib/monad-testnet"

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected()],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
})
