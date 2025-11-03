# x402Resolve: Quality Guarantees for HTTP 402

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/address/D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP?cluster=devnet)
[![Tests](https://img.shields.io/badge/tests-90%2B-success)](https://github.com/x402kamiyo/x402resolve)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Extends RFC 9110's HTTP 402 Payment Required with cryptographically-verified quality guarantees and automated dispute resolution.

**Key Features:**
- 99% cost reduction ($0.000005/dispute vs $50-500 chargebacks)
- 48-hour resolution (85% faster than traditional arbitration)
- Sliding-scale refunds (0-100%) via Solana escrow
- Multi-oracle consensus for quality verification
- Production API: [x402resolve.kamiyo.ai](https://x402resolve.kamiyo.ai)

## Overview

Standard HTTP 402 enables micropayments but lacks quality assurance:

```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: Basic realm="API Access"
```

x402Resolve adds quality-guaranteed escrow flow:

```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: Solana realm="security-api"
X-Escrow-Address: Required
X-Price: 0.0001 SOL
X-Quality-Guarantee: true
X-Program-Id: D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP
```

**Mechanism:**
1. Payment held in trustless Solana escrow (PDA)
2. Consumer receives data with `X-Payment-Proof` header
3. Quality auto-assessed (completeness 40%, accuracy 30%, freshness 30%)
4. Automatic refund if quality < threshold
5. Ed25519 verification prevents manipulation

## Economics

### Security Intelligence Agent (1,000 queries/month)

| Metric | Without x402Resolve | With x402Resolve | Savings |
|--------|---------------------|------------------|---------|
| Monthly spend | $100 | $100 | - |
| Stale/incomplete data | 70% unusable | 70% auto-refunded | - |
| Wasted spend | $70 (irreversible) | $0 (auto-refunds) | $70/month |
| Manual review | Required | Automated | $50/month |
| Net cost | $100/month | $30/month | 70% reduction |

### Scale Analysis (10,000 API calls @ $0.50)

| Cost Component | Traditional | x402Resolve | Savings |
|----------------|-------------|-------------|---------|
| API calls | $5,000 | $5,000 | - |
| Disputes (5% rate) | $50 × 500 = $25,000 | $0.000005 × 500 = $0.0025 | $24,999.98 |
| Poor quality refunds | $0 (irreversible) | -$800 (sliding) | $800.00 |
| Total | $30,000/mo | $4,200/mo | $25,800/mo |

Annual savings at scale: $309,600

## Quick Start

### API Provider

```typescript
import express from 'express';
import { x402PaymentMiddleware } from '@x402resolve/middleware';

const app = express();

app.use('/api/*', x402PaymentMiddleware({
  realm: 'my-api',
  programId: ESCROW_PROGRAM_ID,
  connection: new Connection('https://api.devnet.solana.com'),
  price: 0.001,
  qualityGuarantee: true
}));

app.get('/api/data', (req, res) => {
  res.json({ data: 'Protected content' });
});
```

### Autonomous Agent

```typescript
import { AutonomousServiceAgent } from '@x402resolve/agent-client';

const agent = new AutonomousServiceAgent({
  keypair: agentKeypair,
  connection,
  programId: ESCROW_PROGRAM_ID,
  qualityThreshold: 85,
  maxPrice: 0.001,
  autoDispute: true
});

const result = await agent.consumeAPI(
  'https://x402resolve.kamiyo.ai/x402/exploits/latest',
  { chain: 'ethereum', severity: 'critical' },
  { exploit_id: '', protocol: '', chain: '', amount_lost_usd: 0, timestamp: '', tx_hash: '' }
);
```

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

### Components

- **Solana Escrow**: Rust/Anchor program with time-locked PDA
- **Quality Oracles**: Python verifier (ML embeddings) + Switchboard (decentralized)
- **TypeScript SDK**: Escrow management, dispute filing, reputation tracking
- **HTTP 402 Middleware**: Express/FastAPI implementing RFC 9110

## Technical Details

### Quality Scoring

```python
quality_score = (
    semantic_similarity * 0.4 +    # Query vs data relevance
    completeness_score * 0.4 +     # Expected criteria coverage
    freshness_score * 0.2           # Data recency
) * 100
```

Results signed with Ed25519, verified on-chain.

### Dual Resolution Paths

| Option | Cost/Dispute | Latency (p95) | Use Case |
|--------|-------------|--------------|----------|
| Python Verifier | ~$0 (hosting) | 400ms | High volume, trusted |
| Switchboard | $0.005 | 4.2s | High-value, trustless |

95% identical outcomes between paths.

### Solana Program

**Deployed:** [D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP](https://explorer.solana.com/address/D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP?cluster=devnet)

**Instructions:**
- `initialize_escrow` - Create time-locked PDA
- `release_funds` - Release after dispute window
- `mark_disputed` - Flag for assessment
- `resolve_dispute` - Execute refund split

**Security:**
- PDA-based (no admin keys)
- Ed25519 signature verification
- 48-hour time-lock
- Checked arithmetic

## Competitive Comparison

| Feature | x402Resolve | Chargebacks | Standard x402 | Oracles |
|---------|-------------|-------------|---------------|---------|
| Resolution Time | 48h | 2-4 weeks | Manual | N/A |
| Cost/Dispute | $0.000005 | $50-500 | $15-50 | $0.10-1.00 |
| Refund Granularity | 0-100% | Binary | Binary | N/A |
| Automation | Full | Manual | Manual | N/A |
| Quality Guarantees | Cryptographic | None | None | Not built-in |
| HTTP 402 Support | Native | None | Basic | None |

## Installation

```bash
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve

npm install
npm test

cd packages/x402-escrow && anchor build && anchor deploy
```

## Live Demo

**Production API**: https://x402resolve.kamiyo.ai

```bash
curl https://x402resolve.kamiyo.ai/health
curl -i https://x402resolve.kamiyo.ai/x402/exploits/latest
```

**Interactive Dashboard**: https://x402kamiyo.github.io/x402resolve

## Documentation

- [Architecture Diagrams](./docs/ARCHITECTURE_DIAGRAMS.md)
- [Security Audit](./SECURITY_AUDIT_REPORT.md)
- [API Reference](./docs/markdown/API_REFERENCE.md)
- [MCP Integration](./MCP_INTEGRATION_GUIDE.md)
- [Switchboard Guide](./packages/x402-escrow/SWITCHBOARD_INTEGRATION.md)
- [Competitive Analysis](./COMPETITIVE_ANALYSIS.md)
- [Trust Model](./TRUST_MODEL.md)

## Metrics

| Metric | Value |
|--------|-------|
| Program Size | 275 KB |
| Tests | 90+ passing |
| Dispute Window | 48 hours |
| Cost/Dispute | $0.000005 SOL |
| Refund Granularity | 0-100% |
| Resolution Time | 48h (85% faster) |
| Cost Savings | 99% vs traditional |

## License

MIT | KAMIYO
