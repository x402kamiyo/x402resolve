#!/usr/bin/env python3
"""
x402Resolve Demo: Agent Dispute Scenario

This demonstrates the complete dispute resolution flow:
1. Agent pays for "comprehensive Uniswap exploit data"
2. API returns incomplete data (3 exploits instead of 10+)
3. Agent disputes quality
4. x402 Verifier Oracle assesses quality → 65/100 score
5. Automatic partial refund (35%) executed
6. Total time: ~8 seconds
"""

import asyncio
import json
import time
from datetime import datetime
import httpx

# Configuration
VERIFIER_URL = "http://localhost:8000"
TRANSACTION_ID = "5x9k2m3n4p5q6r7s8t9u0v1w2x3y4z"

# Simulated data
ORIGINAL_QUERY = "Get comprehensive Uniswap V3 exploit history on Ethereum"

# What the API actually returned (incomplete!)
DATA_RECEIVED = {
    "exploits": [
        {
            "date": "2024-07-30",
            "protocol": "Curve Finance",  # Wrong protocol!
            "chain": "ethereum",
            "amount_usd": 61700000,
            "vulnerability_type": "reentrancy"
        },
        {
            "date": "2023-04-15",
            "protocol": "Euler Finance",  # Wrong protocol!
            "chain": "ethereum",
            "amount_usd": 8200000,
            "vulnerability_type": "flash_loan"
        },
        {
            "date": "2022-10-07",
            "protocol": "Mango Markets",  # Wrong protocol!
            "chain": "solana",  # Wrong chain!
            "amount_usd": 1500000,
            "vulnerability_type": "oracle_manipulation"
        }
    ],
    "total_count": 3,
    "timestamp": datetime.utcnow().isoformat()
}

EXPECTED_CRITERIA = [
    "comprehensive",  # Should have 10+ historical incidents
    "uniswap",        # Should be Uniswap-specific
    "ethereum",       # Should be Ethereum chain only
    "verified"        # Should be verified exploits
]

EXPECTED_RECORD_COUNT = 10  # Agent expected at least 10 exploits


async def main():
    print("=" * 70)
    print("x402Resolve Dispute Resolution Demo")
    print("=" * 70)
    print()

    # Step 1: Agent evaluates data
    print(" Step 1: Agent evaluates received data")
    print("-" * 70)
    print(f"Original Query: \"{ORIGINAL_QUERY}\"")
    print(f"Expected: {EXPECTED_RECORD_COUNT}+ Uniswap exploits on Ethereum")
    print(f"Received: {len(DATA_RECEIVED['exploits'])} exploits")
    print()

    # Analyze what was wrong
    print("  Agent Analysis:")
    print("   - Wrong protocols: Curve, Euler, Mango (NOT Uniswap!)")
    print("   - Wrong chains: Includes Solana (expected Ethereum only)")
    print("   - Incomplete: 3 exploits (expected 10+)")
    print("   - Verdict: DATA QUALITY UNACCEPTABLE")
    print()

    input("Press Enter to file dispute...")
    print()

    # Step 2: File dispute with x402 Verifier Oracle
    print("📝 Step 2: Filing dispute with x402 Verifier Oracle")
    print("-" * 70)

    start_time = time.time()

    async with httpx.AsyncClient() as client:
        try:
            # Call verifier oracle
            response = await client.post(
                f"{VERIFIER_URL}/verify-quality",
                json={
                    "original_query": ORIGINAL_QUERY,
                    "data_received": DATA_RECEIVED,
                    "expected_criteria": EXPECTED_CRITERIA,
                    "transaction_id": TRANSACTION_ID,
                    "expected_record_count": EXPECTED_RECORD_COUNT
                },
                timeout=30.0
            )

            if response.status_code != 200:
                print(f" Verifier error: {response.text}")
                return

            result = response.json()

        except httpx.ConnectError:
            print(" Error: Could not connect to x402 Verifier Oracle")
            print("   Please start the verifier:")
            print("   $ cd packages/x402-verifier")
            print("   $ python verifier.py")
            return

    resolution_time = time.time() - start_time

    # Step 3: Display verification result
    print()
    print(" Step 3: x402 Verifier Oracle Assessment")
    print("-" * 70)
    print(f"Quality Score: {result['quality_score']:.2f}/100")
    print(f"Reasoning: {result['reasoning']}")
    print(f"Recommendation: {result['recommendation']}")
    print(f"Refund Percentage: {result['refund_percentage']:.1f}%")
    print()

    # Step 4: Calculate refund amounts
    print("💰 Step 4: Calculating Refund")
    print("-" * 70)
    PAYMENT_AMOUNT = 0.01  # SOL

    refund_amount = PAYMENT_AMOUNT * (result['refund_percentage'] / 100)
    payment_amount = PAYMENT_AMOUNT - refund_amount

    print(f"Original Payment: {PAYMENT_AMOUNT} SOL")
    print(f"Refund to Agent: {refund_amount:.4f} SOL ({result['refund_percentage']:.1f}%)")
    print(f"Payment to API: {payment_amount:.4f} SOL ({100 - result['refund_percentage']:.1f}%)")
    print()

    # Step 5: Summary
    print(" Step 5: Dispute Resolved")
    print("-" * 70)
    print(f"Resolution Time: {resolution_time:.2f} seconds")
    print(f"Human Intervention: ZERO")
    print(f"Fairness: {result['quality_score']:.0f}% quality → {100 - result['refund_percentage']:.0f}% payment")
    print()

    print("🎉 x402Resolve: Automated conflict resolution complete!")
    print()

    # Show what would happen on-chain
    print("📡 Next Steps (On-Chain):")
    print("-" * 70)
    print("1. Verifier signature submitted to Solana escrow program")
    print(f"   Signature: {result['signature'][:32]}...")
    print("2. Escrow program verifies signature with verifier public key")
    print("3. Escrow executes split:")
    print(f"   - Transfer {refund_amount:.4f} SOL to Agent A")
    print(f"   - Transfer {payment_amount:.4f} SOL to API")
    print("4. Dispute marked as RESOLVED on-chain")
    print()

    print("=" * 70)
    print("Demo complete! This is x402Resolve in action. ")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
