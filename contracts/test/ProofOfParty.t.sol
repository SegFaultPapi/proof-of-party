// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {CrudaEscrow} from "../src/ProofOfParty.sol";

// ── Mock USDC ─────────────────────────────────────────────────────────────────
contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "USDC: insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "USDC: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "USDC: allowance too low");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// ── Test Suite ────────────────────────────────────────────────────────────────
contract CrudaEscrowTest is Test {
    CrudaEscrow public escrow;
    MockUSDC    public usdc;

    address agent    = makeAddr("agent");
    address user     = makeAddr("user");
    address merchant = makeAddr("merchant");
    address hacker   = makeAddr("hacker");

    uint256 constant AMOUNT    = 15 * 10 ** 6; // 15 USDC
    uint256 constant MIN_SCORE = 70;
    uint256 constant WINDOW    = 18 hours;

    function setUp() public {
        usdc   = new MockUSDC();
        escrow = new CrudaEscrow(agent, address(usdc), MIN_SCORE);

        // El usuario tiene 100 USDC y aprueba al contrato
        usdc.mint(user, 100 * 10 ** 6);
        vm.prank(user);
        usdc.approve(address(escrow), type(uint256).max);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ lockFunds — depósito correcto
    // ─────────────────────────────────────────────────────────
    function test_LockFunds_Success() public {
        vm.prank(user);
        uint256 orderId = escrow.lockFunds(merchant, AMOUNT, WINDOW);

        assertEq(orderId, 0);
        assertEq(usdc.balanceOf(address(escrow)), AMOUNT, "Escrow should hold funds");
        assertEq(usdc.balanceOf(user), 100 * 10 ** 6 - AMOUNT, "User balance should decrease");

        CrudaEscrow.Order memory o = escrow.getOrder(0);
        assertEq(o.user,     user);
        assertEq(o.merchant, merchant);
        assertEq(o.amount,   AMOUNT);
        assertEq(uint256(o.status), uint256(CrudaEscrow.Status.Pending));
    }

    // ─────────────────────────────────────────────────────────
    // ✅ lockFunds emite evento
    // ─────────────────────────────────────────────────────────
    function test_LockFunds_EmitsEvent() public {
        vm.expectEmit(true, true, true, false);
        emit CrudaEscrow.FundsLocked(0, user, merchant, AMOUNT, 0); // deadline ignorado

        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ fulfill — score suficiente → paga al merchant
    // ─────────────────────────────────────────────────────────
    function test_Fulfill_Success() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        vm.prank(agent);
        escrow.fulfill(0, 85);

        assertEq(usdc.balanceOf(merchant), AMOUNT, "Merchant should receive payment");
        assertEq(usdc.balanceOf(address(escrow)), 0, "Escrow should be empty");

        CrudaEscrow.Order memory o = escrow.getOrder(0);
        assertEq(uint256(o.status), uint256(CrudaEscrow.Status.Fulfilled));
        assertEq(o.crudaScore, 85);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ fulfill — score exactamente en el límite mínimo
    // ─────────────────────────────────────────────────────────
    function test_Fulfill_ExactMinScore() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        vm.prank(agent);
        escrow.fulfill(0, MIN_SCORE);

        assertEq(usdc.balanceOf(merchant), AMOUNT);
    }

    // ─────────────────────────────────────────────────────────
    // ❌ fulfill — score insuficiente → revert
    // ─────────────────────────────────────────────────────────
    function test_Revert_Fulfill_LowScore() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        vm.prank(agent);
        vm.expectRevert("CrudaEscrow: Not cruda enough to order");
        escrow.fulfill(0, 50);
    }

    // ─────────────────────────────────────────────────────────
    // ❌ fulfill — solo el agente
    // ─────────────────────────────────────────────────────────
    function test_Revert_Fulfill_NotAgent() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        vm.prank(hacker);
        vm.expectRevert("CrudaEscrow: Only AI agent");
        escrow.fulfill(0, 90);
    }

    // ─────────────────────────────────────────────────────────
    // ❌ fulfill — después del deadline → revert
    // ─────────────────────────────────────────────────────────
    function test_Revert_Fulfill_AfterDeadline() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        vm.warp(block.timestamp + WINDOW + 1);

        vm.prank(agent);
        vm.expectRevert("CrudaEscrow: Deadline passed, user can refund");
        escrow.fulfill(0, 85);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ refund — usuario recupera USDC tras el deadline
    // ─────────────────────────────────────────────────────────
    function test_Refund_Success() public {
        uint256 balanceBefore = usdc.balanceOf(user);

        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        // Avanzar el tiempo más allá del deadline
        vm.warp(block.timestamp + WINDOW + 1);

        vm.prank(user);
        escrow.refund(0);

        assertEq(usdc.balanceOf(user), balanceBefore, "User should get full refund");
        assertEq(usdc.balanceOf(address(escrow)), 0);

        CrudaEscrow.Order memory o = escrow.getOrder(0);
        assertEq(uint256(o.status), uint256(CrudaEscrow.Status.Refunded));
    }

    // ─────────────────────────────────────────────────────────
    // ❌ refund — antes del deadline → revert
    // ─────────────────────────────────────────────────────────
    function test_Revert_Refund_BeforeDeadline() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        vm.prank(user);
        vm.expectRevert("CrudaEscrow: Deadline not reached yet");
        escrow.refund(0);
    }

    // ─────────────────────────────────────────────────────────
    // ❌ refund — otro usuario intenta reclamar orden ajena
    // ─────────────────────────────────────────────────────────
    function test_Revert_Refund_NotOwner() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        vm.warp(block.timestamp + WINDOW + 1);

        vm.prank(hacker);
        vm.expectRevert("CrudaEscrow: Not your order");
        escrow.refund(0);
    }

    // ─────────────────────────────────────────────────────────
    // ❌ doble resolución — no se puede fulfill ni refund 2 veces
    // ─────────────────────────────────────────────────────────
    function test_Revert_DoubleResolve() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        vm.prank(agent);
        escrow.fulfill(0, 80);

        vm.prank(agent);
        vm.expectRevert("CrudaEscrow: Order already resolved");
        escrow.fulfill(0, 80);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ múltiples órdenes independientes
    // ─────────────────────────────────────────────────────────
    function test_MultipleOrders() public {
        address user2 = makeAddr("user2");
        usdc.mint(user2, 100 * 10 ** 6);
        vm.prank(user2);
        usdc.approve(address(escrow), type(uint256).max);

        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);           // orderId 0

        vm.prank(user2);
        escrow.lockFunds(merchant, AMOUNT * 2, WINDOW);       // orderId 1

        vm.prank(agent);
        escrow.fulfill(0, 75);     // user1 crudo ✅

        vm.warp(block.timestamp + WINDOW + 1);
        vm.prank(user2);
        escrow.refund(1);          // user2 no reclamó a tiempo 🔄

        assertEq(usdc.balanceOf(merchant), AMOUNT);
        assertEq(usdc.balanceOf(user2), 100 * 10 ** 6);
    }

    // ─────────────────────────────────────────────────────────
    // ✅ isExpired helper
    // ─────────────────────────────────────────────────────────
    function test_IsExpired() public {
        vm.prank(user);
        escrow.lockFunds(merchant, AMOUNT, WINDOW);

        assertFalse(escrow.isExpired(0));
        vm.warp(block.timestamp + WINDOW + 1);
        assertTrue(escrow.isExpired(0));
    }
}
