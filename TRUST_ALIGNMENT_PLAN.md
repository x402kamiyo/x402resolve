# Trust Alignment Plan - x402Resolve Protocol

**Date**: October 31, 2025
**Purpose**: Map x402Resolve features to hackathon trust requirements

---

## Trust Requirements Analysis

### 1. How do we trust them (agents)?

**Requirement**: Establish mechanisms to verify agent reliability and behavior

**x402Resolve Current Implementation**:
- ✓ On-chain transaction history (immutable audit trail)
- ✓ Cryptographic signatures (Ed25519 verification)
- ✓ Objective quality scoring (not subjective reviews)
- ✓ Transparent dispute resolution (all on Solana)

**Gaps**:
- No agent reputation system
- No historical performance metrics
- No identity verification

**Enhancement Plan**:

#### 1A. Agent Reputation System
**Implementation**: Track agent behavior on-chain

```rust
// Add to escrow program
pub struct AgentReputation {
    pub agent_pubkey: Pubkey,
    pub total_transactions: u64,
    pub disputes_filed: u64,
    pub disputes_won: u64,        // Quality < 50
    pub disputes_partial: u64,     // Quality 50-79
    pub disputes_lost: u64,        // Quality >= 80
    pub average_quality_received: u8,
    pub reputation_score: u16,     // 0-1000
    pub last_updated: i64,
}
```

**Reputation Calculation**:
```
reputation_score = (
    (disputes_won * 100) +
    (disputes_partial * 50) +
    ((total_tx - disputes_filed) * 75) +
    (average_quality_received * 2)
) / total_transactions
```

**Benefits**:
- Agents build on-chain reputation over time
- Bad actors get flagged automatically
- API providers can set minimum reputation requirements

#### 1B. Historical Performance Dashboard
**Implementation**: MCP tool for reputation lookup

```typescript
// New MCP tool
async function check_agent_reputation(agent_address: string) {
  return {
    address: agent_address,
    total_transactions: 142,
    dispute_rate: 0.18,           // 18% of transactions disputed
    win_rate: 0.67,                // 67% of disputes resulted in refund
    average_refund: 0.42,          // Average 42% refund
    reputation_score: 745,         // 745/1000
    trust_level: "High",           // Low/Medium/High/Verified
    since: "2025-06-01"
  };
}
```

**Integration**:
- Add to MCP server: `packages/mcp-server/server.py`
- Query on-chain PDA accounts
- Display in interactive demo

#### 1C. Agent Verification Badges
**Implementation**: Tiered verification system

**Levels**:
1. **Unverified** (0-250): New agents, no history
2. **Basic** (251-500): 10+ transactions, <30% dispute rate
3. **Trusted** (501-750): 50+ transactions, <15% dispute rate
4. **Verified** (751-1000): 100+ transactions, <10% dispute rate

**Visual Indicator**:
```
#00ffff Verified (850/1000) - 147 transactions, 8% dispute rate
🟡 Trusted (680/1000) - 52 transactions, 14% dispute rate
#FFE700 Basic (420/1000) - 18 transactions, 22% dispute rate
#ff00ff Unverified (120/1000) - 3 transactions, 33% dispute rate
```

---

### 2. What's the scope of work?

**Requirement**: Clear definition of what agent is expected to deliver

**x402Resolve Current Implementation**:
- ✓ Query string defines expected data
- ✓ Semantic similarity checks query-data alignment
- ✓ Completeness validation for required fields
- ✓ Freshness scoring for data recency

**Gaps**:
- No formal specification format
- No pre-agreement on deliverables
- No structured SLA definition

**Enhancement Plan**:

#### 2A. Structured Work Agreement
**Implementation**: On-chain work specification

```rust
pub struct WorkAgreement {
    pub escrow_id: Pubkey,
    pub client: Pubkey,
    pub provider: Pubkey,
    pub specification: WorkSpec,
    pub acceptance_criteria: AcceptanceCriteria,
    pub created_at: i64,
}

pub struct WorkSpec {
    pub query: String,              // "Uniswap V3 exploits on Ethereum"
    pub required_fields: Vec<String>, // ["tx_hash", "amount_usd", "timestamp"]
    pub min_records: u32,           // Minimum 5 records
    pub max_age_days: u32,          // Data not older than 30 days
    pub chain_filter: Option<String>, // "ethereum"
    pub protocol_filter: Option<String>, // "uniswap-v3"
}

pub struct AcceptanceCriteria {
    pub min_quality_score: u8,      // Minimum 70/100
    pub required_completeness: u8,  // 90% complete
    pub required_semantic: u8,      // 80% semantic match
    pub required_freshness: u8,     // 70% fresh
}
```

**Benefits**:
- Clear expectations before payment
- Objective acceptance criteria
- Reduced disputes due to misalignment

#### 2B. Pre-Flight Validation
**Implementation**: SDK method to validate work spec

```typescript
// Before paying
const validation = await client.validateWorkSpec({
  query: 'Uniswap V3 exploits on Ethereum',
  minRecords: 5,
  maxAgeDays: 30,
  requiredFields: ['tx_hash', 'amount_usd', 'timestamp'],
  minQuality: 70
});

if (!validation.feasible) {
  console.log('Provider cannot meet requirements:', validation.reason);
  // Don't proceed with payment
} else {
  console.log('Provider commits to:', validation.commitment);
  // Safe to proceed
}
```

#### 2C. SLA Templates
**Implementation**: Pre-defined service level agreements

```typescript
const SLA_TEMPLATES = {
  "exploit-intelligence-basic": {
    min_records: 3,
    max_age_days: 90,
    required_fields: ['tx_hash', 'amount_usd'],
    min_quality: 60,
    price: 0.01 // SOL
  },
  "exploit-intelligence-premium": {
    min_records: 10,
    max_age_days: 7,
    required_fields: ['tx_hash', 'amount_usd', 'source', 'vulnerability_type'],
    min_quality: 85,
    price: 0.05 // SOL
  }
};

// Use template
const payment = await client.pay({
  template: 'exploit-intelligence-premium',
  customizations: { chain: 'ethereum' }
});
```

---

### 3. What happens when they mess up?

**Requirement**: Clear consequences and remediation for failures

**x402Resolve Current Implementation**:
- ✓ Automated dispute filing
- ✓ Objective quality assessment
- ✓ Sliding scale refunds (0-100%)
- ✓ Fast resolution (24-48h)

**Gaps**:
- No escalation path
- No provider penalties beyond refunds
- No permanent ban mechanism

**Enhancement Plan**:

#### 3A. Multi-Tier Dispute Resolution
**Implementation**: Escalation system

```rust
pub enum DisputeStatus {
    Filed,              // Initial dispute
    UnderReview,        // Verifier scoring
    Resolved,           // Automated resolution
    Escalated,          // Client disagrees with resolution
    Arbitration,        // Manual review (rare)
    Finalized,          // No further appeals
}

pub struct DisputeResolution {
    pub dispute_id: Pubkey,
    pub status: DisputeStatus,
    pub quality_score: u8,
    pub refund_percentage: u8,
    pub escalation_count: u8,
    pub arbitrator: Option<Pubkey>,
    pub final_decision: Option<ArbitrationResult>,
}
```

**Escalation Rules**:
1. **Automatic Resolution** (80% of cases): Quality score → Refund
2. **Client Appeal** (15% of cases): Client stakes 0.01 SOL, requests review
3. **Multi-Oracle Consensus** (4% of cases): 3 oracles score, median used
4. **Human Arbitration** (1% of cases): Staked arbitrators review evidence

#### 3B. Provider Penalties
**Implementation**: Consequences beyond refunds

```rust
pub struct ProviderPenalties {
    pub provider: Pubkey,
    pub strike_count: u8,           // 0-3 strikes
    pub suspended: bool,
    pub suspension_end: Option<i64>,
    pub total_refunds_issued: u64,  // Lamports
    pub poor_quality_rate: u16,     // Per 1000 transactions
}

// Penalty tiers
// 1 strike: Warning + reputation -100
// 2 strikes: 7-day suspension + reputation -200
// 3 strikes: 30-day suspension + reputation -500
// 4 strikes: Permanent ban from protocol
```

**Trigger Conditions**:
- Quality score <30 on 3+ transactions in 30 days → Strike
- Dispute rate >40% over 20+ transactions → Strike
- Systematic fraud detected → Immediate ban

#### 3C. Automatic Remediation
**Implementation**: Beyond refunds

```typescript
// When provider messes up
async function handleFailure(dispute: Dispute) {
  const resolution = await verifier.score(dispute);

  // 1. Issue refund
  await escrow.resolveDispute(resolution.refundPercentage);

  // 2. Update provider reputation
  await reputation.recordFailure(dispute.provider, resolution.qualityScore);

  // 3. Offer re-work option
  if (resolution.qualityScore < 50 && provider.reputation > 600) {
    await notifyProvider({
      dispute_id: dispute.id,
      option: "re_work",
      deadline: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      incentive: "Avoid reputation penalty if quality >80"
    });
  }

  // 4. Check for patterns
  const recentFailures = await reputation.getRecentFailures(dispute.provider);
  if (recentFailures.length >= 3) {
    await penalties.issueStrike(dispute.provider);
  }
}
```

---

### 4. Who gives them reputation, credit, or refunds?

**Requirement**: Decentralized, objective reputation and credit system

**x402Resolve Current Implementation**:
- ✓ Automated verifier oracle (no human bias)
- ✓ On-chain execution (transparent)
- ✓ Cryptographic proofs (verifiable)

**Gaps**:
- Single oracle (centralization risk)
- No community governance
- No credit system for agents

**Enhancement Plan**:

#### 4A. Decentralized Oracle Network
**Implementation**: Multi-oracle consensus

```rust
pub struct OracleNetwork {
    pub oracles: Vec<Oracle>,
    pub min_consensus: u8,          // Require 2/3 agreement
    pub stake_required: u64,        // 10 SOL minimum stake
}

pub struct Oracle {
    pub pubkey: Pubkey,
    pub stake_amount: u64,
    pub reputation: u16,
    pub total_scores: u64,
    pub disputed_scores: u64,       // How often oracle was wrong
    pub accuracy_rate: u16,         // Per 1000 assessments
}

// Oracle selection
// - Random selection of 3 oracles per dispute
// - Weighted by reputation and stake
// - Median score used as final result
// - Outlier oracles lose reputation
```

**Benefits**:
- No single point of failure
- Byzantine fault tolerance
- Economic security via staking

#### 4B. Community Reputation System
**Implementation**: On-chain reputation managed by network

```rust
pub struct CommunityReputation {
    pub entity: Pubkey,              // Agent or Provider
    pub entity_type: EntityType,
    pub transaction_score: u16,      // From successful transactions
    pub peer_endorsements: u16,      // From other verified entities
    pub community_votes: i32,        // Upvotes - downvotes
    pub oracle_accuracy: u16,        // For oracles only
    pub total_value_transacted: u64,
    pub reputation_level: ReputationLevel,
}

pub enum ReputationLevel {
    Newcomer,      // 0-100
    Active,        // 101-300
    Established,   // 301-600
    Trusted,       // 601-850
    Elite,         // 851-1000
}
```

**Reputation Accrual**:
- Successful transaction: +5 points
- Dispute resolved favorably: +10 points
- Peer endorsement: +20 points
- Community upvote: +2 points
- Failed quality: -15 points
- Strike issued: -100 points

#### 4C. Credit and Payment System
**Implementation**: Credit lines for trusted agents

```rust
pub struct CreditAccount {
    pub agent: Pubkey,
    pub credit_limit: u64,          // Based on reputation
    pub credit_used: u64,
    pub payment_history_score: u16,
    pub default_rate: u16,
    pub last_payment: i64,
}

// Credit limits by reputation
// Elite (850+): 10 SOL credit
// Trusted (600+): 5 SOL credit
// Established (300+): 1 SOL credit
// Active/Newcomer: 0 SOL (prepay only)
```

**Benefits**:
- High-reputation agents can transact without prepayment
- Reduces friction for trusted users
- Payment history builds further reputation

#### 4D. Automated Refund System
**Implementation**: Enhanced refund logic

```rust
pub fn calculate_refund(
    quality_score: u8,
    agreement: &WorkAgreement,
    provider_reputation: u16,
) -> RefundResult {
    // Base refund from quality
    let base_refund = match quality_score {
        0..=49 => 100,    // Full refund
        50..=59 => 75,
        60..=69 => 50,
        70..=79 => 25,
        80..=100 => 0,
    };

    // Adjust for provider reputation
    let reputation_bonus = if provider_reputation > 800 {
        -5  // Reduce refund by 5% for elite providers
    } else if provider_reputation < 300 {
        +10 // Increase refund by 10% for unproven providers
    } else {
        0
    };

    let final_refund = (base_refund + reputation_bonus).clamp(0, 100);

    RefundResult {
        refund_percentage: final_refund,
        client_amount: (agreement.amount * final_refund) / 100,
        provider_amount: agreement.amount - client_amount,
        reputation_impact: -1 * (base_refund / 10), // Provider loses reputation
    }
}
```

---

### 5. How do we stop them from being exploited?

**Requirement**: Protection mechanisms for both agents and providers

**x402Resolve Current Implementation**:
- ✓ Time-lock prevents indefinite escrow
- ✓ Cryptographic signatures prevent tampering
- ✓ PDA-based escrow prevents theft
- ✓ Objective scoring reduces manipulation

**Gaps**:
- No Sybil attack protection
- No rate limiting per entity
- No collusion detection
- No provider protection from frivolous disputes

**Enhancement Plan**:

#### 5A. Sybil Attack Protection
**Implementation**: Identity and stake requirements

```rust
pub struct EntityVerification {
    pub entity: Pubkey,
    pub verification_level: VerificationLevel,
    pub kyc_hash: Option<[u8; 32]>,     // Hash of KYC data (privacy)
    pub stake_amount: u64,
    pub social_proofs: Vec<SocialProof>,
    pub verified_at: i64,
}

pub enum VerificationLevel {
    Basic,          // Just wallet address
    Staked,         // 1+ SOL staked
    Social,         // Twitter/GitHub linked
    KYC,            // Identity verified (enterprise)
}

// Higher verification = higher limits
// Basic: Max 0.1 SOL per transaction, 1 tx/hour
// Staked: Max 1 SOL per transaction, 10 tx/hour
// Social: Max 5 SOL per transaction, 50 tx/hour
// KYC: Max 100 SOL per transaction, unlimited
```

#### 5B. Rate Limiting and Fraud Detection
**Implementation**: Per-entity limits

```rust
pub struct RateLimiter {
    pub entity: Pubkey,
    pub transactions_last_hour: u16,
    pub transactions_last_day: u16,
    pub disputes_last_day: u16,
    pub suspicious_patterns: Vec<FraudFlag>,
}

pub enum FraudFlag {
    HighDisputeRate,        // >50% disputes
    SameProviderSpam,       // 10+ tx to same provider in 1 hour
    QualityGaming,          // Pattern of scores near boundaries
    CollaborativeFraud,     // Multiple entities coordinating
}

// Automatic suspension if:
// - 10+ disputes filed in 1 hour
// - 5+ disputes with same provider in 1 day
// - Quality scores always 49 or 79 (gaming boundaries)
```

#### 5C. Provider Protection
**Implementation**: Frivolous dispute penalties

```rust
pub struct DisputeCost {
    pub base_fee: u64,              // 0.001 SOL to file dispute
    pub stake_required: u64,        // Additional stake if repeat disputer
    pub refundable: bool,           // Refunded if dispute valid
}

pub fn calculate_dispute_cost(client: &AgentReputation) -> DisputeCost {
    let base = 1_000_000; // 0.001 SOL

    // Increase cost for clients with high dispute rate
    let multiplier = match client.disputes_filed * 100 / client.total_transactions {
        0..=20 => 1,      // Normal dispute rate
        21..=40 => 2,     // High dispute rate
        41..=60 => 5,     // Very high dispute rate
        _ => 10,          // Abuse pattern
    };

    DisputeCost {
        base_fee: base * multiplier,
        stake_required: if client.disputes_lost > 5 { base * 5 } else { 0 },
        refundable: true, // Refunded if quality <70
    }
}
```

**Benefits**:
- Discourages frivolous disputes
- Protects providers from abuse
- Still allows legitimate disputes

#### 5D. Collusion Detection
**Implementation**: Network analysis

```rust
pub struct CollusionDetector {
    pub entity_graph: HashMap<Pubkey, Vec<Pubkey>>,
    pub suspicious_clusters: Vec<SuspiciousCluster>,
}

pub struct SuspiciousCluster {
    pub entities: Vec<Pubkey>,
    pub pattern: CollusionPattern,
    pub confidence: f32,
    pub detected_at: i64,
}

pub enum CollusionPattern {
    CircularTransactions,   // A→B→C→A pattern
    QualityManipulation,    // Always rate each other 79/80
    DisputeFarming,         // Coordinate to exploit refunds
    ReputationWashing,      // Transfer reputation via fake tx
}

// Penalties for detected collusion
// - All entities in cluster suspended
// - Reputation reset to 0
// - Staked funds slashed 50%
// - Permanent flag in on-chain record
```

#### 5E. Time-Lock and Escape Hatches
**Implementation**: Safety mechanisms

```rust
pub struct EscrowSafety {
    pub max_escrow_duration: i64,   // 7 days maximum
    pub emergency_release: EmergencyRelease,
    pub dispute_deadline: i64,      // Must dispute within 48h
}

pub struct EmergencyRelease {
    pub enabled: bool,
    pub requester: Pubkey,
    pub reason: EmergencyReason,
    pub admin_approval: Option<Pubkey>,
}

pub enum EmergencyReason {
    ProviderDisappeared,    // No response for 5+ days
    OracleOffline,          // Verifier not responding
    ClientRequest,          // Client emergency (admin review)
    ProtocolUpgrade,        // Contract upgrade needed
}

// Automatic release after max duration
// Client can emergency release with reason
// Admin can override in extreme cases (logged on-chain)
```

---

## Implementation Priority

### Phase 1: High Impact, Low Complexity (Next 2 weeks)
1. **Agent Reputation System** (1A) - Track on-chain history
2. **Structured Work Agreement** (2A) - Clear specifications
3. **Multi-Tier Dispute Resolution** (3A) - Escalation path
4. **Rate Limiting** (5B) - Prevent abuse

### Phase 2: Medium Impact, Medium Complexity (Weeks 3-6)
5. **Historical Performance Dashboard** (1B) - MCP tool
6. **Pre-Flight Validation** (2B) - Validate before pay
7. **Provider Penalties** (3B) - Strike system
8. **Sybil Attack Protection** (5A) - Identity verification

### Phase 3: High Impact, High Complexity (Weeks 7-12)
9. **Decentralized Oracle Network** (4A) - Multi-oracle consensus
10. **Community Reputation System** (4B) - Decentralized reputation
11. **Credit System** (4C) - Credit lines for trusted agents
12. **Collusion Detection** (5D) - Network analysis

### Phase 4: Polish and Security (Weeks 13-16)
13. **Agent Verification Badges** (1C) - Visual trust indicators
14. **SLA Templates** (2C) - Pre-defined agreements
15. **Automatic Remediation** (3C) - Beyond refunds
16. **Emergency Escape Hatches** (5E) - Safety mechanisms

---

## Alignment with Hackathon

### Current Features (Already Aligned)

| Trust Question | x402Resolve Feature | Status |
|----------------|---------------------|--------|
| How do we trust them? | On-chain audit trail | ✓ Implemented |
| How do we trust them? | Cryptographic signatures | ✓ Implemented |
| What's the scope? | Query string specification | ✓ Implemented |
| What's the scope? | Semantic similarity check | ✓ Implemented |
| What happens when they mess up? | Automated dispute filing | ✓ Implemented |
| What happens when they mess up? | Sliding scale refunds | ✓ Implemented |
| Who gives reputation? | Automated verifier oracle | ✓ Implemented |
| Who gives refunds? | On-chain escrow execution | ✓ Implemented |
| How do we stop exploitation? | Time-lock mechanism | ✓ Implemented |
| How do we stop exploitation? | PDA-based security | ✓ Implemented |

### Enhanced Features (This Plan)

| Trust Question | Enhancement | Priority | Complexity |
|----------------|-------------|----------|------------|
| How do we trust them? | Reputation system | P1 | Low |
| How do we trust them? | Performance dashboard | P2 | Medium |
| How do we trust them? | Verification badges | P4 | Low |
| What's the scope? | Structured agreements | P1 | Low |
| What's the scope? | Pre-flight validation | P2 | Medium |
| What's the scope? | SLA templates | P4 | Low |
| What happens when they mess up? | Multi-tier resolution | P1 | Medium |
| What happens when they mess up? | Provider penalties | P2 | Medium |
| What happens when they mess up? | Auto remediation | P4 | High |
| Who gives reputation? | Decentralized oracles | P3 | High |
| Who gives reputation? | Community voting | P3 | High |
| Who gives reputation? | Credit system | P3 | High |
| How do we stop exploitation? | Sybil protection | P2 | Medium |
| How do we stop exploitation? | Rate limiting | P1 | Low |
| How do we stop exploitation? | Collusion detection | P3 | High |

---

## Documentation Strategy

### For Hackathon Submission

**Updated Files**:
1. `README.md` - Add trust and reputation sections
2. `HACKATHON.md` - Emphasize alignment with trust requirements
3. New: `TRUST_MODEL.md` - Comprehensive trust architecture
4. New: `REPUTATION_SYSTEM.md` - Technical specification

**Key Messaging**:
- x402Resolve directly addresses agent trust challenges
- Already implements 10/16 trust features
- Clear roadmap for remaining 6 features
- Production-ready foundation with expansion path

### Demo Updates

**Interactive Demo** (`demo/index.html`):
- Add reputation score visualization
- Show trust indicators (badges)
- Display provider history
- Simulate escalation flow

**MCP Server**:
- Add `check_agent_reputation` tool
- Add `validate_work_spec` tool
- Update documentation

---

## Success Metrics

### Quantitative
- Reputation scores tracked for 100% of transactions
- Dispute rate <15% (vs 30% without clear scope)
- Frivolous dispute rate <5% (vs 20% without cost)
- Provider satisfaction >80%
- Agent satisfaction >85%

### Qualitative
- Clear trust model documentation
- Strong alignment with hackathon requirements
- Production-ready reputation system
- Comprehensive fraud protection
- Community governance path

---

## Conclusion

x402Resolve already addresses 10/16 trust requirements. This plan adds 6 critical features to create a comprehensive trust system for autonomous agent commerce.

**Immediate Actions** (Before submission):
1. Document current trust features in HACKATHON.md
2. Create TRUST_MODEL.md explaining architecture
3. Update README.md with reputation section
4. Add reputation visualization to demo
5. Implement Phase 1 features (if time permits)

**Post-Hackathon**:
- Execute Phase 2-4 implementation
- Gather community feedback
- Iterate on trust mechanisms
- Build decentralized oracle network
