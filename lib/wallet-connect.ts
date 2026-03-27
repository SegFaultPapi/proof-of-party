import type { Config, Connector } from "wagmi"

/** Connector EVM por defecto (primer entrada de `wagmi-config`). */
export function getDefaultEvmConnector(config: Config): Connector | undefined {
  return config.connectors[0]
}
