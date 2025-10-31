# Multi-Oracle Consensus Design

Multi-oracle support for high-value disputes requiring additional verification beyond single oracle assessment.

## Architecture

### Oracle Registry

```rust
#[account]
pub struct OracleRegistry {
    pub oracles: Vec<Pubkey>,           // Registered oracle public keys
    pub min_stake: u64,                  // Minimum stake required (10 SOL)
    pub active_count: u8,                // Currently active oracles
}

#[account]
pub struct Oracle {
    pub pubkey: Pubkey,                  // Oracle identity
    pub stake: u64,                      // Staked amount
    pub total_assessments: u64,          // Lifetime assessments
    pub slashed_count: u16,              // Times slashed for dishonesty
    pub reputation_score: u16,           // 0-1000 oracle reputation
    pub active: bool,                    // Currently accepting work
}
```

### Consensus Mechanism

**3-Oracle Consensus** for disputes >1 SOL or when client requests review:

1. Primary oracle provides initial assessment
2. If disputed OR high-value, trigger 2 additional oracles
3. Calculate median quality score from 3 assessments
4. Use median for refund calculation

**Benefits**:
- Prevents single oracle manipulation
- Higher confidence for large transactions
- Built-in appeal mechanism
- Oracle reputation tracking

## Thresholds

| Transaction Value | Oracles Required | Consensus Rule |
|-------------------|------------------|----------------|
| <0.1 SOL         | 1                | Single assessment |
| 0.1-1 SOL        | 1 (appealable)   | Single + optional review |
| >1 SOL           | 3 (automatic)    | Median of 3 scores |

## Oracle Selection

**Random selection from active pool**:
```rust
// Pseudo-random selection using recent blockhash
fn select_oracles(registry: &OracleRegistry, count: u8, seed: [u8; 32]) -> Vec<Pubkey> {
    let mut selected = Vec::new();
    let mut rng = Rng::from_seed(seed);

    while selected.len() < count {
        let idx = rng.next_u64() % registry.active_count;
        let oracle = registry.oracles[idx];
        if !selected.contains(&oracle) && registry.get_oracle(oracle).active {
            selected.push(oracle);
        }
    }

    selected
}
```

## Slashing Mechanism

**Oracle penalized if**:
- Score deviates >30 points from median (outlier detection)
- Signature verification fails
- Timeout (no response within 24h)

**Penalties**:
1. First offense: Warning + reputation -100
2. Second: 10% stake slashed + reputation -200
3. Third: 50% stake slashed + suspended 30 days
4. Fourth: 100% stake slashed + permanent ban

## Consensus Calculation

```rust
pub fn calculate_consensus(scores: Vec<u8>) -> ConsensusResult {
    assert!(scores.len() >= 3, "Requires 3+ oracle assessments");

    // Sort scores
    let mut sorted = scores.clone();
    sorted.sort();

    // Calculate median
    let median_score = sorted[sorted.len() / 2];

    // Calculate standard deviation
    let mean = sorted.iter().sum::<u8>() / sorted.len() as u8;
    let variance = sorted.iter()
        .map(|&s| (s as i16 - mean as i16).pow(2))
        .sum::<i16>() / sorted.len() as i16;
    let std_dev = (variance as f64).sqrt() as u8;

    // Identify outliers (>2 std dev from mean)
    let outliers = scores.iter()
        .enumerate()
        .filter(|(_, &s)| (s as i16 - mean as i16).abs() > 2 * std_dev as i16)
        .map(|(i, _)| i)
        .collect();

    ConsensusResult {
        median: median_score,
        mean,
        std_dev,
        outlier_indices: outliers,
        confidence: calculate_confidence(std_dev),
    }
}

fn calculate_confidence(std_dev: u8) -> u8 {
    // High agreement (low std dev) = high confidence
    if std_dev < 5 { 100 }
    else if std_dev < 10 { 90 }
    else if std_dev < 15 { 75 }
    else if std_dev < 20 { 60 }
    else { 40 }
}
```

## Oracle Incentives

**Payment structure**:
- Primary oracle: 60% of assessment fee
- Secondary oracles: 20% each
- Assessment fee: 0.1% of escrow amount (min 0.0001 SOL, max 0.01 SOL)

**Reputation rewards**:
- +10 reputation per accurate assessment (within 1 std dev of consensus)
- +50 bonus at 100 consecutive accurate assessments
- Top 10 oracles receive 2x fees

## Example Flow

```
High-Value Dispute (1.5 SOL escrow)
├─ Automatic multi-oracle trigger
├─ Select 3 oracles randomly
│  ├─ Oracle A: Quality 72/100
│  ├─ Oracle B: Quality 68/100
│  └─ Oracle C: Quality 70/100
├─ Calculate consensus
│  ├─ Median: 70/100
│  ├─ Std Dev: 2 points
│  └─ Confidence: 100% (high agreement)
├─ Apply median score for refund
│  └─ 70/100 → 23% refund
└─ Distribute fees
   ├─ Oracle A: 0.0009 SOL
   ├─ Oracle B: 0.0003 SOL
   └─ Oracle C: 0.0003 SOL
```

## Implementation Status

**Current (Phase 1)**:
- Single oracle assessment
- Ed25519 signature verification
- Quality scoring algorithm deployed

**Phase 2 (Multi-Oracle)**:
- Oracle registry contract
- Consensus mechanism
- Random selection algorithm
- Slashing implementation
- Reputation tracking

**Estimated deployment**: Q1 2026 (post-hackathon)

## Security Considerations

1. **Sybil Resistance**: 10 SOL minimum stake prevents cheap oracle creation
2. **Collusion Prevention**: Random selection + slashing for outliers
3. **Availability**: Primary oracle sufficient for most transactions, multi-oracle only for high-value
4. **Incentive Alignment**: Reputation and fee bonuses reward honest behavior

## Benefits Over Single Oracle

| Metric | Single Oracle | Multi-Oracle (3+) |
|--------|---------------|-------------------|
| Manipulation Risk | Medium | Low |
| Assessment Confidence | 60-80% | 90-95% |
| Client Trust | Good | Excellent |
| Cost | 0.0001 SOL | 0.0015 SOL |
| Resolution Time | 5 min | 15 min |

**Trade-off**: Increased cost and latency justified for high-value transactions where trust is critical.
