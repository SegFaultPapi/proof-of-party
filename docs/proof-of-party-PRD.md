# PRD: Proof of Party (PoP) — MVP

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Estado:** Development-Ready  
**Contexto:** Hackathon Build — Monad + Etherfuse

---

## 1. Project Overview

### Problema

Los fiesteros del ecosistema Web3 no tienen una forma divertida y automatizada de convertir sus noches de fiesta en valor económico on-chain. No existe un mecanismo que vincule datos biométricos básicos post-evento con recompensas automáticas en stablecoins. La experiencia post-fiesta es ignorada por el ecosistema DeFi.

### Objetivos del MVP

| Objetivo | Métrica de éxito |
|----------|-----------------|
| Demostrar el flujo end-to-end en Monad | ≥70% de usuarios con check-in completan el ciclo de pago |
| Validar el concepto de "seguro de cruda" gamificado | Transacciones demostrables en el explorador de Monad |
| Probar integración off-chain oracle → smart contract | Latencia < 5 seg entre score y payout on-chain |
| Generar modelo de fees sobre payouts | Fee del 5-10% sobre cada payout liquidado |

### Usuario Target

**Primario — El Fiestero Web3 ("Crypto Clubber")**
- Edad: 22–32 años
- Tiene wallet Web3 (MetaMask, Rabby, wallet mobile)
- Asiste a eventos crypto/tech/NFT con frecuencia
- Motivado por rewards, gamificación y memes
- No es nativo DeFi avanzado, prefiere UX simple

**Secundario — El Organizador de Eventos Web3**
- Genera el QR/NFC del evento
- Quiere engagement on-chain de sus asistentes
- Futuro: podría pagar fees por el servicio de check-in

**Stakeholder — Etherfuse / Protocolo**
- Fuente de rendimiento sobre el pool de estabilidad
- Los fondos no utilizados (usuarios sin cruda) generan yield via Stablebonds
- Captura fees sobre liquidaciones

---

## 2. User Stories & Acceptance Criteria

### Epic 1: Check-In On-Chain

---

**US-01 — Conectar Wallet**

> *Como fiestero Web3, quiero conectar mi wallet al frontend de PoP para poder participar en el evento.*

**Acceptance Criteria:**
- [ ] El botón "Conectar Wallet" soporta MetaMask y WalletConnect
- [ ] Se muestra la dirección truncada (0x...1234) al conectarse
- [ ] Se solicita cambio de red si el usuario no está en Monad Testnet
- [ ] Si el usuario rechaza la conexión, se muestra un mensaje de error claro
- [ ] La sesión persiste mientras no se desconecte manualmente

---

**US-02 — Seleccionar Evento y Hacer Check-In**

> *Como fiestero Web3, quiero seleccionar el evento al que voy a asistir y hacer check-in on-chain para registrar mi participación.*

**Acceptance Criteria:**
- [ ] La pantalla muestra lista de eventos activos con nombre, fecha y venue
- [ ] El usuario puede escanear un QR o seleccionar manualmente el evento
- [ ] Al confirmar, se invoca `checkIn(eventId)` en el smart contract
- [ ] Se muestra loading spinner durante la transacción (optimistic UI)
- [ ] Tras confirmación on-chain, se muestra: hash de tx + link al explorador de Monad
- [ ] Si el check-in ya fue realizado para ese evento, se muestra mensaje "Ya estás registrado"
- [ ] El depósito simbólico del pool se registra al momento del check-in

---

**US-03 — Ver Estado de Check-In**

> *Como fiestero Web3, quiero ver si mi check-in fue exitoso para saber que estoy participando en el pool.*

**Acceptance Criteria:**
- [ ] Al reconectar wallet post-evento, se muestra badge "Check-in confirmado"
- [ ] Se muestra el nombre del evento, timestamp del check-in y el tx hash
- [ ] El estado se consulta directamente del smart contract (no solo frontend state)

---

### Epic 2: Reporte de Cruda

---

**US-04 — Ingresar Métricas Post-Fiesta**

> *Como fiestero Web3, quiero ingresar mis métricas de salud del día siguiente para que el sistema determine si tuve cruda.*

**Acceptance Criteria:**
- [ ] El formulario solicita exactamente 3 campos: **Horas de sueño** (slider 0-12h), **Pasos caminados** (input numérico), **Pulso en reposo** (input numérico en BPM)
- [ ] Alternativa: botón "Subir JSON" acepta un archivo mock con los mismos campos
- [ ] Validación frontend: horas de sueño entre 0-12, pasos entre 0-30000, BPM entre 40-200
- [ ] El usuario puede ver un preview de sus métricas antes de enviar
- [ ] El formulario solo está disponible si existe un check-in activo para el usuario
- [ ] Se bloquea el envío de métricas más de 36h después del check-in

---

**US-05 — Recibir Resultado del Score**

> *Como fiestero Web3, quiero saber si mi score resultó en "cruda confirmada" o "superviviente" para entender cuál recompensa voy a recibir.*

**Acceptance Criteria:**
- [ ] Tras enviar métricas, se muestra pantalla de loading "Calculando tu cruda..."
- [ ] El resultado se muestra como uno de dos estados: 🤕 **Cruda Confirmada** o 💪 **Superviviente**
- [ ] Se explica brevemente el score: "Dormiste 4h, 110 BPM → cruda confirmada"
- [ ] El score se calcula off-chain antes de llamar al contrato
- [ ] El resultado es visible antes de que el payout se confirme on-chain

---

### Epic 3: Payout On-Chain

---

**US-06 — Recibir Recompensa Automática**

> *Como fiestero Web3, quiero recibir automáticamente mi recompensa en stablecoin a mi wallet una vez confirmada mi cruda.*

**Acceptance Criteria:**
- [ ] Si hay cruda: el script off-chain llama a `settleHangover(user, score)` y el contrato envía **8 USDC (mock)** al wallet del usuario
- [ ] Si no hay cruda: se registra rendimiento simbólico (0.5 USDC mock de "bonus fitness") y se emite evento on-chain
- [ ] El usuario ve el tx hash del payout + link al explorador de Monad
- [ ] El monto exacto enviado es visible en la UI antes del claim
- [ ] La liquidación solo puede ejecutarse una vez por wallet por evento
- [ ] El fee del protocolo (5%) se descuenta antes del envío al usuario

---

**US-07 — Ver Dashboard de Actividad**

> *Como organizador o demo viewer, quiero ver una lista de usuarios con check-in y sus estados para demostrar el funcionamiento del protocolo.*

**Acceptance Criteria:**
- [ ] Dashboard muestra tabla con: wallet (truncada), evento, estado cruda (sí/no), monto pagado, tx hash
- [ ] La tabla se actualiza en tiempo real o con botón "Refresh"
- [ ] Cada fila tiene link directo al explorador de Monad
- [ ] El dashboard es público (no requiere conectar wallet para verlo)
- [ ] Muestra contador: total check-ins, total pagos liquidados, total USDC distribuido

---

## 3. UI/UX Requirements

### Principios de Diseño

- **Mobile-first:** La mayoría de usuarios usarán el móvil en el evento
- **Mínima fricción:** Máximo 3 pasos para completar el check-in
- **Feedback inmediato:** Cada acción muestra estado (pending/confirmed/error)
- **Meme-first tone:** Copy divertido, no corporativo. Ej: "🤕 Tu cruda ya vale algo"

---

### Pantallas Requeridas

#### Pantalla 1: Landing / Home
- Hero con nombre "Proof of Party" y tagline: *"Tu cruda, tu recompensa."*
- CTA primario: **"Conectar Wallet"**
- Sección secundaria: cómo funciona (3 pasos: Check-in → Reporta → Cobra)
- Sin auth tradicional, solo wallet connect

#### Pantalla 2: Selección de Evento
- Lista de eventos activos (card con nombre, fecha, venue, imagen placeholder)
- Campo de búsqueda o scan QR (botón que abre cámara del dispositivo)
- CTA: **"Check-In en este Evento"** por cada card
- Estado del evento: Activo / Cerrado / Ya checkeado

#### Pantalla 3: Confirmación de Check-In
- Resumen: nombre del evento, wallet del usuario, monto del depósito simbólico
- CTA: **"Firmar Check-In"** (abre MetaMask/WalletConnect)
- Post-confirmación: animación de confetti + tx hash + link explorador
- Botón: **"Volver mañana para reportar tu cruda"**

#### Pantalla 4: Reporte de Métricas (Day-After Flow)
- Header: "¿Cómo amaneciste?" con fecha del evento
- Form con 3 inputs:
  - 🛌 Horas de sueño (slider visual 0-12)
  - 👟 Pasos caminados (input + ícono)
  - 💓 Pulso en reposo (input + ícono)
- Botón alternativo: "Subir JSON de wearable"
- CTA: **"Calcular mi Cruda"**

#### Pantalla 5: Resultado y Payout
- Estado grande: 🤕 Cruda Confirmada / 💪 Superviviente
- Explicación del score: métricas ingresadas + umbral superado
- Monto a recibir (destacado): "Recibirás 7.6 USDC" (neto de fee)
- Fee del protocolo visible: "Fee PoP: 0.4 USDC (5%)"
- CTA: **"Reclamar Recompensa"** → ejecuta `settleHangover()`
- Post-tx: tx hash + animación + link explorador

#### Pantalla 6: Dashboard Público
- Tabla scrolleable con columnas: Wallet | Evento | Cruda | Monto | Tx
- Stats encabezado: Total Check-ins | Total Payouts | USDC Distribuido
- Filtro por evento
- Sin auth necesaria

---

### User Flow Principal

```
[Home] → [Conectar Wallet] → [Seleccionar Evento] → [Firmar Check-In]
                                                           ↓
                                              [Confirmación + Tx Hash]
                                                           ↓
                                              [Volver al día siguiente]
                                                           ↓
                                              [Ingresar Métricas]
                                                           ↓
                                              [Ver Score + Monto]
                                                           ↓
                                              [Reclamar Payout]
                                                           ↓
                                              [Tx Hash + Dashboard]
```

---

### Componentes UI Reutilizables

| Componente | Props necesarios |
|------------|-----------------|
| `WalletConnectButton` | `onConnect`, `onDisconnect`, `address` |
| `EventCard` | `eventId`, `name`, `date`, `venue`, `status` |
| `MetricsForm` | `onSubmit`, `eventId`, `walletAddress` |
| `HangoverResult` | `score`, `verdict`, `amount`, `fee` |
| `TxHashBadge` | `txHash`, `explorerUrl` |
| `DashboardTable` | `entries[]`, `onRefresh` |

---

## 4. Technical Requirements

### Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Wallet Connect | wagmi v2 + viem + RainbowKit o ConnectKit |
| Smart Contracts | Solidity ^0.8.20, Hardhat o Foundry |
| Red | Monad Testnet (EVM-compatible, Chain ID a confirmar) |
| Off-chain Oracle | Node.js script / Cloudflare Worker |
| Stablecoin (mock) | ERC-20 mock desplegado en Monad Testnet |
| Yield / Seguros | Etherfuse Stablebonds SDK (integración básica de referencia) |
| Deploy Frontend | Vercel |
| Deploy Contratos | Monad Testnet via script Hardhat/Foundry |

---

### Smart Contracts

#### Contrato Principal: `ProofOfParty.sol`

```solidity
// Funciones mínimas requeridas

function checkIn(uint256 eventId) external payable;
// - Registra wallet + eventId + timestamp
// - Requiere que el evento esté activo
// - Emite evento CheckInRegistered(address user, uint256 eventId, uint256 timestamp)

function settleHangover(address user, uint256 score) external onlyOracle;
// - Solo puede ser llamada por el oracle autorizado (owner/role)
// - Calcula payout según score (score >= 60 = cruda, score < 60 = fitness)
// - Descuenta fee del protocolo (5%)
// - Transfiere USDC mock al usuario
// - Emite evento HangoverSettled(address user, uint256 score, uint256 amount)

function createEvent(string memory name, uint256 startTime, uint256 endTime) external onlyOwner;
// - Crea un nuevo evento con ID incremental

function setOracle(address oracle) external onlyOwner;
// - Autoriza la dirección del oracle off-chain
```

**Mappings requeridos:**
```solidity
mapping(address => mapping(uint256 => bool)) public hasCheckedIn;
mapping(address => mapping(uint256 => bool)) public hasSettled;
mapping(uint256 => Event) public events;
```

#### Contrato: `MockUSDC.sol`
- ERC-20 estándar con función `mint(address, amount)` para faucet de demo
- 6 decimales (igual que USDC real)

---

### Off-Chain Oracle / Score Engine

**Lógica de scoring (reglas fijas para MVP):**

```
score = 100
if horas_sueño < 5:   score -= 40
if horas_sueño < 7:   score -= 20
if bpm_reposo > 100:  score -= 25
if bpm_reposo > 90:   score -= 10
if pasos < 2000:      score -= 15

CRUDA CONFIRMADA si score < 60
SUPERVIVIENTE si score >= 60
```

**Payout lógica:**
- Cruda confirmada: `payoutAmount = 8 USDC mock`
- Superviviente: `payoutAmount = 0.5 USDC mock` (bonus fitness)
- Fee protocolo: `feeAmount = payoutAmount * 0.05`
- Monto neto usuario: `payoutAmount - feeAmount`

**Implementación:**
- Node.js script con endpoint POST `/settle`
- Recibe: `{ wallet, eventId, sleep, steps, bpm }`
- Calcula score localmente
- Llama a `settleHangover(wallet, score)` firmando con clave privada del oracle
- Retorna: `{ score, verdict, txHash }`

**Variables de entorno requeridas:**
```
ORACLE_PRIVATE_KEY=
MONAD_RPC_URL=
CONTRACT_ADDRESS=
MOCK_USDC_ADDRESS=
NEXT_PUBLIC_CHAIN_ID=
```

---

### Integraciones

| Integración | Tipo | Prioridad |
|-------------|------|-----------|
| Monad Testnet RPC | Infraestructura blockchain | P0 — bloqueante |
| MockUSDC ERC-20 | Token de pago en demo | P0 — bloqueante |
| MetaMask / WalletConnect | Wallet connect | P0 — bloqueante |
| Etherfuse Stablebonds SDK | Referencia de rendimiento (mock para MVP) | P1 — nice to have en demo |
| QR Scanner (HTML5) | Check-in por QR en evento | P1 |
| Monad Block Explorer | Links de verificación de tx | P1 |

---

### Constraints

- **No hay integración real con Apple Health o Fitbit** en el MVP; todo es ingreso manual o JSON mock
- **No hay pools de yield complejos**: el rendimiento de Etherfuse es referenciado pero no implementado en producción
- **No hay auth tradicional**: solo wallet-based authentication (sign-in-with-ethereum opcional, no requerido)
- **Oracle centralizado**: para el MVP, una sola clave privada firma las liquidaciones (sin descentralización del oracle)
- **Single chain**: solo Monad Testnet, sin soporte multi-chain
- **Gas fees**: el protocolo absorbe el gas de `settleHangover()` en el demo (oracle paga gas)

---

## 5. Success Metrics

### KPIs del Demo (Hackathon)

| KPI | Objetivo | Cómo medirlo |
|-----|----------|--------------|
| **Completion Rate** | ≥ 70% de check-ins completan el flujo de payout | (wallets con settleHangover / wallets con checkIn) × 100 |
| **Tiempo de flujo completo** | < 3 minutos del check-in al payout | Timestamps en eventos on-chain |
| **Latencia oracle → payout** | < 5 segundos | Timestamp envío métricas vs. tx confirmada |
| **Tasa de éxito de transacciones** | > 95% de txs sin error | Monitoreo en explorador Monad |
| **Transacciones demostrables** | ≥ 10 txs visibles en explorador | Count en dashboard público |

### KPIs de Negocio (Post-Hackathon)

| KPI | Objetivo | Horizonte |
|-----|----------|-----------|
| **Fee Revenue** | 5% sobre USDC distribuido | Por evento |
| **Yield generado** | % de APY de Stablebonds sobre fondos no utilizados | Mensual |
| **Usuarios recurrentes** | ≥ 30% de usuarios repite en 2do evento | 30 días |
| **Eventos integrados** | 5 eventos en primeros 60 días | 60 días post-launch |
| **TVL en pool de estabilidad** | > 5,000 USDC en pool | 90 días |

---

### Eventos On-Chain a Trackear

```
CheckInRegistered(address indexed user, uint256 indexed eventId, uint256 timestamp)
HangoverSettled(address indexed user, uint256 indexed eventId, uint256 score, uint256 amountPaid, uint256 fee)
```

Estos eventos permiten reconstruir todas las métricas desde el chain sin backend adicional.

---

## 6. Implementation Roadmap

### Fases del MVP (Hackathon Build — ~3-5 días)

---

#### Fase 0: Setup & Infraestructura (Día 1 — ~4h)

**Tickets:**
- `[INFRA-01]` Crear repo con monorepo: `/frontend` (Next.js), `/contracts` (Hardhat/Foundry), `/oracle` (Node.js)
- `[INFRA-02]` Configurar Monad Testnet en wagmi (chainId, RPC URL, block explorer URL)
- `[INFRA-03]` Desplegar `MockUSDC.sol` en Monad Testnet y verificar
- `[INFRA-04]` Setup de variables de entorno: `.env.local` para frontend, `.env` para oracle
- `[INFRA-05]` Deploy de Vercel con preview branch

**Criterio de salida:** Wallet conecta a Monad Testnet en localhost sin errores.

---

#### Fase 1: Smart Contracts (Día 1-2 — ~6h)

**Tickets:**
- `[SC-01]` Escribir `ProofOfParty.sol` con `checkIn()`, `settleHangover()`, `createEvent()`
- `[SC-02]` Implementar role-based access para oracle (`onlyOracle` modifier)
- `[SC-03]` Agregar mappings de estado: `hasCheckedIn`, `hasSettled`, `events`
- `[SC-04]` Emitir eventos `CheckInRegistered` y `HangoverSettled`
- `[SC-05]` Tests unitarios: checkIn duplicado falla, settleHangover sin checkIn falla, payout correcto
- `[SC-06]` Deploy de `ProofOfParty.sol` en Monad Testnet con script

**Criterio de salida:** Tests pasan, contrato deployado y funciones llamables desde script.

---

#### Fase 2: Oracle / Score Engine (Día 2 — ~3h)

**Tickets:**
- `[ORC-01]` Crear endpoint POST `/api/settle` en Node.js/Next.js API Route
- `[ORC-02]` Implementar lógica de scoring con las reglas definidas en sección 4
- `[ORC-03]` Integrar viem para llamar `settleHangover()` firmando con clave privada oracle
- `[ORC-04]` Retornar `{ score, verdict, txHash, amountPaid, fee }` en respuesta
- `[ORC-05]` Manejo de errores: wallet sin check-in, evento no activo, ya liquidado

**Criterio de salida:** Llamada POST con métricas mock resulta en tx on-chain confirmada.

---

#### Fase 3: Frontend — Core Flow (Día 2-3 — ~8h)

**Tickets:**
- `[FE-01]` Setup RainbowKit/ConnectKit con configuración de Monad Testnet
- `[FE-02]` Componente `WalletConnectButton` con address truncada y opción disconnect
- `[FE-03]` Pantalla de selección de evento: lista hardcoded de 2-3 eventos para demo
- `[FE-04]` Flujo de check-in: llamar `checkIn(eventId)` vía wagmi `useWriteContract`, mostrar loading y tx hash
- `[FE-05]` Detección de estado: leer `hasCheckedIn[wallet][eventId]` al cargar
- `[FE-06]` Formulario de métricas (Pantalla 4): slider + inputs + validación
- `[FE-07]` Llamada al oracle desde frontend: POST `/api/settle` con métricas
- `[FE-08]` Pantalla de resultado (Pantalla 5): verdict + monto + fee + CTA reclamar
- `[FE-09]` Mostrar tx hash del payout + link al explorador de Monad

**Criterio de salida:** Flujo completo end-to-end funciona en browser con wallet real.

---

#### Fase 4: Dashboard Público (Día 3 — ~3h)

**Tickets:**
- `[DASH-01]` Leer eventos `CheckInRegistered` y `HangoverSettled` del contrato via `getLogs`
- `[DASH-02]` Parsear logs y construir tabla de actividad en cliente
- `[DASH-03]` Mostrar stats: total check-ins, total liquidados, USDC distribuido
- `[DASH-04]` Botón refresh y links a explorador por cada tx

**Criterio de salida:** Dashboard refleja txs reales del contrato en tiempo real.

---

#### Fase 5: QR & Polish (Día 4 — ~3h)

**Tickets:**
- `[QR-01]` Integrar librería `html5-qrcode` para scan QR en móvil
- `[QR-02]` El QR de cada evento encoda la URL: `https://pop.xyz/checkin?eventId=XXX`
- `[POLISH-01]` Copy final y emojis en toda la UI
- `[POLISH-02]` Responsive móvil: probar en iOS Safari y Chrome Android
- `[POLISH-03]` Toast notifications para estados de tx (pending/success/error)
- `[POLISH-04]` Loading skeletons en dashboard

**Criterio de salida:** Flujo completo funciona desde celular en el evento real del hackathon.

---

#### Fase 6: Demo Prep (Día 5 — ~2h)

**Tickets:**
- `[DEMO-01]` Crear 2-3 wallets de demo pre-financiadas con ETH de testnet para gas
- `[DEMO-02]` Pre-cargar MockUSDC en el contrato para payouts del demo
- `[DEMO-03]` Crear evento "PoP Hackathon Demo" en el contrato
- `[DEMO-04]` Preparar JSON de métricas mock para demo rápido (cruda + no cruda)
- `[DEMO-05]` Script de reset: función para limpiar estado de demo entre presentaciones

**Criterio de salida:** Demo ejecutable en < 2 minutos con flujo cruda confirmada visible.

---

### Prioridad de Features

| Feature | Prioridad | Complejidad | Bloqueante para demo |
|---------|-----------|-------------|---------------------|
| Wallet connect | P0 | Baja | ✅ Sí |
| `checkIn()` on-chain | P0 | Media | ✅ Sí |
| Formulario de métricas | P0 | Baja | ✅ Sí |
| Score engine off-chain | P0 | Media | ✅ Sí |
| `settleHangover()` on-chain | P0 | Media | ✅ Sí |
| Dashboard público | P1 | Media | ⚠️ Para impresionar |
| QR scanner | P1 | Baja | ⚠️ Ideal para evento real |
| Etherfuse SDK reference | P2 | Alta | ❌ Nice to have |
| Animaciones/polish | P2 | Baja | ❌ Tiempo extra |

---

## Apéndice A: Modelo de Negocio

### Fuentes de Ingresos (MVP → Producción)

**1. Protocol Fee (activo desde MVP)**
- 5% de cada payout liquidado
- Ejemplo: 8 USDC payout → 0.4 USDC fee al protocolo
- Implementado on-chain en `settleHangover()`

**2. Yield sobre Pool de Estabilidad (post-MVP via Etherfuse)**
- Los fondos del pool que no son reclamados (usuarios sin cruda) se invierten en Stablebonds de Etherfuse
- APY estimado: 8-12% sobre capital en pool
- El protocolo retiene el yield mientras los fondos permanecen en el pool
- Implementación: integración con Etherfuse Stablebonds SDK, fondos del pool → Stablebond → redimir al liquidar

**3. B2B: Eventos como Clientes (futuro)**
- Eventos pagan fee de integración por desplegar PoP en su venue
- Modelo SaaS: fee mensual o por evento

---

## Apéndice B: Glosario Técnico

| Término | Definición en contexto PoP |
|---------|---------------------------|
| `checkIn()` | Función del smart contract que registra asistencia on-chain |
| `settleHangover()` | Función que distribuye el payout según el score de cruda |
| Score de cruda | Número 0-100 calculado por el oracle; < 60 = cruda confirmada |
| Oracle | Script off-chain autorizado para llamar `settleHangover()` |
| MockUSDC | ERC-20 de prueba que simula pagos en USDC en Monad Testnet |
| Pool de estabilidad | Fondos del protocolo usados para pagar recompensas |
| Stablebonds | Instrumentos de deuda tokenizados de Etherfuse generadores de yield |
| Verdict | Resultado binario del flujo: "Cruda Confirmada" o "Superviviente" |

---

*Proof of Party — PRD v1.0 — Hackathon Build*  
*Para tickets: mapear cada US-XX e INFRA/SC/FE/ORC/DASH ticket a una issue en el repo*
