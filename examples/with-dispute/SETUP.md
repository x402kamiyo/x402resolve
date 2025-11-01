# With Dispute Example - Setup Guide

This example demonstrates escrow payments with automated dispute resolution.

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- Solana CLI installed
- Anchor CLI installed (optional, for program deployment)

## Step 1: Generate Wallets

From the repository root:

```bash
cd ../..
./scripts/generate-wallets.sh
cd examples/with-dispute
```

## Step 2: Start Verifier Oracle

The verifier oracle must be running to process disputes.

**Terminal 1:**
```bash
cd ../../packages/x402-verifier
pip install -r requirements.txt
python verifier.py
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Keep this running!

## Step 3: Configure Environment

**Terminal 2:**
```bash
cd examples/with-dispute
cp .env.example .env
```

Edit `.env`:
```bash
API_WALLET_PUBKEY=$(solana-keygen pubkey ../../wallets/api-wallet.json)
VERIFIER_URL=http://localhost:8000
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Run the Example

```bash
ts-node index.ts
```

## Expected Output

```
======================================================================
🔒 x402 Escrow Payment with Dispute Resolution
======================================================================

📤 Step 1: Creating escrow payment...
----------------------------------------------------------------------
 Escrow created!
   Transaction ID: tx_abc123
   Escrow Address: EscrowPDA...
   Time Lock: 24 hours
   Amount: 0.01 SOL

🔍 Step 2: Querying API (simulating bad data)...
----------------------------------------------------------------------
 Received data (intentionally incomplete):
   Expected: Uniswap V3 exploits
   Got: Curve Finance exploits (WRONG PROTOCOL!)

⚖️  Step 3: Filing dispute automatically...
----------------------------------------------------------------------
 Quality Assessment:
   Semantic Similarity: 72% (protocols are related)
   Completeness: 40% (wrong protocol, missing fields)
   Freshness: 100% (recent data)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Quality Score: 65/100
   Refund: 35%

💰 Step 4: Executing on-chain resolution...
----------------------------------------------------------------------
 Dispute resolved!
   Agent refund: 0.0035 SOL (35%)
   API payment: 0.0065 SOL (65%)
   Transaction: https://explorer.solana.com/tx/...?cluster=devnet

======================================================================
 Example complete! Dispute resolved in <1 minute.
 (Production: 24-48 hours after time lock expires)
======================================================================
```

## Troubleshooting

### "Cannot connect to verifier oracle"

Make sure the verifier is running in Terminal 1:

```bash
cd packages/x402-verifier
python verifier.py
```

Check it's accessible:
```bash
curl http://localhost:8000/
# Should return: {"status":"operational"}
```

### "ModuleNotFoundError: No module named 'sentence_transformers'"

Install Python dependencies:

```bash
cd ../../packages/x402-verifier
pip install -r requirements.txt
```

### "Insufficient funds for dispute"

Request devnet SOL:

```bash
solana airdrop 2 $(solana-keygen pubkey ../../wallets/agent-wallet.json) --url devnet
```

### "Escrow account not found"

This usually means the escrow program isn't deployed to devnet. Verify:

```bash
solana program show AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR --url devnet
```

## What's Happening?

1. **Escrow Creation**: 0.01 SOL locked in PDA escrow account
2. **Time Lock**: 24-hour dispute window starts
3. **API Query**: Client requests data, receives poor quality response
4. **Automatic Dispute**: SDK detects quality issues, files dispute
5. **Verifier Assessment**: Oracle analyzes data using 3-factor algorithm
6. **On-Chain Resolution**: Solana program splits funds based on quality score
7. **Partial Refund**: Agent gets 35%, API keeps 65%

## Architecture Flow

```
Agent → SDK → Escrow (Solana)
         ↓
      API Query
         ↓
   Quality Check
         ↓
  Verifier Oracle ← Ed25519 Signature
         ↓
Solana Program → Refund Split
```

## Key Differences vs Basic Payment

| Feature | Basic Payment | With Dispute |
|---------|--------------|--------------|
| Escrow | ❌ No | ✅ Yes (PDA) |
| Dispute | ❌ No | ✅ Automated |
| Refunds | ❌ No | ✅ 0-100% sliding scale |
| Time Lock | ❌ Instant | ✅ 24-hour window |
| Protection | ❌ None | ✅ Quality-based |

## Next Steps

- Review [Quality Scoring Algorithm](../../docs/ARCHITECTURE_DIAGRAMS.md)
- Try filing disputes with different quality levels
- Explore [MCP Server](../../packages/mcp-server/) for AI agent integration
- Read [Smart Contract Code](../../packages/x402-escrow/programs/x402-escrow/src/lib.rs)
