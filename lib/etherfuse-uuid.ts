/** UUID de entidades Etherfuse (órdenes, cuentas bancarias, etc.). No confundir con CLABE SPEI (18 dígitos). */

export const ETHERFUSE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const CLABE_RE = /^\d{18}$/

/** CLABE mexicana (18 dígitos). No es el UUID de cuenta que pide la API Etherfuse para órdenes. */
export function isMexicanClabe18(value: unknown): boolean {
  return typeof value === "string" && CLABE_RE.test(value.trim())
}

export function isEtherfuseUuid(value: unknown): value is string {
  return typeof value === "string" && ETHERFUSE_UUID_RE.test(value.trim())
}

/** Mensaje si el valor parece CLABE u otro formato inválido para campos UUID de la API. */
export function explainInvalidEtherfuseUuid(value: string): string {
  const t = value.trim()
  if (CLABE_RE.test(t)) {
    return "Eso es una CLABE (18 dígitos). No sirve como bankAccountId: necesitas el UUID de la cuenta en Etherfuse (GET …/bank-accounts). Si guardaste la CLABE por error, borra la caché del sitio para esta app o vuelve a registrar la cuenta sandbox."
  }
  if (t.length > 0 && t.length < 36) {
    return `Valor demasiado corto para UUID (${t.length} caracteres). Usa el UUID completo de la cuenta en Etherfuse.`
  }
  return "Debe ser un UUID válido (formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)."
}
