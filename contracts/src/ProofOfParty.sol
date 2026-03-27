// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/**
 * @title CrudaEscrow
 * @notice Escrow para pedir comida / delivery al día siguiente de una fiesta.
 *
 * Flujo:
 *   1. [Noche] Usuario llama a lockFunds() — deposita USDC en el contrato.
 *   2. [Mañana] El Agente AI evalúa si el usuario está crudo y llama a fulfill().
 *      - Si ‟crudo‟: libera USDC al merchant de delivery.
 *      - Si no confirma antes del deadline: el usuario reclama su reembolso con refund().
 *
 * Roles:
 *   - agent     → única wallet autorizada a ejecutar fulfill() (OpenClaw AI)
 *   - user      → quien depositó y puede reclamar reembolso tras el deadline
 *   - merchant  → wallet del negocio de delivery que recibe el pago
 */
contract CrudaEscrow {
    // ─── Tipos ────────────────────────────────────────────────────────────────
    enum Status {
        Pending,    // fondos bloqueados, esperando confirmación del agente
        Fulfilled,  // pago enviado al merchant
        Refunded    // fondos devueltos al usuario
    }

    struct Order {
        address user;
        address merchant;
        uint256 amount;       // en unidades del token (ej: USDC 6 decimales)
        uint256 deadline;     // timestamp unix hasta el que el agente puede cumplir
        uint256 crudaScore;   // puntuación asignada por el agente (0-100)
        Status  status;
    }

    // ─── Estado ───────────────────────────────────────────────────────────────
    address public agent;
    IERC20  public usdc;

    uint256 public nextOrderId;
    mapping(uint256 => Order) public orders;

    // Mínimo de "nivel de cruda" para liberar el pago al merchant
    uint256 public minimumScore;

    // Ventana de tiempo máxima desde lockFunds() para que el agente pueda cumplir
    // Default: 18 horas (suficiente para pedir desayuno/brunch al día siguiente)
    uint256 public defaultWindow = 18 hours;

    // ─── Eventos ──────────────────────────────────────────────────────────────
    event FundsLocked(
        uint256 indexed orderId,
        address indexed user,
        address indexed merchant,
        uint256 amount,
        uint256 deadline
    );
    event OrderFulfilled(
        uint256 indexed orderId,
        address indexed merchant,
        uint256 crudaScore,
        uint256 amount
    );
    event OrderRefunded(uint256 indexed orderId, address indexed user, uint256 amount);
    event AgentUpdated(address newAgent);

    // ─── Modificadores ────────────────────────────────────────────────────────
    modifier onlyAgent() {
        require(msg.sender == agent, "CrudaEscrow: Only AI agent");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    /**
     * @param _agent        Wallet del Agente AI (OpenClaw)
     * @param _usdc         Dirección del contrato USDC en Monad
     * @param _minimumScore Nivel mínimo de cruda para liberar el pago (0-100)
     */
    constructor(address _agent, address _usdc, uint256 _minimumScore) {
        require(_agent != address(0), "Invalid agent");
        require(_usdc  != address(0), "Invalid USDC");
        agent        = _agent;
        usdc         = IERC20(_usdc);
        minimumScore = _minimumScore;
    }

    // ─── Funciones principales ────────────────────────────────────────────────

    /**
     * @notice [Noche-Fiesta] Usuario bloquea USDC para su pedido de delivery del día siguiente.
     * @param merchant   Wallet del negocio de delivery que recibirá el pago
     * @param amount     Monto en USDC a bloquear (en unidades, ej: 15_000000 = 15 USDC)
     * @param windowSecs Ventana en segundos para que el agente confirme (0 = usa default 18h)
     * @return orderId   ID único de la orden creada
     */
    function lockFunds(
        address merchant,
        uint256 amount,
        uint256 windowSecs
    ) external returns (uint256 orderId) {
        require(merchant != address(0), "CrudaEscrow: Invalid merchant");
        require(amount > 0,             "CrudaEscrow: Amount must be > 0");

        uint256 window = windowSecs == 0 ? defaultWindow : windowSecs;
        require(window >= 1 hours && window <= 48 hours, "CrudaEscrow: Window must be 1h-48h");

        // Transferir USDC del usuario al contrato (requiere approve previo)
        bool ok = usdc.transferFrom(msg.sender, address(this), amount);
        require(ok, "CrudaEscrow: USDC transferFrom failed");

        orderId = nextOrderId++;

        orders[orderId] = Order({
            user:       msg.sender,
            merchant:   merchant,
            amount:     amount,
            deadline:   block.timestamp + window,
            crudaScore: 0,
            status:     Status.Pending
        });

        emit FundsLocked(orderId, msg.sender, merchant, amount, orders[orderId].deadline);
    }

    /**
     * @notice [Mañana] El Agente AI libera el pago al merchant si el usuario está suficientemente crudo.
     * @dev Solo puede llamarse antes del deadline. Si el score es insuficiente, revierte.
     * @param orderId    ID de la orden a cumplir
     * @param crudaScore Nivel de cruda evaluado por el AI (0-100)
     */
    function fulfill(uint256 orderId, uint256 crudaScore) external onlyAgent {
        Order storage o = orders[orderId];

        require(o.user != address(0),          "CrudaEscrow: Order does not exist");
        require(o.status == Status.Pending,    "CrudaEscrow: Order already resolved");
        require(block.timestamp <= o.deadline, "CrudaEscrow: Deadline passed, user can refund");
        require(crudaScore >= minimumScore,    "CrudaEscrow: Not cruda enough to order");

        o.status     = Status.Fulfilled;
        o.crudaScore = crudaScore;

        bool ok = usdc.transfer(o.merchant, o.amount);
        require(ok, "CrudaEscrow: USDC transfer to merchant failed");

        emit OrderFulfilled(orderId, o.merchant, crudaScore, o.amount);
    }

    /**
     * @notice [Reembolso] Si el agente no confirma antes del deadline, el usuario recupera su USDC.
     * @param orderId ID de la orden a reembolsar
     */
    function refund(uint256 orderId) external {
        Order storage o = orders[orderId];

        require(o.user == msg.sender,         "CrudaEscrow: Not your order");
        require(o.status == Status.Pending,   "CrudaEscrow: Order already resolved");
        require(block.timestamp > o.deadline, "CrudaEscrow: Deadline not reached yet");

        o.status = Status.Refunded;

        bool ok = usdc.transfer(o.user, o.amount);
        require(ok, "CrudaEscrow: USDC refund failed");

        emit OrderRefunded(orderId, o.user, o.amount);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function updateAgent(address _newAgent) external onlyAgent {
        require(_newAgent != address(0), "Invalid agent");
        agent = _newAgent;
        emit AgentUpdated(_newAgent);
    }

    function updateMinimumScore(uint256 _minimumScore) external onlyAgent {
        require(_minimumScore <= 100, "Score max 100");
        minimumScore = _minimumScore;
    }

    // ─── Vistas ───────────────────────────────────────────────────────────────

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function isExpired(uint256 orderId) external view returns (bool) {
        return block.timestamp > orders[orderId].deadline;
    }
}
