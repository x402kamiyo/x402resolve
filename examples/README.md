# x402Resolve Examples

Production-ready autonomous agent demonstrations.

## Available Examples

### 1. Autonomous Agent Demo

**Path**: `autonomous-agent-demo/`
**Focus**: Basic autonomous operations

Demonstrates 3 scenarios:
- Query latest crypto exploits
- Assess protocol security risk
- Check wallet involvement

Features:
- Autonomous payment via escrow
- Quality assessment
- Auto-dispute on poor quality
- Sliding-scale refunds

### 2. Autonomous Agent Loop

**Path**: `autonomous-agent-loop/`
**Focus**: Full lifecycle automation

Complete agent workflow:
- API discovery
- Risk assessment
- Intelligence consumption
- Performance evaluation
- Decision logging

Features:
- Zero human intervention
- Multi-phase reasoning
- Quality thresholds
- Cost tracking

### 3. Exploit Prevention

**Path**: `exploit-prevention/`
**Focus**: Real-world ROI demonstration

Monitors multiple security APIs:
- Filters by quality threshold (95%)
- Auto-disputes stale/incomplete intel
- Demonstrates 70% cost reduction
- Tracks savings metrics

Features:
- Multi-API monitoring
- Quality-based filtering
- Automatic refunds
- Cost analysis

### 4. Production API Server

**Path**: `x402-api-server/`
**Focus**: HTTP 402 implementation

Live API at x402resolve.kamiyo.ai:
- RFC 9110 compliant
- x402Resolve middleware
- Quality guarantees
- KAMIYO security intelligence

Features:
- Express + CORS
- Solana escrow integration
- Health check endpoint
- Public pricing endpoint

## Switchboard Integration

All examples support dual dispute resolution:

**Python Verifier** (centralized):
- Cost: ~$0 (hosting only)
- Latency: 400ms
- Use: High volume, trusted

**Switchboard On-Demand** (decentralized):
- Cost: $0.005/dispute
- Latency: 4.2s
- Use: Trustless, high-value

**Implementation**: `packages/x402-escrow/programs/x402-escrow/src/lib.rs:500-665`

## Quick Start

```bash
# Clone repository
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve

# Install dependencies
npm install

# Run autonomous agent demo
cd examples/autonomous-agent-demo
npm install
ts-node demo.ts

# Run exploit prevention demo
cd ../exploit-prevention
npm install
ts-node agent.ts
```

## Quality Scoring

```python
quality_score = (
    semantic_similarity * 0.4 +  # Query vs data relevance
    completeness_score * 0.4 +   # Expected fields present
    freshness_score * 0.2         # Data recency
) * 100
```

**Refund calculation**:
- Quality 90-100: 0% refund (high quality)
- Quality 70-89: 25% refund (minor issues)
- Quality 50-69: 50% refund (moderate issues)
- Quality 30-49: 75% refund (significant issues)
- Quality 0-29: 100% refund (poor quality)

## Prerequisites

**Required**:
- Node.js 18+
- Solana CLI
- Devnet SOL

**Optional** (for local testing):
- Python 3.9+ (verifier oracle)
- Anchor CLI (program development)

### Installation

```bash
# Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Devnet SOL
solana airdrop 2 --url devnet

# Example dependencies
cd examples/autonomous-agent-demo
npm install
```

## Architecture

```
AGENT          SDK         ESCROW        API       VERIFIER
  │              │             │            │            │
  ├─Pay──────────▶            │            │            │
  │              ├─Create─────▶           │            │
  │              │             │            │            │
  │              ├─Request─────────────────▶           │
  │              ◀─Data──────────────────────┤            │
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
  │              ├─Dispute─────────────────────────────▶ │
  │              │             ◀──Score────────────────┤ │
  │              │             │            │            │
  │    ◀─────────────Refund────┤            │            │
  │              │             ├──Pay───────▶           │
```

## Live Demo

**Production API**: https://x402resolve.kamiyo.ai
**Interactive Dashboard**: https://x402kamiyo.github.io/x402resolve

```bash
# Health check
curl https://x402resolve.kamiyo.ai/health

# Pricing info
curl https://x402resolve.kamiyo.ai/x402/pricing

# Protected endpoint (requires payment)
curl -i https://x402resolve.kamiyo.ai/x402/exploits/latest
```

## Documentation

- [Main README](../README.md)
- [API Reference](../docs/markdown/API_REFERENCE.md)
- [Architecture](../docs/ARCHITECTURE_DIAGRAMS.md)
- [Switchboard Integration](../packages/x402-escrow/SWITCHBOARD_INTEGRATION.md)
- [Security Audit](../SECURITY_AUDIT_REPORT.md)

## Support

**Issues**: https://github.com/x402kamiyo/x402resolve/issues
**Email**: dev@kamiyo.ai
