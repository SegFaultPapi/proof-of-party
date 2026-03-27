# MVP Scope: Proof of Party (PoP)

---

## Problema Core

Fiesteros Web3 no tienen una forma divertida y automatizada de convertir sus crudas en recompensas on-chain usando datos biometricos simples y pagos en stablecoins.

---

## Flujo MVP

1. Usuario hace check-in on-chain en el antro/evento escaneando un QR o NFC con su wallet Web3 (en Monad EVM-compatible).
2. Se registra en el contrato el evento de participacion (wallet, eventID, timestamp) y un deposito simbolico del pool de estabilidad (fondos del protocolo o faucet para demo).
3. Al dia siguiente, el usuario abre el frontend y sube o simula sus metricas basicas (pasos, horas de sueno, pulso promedio) desde un mock de Apple Health o Fitbit — formulario sencillo o JSON fake.
4. Un script/oraculo off-chain evalua las metricas con reglas simples (por ejemplo: pocas horas de sueno + baja actividad = "cruda confirmada") y llama al smart contract en Monad con el resultado.
5. El contrato distribuye automaticamente recompensas: un bono fitness si el usuario "sobrevivio bien", o una compensacion en stablecoins si se confirma la cruda.

---

## Features MVP

- **Frontend Web (Next.js / React):** flujo de check-in con conexion de wallet, seleccion de evento y firma de transaccion de asistencia en Monad.
- **Smart contract en Monad:** funciones `checkIn(eventId)` y `settleHangover(user, score)`, mapping de wallet a estado del partido, emision de recompensa en token ERC-20 de prueba.
- **Modulo de reporte de cruda:** formulario o upload de JSON con metricas simuladas; script off-chain calcula el score de cruda y llama al contrato.
- **Logica de payouts on-chain:** si no hay cruda, se registra un rendimiento simbolico; si hay cruda, se envia un monto fijo en stablecoin (mock o inspirado en el flujo de Etherfuse Stablebonds SDK).
- **Dashboard de demo:** lista de usuarios con check-in, estado de cruda (si/no), y link al explorador de Monad con las transacciones ejecutadas.

---

## NO va en MVP

- Integracion real con Apple HealthKit o Fitbit (requiere app nativa iOS/Android y permisos especificos; se reemplaza con mocks para el hackathon).
- Pools de yield complejos, bonding curves o integracion completa de Etherfuse en produccion.
- Matching social entre usuarios, ranking global de fiesteros, badges NFT o sistema de reputacion.
- Panel de analytics avanzado o machine learning para deteccion de cruda.
- Soporte multi-cadena, integracion movil nativa o UX de produccion.

---

## Criterio de Exito

El MVP funciona si: en el demo, al menos 70% de los usuarios que hacen check-in completan el flujo al dia siguiente (o simulado) y reciben automaticamente una transaccion on-chain de recompensa, demostrable en el explorador de Monad.

---

## Tests de Validacion

- Test de 30 segundos: puedes explicar el MVP en 30 segundos.
- Test de enfoque: tienes maximo 5 features criticas.
- Test de problema: resuelve UN problema especifico muy bien.

Si respondiste NO a alguno, refina el scope.

---

## Red Flags

- Tienes mas de 7 features "criticas".
- No puedes explicar el problema en una frase.
- Tu usuario objetivo es "cualquier persona que...".

---

## Ejemplo de Demo

**Ana** hace check-in en el evento "La Mona" con su wallet. Al dia siguiente, sus datos simulados muestran 4 horas de sueno y 110 BPM en reposo. El script off-chain califica "cruda confirmada" y llama a `settleHangover()`. El contrato le envia automaticamente 8 USDC (mock) a su wallet. La transaccion es visible en el explorador de Monad.

---

*Proof of Party — MVP Scope v1.0 — Hackathon Build*
