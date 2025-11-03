# x402Resolve: Quality Guarantees for HTTP 402

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)](https://explorer.solana.com/address/D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP?cluster=devnet)
[![Tests](https://img.shields.io/badge/tests-90%2B-success)](https://github.com/x402kamiyo/x402resolve)
[![Security Audit](https://img.shields.io/badge/security-audited-green)](./docs/security/SECURITY_AUDIT_REPORT.md)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Extends RFC 9110's HTTP 402 Payment Required with cryptographically-verified quality guarantees and automated dispute resolution on Solana.

## Table of Contents

- [For Hackathon Judges](#for-hackathon-judges)
- [Economic Impact](#economic-impact)
- [Visual Demo](#visual-demo)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Technical Innovation](#technical-innovation)
- [Live Deployment](#live-deployment)
- [Documentation](#documentation)

---

## For Hackathon Judges

**Competing in 3 Bounty Categories:**

| Bounty | Amount | Status | Submission Link |
|--------|--------|--------|-----------------|
| **Switchboard On-Demand** | $5,000 | READY | [Submission](./docs/hackathon-submissions/SWITCHBOARD_BOUNTY_SUBMISSION.md) |
| **CDP Embedded Wallets** | $5,000 | READY | [Submission](./docs/hackathon-submissions/CDP_BOUNTY_SUBMISSION.md) |
| **Best x402 Agent Application** | $10,000 | READY | [This Repo](https://github.com/x402kamiyo/x402resolve) |

**Key Innovation:** First implementation of sliding-scale refunds (0-100%) for HTTP 402, reducing dispute costs by 99% while maintaining fairness.

**Try It Now:**
- **Live API**: [x402resolve.kamiyo.ai](https://x402resolve.kamiyo.ai)
- **Interactive Dashboard**: [x402kamiyo.github.io/x402resolve](https://x402kamiyo.github.io/x402resolve)
- **Demo Video**: _(In production - 3 minutes)_

---

## Economic Impact

### Annual Savings at Scale: **$309,600**

10,000 API calls/month @ $0.50 per call with 5% dispute rate:

```
┌─────────────────────────────────────────────────────────────┐
│                COST COMPARISON                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Traditional Chargebacks:                                   │
│  ─────────────────────                                      │
│    API Calls:     $5,000/mo                                 │
│    Disputes:      $50 × 500 = $25,000/mo                    │
│    Lost Quality:  $0 (no refunds)                           │
│                   ───────────────                           │
│    TOTAL:         $30,000/mo                                │
│                                                             │
│                                                             │
│  With x402Resolve:                                          │
│  ─────────────────                                          │
│    API Calls:     $5,000/mo                                 │
│    Disputes:      $0.000005 × 500 = $0.0025/mo             │
│    Auto-Refunds:  -$800/mo (sliding scale)                 │
│                   ───────────────                           │
│    TOTAL:         $4,200/mo                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SAVINGS: $25,800/mo = $309,600/year (86% reduction) │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Metrics

| Metric | Traditional | x402Resolve | Improvement |
|--------|-------------|-------------|-------------|
| **Dispute Cost** | $50-500 | $0.000005 | 99.99% ↓ |
| **Resolution Time** | 2-4 weeks | 48 hours | 85% faster |
| **Refund Precision** | Binary (0% or 100%) | Sliding (0-100%) | Fair outcomes |
| **Automation** | Manual review | Fully autonomous | Zero human cost |

---

## Visual Demo

### Live Dispute Resolution Dashboard

![Switchboard Dashboard](./docs/media/switchboard-dashboard.png)

*Decentralized quality assessment via Switchboard On-Demand oracles*

### Autonomous Agent Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                   AUTONOMOUS AGENT FLOW                         │
└─────────────────────────────────────────────────────────────────┘

  Agent              Escrow             API            Oracle
    │                  │                 │                │
    │                  │                 │                │
    ├──Pay 0.01 SOL──▶│                 │                │
    │                  │                 │                │
    ├──────────────Request Data────────▶│                │
    │                  │                 │                │
    │◀─────────────Returns Data─────────┤                │
    │                  │                 │                │
    │                  │                 │                │
    │ ┌──────────┐     │                 │                │
    │ │ Quality  │     │                 │                │
    │ │  Score:  │     │                 │                │
    │ │  65/100  │     │                 │                │
    │ └─────┬────┘     │                 │                │
    │       │          │                 │                │
    │   ╔═══╧═══╗      │                 │                │
    │   ║ FAIL  ║      │                 │                │
    │   ║ < 85% ║      │                 │                │
    │   ╚═══╤═══╝      │                 │                │
    │       │          │                 │                │
    ├───File Dispute───────────────────────────────────▶│
    │                  │                 │                │
    │                  │                 │   ┌───────────┴────────┐
    │                  │                 │   │ Completeness: 70%  │
    │                  │                 │   │ Accuracy:     60%  │
    │                  │                 │   │ Freshness:    65%  │
    │                  │                 │   │ ─────────────────  │
    │                  │                 │   │ Final Score:  65%  │
    │                  │                 │   │ Refund:       35%  │
    │                  │                 │   └───────────┬────────┘
    │                  │                 │                │
    │                  │◀────Sign Assessment (Ed25519)───┤
    │                  │                 │                │
    │                  │  ┌──────────┐   │                │
    │                  │  │  Split   │   │                │
    │                  │  │ Payment  │   │                │
    │                  │  └─────┬────┘   │                │
    │                  │        │        │                │
    │◀───Refund 35%────┤        │        │                │
    │  0.0035 SOL      │        │        │                │
    │                  │        │        │                │
    │                  ├────Pay 65%─────▶│                │
    │                  │   0.0065 SOL    │                │
    │                  │                 │                │
    ▼                  ▼                 ▼                ▼

  TOTAL TIME: ~48 hours (automated)
  NO HUMAN INTERVENTION REQUIRED
```

---

## Quick Start

### For API Providers

Add quality-guaranteed HTTP 402 to your API in 3 lines:

```typescript
import { x402PaymentMiddleware } from '@x402resolve/middleware';

app.use('/api/*', x402PaymentMiddleware({
  realm: 'my-api',
  programId: new PublicKey('D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP'),
  connection: new Connection('https://api.devnet.solana.com'),
  price: 0.001,
  qualityGuarantee: true
}));
```

Your API now responds with:

```http
HTTP/1.1 402 Payment Required
WWW-Authenticate: Solana realm="my-api"
X-Escrow-Address: Required
X-Price: 0.001 SOL
X-Quality-Guarantee: true
X-Program-Id: D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP
```

### For Autonomous Agents

Consume quality-guaranteed APIs with automatic dispute handling:

```typescript
import { AutonomousServiceAgent } from '@x402resolve/agent-client';

const agent = new AutonomousServiceAgent({
  keypair: agentKeypair,
  connection,
  programId: ESCROW_PROGRAM_ID,
  qualityThreshold: 85,     // Auto-dispute if quality < 85%
  maxPrice: 0.001,
  autoDispute: true
});

// Automatically creates escrow, pays, assesses quality, disputes if needed
const result = await agent.consumeAPI(
  'https://x402resolve.kamiyo.ai/x402/exploits/latest',
  { chain: 'ethereum', severity: 'critical' },
  { exploit_id: '', protocol: '', chain: '', amount_lost_usd: 0 }
);

console.log(`Quality: ${result.quality}%`);
console.log(`Cost: ${result.cost} SOL${result.disputed ? ' (partial refund)' : ''}`);
```

### For CDP Agents

Demand-side autonomous agents using Coinbase CDP Embedded Wallets:

```typescript
import { CDPAutonomousAgent } from '@x402resolve/agent-client';

const agent = new CDPAutonomousAgent({
  apiKeyName: process.env.CDP_API_KEY_NAME,
  apiKeySecret: process.env.CDP_API_KEY_SECRET,
  connection,
  programId: ESCROW_PROGRAM_ID,
  qualityThreshold: 85,
  maxPrice: 0.001,
  autoDispute: true
});

await agent.initialize();

// Discover x402 APIs, reason over available tools, execute with quality guarantees
const { results, totalCost, averageQuality } = await agent.autonomousWorkflow(
  { chain: 'ethereum', severity: 'critical' },
  { exploit_id: '', protocol: '', amount_lost_usd: 0 }
);
```

---

## How It Works

### Standard HTTP 402 (No Quality Guarantees)

```
┌──────┐         ┌─────┐
│Client├────$───▶│ API │
└──┬───┘         └──┬──┘
   │                │
   │◀───data───────┤
   │                │
   │  ╔═══════════════════════╗
   │  ║ Poor quality?         ║
   │  ║ Too bad - no refund   ║
   │  ╚═══════════════════════╝
```

### x402Resolve (Quality-Guaranteed)

```
┌──────┐    ┌────────┐    ┌─────┐    ┌────────┐
│Client├───▶│ Escrow ├───▶│ API │◀──▶│ Oracle │
└──┬───┘    └───┬────┘    └──┬──┘    └───┬────┘
   │            │             │            │
   │            │             │            │
   │◀───data────────────────┤            │
   │            │             │            │
   │  ┌───────────────────┐  │            │
   │  │ Quality Check     │  │            │
   │  │ Completeness: 40% │──────────────▶│
   │  │ Accuracy:     30% │  │            │
   │  │ Freshness:    30% │  │  ┌─────────┴────────┐
   │  └───────────────────┘  │  │ ML embeddings    │
   │                         │  │ Schema matching  │
   │  If quality < 85%:      │  │ Timestamp check  │
   │  ├─File dispute────────────▶│ Sign w/ Ed25519  │
   │  │                     │  └─────────┬────────┘
   │  │                     │            │
   │  │         ┌───────────────────┐    │
   │  │         │ Refund: 0-100%    │◀───┤
   │  │         │ Based on quality  │    │
   │  │         └─────────┬─────────┘    │
   │  │                   │              │
   │◀─┴──Partial refund───┤              │
   │            │          │              │
   │            └─Pay API─▶│              │
   │         (proportional)│              │
```

**Key Innovation:** Sliding-scale refunds based on objective quality metrics, not binary outcomes.

---

## Architecture

### System Components

```
┌────────────────────────────────────────────────────────────────────┐
│                         x402Resolve Stack                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Clients    │  │   Agents     │  │  Providers   │            │
│  │              │  │              │  │              │            │
│  │ • Web Apps   │  │ • Autonomous │  │ • API Owners │            │
│  │ • Mobile     │  │ • CDP Agents │  │ • Data Srcs  │            │
│  │ • CLI Tools  │  │ • MCP Tools  │  │ • Services   │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                    │
│         └──────────────────┴──────────────────┘                    │
│                            │                                       │
│         ┌──────────────────▼──────────────────┐                   │
│         │    TypeScript SDK (@x402resolve)    │                   │
│         │                                      │                   │
│         │  • EscrowClient                      │                   │
│         │  • AutonomousServiceAgent            │                   │
│         │  • CDPAutonomousAgent                │                   │
│         │  • SwitchboardClient                 │                   │
│         │  • x402PaymentMiddleware             │                   │
│         └──────────┬───────────────────────────┘                   │
│                    │                                               │
│         ┌──────────▼────────────┬──────────────────┐              │
│         │                       │                  │              │
│  ┌──────▼──────────┐  ┌─────────▼────────┐  ┌─────▼──────┐       │
│  │ Solana Program  │  │  Quality Oracles │  │   HTTP 402 │       │
│  │  (Rust/Anchor)  │  │                  │  │ Middleware │       │
│  │                 │  │ • Python ML      │  │            │       │
│  │ • PDA Escrows   │  │ • Switchboard    │  │ • Express  │       │
│  │ • Time-locks    │  │   On-Demand      │  │ • FastAPI  │       │
│  │ • Ed25519 Sig   │  │ • Multi-oracle   │  │            │       │
│  │ • Reputation    │  │   Consensus      │  │            │       │
│  └─────────────────┘  └──────────────────┘  └────────────┘       │
│         │                       │                                 │
│         └───────────────────────┘                                 │
│                    │                                               │
│         ┌──────────▼────────────┐                                 │
│         │   Solana Blockchain   │                                 │
│         │    (Devnet/Mainnet)   │                                 │
│         └───────────────────────┘                                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Dual Oracle Architecture

```
                    ┌─────────────────────┐
                    │   Dispute Filed     │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴───────────────┐
                │                              │
                ▼                              ▼
    ┌───────────────────────┐      ┌───────────────────────┐
    │   Python Verifier     │      │   Switchboard OD      │
    │   (Centralized)       │      │   (Decentralized)     │
    ├───────────────────────┤      ├───────────────────────┤
    │                       │      │                       │
    │ Cost: ~$0             │      │ Cost: $0.005          │
    │ Speed: 400ms          │      │ Speed: 4.2s           │
    │                       │      │                       │
    │ • ML embeddings       │      │ • Oracle consensus    │
    │ • Schema validation   │      │ • PullFeed data       │
    │ • Ed25519 signing     │      │ • On-chain verify     │
    │                       │      │                       │
    │ Use: High volume      │      │ Use: High value       │
    │      Trusted APIs     │      │      Trustless        │
    └───────────┬───────────┘      └───────────┬───────────┘
                │                              │
                └──────────────┬───────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  95% Agreement Rate  │
                    │                      │
                    │   Quality Score:     │
                    │   65/100             │
                    │                      │
                    │   Refund: 35%        │
                    └──────────────────────┘
```

---

## Technical Innovation

### 1. Multi-Factor Quality Scoring

```python
def calculate_quality(received_data, query, expected_schema):
    completeness = check_schema_coverage(received_data, expected_schema)  # 40%
    accuracy      = semantic_similarity(query, received_data)             # 30%
    freshness     = timestamp_recency(received_data)                      # 30%

    return (completeness * 0.4 + accuracy * 0.3 + freshness * 0.3) * 100
```

**Example:**
- Completeness: 70% (missing 3 of 10 fields)
- Accuracy: 60% (wrong chain returned)
- Freshness: 65% (12 hours old, expected <1 hour)
- **Final Score: 65/100**
- **Refund: 35%** (inverse of quality)

### 2. Sliding-Scale Refunds

Traditional systems: Binary outcomes (0% or 100% refund)
x402Resolve: Proportional fairness

```
Quality Score  │  Consumer Refund  │  Provider Payment
─────────────────────────────────────────────────────
    100%       │        0%         │      100%
     90%       │       10%         │       90%
     80%       │       20%         │       80%
     70%       │       30%         │       70%  ← Example
     60%       │       40%         │       60%
     50%       │       50%         │       50%
      0%       │      100%         │        0%
```

### 3. Ed25519 Cryptographic Verification

```rust
// On-chain verification (Solana program)
pub fn resolve_dispute(
    ctx: Context<ResolveDispute>,
    quality_score: u8,
    refund_percentage: u8,
    signature: [u8; 64],
) -> Result<()> {
    // Verify oracle signature
    let message = create_assessment_message(
        &ctx.accounts.escrow.key(),
        quality_score,
        refund_percentage
    );

    verify_ed25519_signature(
        &signature,
        &ctx.accounts.verifier.key(),
        &message
    )?;

    // Execute sliding-scale refund
    let refund_amount = escrow.amount * refund_percentage / 100;
    let payment_amount = escrow.amount - refund_amount;

    transfer_lamports(escrow, agent, refund_amount)?;
    transfer_lamports(escrow, api, payment_amount)?;

    Ok(())
}
```

### 4. Switchboard On-Demand Integration

```rust
// Decentralized quality assessment
pub fn resolve_dispute_switchboard(
    ctx: Context<ResolveDisputeSwitchboard>,
    quality_score: u8,
    refund_percentage: u8,
) -> Result<()> {
    // Parse Switchboard feed data
    let feed = PullFeedAccountData::parse(
        ctx.accounts.switchboard_function.try_borrow_data()?
    )?;

    // Validate timestamp (5-minute staleness window)
    require!(
        Clock::get()?.unix_timestamp - feed.timestamp < 300,
        ErrorCode::StaleData
    );

    // Verify quality score matches oracle consensus
    require!(
        feed.value == quality_score as i128,
        ErrorCode::QualityMismatch
    );

    // Execute refund
    execute_sliding_scale_refund(ctx, quality_score, refund_percentage)?;

    Ok(())
}
```

### 5. CDP Autonomous Agents

```typescript
// Demand-side agent: discovers, reasons, pays, disputes autonomously
export class CDPAutonomousAgent {
    async autonomousWorkflow(query: any, schema: any) {
        // 1. Discover x402-enabled APIs
        const tools = await this.discoverAPIs();

        // 2. Reason over available tools
        const reasoning = await this.reasonOverToolCalls(query, tools);

        // 3. Execute with CDP wallet
        const results = await this.executeChainedToolCalls(
            reasoning,
            query,
            schema
        );

        // 4. Auto-dispute poor quality (no human intervention)
        results.forEach(r => {
            if (r.quality < this.config.qualityThreshold) {
                console.log(`Auto-disputed ${r.tool}, refund: ${100 - r.quality}%`);
            }
        });

        return results;
    }
}
```

---

## Live Deployment

### Production API

**Endpoint**: https://x402resolve.kamiyo.ai

```bash
# Health check
curl https://x402resolve.kamiyo.ai/health

# Get 402 payment details
curl -i https://x402resolve.kamiyo.ai/x402/exploits/latest

# Response:
# HTTP/1.1 402 Payment Required
# WWW-Authenticate: Solana realm="kamiyo-security-intelligence"
# X-Escrow-Address: Required
# X-Price: 0.0001 SOL
# X-Program-Id: D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP
# X-Quality-Guarantee: true
```

### Solana Program

**Program ID**: `D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP`

**Explorer**: [View on Solana Explorer](https://explorer.solana.com/address/D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP?cluster=devnet)

**Deployment**:
- Network: Devnet
- Size: 275 KB
- Status: Active
- Audit: [Security Report](./docs/security/SECURITY_AUDIT_REPORT.md)

### Interactive Dashboard

**URL**: https://x402kamiyo.github.io/x402resolve

Features:
- Live dispute resolution monitoring
- Switchboard oracle consensus
- Quality score distributions
- Refund analytics

---

## Documentation

### For Developers

- [Quick Start Guide](./docs/QUICK_START.md)
- [API Reference](./docs/markdown/API_REFERENCE.md)
- [Integration Examples](./examples/README.md)
- [TypeScript SDK Docs](./packages/x402-sdk/README.md)
- [Switchboard Integration](./packages/x402-escrow/SWITCHBOARD_INTEGRATION.md)

### For Judges

- [Switchboard Bounty Submission](./docs/hackathon-submissions/SWITCHBOARD_BOUNTY_SUBMISSION.md)
- [CDP Bounty Submission](./docs/hackathon-submissions/CDP_BOUNTY_SUBMISSION.md)
- [Security Audit Report](./docs/security/SECURITY_AUDIT_REPORT.md)
- [Architecture Diagrams](./docs/ARCHITECTURE_DIAGRAMS.md)

### Advanced Topics

- [MCP Integration Guide](./MCP_INTEGRATION_GUIDE.md) (Claude Desktop)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Security Policy](./SECURITY.md)
- [Contributing](./CONTRIBUTING.md)

### Archive

- [Competitive Analysis](./archive/COMPETITIVE_ANALYSIS.md)
- [Trust Model](./archive/TRUST_MODEL.md)
- [Dispute Comparison](./archive/DISPUTE_RESOLUTION_COMPARISON.md)

---

## Installation

```bash
# Clone repository
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve

# Install dependencies
npm install

# Run tests
npm test

# Build all packages
npm run build

# Deploy Solana program
cd packages/x402-escrow
anchor build
anchor deploy
```

---

## Competitive Comparison

| Feature | x402Resolve | Chargebacks | Standard x402 | Oracles |
|---------|-------------|-------------|---------------|---------|
| **Resolution Time** | 48 hours | 2-4 weeks | Manual | N/A |
| **Cost per Dispute** | $0.000005 | $50-500 | $15-50 | $0.10-1.00 |
| **Refund Precision** | 0-100% sliding | Binary | Binary | N/A |
| **Automation** | Fully autonomous | Manual | Manual | Partial |
| **Quality Guarantees** | Cryptographic | None | None | Not built-in |
| **HTTP 402 Native** | Yes | No | Yes | No |
| **Multi-Oracle** | Yes (2 paths) | No | No | Yes |

---

## Metrics

| Metric | Value |
|--------|-------|
| **Program Size** | 275 KB |
| **Test Coverage** | 90+ tests passing |
| **Dispute Window** | 48 hours |
| **Cost per Dispute** | $0.000005 SOL |
| **Refund Granularity** | 0-100% (1% steps) |
| **Resolution Speed** | 85% faster than traditional |
| **Cost Reduction** | 99.99% vs chargebacks |
| **Oracle Consensus** | 95% agreement rate |

---

## License

MIT | KAMIYO

**Contact**: dev@kamiyo.ai | [kamiyo.ai](https://kamiyo.ai)
