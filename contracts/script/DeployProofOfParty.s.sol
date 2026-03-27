// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {CrudaEscrow} from "../src/ProofOfParty.sol";

/**
 * @title DeployCrudaEscrow
 * @notice Deploy CrudaEscrow to Monad Testnet (Chain ID 10143)
 *
 * Usage:
 *   # Deploy:
 *   forge script script/DeployProofOfParty.s.sol \
 *     --rpc-url monad \
 *     --broadcast \
 *     --private-key $PRIVATE_KEY
 *
 *   # Deploy + verify on Monad Explorer:
 *   forge script script/DeployProofOfParty.s.sol \
 *     --rpc-url monad \
 *     --broadcast \
 *     --verify \
 *     --private-key $PRIVATE_KEY
 */
contract DeployCrudaEscrow is Script {
    // ── Config (override with env vars) ──────────────────────────
    // Address of the AI Agent wallet that will call fulfill()
    address constant DEFAULT_AGENT = address(0xDEAD); // change before deploying!

    // USDC on Monad Testnet — replace with real address
    address constant DEFAULT_USDC = address(0xBEEF); // change before deploying!

    // Minimum hangover score (0-100) to release payment, e.g. 70
    uint256 constant DEFAULT_MIN_SCORE = 70;

    function run() external {
        address agentAddr = vm.envOr("AGENT_ADDRESS", DEFAULT_AGENT);
        address usdcAddr  = vm.envOr("USDC_ADDRESS",  DEFAULT_USDC);
        uint256 minScore  = vm.envOr("MINIMUM_SCORE", DEFAULT_MIN_SCORE);

        vm.startBroadcast();

        CrudaEscrow escrow = new CrudaEscrow(agentAddr, usdcAddr, minScore);

        console.log("===========================================");
        console.log(" CrudaEscrow deployed to Monad Testnet");
        console.log("===========================================");
        console.log(" Contract   :", address(escrow));
        console.log(" Agent      :", agentAddr);
        console.log(" USDC       :", usdcAddr);
        console.log(" Min Score  :", minScore);
        console.log("===========================================");

        vm.stopBroadcast();
    }
}

