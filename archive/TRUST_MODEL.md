# Trust Model - x402Resolve Protocol

**Version**: 1.0
**Date**: October 31, 2025

---

## Overview

x402Resolve implements a comprehensive trust system for autonomous agent commerce. This document describes how the protocol addresses five critical trust questions.

---

## 1. How do we trust agents?

### On-Chain Audit Trail

Every transaction recorded immutably on Solana:

```
Transaction History:
├── Escrow Created: 2025-10-31 14:23:45 UTC
├── Payment Amount: 0.05 SOL
├── Query: "Uniswap V3 exploits on Ethereum"
├── Dispute Filed: 2025-10-31 16:45:12 UTC
├── Quality Score: 65/100
└── Refund Issued: 0.0175 SOL (35%)
```

**Benefits**:
- Cannot be deleted or modified
- Publicly verifiable on Solana Explorer
- Creates permanent reputation record

### Cryptographic Verification

All quality assessments signed with Ed25519:

```typescript
const assessment = {
  transaction_id: "4x7Kj...",
  quality_score: 65,
  semantic: 0.72,
  completeness: 0.40,
  freshness: 1.00,
  timestamp: 1698764712
};

const signature = oracle.sign(assessment, privateKey);

// On-chain verification
const valid = verifySignature(assessment, signature, oraclePublicKey);
// Result: true = trust, false = reject
```

**Benefits**:
- Prevents quality score manipulation
- Proves oracle actually assessed the data
- Enables slashing for dishonest oracles

### Objective Quality Scoring

Algorithm removes human bias:

```python
def calculate_quality(query, data):
    # No subjective reviews
    # No manual scoring
    # Pure algorithmic assessment

    semantic = cosine_similarity(
        embed(query),
        embed(data)
    )  # 0.72

    completeness = validate_fields(
        data,
        required=['tx_hash', 'amount_usd']
    )  # 0.40

    freshness = calculate_age_score(
        data.timestamp,
        max_age_days=30
    )  # 1.00

    return (semantic * 0.4 + completeness * 0.4 + freshness * 0.2) * 100
    # Result: 65/100
```

**Benefits**:
- No manipulation through fake reviews
- Consistent across all transactions
- Transparent calculation method

### Reputation Tracking

Future enhancement tracking agent reliability:

**Reputation Score** (0-1000):
```
Agent: 7tewg...1b2b
├── Total Transactions: 147
├── Disputes Filed: 23 (15.6%)
├── Disputes Won: 18 (78%)
├── Average Quality Received: 68/100
└── Reputation: 745/1000 (Trusted)
```

**Trust Levels**:
- 0-250: Newcomer (limited access)
- 251-500: Active (standard limits)
- 501-750: Trusted (higher limits)
- 751-1000: Elite (priority access)

---

## 2. What's the scope of work?

### Query-Based Specification

Clear definition of expected data:

```typescript
const payment = await client.pay({
  query: 'Uniswap V3 exploits on Ethereum',
  amount: 0.05,
  expectedCriteria: {
    protocol: 'uniswap-v3',
    chain: 'ethereum',
    minRecords: 5,
    requiredFields: ['tx_hash', 'amount_usd', 'timestamp'],
    maxAgeDays: 30
  }
});
```

**Semantic Validation**:
- Query embedded into vector space
- Data embedded into same space
- Cosine similarity measured
- >80% match = acceptable

### Structured Work Agreements

Future enhancement for complex work:

```rust
pub struct WorkAgreement {
    pub query: String,
    pub required_fields: Vec<String>,
    pub min_records: u32,
    pub max_age_days: u32,
    pub min_quality_score: u8,
    pub acceptance_criteria: AcceptanceCriteria,
}
```

**Example**:
```json
{
  "query": "Curve Finance exploit history 2024-2025",
  "required_fields": ["tx_hash", "amount_usd", "timestamp", "vulnerability_type"],
  "min_records": 10,
  "max_age_days": 365,
  "min_quality_score": 80,
  "acceptance_criteria": {
    "protocol_match": "curve-finance",
    "year_range": [2024, 2025],
    "verified_only": true
  }
}
```

### Pre-Flight Validation

Check feasibility before payment:

```typescript
// Before paying
const validation = await client.validateWorkSpec({
  query: 'All Solana exploits in 2025',
  minRecords: 100
});

if (!validation.feasible) {
  console.log('Provider cannot deliver:', validation.reason);
  // "Only 47 Solana exploits recorded in 2025"
  // Adjust requirements or don't proceed
}
```

**Benefits**:
- Prevents misaligned expectations
- Reduces disputes
- Saves transaction fees

---

## 3. What happens when they mess up?

### Automated Dispute Resolution

Zero manual intervention required:

```
1. Client receives data
2. Quality check fails (score: 45/100)
3. Dispute filed automatically via MCP
4. Verifier oracle scores quality
5. Refund calculated (75% for score 45)
6. Executed on-chain within 24-48h
```

**Timeline**:
- Dispute filed: Instant
- Quality assessed: <5 minutes
- Refund executed: 24-48 hours (time-lock)

### Sliding Scale Refunds

Not binary (all or nothing):

| Quality Score | Refund | Client Gets | API Gets | Fair? |
|---------------|--------|-------------|----------|-------|
| 95 | 0% | $0 | $10 | ✓ Data acceptable |
| 75 | 25% | $2.50 | $7.50 | ✓ Minor issues |
| 55 | 50% | $5.00 | $5.00 | ✓ Moderate quality |
| 35 | 75% | $7.50 | $2.50 | ✓ Poor quality |
| 15 | 100% | $10 | $0 | ✓ Unacceptable |

**Benefits**:
- Fair to both parties
- Provider not penalized for minor issues
- Client not stuck with poor data

### Provider Penalties

Future enhancement for repeat offenders:

**Strike System**:
1. **Strike 1**: Warning + reputation -100
2. **Strike 2**: 7-day suspension + reputation -200
3. **Strike 3**: 30-day suspension + reputation -500
4. **Strike 4**: Permanent ban

**Strike Triggers**:
- 3+ transactions with quality <30 in 30 days
- Dispute rate >40% over 20+ transactions
- Detected fraud or manipulation

### Escalation Path

For disputed resolutions:

**Level 1**: Automated scoring (80% of cases)
**Level 2**: Client appeal + stake 0.01 SOL (15%)
**Level 3**: Multi-oracle consensus (4%)
**Level 4**: Human arbitration (1%)

```typescript
// Client disagrees with 65/100 score
const appeal = await client.escalateDispute({
  dispute_id: "abc123",
  stake: 0.01, // SOL
  reason: "Data completely wrong protocols"
});

// 3 additional oracles score
// Median used: [45, 52, 48] → 48/100
// Refund increased from 35% to 75%
// Stake refunded to client
```

---

## 4. Who gives them reputation, credit, or refunds?

### Automated Verifier Oracle

Objective quality assessment:

**Current Implementation**:
- Single verifier oracle (centralized)
- Ed25519 signed assessments
- Multi-factor algorithm
- Fast response (<5 minutes)

**Algorithm**:
```python
quality_score = (
    semantic_similarity(query, data) * 0.4 +
    completeness_check(data, required_fields) * 0.4 +
    freshness_score(data, max_age) * 0.2
) * 100
```

### On-Chain Execution

Smart contract enforces refunds:

```rust
pub fn resolve_dispute(
    ctx: Context<ResolveDispute>,
    quality_score: u8,
    oracle_signature: [u8; 64]
) -> Result<()> {
    // 1. Verify oracle signature
    verify_ed25519_signature(
        &quality_score,
        &oracle_signature,
        &ORACLE_PUBKEY
    )?;

    // 2. Calculate refund
    let refund_pct = calculate_refund_percentage(quality_score);
    let client_refund = escrow.amount * refund_pct / 100;
    let provider_payment = escrow.amount - client_refund;

    // 3. Execute transfers
    transfer_lamports(escrow, client, client_refund)?;
    transfer_lamports(escrow, provider, provider_payment)?;

    // 4. Update reputation (future)
    update_reputation(client, provider, quality_score)?;

    Ok(())
}
```

**Benefits**:
- No human discretion
- Cannot be overridden by single party
- Transparent execution
- Verifiable on blockchain

### Decentralized Oracle Network

Future enhancement for security:

**Multi-Oracle Consensus**:
```
Dispute ID: abc123
├── Oracle 1: Quality 62/100 (stake: 10 SOL)
├── Oracle 2: Quality 68/100 (stake: 15 SOL)
├── Oracle 3: Quality 65/100 (stake: 12 SOL)
├── Median Score: 65/100
└── Outlier Detection: None
```

**Economic Security**:
- Oracles stake 10+ SOL
- Wrong assessments lose reputation
- Persistent bad actors slashed
- Stake redistributed to honest oracles

### Community Reputation

Future enhancement for social layer:

**Reputation Sources**:
1. **Transaction History** (40%): Successful completions
2. **Oracle Assessments** (30%): Quality scores received
3. **Peer Endorsements** (20%): From verified entities
4. **Community Votes** (10%): Upvotes from users

**Reputation Calculation**:
```python
reputation = (
    transaction_score * 0.4 +
    avg_quality_received * 0.3 +
    peer_endorsements * 0.2 +
    community_votes * 0.1
) * 1000

# Result: 0-1000 score
```

### Credit System

Future enhancement for trusted agents:

**Credit Limits**:
- Elite (850+): 10 SOL credit
- Trusted (600+): 5 SOL credit
- Established (300+): 1 SOL credit
- Newcomer (<300): 0 SOL (prepay only)

**Benefits**:
- Reduces friction for proven agents
- Enables higher-value transactions
- Reputation becomes valuable asset

---

## 5. How do we stop them from being exploited?

### Time-Lock Protection

Prevents indefinite escrow:

```rust
pub struct Escrow {
    pub amount: u64,
    pub release_time: i64,      // Unix timestamp
    pub dispute_deadline: i64,   // 48 hours after creation
    pub max_duration: i64,       // 7 days maximum
}

// Automatic release after max_duration
// Client must dispute within 48 hours
// Provider gets paid after time-lock expires
```

**Benefits**:
- Agents cannot hold funds forever
- Providers guaranteed payment timeline
- Clear dispute window

### PDA-Based Security

Deterministic escrow addresses:

```rust
// Escrow PDA derivation
let (escrow_pda, bump) = Pubkey::find_program_address(
    &[
        b"escrow",
        client.key().as_ref(),
        provider.key().as_ref(),
        transaction_id.as_bytes()
    ],
    program_id
);

// Benefits:
// - No one can steal funds (only program controls PDA)
// - Deterministic address (can recompute)
// - No private key to lose
```

### Rate Limiting

Prevents spam and abuse:

**Per-Entity Limits**:
```rust
pub struct RateLimiter {
    pub entity: Pubkey,
    pub tx_per_hour: u16,
    pub tx_per_day: u16,
    pub disputes_per_day: u16,
}

// Limits by verification level:
// Basic: 1 tx/hour, 10 tx/day, 3 disputes/day
// Staked: 10 tx/hour, 100 tx/day, 10 disputes/day
// KYC: Unlimited
```

**Benefits**:
- Prevents Sybil attacks
- Stops dispute farming
- Protects network capacity

### Dispute Cost

Prevents frivolous disputes:

```rust
pub fn calculate_dispute_cost(client: &Reputation) -> u64 {
    let base_cost = 1_000_000; // 0.001 SOL

    // Increase cost for high dispute rate
    let multiplier = match client.dispute_rate_pct {
        0..=20 => 1,    // Normal
        21..=40 => 2,   // High
        41..=60 => 5,   // Very high
        _ => 10,        // Abuse
    };

    base_cost * multiplier
    // Refunded if quality <70
}
```

**Benefits**:
- Discourages frivolous disputes
- Protects providers from abuse
- Still allows legitimate disputes

### Sybil Attack Protection

Future enhancement:

**Identity Verification**:
```rust
pub enum VerificationLevel {
    Basic,      // Just wallet (max 0.1 SOL/tx)
    Staked,     // 1+ SOL staked (max 1 SOL/tx)
    Social,     // Twitter/GitHub (max 5 SOL/tx)
    KYC,        // Identity verified (max 100 SOL/tx)
}
```

**Benefits**:
- Creating fake identities expensive
- Higher limits for verified users
- Attack cost exceeds potential gain

### Collusion Detection

Future enhancement for network analysis:

**Pattern Detection**:
```rust
pub enum CollusionPattern {
    CircularTransactions,   // A→B→C→A
    QualityManipulation,    // Always 79/80 scores
    DisputeFarming,         // Coordinate refunds
    ReputationWashing,      // Transfer rep via fake tx
}

// Automatic suspension if pattern detected
// Stake slashed 50%
// Permanent on-chain flag
```

---

## Trust Guarantees

### What x402Resolve Guarantees

**For Agents (Data Buyers)**:
- Pay only if quality meets expectations
- Objective quality assessment
- Fair refunds (0-100% sliding scale)
- Fast dispute resolution (24-48h)
- Transparent on-chain execution

**For Providers (Data Sellers)**:
- Protected from frivolous disputes
- Partial payment for partial quality
- Not penalized for minor issues
- Time-lock guarantees eventual payment
- Build reputation over time

### What x402Resolve Does NOT Guarantee

**Not Guaranteed**:
- Data accuracy (beyond quality metrics)
- Instant refunds (time-lock required)
- 100% dispute win rate
- Zero transaction fees
- Immunity from network outages

**Limitations**:
- Quality is algorithmic (not human judgment)
- Single oracle (v1) has centralization risk
- Dispute requires stake (prevents spam)
- Maximum 7-day escrow (not indefinite)

---

## Security Model

### Threat Model

**Protected Against**:
- ✓ Fund theft (PDA security)
- ✓ Quality manipulation (signatures)
- ✓ Indefinite escrow (time-lock)
- ✓ Frivolous disputes (cost + reputation)
- ✓ Single oracle failure (future: multi-oracle)

**Not Protected Against**:
- ✗ Solana network outage
- ✗ Oracle private key compromise (v1)
- ✗ Coordinated Sybil attacks (requires verification)
- ✗ Legal disputes (code ≠ law)

### Attack Vectors and Mitigations

**Attack**: Dispute farming (file fake disputes for refunds)
**Mitigation**: Dispute cost scales with history, stake slashed if pattern detected

**Attack**: Quality gaming (provide exactly 79/100 to minimize refund)
**Mitigation**: Continuous scale (not thresholds), pattern detection flags suspicious scores

**Attack**: Oracle bribery (pay oracle for favorable score)
**Mitigation**: Ed25519 signatures tie oracle to score, reputation system penalizes bad oracles

**Attack**: Provider disappears (no response after payment)
**Mitigation**: Time-lock auto-releases to client after max duration, provider loses reputation

**Attack**: Client refuses to release (disputes everything)
**Mitigation**: Dispute costs increase with rate, reputation tracks behavior

---

## Comparison to Alternatives

### vs Traditional Payments

| Feature | Traditional | x402Resolve |
|---------|------------|-------------|
| Refunds | Manual (weeks) | Automated (24-48h) |
| Disputes | Email support | On-chain program |
| Fairness | Subjective | Objective algorithm |
| Transparency | Hidden | Public blockchain |
| Reputation | Centralized | On-chain |

### vs Escrow Services

| Feature | Escrow.com | x402Resolve |
|---------|-----------|-------------|
| Speed | Days-weeks | 24-48 hours |
| Cost | 3-5% fee | <0.1% (Solana fees) |
| Trust Model | Company | Smart contract |
| Automation | Manual | Programmatic |
| Sliding Scale | No | Yes (0-100%) |

### vs Chargebacks

| Feature | Credit Card | x402Resolve |
|---------|------------|-------------|
| Who Decides | Bank | Algorithm |
| Timeline | 60-90 days | 24-48 hours |
| Evidence | Manual review | Cryptographic proof |
| Cost | $15-25 per chargeback | ~$0.00001 (gas) |
| Abuse | Friendly fraud common | Costly (staking) |

---

## Future Enhancements

### Roadmap

**Q1 2026**: Reputation system launch
**Q2 2026**: Multi-oracle consensus
**Q3 2026**: Credit system for trusted agents
**Q4 2026**: Decentralized governance

### Governance

Future decentralization via token:

**x402 Token Utility**:
- Vote on oracle selection
- Propose parameter changes
- Stake for oracle role
- Earn from protocol fees

**Parameters**:
- Refund scale thresholds
- Time-lock durations
- Dispute costs
- Oracle stake requirements

---

## Conclusion

x402Resolve implements a comprehensive trust model addressing all five critical questions:

1. **Trust agents**: On-chain history + cryptographic proofs
2. **Scope definition**: Structured work agreements
3. **Failure handling**: Automated disputes + sliding refunds
4. **Reputation/credit**: Algorithmic scoring + future governance
5. **Exploitation prevention**: Time-locks + rate limits + staking

Current implementation provides foundation. Future enhancements add decentralization and governance.

**Status**: Production-ready with clear upgrade path.
