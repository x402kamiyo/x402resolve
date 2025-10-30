# x402Resolve: Production-Grade Implementation Plan

> **A comprehensive, technically rigorous, future-proof protocol for automated AI agent dispute resolution**

**Timeline:** 6-8 weeks (we have time to do this right)
**Approach:** Build production-ready infrastructure, not a hackathon demo
**Philosophy:** Solve the hard problems now, iterate on features later

---

## Executive Summary

### What We're Building

A **trustless, decentralized dispute resolution protocol** for the AI agent economy that operates at three layers:

1. **Settlement Layer (Solana)** - On-chain escrow, verifier registry, reputation system
2. **Verification Layer (Distributed Oracles)** - Multi-oracle consensus, staking, slashing
3. **Application Layer (SDKs/APIs)** - TypeScript, Python, Rust clients with dispute support

### Why Production-Grade Matters

**Hackathon MVP approach:**
- Single verifier oracle (centralized)
- Simple semantic matching (gameable)
- No appeal mechanism (unfair)
- Manual deployment (not scalable)

**Production approach:**
- Multi-oracle consensus (decentralized)
- Multi-factor quality scoring with ML (robust)
- On-chain appeals + governance (fair)
- Automated deployment + monitoring (scalable)

**The difference:** MVP gets attention. Production gets **adoption**.

---

## Phase 1: Core Protocol Design (Week 1-2)

### 1.1 Threat Modeling & Attack Vectors

**Goal:** Identify and mitigate all attack vectors before writing code

#### Attack Vector 1: Sybil Attacks on Verifiers
**Scenario:** Malicious actor spins up 100 verifier nodes, controls majority vote

**Mitigation:**
```rust
// x402-escrow/programs/escrow/src/state.rs
#[account]
pub struct VerifierRegistry {
    pub verifiers: Vec<RegisteredVerifier>,
    pub min_stake: u64,          // 10,000 USDC minimum
    pub reputation_threshold: u8, // Must have 80+ reputation
}

#[account]
pub struct RegisteredVerifier {
    pub pubkey: Pubkey,
    pub stake_amount: u64,        // Slashable stake
    pub reputation_score: u8,     // 0-100 based on accuracy
    pub disputes_resolved: u64,
    pub accuracy_rate: f32,       // % of votes matching consensus
}
```

**Implementation:**
- Require 10,000 USDC stake per verifier (economic cost)
- Reputation-weighted voting (new verifiers have less weight)
- Slash stake for dishonest votes (detect via consensus deviation)
- Quadratic voting (√stake instead of linear)

#### Attack Vector 2: Data Withholding
**Scenario:** API delivers data, then deletes it before dispute window closes

**Mitigation:**
```typescript
// x402-sdk/src/client.ts
export class KamiyoClient {
  async pay(params: PaymentParams): Promise<AccessToken> {
    // Store content hash on-chain for dispute evidence
    const response = await this.api.query(params.query);
    const contentHash = sha256(JSON.stringify(response));

    await this.escrow.initialize({
      ...params,
      content_hash: contentHash,  // Stored on-chain
      ipfs_cid: await this.uploadToIPFS(response) // Backup to IPFS
    });
  }
}
```

**Implementation:**
- Content hash stored in escrow account
- Full response uploaded to IPFS (pin for 30 days)
- Verifiers check hash matches IPFS content
- If mismatch → Auto-refund to agent

#### Attack Vector 3: Oracle Manipulation
**Scenario:** Agent bribes verifier to give low quality scores

**Mitigation:**
```rust
// Commit-reveal scheme for verifier votes
pub fn commit_quality_score(
    ctx: Context<CommitScore>,
    score_hash: [u8; 32], // Hash of (score + random salt)
) -> Result<()> {
    // Phase 1: All verifiers commit hashes (can't see others' votes)
}

pub fn reveal_quality_score(
    ctx: Context<RevealScore>,
    score: u8,
    salt: [u8; 32],
) -> Result<()> {
    // Phase 2: Reveal scores after all commits submitted
    // Slash stake if revealed score doesn't match commit
}
```

**Implementation:**
- Two-phase commit-reveal voting
- Verifiers can't see others' votes before committing
- Slashing for revealed score != committed hash
- Time-lock between phases (1 hour)

### 1.2 Verifier Quality Scoring Algorithm (Expert-Level)

**Goal:** Objective, tamper-proof, multi-dimensional quality assessment

#### Factor 1: Semantic Similarity (40% weight)
**Not just cosine similarity - use ensemble approach:**

```python
# x402-verifier/verifier/scoring/semantic.py
from sentence_transformers import SentenceTransformer
from transformers import AutoModel
import torch

class SemanticScorer:
    def __init__(self):
        # Ensemble of 3 models for robustness
        self.models = [
            SentenceTransformer('all-MiniLM-L6-v2'),      # Fast
            SentenceTransformer('all-mpnet-base-v2'),     # Accurate
            AutoModel.from_pretrained('microsoft/codebert-base')  # Code-aware
        ]

    def calculate_similarity(
        self,
        original_query: str,
        data_received: dict
    ) -> float:
        # Extract textual content from data
        data_text = self._extract_text(data_received)

        # Get embeddings from all 3 models
        scores = []
        for model in self.models:
            query_emb = model.encode(original_query)
            data_emb = model.encode(data_text)

            # Cosine similarity
            similarity = cosine_similarity(
                query_emb.reshape(1, -1),
                data_emb.reshape(1, -1)
            )[0][0]
            scores.append(similarity)

        # Weighted average (more weight to accurate model)
        semantic_score = (
            scores[0] * 0.2 +  # Fast model
            scores[1] * 0.6 +  # Accurate model
            scores[2] * 0.2    # Code-aware model
        )

        return semantic_score
```

#### Factor 2: Completeness (40% weight)
**Deep structural analysis:**

```python
# x402-verifier/verifier/scoring/completeness.py
class CompletenessScorer:
    def calculate_completeness(
        self,
        query: str,
        data: dict,
        expected_criteria: list[str]
    ) -> float:
        scores = []

        # 1. Record count validation
        if 'expected_count' in query_metadata:
            expected_count = extract_count_from_query(query)
            actual_count = len(data.get('items', []))
            count_score = min(actual_count / expected_count, 1.0)
            scores.append(count_score)

        # 2. Schema completeness
        expected_fields = infer_expected_schema(query, expected_criteria)
        actual_fields = extract_schema(data)
        schema_score = len(actual_fields & expected_fields) / len(expected_fields)
        scores.append(schema_score)

        # 3. Criteria coverage (keyword matching)
        data_text = str(data).lower()
        criteria_matched = sum(
            1 for criterion in expected_criteria
            if criterion.lower() in data_text
        )
        criteria_score = criteria_matched / len(expected_criteria)
        scores.append(criteria_score)

        # 4. Data density (non-null fields)
        total_fields = count_all_fields(data)
        non_null_fields = count_non_null_fields(data)
        density_score = non_null_fields / total_fields if total_fields > 0 else 0
        scores.append(density_score)

        # 5. Temporal coverage (for time-series data)
        if is_time_series_query(query):
            time_range_score = calculate_time_range_coverage(query, data)
            scores.append(time_range_score)

        # Weighted average
        return sum(scores) / len(scores)
```

#### Factor 3: Freshness (20% weight)
**Timestamp validation with decay:**

```python
# x402-verifier/verifier/scoring/freshness.py
class FreshnessScorer:
    def calculate_freshness(self, query: str, data: dict) -> float:
        # Extract all timestamps from data
        timestamps = extract_timestamps(data)

        if not timestamps:
            # No timestamps → Check data creation time
            if 'timestamp' in data:
                return self._timestamp_freshness(data['timestamp'])
            return 0.5  # Neutral score

        # Calculate average age
        now = datetime.utcnow()
        ages_days = [(now - ts).days for ts in timestamps]
        avg_age = sum(ages_days) / len(ages_days)

        # Query-aware decay
        query_type = classify_query_type(query)

        if query_type == 'real_time':
            # Real-time queries: Exponential decay (steep)
            # Fresh (0-1 day) = 1.0
            # Medium (1-7 days) = 0.3
            # Old (7+ days) = 0.0
            if avg_age <= 1:
                return 1.0
            elif avg_age <= 7:
                return 1.0 - (avg_age - 1) / 6 * 0.7
            else:
                return 0.0

        elif query_type == 'historical':
            # Historical queries: Linear decay (gentle)
            # Fresh (0-30 days) = 1.0
            # Medium (30-90 days) = 0.7
            # Old (90-365 days) = 0.3
            if avg_age <= 30:
                return 1.0
            elif avg_age <= 90:
                return 0.7
            elif avg_age <= 365:
                return 0.3
            else:
                return 0.1

        elif query_type == 'comprehensive':
            # Comprehensive queries: Value OLD data too
            # Want both recent AND historical
            # Score = (recent_coverage + historical_coverage) / 2
            recent_count = sum(1 for age in ages_days if age <= 30)
            historical_count = sum(1 for age in ages_days if 30 < age <= 365)

            recent_score = min(recent_count / 5, 1.0)  # Want 5+ recent
            historical_score = min(historical_count / 10, 1.0)  # Want 10+ historical

            return (recent_score + historical_score) / 2

        return 0.5
```

### 1.3 Multi-Oracle Consensus Mechanism

**Goal:** Decentralized verification with Byzantine fault tolerance

```rust
// x402-escrow/programs/escrow/src/consensus.rs
use anchor_lang::prelude::*;

#[account]
pub struct DisputeConsensus {
    pub dispute_id: Pubkey,
    pub verifier_votes: Vec<VerifierVote>,
    pub consensus_reached: bool,
    pub final_quality_score: Option<u8>,
    pub refund_percentage: Option<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VerifierVote {
    pub verifier: Pubkey,
    pub quality_score: u8,
    pub commit_hash: [u8; 32],
    pub revealed: bool,
    pub timestamp: i64,
}

impl DisputeConsensus {
    /// Calculate weighted consensus from verifier votes
    ///
    /// Algorithm:
    /// 1. Filter out outliers (>2 std dev from median)
    /// 2. Weight by verifier reputation
    /// 3. Weight by stake amount (√stake)
    /// 4. Calculate weighted median (more robust than mean)
    pub fn calculate_consensus(&mut self) -> Result<(u8, u8)> {
        require!(
            self.verifier_votes.len() >= 3,
            ErrorCode::InsufficientVerifiers
        );

        // Step 1: Extract revealed scores
        let revealed_votes: Vec<&VerifierVote> = self.verifier_votes
            .iter()
            .filter(|v| v.revealed)
            .collect();

        require!(
            revealed_votes.len() >= 3,
            ErrorCode::InsufficientReveals
        );

        // Step 2: Load verifier metadata (reputation, stake)
        let verifier_metadata = load_verifier_metadata(&revealed_votes)?;

        // Step 3: Filter outliers
        let scores: Vec<u8> = revealed_votes.iter().map(|v| v.quality_score).collect();
        let median_score = calculate_median(&scores);
        let std_dev = calculate_std_dev(&scores);

        let filtered_votes: Vec<&VerifierVote> = revealed_votes
            .iter()
            .filter(|v| {
                let deviation = (v.quality_score as f32 - median_score as f32).abs();
                deviation <= 2.0 * std_dev
            })
            .copied()
            .collect();

        // Step 4: Calculate weighted scores
        let mut weighted_sum: f32 = 0.0;
        let mut weight_sum: f32 = 0.0;

        for vote in filtered_votes {
            let verifier_meta = verifier_metadata.get(&vote.verifier).unwrap();

            // Weight = (reputation / 100) * sqrt(stake)
            let reputation_weight = verifier_meta.reputation_score as f32 / 100.0;
            let stake_weight = (verifier_meta.stake_amount as f32).sqrt();
            let total_weight = reputation_weight * stake_weight;

            weighted_sum += vote.quality_score as f32 * total_weight;
            weight_sum += total_weight;
        }

        // Step 5: Final consensus score
        let consensus_score = (weighted_sum / weight_sum).round() as u8;

        // Step 6: Calculate refund percentage
        let refund_percentage = self.calculate_refund(consensus_score);

        Ok((consensus_score, refund_percentage))
    }

    fn calculate_refund(&self, quality_score: u8) -> u8 {
        // Sliding scale with configurable thresholds
        if quality_score >= 80 {
            0  // Full release
        } else if quality_score >= 50 {
            // Linear interpolation: (80 - score) / 30 * 100
            ((80 - quality_score) as f32 / 30.0 * 100.0) as u8
        } else {
            100  // Full refund
        }
    }
}
```

### 1.4 On-Chain Governance & Appeals

**Goal:** Fair dispute resolution with community oversight

```rust
// x402-escrow/programs/governance/src/lib.rs
use anchor_lang::prelude::*;

#[program]
pub mod x402_governance {
    use super::*;

    /// File an appeal against a dispute resolution
    ///
    /// Requires:
    /// - Appeal fee (5 USDC, prevents spam)
    /// - Valid reason (enum: OutlierScore, ProofOfCorrectness, OracleCollusion)
    /// - Supporting evidence (IPFS hash)
    pub fn file_appeal(
        ctx: Context<FileAppeal>,
        dispute_id: Pubkey,
        reason: AppealReason,
        evidence_ipfs: String,
    ) -> Result<()> {
        let appeal = &mut ctx.accounts.appeal;

        appeal.dispute_id = dispute_id;
        appeal.appellant = ctx.accounts.agent.key();
        appeal.reason = reason;
        appeal.evidence_ipfs = evidence_ipfs;
        appeal.status = AppealStatus::Pending;
        appeal.created_at = Clock::get()?.unix_timestamp;

        // Transfer appeal fee to governance treasury
        transfer_appeal_fee(ctx, 5_000_000)?; // 5 USDC

        emit!(AppealFiled {
            dispute_id,
            appellant: ctx.accounts.agent.key(),
            reason,
        });

        Ok(())
    }

    /// Vote on appeal (governance token holders)
    pub fn vote_on_appeal(
        ctx: Context<VoteOnAppeal>,
        vote: AppealVote,
    ) -> Result<()> {
        let appeal = &mut ctx.accounts.appeal;
        let voter_stake = ctx.accounts.voter_stake_account.amount;

        require!(
            voter_stake >= 100_000_000, // Must hold 100 $X402 tokens
            ErrorCode::InsufficientGovernanceStake
        );

        // Record vote (quadratic voting: weight = sqrt(stake))
        let vote_weight = (voter_stake as f32).sqrt() as u64;

        match vote {
            AppealVote::Uphold => appeal.uphold_votes += vote_weight,
            AppealVote::Overturn => appeal.overturn_votes += vote_weight,
        }

        // Check if quorum reached (10% of total supply)
        let total_votes = appeal.uphold_votes + appeal.overturn_votes;
        if total_votes >= ctx.accounts.governance.quorum_threshold {
            // Resolve appeal
            if appeal.overturn_votes > appeal.uphold_votes {
                // Appeal successful - reverse refund
                appeal.status = AppealStatus::Overturned;
                execute_appeal_refund_reversal(ctx)?;
            } else {
                // Appeal rejected - original decision stands
                appeal.status = AppealStatus::Upheld;
                // Burn appeal fee (penalty for failed appeal)
            }
        }

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum AppealReason {
    OutlierScore,       // Consensus score was statistical outlier
    ProofOfCorrectness, // Agent has proof data was correct
    OracleCollusion,    // Evidence of verifier manipulation
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum AppealStatus {
    Pending,
    Upheld,      // Original decision stands
    Overturned,  // Appeal successful, refund reversed
}
```

---

## Phase 2: Advanced Escrow Program (Week 3-4)

### 2.1 Multi-Signature Time-Locked Escrow

**Features:**
- Multiple dispute windows (immediate, 24h, 7d)
- Partial releases (stream payments over time)
- Conditional releases (trigger on external events)
- Emergency recovery (governance-approved)

```rust
// x402-escrow/programs/escrow/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("X402Esc11111111111111111111111111111111111");

#[program]
pub mod x402_escrow {
    use super::*;

    /// Initialize escrow with advanced features
    pub fn initialize_escrow_v2(
        ctx: Context<InitializeEscrowV2>,
        params: EscrowParams,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        // Basic setup
        escrow.agent = ctx.accounts.agent.key();
        escrow.api = ctx.accounts.api.key();
        escrow.amount = params.amount;
        escrow.status = EscrowStatus::Active;
        escrow.created_at = clock.unix_timestamp;
        escrow.transaction_id = params.transaction_id;
        escrow.bump = ctx.bumps.escrow;

        // Advanced features
        escrow.dispute_window_hours = params.dispute_window_hours;
        escrow.auto_release_enabled = params.auto_release_enabled;
        escrow.partial_release_schedule = params.partial_release_schedule;
        escrow.required_verifiers = params.required_verifiers;
        escrow.content_hash = params.content_hash;
        escrow.ipfs_cid = params.ipfs_cid;

        // Calculate time-lock deadlines
        escrow.expires_at = clock.unix_timestamp + (params.dispute_window_hours * 3600);

        // Transfer SOL to escrow PDA
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.agent.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, params.amount)?;

        emit!(EscrowCreated {
            escrow_pubkey: escrow.key(),
            agent: escrow.agent,
            api: escrow.api,
            amount: escrow.amount,
            dispute_window_hours: escrow.dispute_window_hours,
        });

        Ok(())
    }

    /// Partial release (stream payments)
    ///
    /// Allows releasing funds incrementally as quality is validated
    /// Example: Release 25% every 6 hours if no disputes
    pub fn partial_release(
        ctx: Context<PartialRelease>,
        release_percentage: u8,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let clock = Clock::get()?;

        require!(
            escrow.status == EscrowStatus::Active,
            ErrorCode::InvalidStatus
        );

        require!(
            release_percentage <= 100,
            ErrorCode::InvalidReleasePercentage
        );

        // Check release schedule
        if let Some(schedule) = &escrow.partial_release_schedule {
            let elapsed_hours = (clock.unix_timestamp - escrow.created_at) / 3600;
            let allowed_release = schedule.calculate_allowed_release(elapsed_hours);

            require!(
                escrow.total_released + release_percentage <= allowed_release,
                ErrorCode::ReleaseScheduleViolation
            );
        }

        // Calculate release amount
        let release_amount = (escrow.amount as u128 * release_percentage as u128 / 100) as u64;

        // Transfer from escrow to API
        let seeds = &[
            b"escrow",
            escrow.transaction_id.as_bytes(),
            &[escrow.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.escrow.to_account_info(),
                to: ctx.accounts.api.to_account_info(),
            },
            signer,
        );
        anchor_lang::system_program::transfer(cpi_context, release_amount)?;

        escrow.total_released += release_percentage;

        if escrow.total_released == 100 {
            escrow.status = EscrowStatus::Released;
        }

        emit!(PartialReleaseExecuted {
            escrow_pubkey: escrow.key(),
            release_percentage,
            release_amount,
            total_released: escrow.total_released,
        });

        Ok(())
    }

    /// Resolve dispute with multi-oracle consensus
    pub fn resolve_dispute_v2(
        ctx: Context<ResolveDisputeV2>,
        consensus_result: ConsensusResult,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let consensus = &ctx.accounts.consensus;

        require!(
            escrow.status == EscrowStatus::Disputed,
            ErrorCode::InvalidStatus
        );

        require!(
            consensus.consensus_reached,
            ErrorCode::ConsensusNotReached
        );

        // Verify consensus result
        require!(
            consensus.dispute_id == escrow.key(),
            ErrorCode::ConsensusMismatch
        );

        require!(
            consensus.verifier_votes.len() >= escrow.required_verifiers as usize,
            ErrorCode::InsufficientVerifiers
        );

        // Execute refund split
        let quality_score = consensus.final_quality_score.unwrap();
        let refund_percentage = consensus.refund_percentage.unwrap();

        let refund_amount = (escrow.amount as u128 * refund_percentage as u128 / 100) as u64;
        let payment_amount = escrow.amount - refund_amount;

        msg!("Resolving dispute:");
        msg!("  Quality Score: {}", quality_score);
        msg!("  Refund: {} SOL ({}%)", refund_amount as f64 / 1_000_000_000.0, refund_percentage);
        msg!("  Payment: {} SOL ({}%)", payment_amount as f64 / 1_000_000_000.0, 100 - refund_percentage);

        // Transfer refund to agent
        if refund_amount > 0 {
            let seeds = &[
                b"escrow",
                escrow.transaction_id.as_bytes(),
                &[escrow.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.agent.to_account_info(),
                },
                signer,
            );
            anchor_lang::system_program::transfer(cpi_context, refund_amount)?;
        }

        // Transfer payment to API
        if payment_amount > 0 {
            let seeds = &[
                b"escrow",
                escrow.transaction_id.as_bytes(),
                &[escrow.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_context = CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.escrow.to_account_info(),
                    to: ctx.accounts.api.to_account_info(),
                },
                signer,
            );
            anchor_lang::system_program::transfer(cpi_context, payment_amount)?;
        }

        escrow.status = EscrowStatus::Resolved;
        escrow.quality_score = Some(quality_score);
        escrow.refund_percentage = Some(refund_percentage);

        emit!(DisputeResolved {
            escrow_pubkey: escrow.key(),
            quality_score,
            refund_percentage,
            refund_amount,
            payment_amount,
        });

        Ok(())
    }
}

// State structures
#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub agent: Pubkey,                         // 32
    pub api: Pubkey,                           // 32
    pub amount: u64,                           // 8
    pub status: EscrowStatus,                  // 1 + 1
    pub created_at: i64,                       // 8
    pub expires_at: i64,                       // 8
    #[max_len(64)]
    pub transaction_id: String,                // 4 + 64
    pub bump: u8,                              // 1
    pub quality_score: Option<u8>,             // 1 + 1
    pub refund_percentage: Option<u8>,         // 1 + 1

    // V2 features
    pub dispute_window_hours: u16,             // 2
    pub auto_release_enabled: bool,            // 1
    pub required_verifiers: u8,                // 1 (minimum 3)
    #[max_len(32)]
    pub content_hash: String,                  // 4 + 32 (SHA-256)
    #[max_len(64)]
    pub ipfs_cid: String,                      // 4 + 64
    pub total_released: u8,                    // 1 (percentage)
    pub partial_release_schedule: Option<ReleaseSchedule>, // 1 + schedule size
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct ReleaseSchedule {
    pub interval_hours: u16,
    pub release_percentage_per_interval: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ConsensusResult {
    pub quality_score: u8,
    pub refund_percentage: u8,
    pub verifier_signatures: Vec<[u8; 64]>,
}

// Events
#[event]
pub struct EscrowCreated {
    pub escrow_pubkey: Pubkey,
    pub agent: Pubkey,
    pub api: Pubkey,
    pub amount: u64,
    pub dispute_window_hours: u16,
}

#[event]
pub struct DisputeResolved {
    pub escrow_pubkey: Pubkey,
    pub quality_score: u8,
    pub refund_percentage: u8,
    pub refund_amount: u64,
    pub payment_amount: u64,
}

#[event]
pub struct PartialReleaseExecuted {
    pub escrow_pubkey: Pubkey,
    pub release_percentage: u8,
    pub release_amount: u64,
    pub total_released: u8,
}
```

### 2.2 Verifier Staking & Slashing

```rust
// x402-escrow/programs/verifier-registry/src/lib.rs
#[program]
pub mod verifier_registry {
    use super::*;

    /// Register as a verifier oracle
    ///
    /// Requirements:
    /// - Stake 10,000 USDC (slashable)
    /// - Prove server uptime (health check endpoint)
    /// - Provide Ed25519 public key
    pub fn register_verifier(
        ctx: Context<RegisterVerifier>,
        server_url: String,
        public_key: Pubkey,
    ) -> Result<()> {
        let verifier = &mut ctx.accounts.verifier;

        // Transfer stake from verifier to vault
        transfer_stake(ctx, 10_000_000_000)?; // 10,000 USDC

        verifier.owner = ctx.accounts.owner.key();
        verifier.public_key = public_key;
        verifier.server_url = server_url;
        verifier.stake_amount = 10_000_000_000;
        verifier.reputation_score = 50; // Start at neutral
        verifier.disputes_resolved = 0;
        verifier.accuracy_rate = 0.0;
        verifier.total_slashed = 0;
        verifier.status = VerifierStatus::Active;
        verifier.registered_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Slash verifier for dishonest behavior
    ///
    /// Triggers:
    /// - Vote deviates >2 std dev from consensus
    /// - Commit-reveal mismatch
    /// - Server downtime during dispute
    pub fn slash_verifier(
        ctx: Context<SlashVerifier>,
        dispute_id: Pubkey,
        slash_percentage: u8, // 1-100%
        reason: SlashReason,
    ) -> Result<()> {
        let verifier = &mut ctx.accounts.verifier;
        let consensus = &ctx.accounts.consensus;

        // Verify slash is justified
        match reason {
            SlashReason::OutlierVote => {
                verify_outlier_slash(verifier, consensus)?;
            },
            SlashReason::CommitRevealMismatch => {
                verify_commit_mismatch(verifier, consensus)?;
            },
            SlashReason::ServerDowntime => {
                verify_downtime_slash(verifier, dispute_id)?;
            },
        }

        // Calculate slash amount
        let slash_amount = (verifier.stake_amount as u128 * slash_percentage as u128 / 100) as u64;

        // Execute slash
        verifier.stake_amount -= slash_amount;
        verifier.total_slashed += slash_amount;
        verifier.reputation_score = verifier.reputation_score.saturating_sub(slash_percentage / 2);

        // If stake drops below minimum, deactivate
        if verifier.stake_amount < 5_000_000_000 { // 5,000 USDC minimum
            verifier.status = VerifierStatus::Deactivated;
        }

        // Transfer slashed funds to governance treasury
        transfer_to_treasury(ctx, slash_amount)?;

        emit!(VerifierSlashed {
            verifier_pubkey: verifier.key(),
            slash_amount,
            slash_percentage,
            reason,
            remaining_stake: verifier.stake_amount,
        });

        Ok(())
    }
}
```

---

## Phase 3: Distributed Verifier Network (Week 5-6)

### 3.1 Verifier Node Implementation

**Stack:** Python + FastAPI + PostgreSQL + Redis

```python
# x402-verifier/verifier/node.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncio
from typing import List, Optional
import redis
from sqlalchemy.ext.asyncio import AsyncSession

from .scoring import SemanticScorer, CompletenessScorer, FreshnessScorer
from .crypto import Ed25519Signer
from .consensus import ConsensusClient

app = FastAPI(
    title="x402 Verifier Node",
    version="2.0.0"
)

class VerifierNode:
    """
    Production-grade verifier node

    Features:
    - Multi-factor quality scoring
    - Commit-reveal voting
    - Stake management
    - Reputation tracking
    - Health monitoring
    """

    def __init__(
        self,
        node_id: str,
        private_key: bytes,
        stake_amount: int,
        redis_client: redis.Redis,
        db_session: AsyncSession
    ):
        self.node_id = node_id
        self.signer = Ed25519Signer(private_key)
        self.stake_amount = stake_amount
        self.redis = redis_client
        self.db = db_session

        # Scoring engines
        self.semantic_scorer = SemanticScorer()
        self.completeness_scorer = CompletenessScorer()
        self.freshness_scorer = FreshnessScorer()

        # Consensus client (communicates with other verifiers)
        self.consensus_client = ConsensusClient(node_id)

        self.reputation_score = 50  # Start neutral
        self.total_disputes_resolved = 0

    async def handle_dispute(
        self,
        dispute: DisputeRequest
    ) -> DisputeResolution:
        """
        Main dispute handling pipeline

        Steps:
        1. Fetch data from IPFS (verify content hash)
        2. Calculate quality scores (semantic, completeness, freshness)
        3. Commit score hash (Phase 1)
        4. Wait for other verifiers to commit
        5. Reveal score (Phase 2)
        6. Participate in consensus
        7. Sign result
        """

        # Step 1: Fetch and verify data
        data = await self._fetch_from_ipfs(dispute.ipfs_cid)
        content_hash = calculate_hash(data)

        if content_hash != dispute.content_hash:
            raise ValueError("Content hash mismatch - data tampering detected")

        # Step 2: Calculate quality scores
        semantic_score = await self.semantic_scorer.calculate_similarity(
            dispute.original_query,
            data
        )

        completeness_score = await self.completeness_scorer.calculate_completeness(
            dispute.original_query,
            data,
            dispute.expected_criteria
        )

        freshness_score = await self.freshness_scorer.calculate_freshness(
            dispute.original_query,
            data
        )

        # Weighted average
        quality_score = int((
            semantic_score * 0.4 +
            completeness_score * 0.4 +
            freshness_score * 0.2
        ) * 100)

        # Log scores for transparency
        await self.db.execute(
            """
            INSERT INTO dispute_scores (dispute_id, verifier_id, quality_score, semantic, completeness, freshness)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            dispute.id, self.node_id, quality_score, semantic_score, completeness_score, freshness_score
        )

        # Step 3: Commit phase (hide score from other verifiers)
        salt = generate_random_salt()
        score_hash = hash_score_with_salt(quality_score, salt)

        await self.consensus_client.commit_score(
            dispute_id=dispute.id,
            score_hash=score_hash,
            verifier_id=self.node_id
        )

        # Step 4: Wait for all verifiers to commit
        await self._wait_for_commits(dispute.id, min_verifiers=3)

        # Step 5: Reveal phase
        await self.consensus_client.reveal_score(
            dispute_id=dispute.id,
            quality_score=quality_score,
            salt=salt,
            verifier_id=self.node_id
        )

        # Step 6: Wait for consensus
        consensus_result = await self._wait_for_consensus(dispute.id)

        # Step 7: Sign consensus result
        signature = self.signer.sign(consensus_result.serialize())

        # Update reputation
        await self._update_reputation(
            my_score=quality_score,
            consensus_score=consensus_result.final_score
        )

        return DisputeResolution(
            dispute_id=dispute.id,
            quality_score=consensus_result.final_score,
            refund_percentage=consensus_result.refund_percentage,
            verifier_signature=signature
        )

    async def _update_reputation(self, my_score: int, consensus_score: int):
        """
        Update reputation based on agreement with consensus

        If vote within 10 points of consensus → +1 reputation
        If vote within 20 points → 0 (neutral)
        If vote >20 points away → -2 reputation (penalize outliers)
        """
        deviation = abs(my_score - consensus_score)

        if deviation <= 10:
            reputation_change = +1
        elif deviation <= 20:
            reputation_change = 0
        else:
            reputation_change = -2

        self.reputation_score = max(0, min(100, self.reputation_score + reputation_change))
        self.total_disputes_resolved += 1

        # Persist to database
        await self.db.execute(
            """
            UPDATE verifiers
            SET reputation_score = $1, total_disputes = $2
            WHERE node_id = $3
            """,
            self.reputation_score, self.total_disputes_resolved, self.node_id
        )
```

### 3.2 Consensus Algorithm Implementation

```python
# x402-verifier/verifier/consensus.py
import asyncio
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class VerifierVote:
    verifier_id: str
    quality_score: int
    commit_hash: str
    revealed: bool
    timestamp: int
    reputation: int
    stake: int

class ConsensusEngine:
    """
    Byzantine fault-tolerant consensus for quality scores

    Algorithm:
    1. Collect votes from N verifiers (N >= 3)
    2. Filter outliers (>2 std dev from median)
    3. Weight by reputation and stake
    4. Calculate weighted median
    5. Determine refund percentage
    """

    async def calculate_consensus(
        self,
        votes: List[VerifierVote],
        min_verifiers: int = 3
    ) -> ConsensusResult:
        if len(votes) < min_verifiers:
            raise ValueError(f"Need at least {min_verifiers} verifiers, got {len(votes)}")

        # Step 1: Extract revealed scores
        revealed_votes = [v for v in votes if v.revealed]

        if len(revealed_votes) < min_verifiers:
            raise ValueError("Not enough verifiers revealed scores")

        # Step 2: Calculate statistics
        scores = [v.quality_score for v in revealed_votes]
        median_score = self._calculate_median(scores)
        std_dev = self._calculate_std_dev(scores)

        # Step 3: Filter outliers
        filtered_votes = [
            v for v in revealed_votes
            if abs(v.quality_score - median_score) <= 2 * std_dev
        ]

        if len(filtered_votes) < 2:
            # If too many outliers, use all votes (prevents attack)
            filtered_votes = revealed_votes

        # Step 4: Calculate weighted scores
        weighted_sum = 0.0
        weight_sum = 0.0

        for vote in filtered_votes:
            # Weight = (reputation / 100) * sqrt(stake)
            reputation_weight = vote.reputation / 100.0
            stake_weight = (vote.stake ** 0.5)
            total_weight = reputation_weight * stake_weight

            weighted_sum += vote.quality_score * total_weight
            weight_sum += total_weight

        consensus_score = int(weighted_sum / weight_sum)

        # Step 5: Calculate refund
        refund_percentage = self._calculate_refund(consensus_score)

        # Step 6: Identify outliers for slashing
        outliers = [
            v for v in revealed_votes
            if v not in filtered_votes
        ]

        return ConsensusResult(
            final_score=consensus_score,
            refund_percentage=refund_percentage,
            participating_verifiers=[v.verifier_id for v in filtered_votes],
            outlier_verifiers=[v.verifier_id for v in outliers],
            median_score=median_score,
            std_dev=std_dev
        )

    def _calculate_refund(self, quality_score: int) -> int:
        """
        Sliding scale refund calculation

        80-100: 0% refund (excellent quality)
        70-79: 10% refund (good quality, minor issues)
        60-69: 20% refund (acceptable quality)
        50-59: 40% refund (poor quality)
        40-49: 60% refund (very poor quality)
        30-39: 80% refund (unacceptable)
        0-29: 100% refund (complete failure)
        """
        if quality_score >= 80:
            return 0
        elif quality_score >= 70:
            return 10
        elif quality_score >= 60:
            return 20
        elif quality_score >= 50:
            return 40
        elif quality_score >= 40:
            return 60
        elif quality_score >= 30:
            return 80
        else:
            return 100
```

---

## Phase 4: TypeScript SDK (Production-Grade) (Week 7)

### 4.1 Full-Featured SDK

```typescript
// x402-sdk/src/client.ts
import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@project-serum/anchor';
import axios from 'axios';
import { EventEmitter } from 'events';

export interface X402ClientConfig {
  apiUrl: string;
  chain: 'solana' | 'ethereum' | 'base';
  walletKeypair?: Keypair;
  rpcUrl?: string;
  verifierRegistry?: PublicKey;
  escrowProgram?: PublicKey;
  enablex402Resolve?: boolean;
  disputeWindowHours?: number;
  autoRelease?: boolean;
  requiredVerifiers?: number;
}

export class X402Client extends EventEmitter {
  private connection: Connection;
  private wallet: Wallet;
  private escrowProgram: Program;
  private apiClient: axios.AxiosInstance;

  constructor(config: X402ClientConfig) {
    super();

    this.connection = new Connection(
      config.rpcUrl || 'https://api.devnet.solana.com',
      'confirmed'
    );

    this.wallet = new Wallet(config.walletKeypair || Keypair.generate());

    // Initialize Anchor program
    const provider = new AnchorProvider(this.connection, this.wallet, {});
    this.escrowProgram = new Program(ESCROW_IDL, config.escrowProgram, provider);

    this.apiClient = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000
    });
  }

  /**
   * Pay with escrow and automatic dispute resolution
   */
  async pay(params: PaymentParams): Promise<PaymentResult> {
    // Step 1: Fetch data from API
    const response = await this.apiClient.post('/query', {
      query: params.query,
      filters: params.filters
    });

    const data = response.data;

    // Step 2: Upload data to IPFS for evidence
    const ipfsCid = await this.uploadToIPFS(data);
    const contentHash = this.hashContent(data);

    // Step 3: Create escrow on-chain
    const transactionId = this.generateTransactionId();
    const escrowPda = this.deriveEscrowPda(transactionId);

    const tx = await this.escrowProgram.methods
      .initializeEscrowV2({
        amount: params.amount,
        transactionId,
        disputeWindowHours: params.disputeWindowHours || 24,
        autoReleaseEnabled: params.autoRelease ?? true,
        partialReleaseSchedule: params.partialReleaseSchedule || null,
        requiredVerifiers: params.requiredVerifiers || 3,
        contentHash,
        ipfsCid
      })
      .accounts({
        escrow: escrowPda,
        agent: this.wallet.publicKey,
        api: new PublicKey(params.recipientPublicKey),
        systemProgram: SystemProgram.programId
      })
      .rpc();

    this.emit('payment:created', {
      transactionId,
      escrowAddress: escrowPda.toBase58(),
      amount: params.amount
    });

    return {
      transactionId,
      escrowAddress: escrowPda.toBase58(),
      data,
      ipfsCid,
      expiresAt: Date.now() + params.disputeWindowHours * 3600 * 1000
    };
  }

  /**
   * File a dispute and trigger automatic resolution
   */
  async dispute(params: DisputeParams): Promise<DisputeResolution> {
    const escrowPda = this.deriveEscrowPda(params.transactionId);

    // Step 1: Mark escrow as disputed on-chain
    await this.escrowProgram.methods
      .markDisputed()
      .accounts({
        escrow: escrowPda,
        agent: this.wallet.publicKey
      })
      .rpc();

    this.emit('dispute:filed', {
      transactionId: params.transactionId,
      reason: params.reason
    });

    // Step 2: Submit dispute to verifier network
    const disputeRequest = {
      dispute_id: params.transactionId,
      original_query: params.originalQuery,
      data_received: params.dataReceived,
      expected_criteria: params.expectedCriteria,
      ipfs_cid: params.ipfsCid,
      content_hash: params.contentHash
    };

    // Broadcast to all registered verifiers
    const verifiers = await this.getRegisteredVerifiers();
    const verifierPromises = verifiers.map(v =>
      axios.post(`${v.serverUrl}/disputes`, disputeRequest)
    );

    await Promise.allSettled(verifierPromises);

    // Step 3: Wait for consensus
    const consensusResult = await this.waitForConsensus(params.transactionId);

    this.emit('consensus:reached', {
      transactionId: params.transactionId,
      qualityScore: consensusResult.final_score,
      refundPercentage: consensusResult.refund_percentage
    });

    // Step 4: Execute refund on-chain
    const consensusPda = this.deriveConsensusPda(params.transactionId);

    await this.escrowProgram.methods
      .resolveDisputeV2({
        qualityScore: consensusResult.final_score,
        refundPercentage: consensusResult.refund_percentage,
        verifierSignatures: consensusResult.signatures
      })
      .accounts({
        escrow: escrowPda,
        consensus: consensusPda,
        agent: this.wallet.publicKey,
        api: new PublicKey(params.apiPublicKey),
        systemProgram: SystemProgram.programId
      })
      .rpc();

    this.emit('dispute:resolved', {
      transactionId: params.transactionId,
      qualityScore: consensusResult.final_score,
      refundPercentage: consensusResult.refund_percentage,
      refundAmount: params.amount * consensusResult.refund_percentage / 100
    });

    return {
      disputeId: params.transactionId,
      status: 'resolved',
      qualityScore: consensusResult.final_score,
      refundPercentage: consensusResult.refund_percentage,
      refundAmount: params.amount * consensusResult.refund_percentage / 100,
      consensusReached: true,
      verifiersParticipated: verifiers.length
    };
  }

  /**
   * Monitor dispute status (polling or websocket)
   */
  async monitorDispute(
    transactionId: string,
    onUpdate: (status: DisputeStatus) => void
  ): Promise<void> {
    const escrowPda = this.deriveEscrowPda(transactionId);

    // Subscribe to account changes
    const subscriptionId = this.connection.onAccountChange(
      escrowPda,
      (accountInfo) => {
        const escrow = this.escrowProgram.coder.accounts.decode(
          'Escrow',
          accountInfo.data
        );

        onUpdate({
          status: escrow.status,
          qualityScore: escrow.qualityScore,
          refundPercentage: escrow.refundPercentage,
          totalReleased: escrow.totalReleased
        });
      },
      'confirmed'
    );

    // Return cleanup function
    return () => this.connection.removeAccountChangeListener(subscriptionId);
  }

  /**
   * File an appeal (governance)
   */
  async fileAppeal(params: AppealParams): Promise<AppealResult> {
    const appealPda = this.deriveAppealPda(params.disputeId);

    // Upload evidence to IPFS
    const evidenceIpfs = await this.uploadToIPFS(params.evidence);

    await this.governanceProgram.methods
      .fileAppeal({
        disputeId: new PublicKey(params.disputeId),
        reason: params.reason,
        evidenceIpfs
      })
      .accounts({
        appeal: appealPda,
        agent: this.wallet.publicKey,
        governance: this.governancePda,
        systemProgram: SystemProgram.programId
      })
      .rpc();

    return {
      appealId: appealPda.toBase58(),
      disputeId: params.disputeId,
      status: 'pending',
      evidenceIpfs
    };
  }
}
```

---

## Phase 5: Infrastructure & DevOps (Week 8)

### 5.1 Deployment Architecture

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Verifier Node Cluster (3 nodes for redundancy)
  verifier-1:
    build: ./x402-verifier
    environment:
      - NODE_ID=verifier-1
      - PRIVATE_KEY=${VERIFIER_1_KEY}
      - STAKE_AMOUNT=10000000000
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/x402
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '2'
          memory: 4G

  verifier-2:
    build: ./x402-verifier
    environment:
      - NODE_ID=verifier-2
      - PRIVATE_KEY=${VERIFIER_2_KEY}
      - STAKE_AMOUNT=10000000000
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/x402
    depends_on:
      - redis
      - postgres

  verifier-3:
    build: ./x402-verifier
    environment:
      - NODE_ID=verifier-3
      - PRIVATE_KEY=${VERIFIER_3_KEY}
      - STAKE_AMOUNT=10000000000
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/x402
    depends_on:
      - redis
      - postgres

  # Redis for commit-reveal coordination
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  # PostgreSQL for dispute history
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=x402
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # IPFS node for evidence storage
  ipfs:
    image: ipfs/kubo:latest
    ports:
      - "5001:5001"  # API
      - "8080:8080"  # Gateway
    volumes:
      - ipfs_data:/data/ipfs

  # Monitoring (Prometheus + Grafana)
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  redis_data:
  postgres_data:
  ipfs_data:
  prometheus_data:
  grafana_data:
```

### 5.2 Monitoring & Alerting

```python
# x402-verifier/verifier/monitoring.py
from prometheus_client import Counter, Histogram, Gauge
import logging

# Metrics
disputes_total = Counter(
    'x402_disputes_total',
    'Total number of disputes processed',
    ['status']  # 'resolved', 'failed', 'timeout'
)

quality_score_distribution = Histogram(
    'x402_quality_score',
    'Distribution of quality scores',
    buckets=[0, 20, 40, 50, 60, 70, 80, 90, 100]
)

consensus_time_seconds = Histogram(
    'x402_consensus_time_seconds',
    'Time to reach consensus',
    buckets=[1, 2, 5, 10, 30, 60, 120]
)

active_disputes = Gauge(
    'x402_active_disputes',
    'Number of disputes currently being processed'
)

verifier_reputation = Gauge(
    'x402_verifier_reputation',
    'Current reputation score',
    ['verifier_id']
)

slash_events = Counter(
    'x402_slash_events_total',
    'Number of slash events',
    ['verifier_id', 'reason']
)
```

---

## Implementation Timeline

| Week | Phase | Deliverables |
|------|-------|-------------|
| 1-2 | Core Protocol Design | Threat model, attack mitigations, quality algorithm |
| 3-4 | Advanced Escrow Program | Multi-sig, partial releases, slashing, governance |
| 5-6 | Distributed Verifier Network | 3+ nodes, consensus, reputation, commit-reveal |
| 7 | Production SDK | Full TypeScript/Python clients, event monitoring |
| 8 | Infrastructure & DevOps | Docker, monitoring, CI/CD, deployment |

**Total: 8 weeks**

---

## Success Metrics

### Technical Excellence
-  Byzantine fault tolerance (3+ verifiers required)
-  Sub-10 second consensus time (99th percentile)
-  99.9% uptime (verifier node cluster)
-  Zero human intervention required
-  Slashing accuracy >95% (catches dishonest verifiers)

### Security
-  All attack vectors mitigated
-  Formal verification of escrow program (Soteria/Sec3)
-  External security audit (OtterSec/Neodyme)
-  Bug bounty program ($50K pool)

### Adoption
-  10+ verifier nodes registered (decentralized)
-  1,000+ disputes resolved (production load)
-  3+ external APIs integrated (beyond KAMIYO)
-  Documentation + video tutorials (developer onboarding)

---

## Beyond Hackathon: Productionization

### Month 1-3: Mainnet Launch
- Audit escrow program (OtterSec)
- Deploy to Solana mainnet
- Launch verifier incentive program
- Onboard 100+ API providers

### Month 4-6: Cross-Chain Expansion
- Wormhole integration (Ethereum ↔ Solana)
- Base escrow contracts (Solidity)
- Unified SDK (works across chains)

### Month 7-12: Governance & Tokenomics
- Launch $X402 governance token (SPL Token-2022)
- Verifier staking rewards (earn from protocol fees)
- DAO for protocol upgrades
- Appeals governance (token-weighted voting)

---

**This is the production roadmap. We build it right, once.**
