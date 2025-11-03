# Switchboard On-Demand Integration Guide

## Overview

The x402-escrow program now supports **fully decentralized dispute resolution** via Switchboard On-Demand oracles. This eliminates the need for the centralized Python verifier and achieves 99% trustlessness.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Dispute Resolution Flow                   │
└─────────────────────────────────────────────────────────────┘

1. Agent initiates dispute
   └─> mark_disputed() instruction

2. Switchboard Function invoked off-chain
   ├─> Quality scoring algorithm runs (TypeScript)
   ├─> Multiple oracle nodes attest to result
   └─> Attestation stored on-chain

3. resolve_dispute_switchboard() instruction
   ├─> Verifies Switchboard attestation
   ├─> Extracts quality score
   ├─> Calculates refund percentage
   ├─> Splits funds (refund + payment)
   └─> Updates reputation scores
```

## Instructions

### New Instruction: `resolve_dispute_switchboard`

Resolves a dispute using Switchboard oracle attestation instead of Ed25519 signatures.

**Arguments:**
- `quality_score: u8` - Quality score from Switchboard (0-100)
- `refund_percentage: u8` - Refund percentage (0-100)

**Accounts:**
1. `escrow` - Escrow account (PDA, seeds: ["escrow", transaction_id])
2. `agent` - Agent wallet (receives refund)
3. `api` - API provider wallet (receives payment)
4. `switchboard_function` - Switchboard pull feed account with attestation
5. `agent_reputation` - Agent reputation account (PDA)
6. `api_reputation` - API reputation account (PDA)
7. `system_program` - Solana system program

**Validation:**
- Escrow status must be Active or Disputed
- Quality score ≤ 100
- Refund percentage ≤ 100
- Switchboard attestation must be valid
- Attestation age < 60 seconds
- Quality score matches Switchboard result

**Refund Formula:**
- Quality ≥ 80: 0% refund (good quality)
- Quality 50-79: Sliding scale `((80 - score) / 80) * 100`
- Quality < 50: 100% refund (poor quality)

## Deployment Steps

### 1. Install Solana & Anchor

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked
```

### 2. Build Program

```bash
cd packages/x402-escrow
anchor build
```

### 3. Deploy to Devnet

```bash
# Set Solana to devnet
solana config set --url https://api.devnet.solana.com

# Airdrop SOL for deployment
solana airdrop 2

# Deploy program
anchor deploy --provider.cluster devnet
```

### 4. Deploy Switchboard Function

See `packages/switchboard-function/README.md` for deploying the quality scoring function.

```bash
cd packages/switchboard-function
npm run build
sb function deploy --devnet
```

### 5. Update SDK with Switchboard Support

The SDK needs to be updated to invoke Switchboard and submit attestations. See Day 3 implementation plan.

## Usage Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { X402Escrow } from "../target/types/x402_escrow";

// Initialize connection
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.X402Escrow as Program<X402Escrow>;

// 1. Create escrow (existing flow)
const transactionId = "dispute-test-001";
await program.methods
  .initializeEscrow(
    new anchor.BN(0.01 * anchor.web3.LAMPORTS_PER_SOL),
    3600, // 1 hour
    transactionId
  )
  .accounts({
    escrow: escrowPDA,
    agent: agentWallet.publicKey,
    api: apiWallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .signers([agentWallet])
  .rpc();

// 2. Mark disputed
await program.methods
  .markDisputed()
  .accounts({
    escrow: escrowPDA,
    reputation: agentReputationPDA,
    agent: agentWallet.publicKey,
  })
  .signers([agentWallet])
  .rpc();

// 3. Invoke Switchboard Function (off-chain)
const switchboardClient = new CrossbarClient("https://crossbar.switchboard.xyz");
const functionResult = await switchboardClient.simulate({
  functionId: SWITCHBOARD_FUNCTION_ID,
  params: {
    originalQuery: "Uniswap exploits",
    dataReceived: apiData,
    expectedCriteria: ["Uniswap", "exploit"],
    transactionId: transactionId,
  },
});

// Extract results
const qualityScore = functionResult.result.value; // 0-100
const refundPercentage = calculateRefund(qualityScore); // Using same formula

// 4. Resolve dispute with Switchboard attestation
await program.methods
  .resolveDisputeSwitchboard(qualityScore, refundPercentage)
  .accounts({
    escrow: escrowPDA,
    agent: agentWallet.publicKey,
    api: apiWallet.publicKey,
    switchboardFunction: functionResult.pullFeed, // Switchboard attestation account
    agentReputation: agentReputationPDA,
    apiReputation: apiReputationPDA,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc();

console.log("Dispute resolved via Switchboard!");
```

## Testing

### Integration Test

```bash
cd packages/x402-escrow
anchor test --skip-local-validator
```

Test file: `tests/switchboard-dispute.ts`

```typescript
describe("switchboard-dispute", () => {
  it("Resolves dispute with Switchboard oracle", async () => {
    // Setup escrow
    const escrow = await setupEscrow(program, agent, api);

    // Mark disputed
    await program.methods.markDisputed().accounts({...}).rpc();

    // Simulate Switchboard Function
    const qualityScore = 45; // Poor quality
    const refundPercentage = 100; // Full refund

    // Mock Switchboard attestation account
    const switchboardFeed = await createMockSwitchboardFeed(
      qualityScore,
      Date.now()
    );

    // Resolve with Switchboard
    await program.methods
      .resolveDisputeSwitchboard(qualityScore, refundPercentage)
      .accounts({
        escrow: escrow.publicKey,
        agent: agent.publicKey,
        api: api.publicKey,
        switchboardFunction: switchboardFeed,
        agentReputation: agentRep,
        apiReputation: apiRep,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Verify funds split correctly
    const agentBalance = await connection.getBalance(agent.publicKey);
    const apiBalance = await connection.getBalance(api.publicKey);

    // Agent should receive full refund
    expect(agentBalance).to.equal(initialBalance + escrowAmount);
    // API should receive nothing
    expect(apiBalance).to.equal(initialApiBalance);
  });
});
```

## Cost Analysis

### Switchboard On-Demand Costs

**Per Dispute:**
- Switchboard oracle fee: ~0.0001 SOL (~$0.005 at $50/SOL)
- Transaction fee: ~0.000005 SOL
- Total: **~$0.005 per dispute**

**vs Python Verifier:**
- Server hosting: $20-50/month (fixed cost)
- AWS Lambda: $0.20 per 1M requests
- Centralization risk: Single point of failure
- **Winner: Switchboard for trustlessness, Python for bulk cost**

### When to Use Each

**Use Switchboard when:**
- Trustlessness is critical
- Dispute involves high value (>$100)
- Parties don't trust centralized oracle
- Targeting security-focused users

**Use Python Verifier when:**
- Cost optimization is priority
- High volume / low value disputes (<$10)
- Trusted counterparties
- Development/testing phase

**Hybrid Approach (Recommended):**
- Python verifier for disputes <$50
- Switchboard for disputes ≥$50
- Configurable per-escrow via `verification_method` field

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6012 | `InvalidSwitchboardAttestation` | Failed to parse Switchboard feed data |
| 6013 | `StaleAttestation` | Attestation older than 60 seconds |
| 6014 | `QualityScoreMismatch` | Submitted score doesn't match Switchboard result |

## Security Considerations

### Attestation Freshness

Switchboard attestations are valid for **60 seconds**. This prevents:
- Replay attacks with old attestations
- Oracle result staleness
- MEV manipulation via delayed submission

### Quality Score Verification

The program **double-checks** the quality score:
1. Extract value from Switchboard attestation (source of truth)
2. Compare with submitted `quality_score` parameter
3. Reject if mismatch

This prevents submitting false scores even with valid attestation.

### Oracle Decentralization

Switchboard On-Demand uses multiple oracle nodes:
- Minimum 3 nodes must attest
- Byzantine fault tolerance
- Economic security via stake slashing
- Higher reliability than single Python verifier

## Monitoring

### On-Chain Events

Listen for `DisputeResolved` events:

```typescript
program.addEventListener("DisputeResolved", (event, slot) => {
  console.log(`Dispute resolved at slot ${slot}`);
  console.log(`Quality: ${event.qualityScore}`);
  console.log(`Refund: ${event.refundPercentage}%`);
  console.log(`Verifier: ${event.verifier}`); // Switchboard function address
});
```

### Switchboard Status

Check function health:

```bash
sb function status --address <FUNCTION_ADDRESS>
```

View recent invocations:

```bash
sb function history --address <FUNCTION_ADDRESS> --limit 10
```

## Next Steps (Day 3)

1. **Update x402-sdk**: Add Switchboard dispute flow
2. **Integration tests**: End-to-end with real Switchboard
3. **SDK examples**: Sample code for both dispute paths
4. **Performance testing**: Measure latency vs Python verifier

## References

- [Switchboard Documentation](https://docs.switchboard.xyz/)
- [Switchboard On-Demand Rust SDK](https://docs.rs/switchboard-on-demand/)
- [Quality Scoring Function](../switchboard-function/README.md)
- [Python Verifier](../x402-verifier/verifier.py)
