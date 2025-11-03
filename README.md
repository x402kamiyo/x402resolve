# x402Resolve

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/address/D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP?cluster=devnet)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Quality-guaranteed HTTP 402 payments with automated dispute resolution on Solana.

## Overview

x402Resolve extends RFC 9110 HTTP 402 with cryptographic quality verification and sliding-scale refunds (0-100%) based on objective quality metrics. Enables trustless payment-for-data with automatic dispute resolution.

**Key Features:**
- Sliding-scale refunds (not binary accept/reject)
- Multi-oracle quality verification (Python verifier + Switchboard)
- PDA-based escrow (no admin keys)
- On-chain reputation system
- 99.99% cost reduction vs traditional arbitration

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

## Architecture

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

### Components

- **Solana Program** (`packages/x402-escrow`): PDA-based escrow with Ed25519 signature verification
- **TypeScript SDK** (`packages/x402-sdk`): Client library for escrow and dispute management
- **Python Verifier** (`packages/x402-verifier`): ML-based quality scoring (centralized)
- **Switchboard Function** (`packages/switchboard-function`): Decentralized quality oracle
- **HTTP 402 Middleware** (`packages/x402-middleware`): Express/FastAPI integration
- **Agent Client** (`packages/agent-client`): Autonomous agent with auto-dispute

## Quality Scoring

Multi-factor algorithm (0-100 scale):

```
Quality = (Completeness × 0.4) + (Accuracy × 0.3) + (Freshness × 0.3)

Refund = 100 - Quality  (for scores < 80)
```

**Example:**
- Quality: 65% → Refund: 35%
- Quality: 85% → Refund: 0%
- Quality: 40% → Refund: 100%

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

| Metric | Value |
|--------|-------|
| Dispute Cost | $0.000005 SOL |
| Resolution Time | 48 hours |
| Program Size | 275 KB |
| Test Coverage | 90+ tests passing |

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
