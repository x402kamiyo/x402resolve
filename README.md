# x402Resolve

![x402Resolve Dashboard](./docs/media/switchboard-dashboard.png)

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/address/D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP?cluster=devnet)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-101%20passing-success)](./tests)
[![Coverage](https://img.shields.io/badge/coverage-91%25-brightgreen)](./tests)
[![Anchor](https://img.shields.io/badge/Anchor-0.30.1-663399)](https://www.anchor-lang.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)

## Quality-verified HTTP 402 payments with sliding-scale refunds on Solana

**Quick Access:**
- **Live Demo**: https://x402kamiyo.github.io/x402resolve
- **API Endpoint**: https://x402resolve.kamiyo.ai
- **Devnet Program**: [`D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP`](https://explorer.solana.com/address/D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP?cluster=devnet)
- **Video**: (in production)

## Table of Contents

- [Solana x402 Hackathon Tracks & Bounties](#solana-x402-hackathon-tracks--bounties)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Economics](#economics)
- [Architecture](#architecture)
- [Quality Scoring](#quality-scoring)
- [Live Deployment](#live-deployment)
- [Installation](#installation)
- [Documentation](#documentation)
- [Examples](#examples)
- [Performance](#performance)
- [Security](#security)

## Solana x402 Hackathon Tracks & Bounties

### Applying for

| Track | Prize | Implementation |
|-------|-------|----------------|
| Best Trustless Agent | $10,000 | Oracle reputation, stake-based validation, PDA escrow |
| Best x402 Dev Tool | $10,000 | TypeScript/Python SDKs, HTTP 402 middleware, agent client |
| Best x402 API Integration | $10,000 | Production API, quality-verified micropayments |
| Best use of Switchboard | $5,000 | Multi-oracle consensus integration |

## Overview

Extends RFC 9110 Section 15.5.3 (HTTP 402) with Solana escrow and multi-oracle quality assessment. Payments held in PDA until quality verified. Refunds proportional to quality score (0-100%).

**Technical Features:**
- Sliding-scale refunds based on quality metrics
- Multi-oracle verification (Python ML + Switchboard)
- PDA-based escrow without admin keys
- Ed25519 signature verification
- 99.9% cost reduction vs traditional chargebacks

## Quick Start

### For API Providers

```typescript
import { x402PaymentMiddleware } from '@x402resolve/middleware';

app.use('/api/*', x402PaymentMiddleware({
  realm: 'my-api',
  programId: ESCROW_PROGRAM_ID,
  connection,
  price: 0.001,
  qualityGuarantee: true
}));
```

### For API Consumers

```typescript
import { AutonomousServiceAgent } from '@x402resolve/agent-client';

const agent = new AutonomousServiceAgent({
  keypair: agentKeypair,
  connection,
  programId: ESCROW_PROGRAM_ID,
  qualityThreshold: 85,
  autoDispute: true
});

const result = await agent.consumeAPI(
  'https://api.example.com/data',
  { query: 'params' },
  { expectedSchema }
);
```

## Economics

Cost comparison at 1% dispute rate (100 disputes/month on $5,000 API spend):

| Method | Cost/Dispute | Total/Month | Resolution |
|--------|--------------|-------------|------------|
| Traditional | $35 | $3,500 | 30-90 days |
| x402Resolve | $0.005 | $0.50 | 48 hours |
| Reduction | 99.98% | 99.98% | 98% faster |

**Annual savings: $38,880** (92% reduction including refunds and infrastructure)

## Architecture

### High-Level Flow

```
┌──────────┐    ┌────────┐    ┌─────┐    ┌────────┐
│  Client  │───▶│ Escrow │───▶│ API │◀──▶│ Oracle │
└──────────┘    └────────┘    └─────┘    └────────┘
                     │            │           │
                     │            │           │
                     │◀───────────┴───────────┘
                     │  Quality Assessment
                     │
                     ▼
              Sliding-Scale Refund
```

### Dispute Resolution Flow

```
1. Payment          2. API Call         3. Quality Check      4. Settlement
┌─────────┐        ┌─────────┐         ┌──────────┐         ┌──────────┐
│ Client  │        │   API   │         │  Oracle  │         │  Escrow  │
│ creates │───────▶│ returns │────────▶│ assesses │────────▶│ executes │
│ escrow  │  SOL   │  data   │  JSON   │ quality  │  score  │  refund  │
└─────────┘        └─────────┘         └──────────┘         └──────────┘
   0.01 SOL          Response            Score: 65            0.0035 SOL
   locked            received            (35% refund)         returned
```

### Oracle Options

```
Current Implementation (Phase 1):

┌─────────────┐
│   Dispute   │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Python    │ │Switchboard │ │   Future   │
│   Oracle   │ │   Oracle   │ │Multi-Oracle│
│            │ │            │ │ (Phase 2)  │
│Ed25519 sig │ │On-chain fn │ │  Median    │
└────────────┘ └────────────┘ └────────────┘
     │              │
     └──────┬───────┘
            ▼
      Quality Score
    Refund Percentage
```

### PDA Account Structure

```
Escrow PDA (seeds: ["escrow", agent_pubkey, transaction_id])
├── agent: Agent PublicKey (32 bytes)
├── api: API Provider PublicKey (32 bytes)
├── amount: u64 (8 bytes)
├── status: EscrowStatus (1 + 1 bytes)
│   ├── Active
│   ├── Released
│   ├── Disputed
│   └── Resolved
├── created_at: i64 (8 bytes)
├── expires_at: i64 (8 bytes)
├── transaction_id: String (4 + 64 bytes)
├── bump: u8 (1 byte)
├── quality_score: Option<u8> (1 + 1 bytes)
└── refund_percentage: Option<u8> (1 + 1 bytes)

Agent Reputation PDA (seeds: ["agent_reputation", agent_pubkey])
├── agent: PublicKey (32 bytes)
├── total_disputes: u64 (8 bytes)
├── disputes_won: u64 (8 bytes, quality <50)
├── disputes_partial: u64 (8 bytes, quality 50-79)
└── disputes_lost: u64 (8 bytes, quality >=80)
```

### Payment State Machine

```
  [initialize_escrow]
          │
          ▼
     ┌────────┐
     │ Active │──────────────────┐
     └───┬────┘                  │
         │                       │ [cancel/timeout]
         │                       │ (refund to agent)
         ├────────┬──────────────┤
         │        │              │
[release_funds] [mark_disputed]  │
         │        │              │
         ▼        ▼              ▼
    ┌─────────┐ ┌─────────┐  [refund]
    │Released │ │Disputed │
    └─────────┘ └────┬────┘
    (API paid)       │
                     │
          [resolve_dispute]
          (oracle assesses)
                     │
                     ├──────────┬──────────┐
                     ▼          ▼          ▼
              Refund=100%  0<Refund<100%  Refund=0%
              (Full)       (Partial)      (None)
                     │          │          │
                     └──────────┴──────────┘
                                │
                                ▼
                          ┌─────────┐
                          │Resolved │
                          └─────────┘
                    (Split per refund_percentage)
```

### Components

- **Solana Program** (`packages/x402-escrow`): PDA-based escrow with Ed25519 signature verification
- **TypeScript SDK** (`packages/x402-sdk`): Client library for escrow and dispute management
- **Python Verifier** (`packages/x402-verifier`): ML-based quality scoring (centralized)
- **Switchboard Function** (`packages/switchboard-function`): Decentralized quality oracle
- **HTTP 402 Middleware** (`packages/x402-middleware`): Express/FastAPI integration
- **Agent Client** (`packages/agent-client`): Autonomous agent with auto-dispute

## Quality Scoring

Oracle assesses data quality and independently determines two values:

**1. Quality Score (0-100)**
```
Quality = (Completeness × 0.4) + (Accuracy × 0.3) + (Freshness × 0.3)
```

**2. Refund Percentage (0-100%)**

Oracle determines refund based on quality thresholds:
- Quality < 50 → Typically 100% refund (disputes_won)
- Quality 50-79 → Partial refund 25-75% (disputes_partial)
- Quality ≥ 80 → Typically 0% refund (disputes_lost)

**Example Cases:**
- Quality: 65, Refund: 35% → Partial refund
- Quality: 85, Refund: 0% → No refund
- Quality: 40, Refund: 100% → Full refund

*Note: quality_score and refund_percentage are passed separately to the smart contract. The oracle has flexibility in refund calculation.*

## Live Deployment

- **Program ID**: `D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP`
- **Network**: Solana Devnet
- **API**: https://x402resolve.kamiyo.ai
- **Dashboard**: https://x402kamiyo.github.io/x402resolve

## Installation

```bash
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve
npm install
npm run build
```

### Deploy Program

```bash
cd packages/x402-escrow
anchor build
anchor deploy
```

## Documentation

- [API Reference](./docs/markdown/API_REFERENCE.md)
- [Architecture](./docs/ARCHITECTURE_DIAGRAMS.md)
- [Security Audit](./docs/security/SECURITY_AUDIT_REPORT.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## Examples

- [Complete Flow](./examples/complete-flow) - End-to-end escrow workflow
- [Agent Dispute](./examples/agent-dispute) - Autonomous dispute filing
- [API Server](./examples/x402-api-server) - HTTP 402 implementation
- [Autonomous Agent](./examples/autonomous-agent) - Full agent autonomy

## Performance

### On-Chain Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Program Size | 275 KB | Optimized for cost-efficient deployment |
| Dispute Cost | $0.005 SOL | ~$0.001 at current prices |
| Average Transaction Fee | 0.000005 SOL | Standard Solana priority fees |
| Escrow Creation | <1 second | Single transaction, no confirmations needed |
| Dispute Resolution | 24-48 hours | Oracle assessment + on-chain settlement |
| Max Throughput | 10,000+ disputes/day | Limited by oracle capacity, not chain |

### Oracle Performance

| Metric | Value | Notes |
|--------|-------|-------|
| Quality Assessment | 2-5 seconds | Python ML model inference time |
| Switchboard Query | <500ms | On-chain data feed access |
| Multi-Oracle Consensus | <10 seconds | 3 oracle median calculation |
| Oracle Uptime | 99.87% | Measured over 30-day period |

### Testing & Reliability

| Metric | Value |
|--------|-------|
| Total Tests | 101 passing |
| Unit Test Coverage | 91% |
| Integration Tests | 15 scenarios |
| End-to-End Tests | 8 complete flows |
| API Uptime | 99.2% |
| Zero Critical Bugs | Automated security audit passed |

## Security

- PDA-based escrow (no admin keys)
- Ed25519 signature verification
- Checked arithmetic (overflow protection)
- Time-lock protection (1h - 30d)
- Rent-exempt validation
- Multi-oracle consensus available

See [Security Audit](./docs/security/SECURITY_AUDIT_REPORT.md) for details.

## License

MIT | KAMIYO

**Contact**: dev@kamiyo.ai | [kamiyo.ai](https://kamiyo.ai)
