# x402Resolve

Automated dispute resolution for AI agent API payments on Solana.

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
- 24-hour dispute window with time-locked escrow
- Multi-factor quality scoring (semantic, completeness, freshness)
- Sliding-scale refunds (0-100% based on actual quality)
- Ed25519-signed oracle assessments verified on-chain
- Cost: $0.000005 vs $50-500 traditional

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

## Live Demo

https://x402kamiyo.github.io/x402resolve

Connect Phantom wallet and submit real disputes to Solana devnet.

## Key Metrics

| Metric | Value |
|--------|-------|
| Devnet Program | [AFmBBw...qsSR](https://explorer.solana.com/address/AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR?cluster=devnet) |
| Program Size | 275 KB |
| Tests | 101/101 passing |
| Resolution Time | 24-48 hours |
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
- 7-day maximum time-lock
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
┌─────────────────┐
│  Client/Agent   │
└────────┬────────┘
         │
    ┌────▼────┐
    │   SDK   │
    └─┬────┬──┘
      │    │
┌─────▼──┐ │  ┌──────────┐
│ Escrow │ └──▶ Verifier │
│Program │    │  Oracle  │
└────────┘    └──────────┘
```

## Trust Model

16 features addressing autonomous agent commerce:
- On-chain audit trail
- Ed25519 cryptographic verification
- Objective quality scoring
- Agent reputation (0-1000 on-chain)
- Time-lock protection
- Rate limiting
- Sybil attack prevention

Full details: [TRUST_MODEL.md](./TRUST_MODEL.md)

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

## Links

- GitHub: https://github.com/x402kamiyo/x402resolve
- Demo: https://x402kamiyo.github.io/x402resolve

## License

MIT
