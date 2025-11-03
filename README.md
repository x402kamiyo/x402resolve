# x402Resolve: Automated Dispute Resolution for AI Agent Payments

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/address/AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR?cluster=devnet)
[![Tests](https://img.shields.io/badge/tests-90%2B-success)](https://github.com/x402kamiyo/x402resolve)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Automated Dispute Resolution at $0.000005 Cost

**TL;DR:** Automated dispute resolution for AI agent payments on Solana using escrow, objective quality scoring, and sliding-scale refunds. When agents pay for API data and receive poor quality, disputes resolve in 24-48 hours with 0-100% refunds based on actual quality. Cost: $0.000005 vs $50-500 traditional chargebacks.

**Current Implementation:**
- **Fully automated** via Solana smart contracts + Python verifier oracle
- **$0.000005 per dispute** (99% cheaper than traditional $50-500)
- **48-hour resolution** (85% faster than 2-4 week arbitration)
- **0-100% sliding-scale refunds** (fair partial compensation)
- **Ed25519 signed** oracle assessments verified on-chain

**Roadmap:** Decentralized oracle integration via Switchboard ([technical plan](./docs/roadmap/SWITCHBOARD_INTEGRATION.md))

KAMIYO | Solana x402 Hackathon 2025

## Problem

AI agents make thousands of API payments with crypto. When data quality is poor:
- Crypto payments are irreversible
- Traditional chargebacks take weeks, cost $50-500
- Manual arbitration doesn't scale
- Binary outcomes ignore partial delivery

Annual fraud losses: $259M

## Solution

Automated dispute resolution with on-chain escrow and objective quality verification:
- **48-hour dispute window** with time-locked PDA escrow (trustless Solana program)
- **Multi-factor quality scoring** (semantic similarity, completeness, freshness)
- **Sliding-scale refunds** (0-100% based on objective quality score)
- **Ed25519-signed oracle assessments** verified on-chain
- **Automated execution** via Solana Anchor smart contracts
- **Cost**: 0.000005 SOL per dispute vs $50-500 traditional chargebacks

**Current Architecture:** Python verifier oracle + Solana escrow program
**Roadmap:** Full decentralization via Switchboard oracle network ([details](./docs/roadmap/SWITCHBOARD_INTEGRATION.md))

## Quick Start

```typescript
import { KamiyoClient } from '@kamiyo/x402-sdk';

const client = new KamiyoClient({
  apiUrl: 'https://api.kamiyo.ai',
  enablex402Resolve: true
});

// Create escrow payment
const payment = await client.pay({
  amount: 0.01,
  recipient: apiWallet,
  enableEscrow: true
});

// Dispute if quality check fails
const dispute = await client.dispute({
  transactionId: payment.transactionId,
  reason: 'Incomplete data',
  evidence: data
});
```

## Demo

**Video Demo**: [Watch Demo Video](https://x402kamiyo.github.io/x402resolve/media/demo-video.mp4)

**Live Demo**: https://x402kamiyo.github.io/x402resolve

Connect Phantom wallet and submit real disputes to Solana devnet.

## Key Metrics

| Metric | Value |
|--------|-------|
| Devnet Program | [AFmBBw...qsSR](https://explorer.solana.com/address/AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR?cluster=devnet) |
| Program Size | 275 KB |
| Tests | 90+ passing |
| Dispute Window | 48 hours |
| Cost per Dispute | $0.000005 SOL |
| Refund Granularity | 0-100% sliding scale |

## Installation

```bash
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve

# SDK
cd packages/x402-sdk && npm install && npm run build

# Verifier
cd ../x402-verifier && pip install -r requirements.txt

# Solana program
cd ../x402-escrow && anchor build
```

## Components

### Solana Escrow Program

Rust/Anchor smart contract with time-locked PDA escrow.

**Instructions:**
- `initialize_escrow` - Create time-locked escrow
- `release_funds` - Release after dispute window
- `mark_disputed` - Mark as disputed
- `resolve_dispute` - Execute refund split

**Security:**
- Ed25519 signature verification
- PDA-based (deterministic, no private keys)
- 30-day maximum time-lock
- Checked arithmetic

### Verifier Oracle

Python/FastAPI service for quality scoring.

```python
quality_score = (
    semantic_similarity * 0.4 +
    completeness_score * 0.4 +
    freshness_score * 0.2
) * 100
```

Results signed with Ed25519 and verified on-chain.

### TypeScript SDK

Client library with escrow management, dispute filing, reputation tracking, and retry handling.

### MCP Server

Model Context Protocol server with 5 tools for AI agent integration:
- `health_check`
- `search_crypto_exploits`
- `assess_defi_protocol_risk`
- `monitor_wallet`
- `file_dispute`

## Architecture

```
CLIENT          SDK         ESCROW        API       VERIFIER
  │              │             │            │            │
  ├─Pay 0.01 SOL─▶            │            │            │
  │              ├─Create──────▶           │            │
  │              │  Escrow     │            │            │
  │              ◀─Created─────┤            │            │
  │              │             │            │            │
  │              ├─Request data─────────────▶           │
  │              ◀─Data─────────────────────┤            │
  │              │             │            │            │
  │         ┌────┴────┐        │            │            │
  │         │ Quality │        │            │            │
  │         │  Check  │        │            │            │
  │         └────┬────┘        │            │            │
  │              │             │            │            │
  │         ╔════╧════╗        │            │            │
  │         ║  FAIL   ║        │            │            │
  │         ╚════╤════╝        │            │            │
  │              │             │            │            │
  │              ├─File dispute────────────────────────▶ │
  │              │             │            │  ┌─────────┴────────┐
  │              │             │            │  │ Score: 65/100    │
  │              │             │            │  │ Refund: 35%      │
  │              │             │            │  └─────────┬────────┘
  │              │             │            │            │
  │              │             ◀──Sign assessment────────┤
  │              │             │            │            │
  │              │          ┌──┴───┐        │            │
  │              │          │Split │        │            │
  │              │          └──┬───┘        │            │
  │              │             │            │            │
  │    ◀─────────────Refund────┤            │            │
  │   0.0035 SOL  │      35%   │            │            │
  │              │             ├──Pay───────▶           │
  │              │             │ 0.0065 SOL │            │
```

## Current Architecture

**Production Implementation:**

| Component | Technology | Status |
|-----------|-----------|--------|
| **Escrow** | Solana Anchor Program (PDA) | ✅ Deployed to Devnet |
| **Quality Scoring** | Python Verifier (FastAPI) | ✅ Production Ready |
| **Verification** | Ed25519 Signature | ✅ On-chain Verification |
| **Refund Execution** | Solana Smart Contract | ✅ Automated |
| **SDK** | TypeScript Client | ✅ npm Package |
| **MCP Server** | 9 Production Tools | ✅ Claude Code Integration |

**Quality Scoring Algorithm:**
```python
quality_score = (
    semantic_similarity * 0.4 +    # Query vs data relevance
    completeness_score * 0.4 +     # Expected criteria coverage
    freshness_score * 0.2           # Data recency
) * 100
```

**Verifier Oracle:** FastAPI service at `packages/x402-verifier/verifier.py`
- Semantic analysis via sentence transformers
- Completeness checking against expected criteria
- Freshness scoring based on timestamps
- Ed25519 signature for on-chain verification

## Trust Model

Security features in production:
- **On-chain audit trail** (all transactions on Solana)
- **Ed25519 cryptographic verification** (verifier signatures checked on-chain)
- **Objective quality scoring** (open-source algorithm)
- **Agent reputation** (0-1000 on-chain tracking)
- **Time-lock protection** (48-hour dispute window)
- **Rate limiting** (Sybil attack prevention)
- **PDA escrow** (no admin keys control funds)

Full details: [TRUST_MODEL.md](./TRUST_MODEL.md)

## Roadmap: Full Decentralization

**Phase 2 - Switchboard Oracle Integration** ([Technical Plan](./docs/roadmap/SWITCHBOARD_INTEGRATION.md))

Target: 99% trustless via decentralized oracle network
- Replace Python verifier with Switchboard Functions
- Multi-oracle consensus (median of 3+ independent nodes)
- On-chain attestation verification
- Economic security via staked oracle nodes
- Eligible for Switchboard bounty program

Timeline: Q1 2026 (post-hackathon)

## Development

```bash
# SDK tests
cd packages/x402-sdk && npm test

# Verifier tests
cd packages/x402-verifier && pytest

# Program tests
cd packages/x402-escrow && anchor test
```

## Examples

```bash
# Basic payment
cd examples/basic-payment && npm install && ts-node index.ts

# With dispute
# Terminal 1
cd packages/x402-verifier && python verifier.py

# Terminal 2
cd examples/with-dispute && ts-node index.ts
```

## Hackathon Tracks

- MCP Server: 5 production tools
- Dev Tool: Complete SDK + oracle + smart contract
- Agent Application: Autonomous dispute workflow
- API Integration: KAMIYO exploit intelligence

## Documentation

- [Architecture](./docs/ARCHITECTURE_DIAGRAMS.md)
- [Security Audit](./SECURITY_AUDIT.md)
- [API Reference](./docs/markdown/API_REFERENCE.md)
- [MCP Integration](./MCP_INTEGRATION_GUIDE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

## License

MIT
