# Payment with Dispute Resolution

Complete example demonstrating x402Resolve's automated dispute resolution workflow.

## Use Case

Use this when:
- Data quality is critical
- You need automated refund protection
- You want objective quality verification
- Provider is unknown or untrusted

## How It Works

```
Agent → Pay 0.01 SOL → Escrow (Time-Locked 24h)
        ↓
    Get Access Token
        ↓
    Query API → Receive Data
        ↓
    Evaluate Quality ← AI Assessment
        ↓
    ┌─────────────┴─────────────┐
    │                           │
Quality OK?              Quality Poor?
    │                           │
    ↓                           ↓
Auto-release            File Dispute
after 24h                      ↓
    │                   x402 Verifier Oracle
    │                   (Semantic, Complete, Fresh)
    │                          ↓
    │                   Quality Score: 45/100
    │                          ↓
    │                   Refund: 75% ($0.0075 SOL)
    │                   API Gets: 25% ($0.0025 SOL)
    │                          ↓
    └───────────────┬───────────┘
                    │
            ✅ Resolution Complete
```

## Run

```bash
# Install dependencies
npm install

# Make sure x402 Verifier is running
# Terminal 1:
cd ../../packages/x402-verifier
python verifier.py

# Terminal 2: Run example
cd examples/with-dispute
ts-node index.ts
```

## Expected Output

```
======================================================================
🛡️  x402Resolve: Payment with Dispute Protection
======================================================================

1️⃣  Creating escrow payment...
----------------------------------------------------------------------
✅ Escrow created!
   Escrow Address: Escrow1x402PDAAccount...
   Amount: 0.01 SOL
   Dispute Window: 24 hours
   Solana TX: 5KQx7zY...

2️⃣  Requesting data from API...
----------------------------------------------------------------------
✅ Data received!
   Exploits: 3 results
   Query: "Uniswap V3 exploits on Ethereum"

   Results:
   1. Curve Finance - $61.7M (WRONG PROTOCOL!)
   2. Euler Finance - $8.2M (WRONG PROTOCOL!)
   3. Mango Markets - $1.5M (WRONG CHAIN!)

3️⃣  Evaluating data quality...
----------------------------------------------------------------------
❌ Quality issues detected:
   • Wrong protocols (expected Uniswap, got Curve/Euler/Mango)
   • Wrong blockchain (expected Ethereum, got Solana)
   • Incomplete (3 vs 10+ expected)

4️⃣  Filing dispute...
----------------------------------------------------------------------
✅ Dispute filed!
   Dispute ID: dispute_x402_xyz789
   Status: pending_verification
   Verifier Oracle: https://verifier.x402resolve.com

5️⃣  Waiting for quality verification... (simulated)
----------------------------------------------------------------------
⏳ x402 Verifier analyzing data...
   Checking semantic coherence...
   Validating completeness...
   Assessing freshness...

✅ Quality verification complete!

   Quality Score: 45/100
   ├─ Semantic Coherence: 60% (protocols don't match query)
   ├─ Completeness: 40% (missing 70% of expected data)
   └─ Freshness: 100% (data is recent)

   Overall: POOR QUALITY

6️⃣  Processing refund...
----------------------------------------------------------------------
✅ Refund processed!

   Quality Score: 45/100
   Refund Percentage: 75%

   Breakdown:
   • Agent refund: 0.0075 SOL (75%)
   • API payment: 0.0025 SOL (25%)

   Solana TX: 7LPz4kQ9...

======================================================================
✅ Dispute Resolved!
======================================================================

Summary:
  • Original payment: 0.01 SOL
  • Quality score: 45/100 (poor)
  • Refund to agent: 0.0075 SOL (75%)
  • Payment to API: 0.0025 SOL (25%)
  • Resolution time: 2 seconds
  • Human intervention: ZERO

Key Benefits:
  ✅ Automated quality verification
  ✅ Fair refund based on objective score
  ✅ Fast resolution (24-48h in production)
  ✅ All transactions on Solana blockchain
  ✅ No manual dispute process needed

Next: Try mcp-integration example to see how Claude Desktop
      can file disputes automatically!
```

## Code Walkthrough

### 1. Create Escrow Payment

```typescript
import { X402Client } from '@kamiyo/x402-sdk';

const client = new X402Client({
  solanaRpc: 'https://api.devnet.solana.com',
  escrowProgramId: process.env.ESCROW_PROGRAM_ID,
  payerKeypair: keypair
});

// Payment goes to escrow (time-locked)
const payment = await client.pay({
  amount: 0.01,
  dataRequest: {
    query: 'Uniswap V3 exploits',
    chain: 'Ethereum',
    limit: 10
  },
  disputeWindow: 86400 // 24 hours
});
```

### 2. Receive and Evaluate Data

```typescript
// Fetch data using payment token
const response = await fetch(API_URL, {
  headers: { 'Authorization': `Bearer ${payment.accessToken}` }
});

const data = await response.json();

// Evaluate quality
const qualityIssues = evaluateDataQuality(data, {
  expectedProtocol: 'Uniswap',
  expectedChain: 'Ethereum',
  minResults: 10
});
```

### 3. File Dispute if Quality is Poor

```typescript
if (qualityIssues.length > 0) {
  const dispute = await client.dispute({
    transactionId: payment.transactionId,
    reason: qualityIssues.join(', '),
    expectedQuality: 80,
    evidence: `Query: "${query}", Got: wrong protocols and chain`
  });

  console.log('Dispute filed:', dispute.disputeId);
}
```

### 4. Monitor Resolution

```typescript
// Monitor dispute resolution
client.on('disputeResolved', (event) => {
  console.log('Quality Score:', event.qualityScore);
  console.log('Refund Amount:', event.refundAmount);
  console.log('Solana TX:', event.solanaTx);
});

// Or poll for status
const resolved = await client.monitorDispute(dispute.disputeId);
```

## Key Features Demonstrated

1. **Time-Locked Escrow**: Funds held in PDA for 24-48h
2. **Quality Evaluation**: Multi-factor AI scoring
3. **Automated Refunds**: 0-100% sliding scale
4. **On-Chain Execution**: All on Solana blockchain
5. **Event-Driven**: Real-time status updates

## Quality Scoring Algorithm

```python
# x402 Verifier Oracle
quality_score = (
    semantic_coherence * 0.4 +  # Does data match query?
    completeness_score * 0.4 +  # All required fields present?
    freshness_score * 0.2       # Is data recent?
) * 100

# Refund calculation
if score >= 90:
    refund = 0%     # High quality
elif score >= 70:
    refund = 25%    # Minor issues
elif score >= 50:
    refund = 50%    # Moderate issues
elif score >= 30:
    refund = 75%    # Significant issues
else:
    refund = 100%   # Poor quality
```

## Comparison

| Feature | Basic Payment | With Dispute |
|---------|---------------|--------------|
| Payment Method | Direct transfer | Escrowed |
| Release Time | Instant | 24-48h time-lock |
| Quality Check | None | AI-powered |
| Refund Support | ❌ No | ✅ Yes (0-100%) |
| Dispute Process | N/A | Automated |
| Human Review | N/A | None needed |
| Use Case | Trusted APIs | Any API |

## Learn More

- [x402 Payment System Docs](../../docs/X402_PAYMENT_SYSTEM.md)
- [TypeScript SDK](../../packages/x402-sdk/)
- [Verifier Oracle](../../packages/x402-verifier/)
- [Solana Escrow Program](../../packages/x402-escrow/)
