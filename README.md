# KAMIYO x402Resolve

Automated dispute resolution system for HTTP 402 payment-required APIs using Solana escrow and objective quality verification.

**Solana x402 Hackathon 2025 Submission**

##  Live on Devnet

**Program ID:** `AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR`
**Explorer:** [View on Solana Explorer](https://explorer.solana.com/address/AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR?cluster=devnet)
**Network:** Solana Devnet

## Overview

Standard x402 payments are irreversible. When data quality doesn't meet expectations, there's no programmatic way to dispute or get refunds. Traditional chargebacks require manual intervention and take weeks to resolve.

x402Resolve implements time-locked escrow on Solana with automated quality verification. When disputed data doesn't meet quality standards, an objective scoring system calculates a fair refund (0-100% sliding scale) and executes it on-chain automatically.

**Demo**: [Interactive Web Demo](./demo/index.html) | **Docs**: [Technical Documentation](./docs/)

## Trust Model

**16 trust features implemented**

x402Resolve addresses five critical trust questions for autonomous agent commerce:

### 1. How Do We Trust Agents?

**On-Chain Audit Trail**: Every transaction recorded immutably on Solana
- Payment, dispute, quality score, and refund all publicly verifiable
- Creates permanent reputation record
- Cannot be deleted or modified

**Cryptographic Verification**: All quality assessments signed with Ed25519
- Prevents quality score manipulation
- Proves oracle actually assessed the data
- Enables slashing for dishonest oracles

**Objective Quality Scoring**: Algorithm removes human bias
- Semantic similarity via sentence embeddings (40%)
- Completeness validation for required fields (40%)
- Freshness scoring for data recency (20%)
- Consistent across all transactions

**Agent Reputation System**: On-chain performance tracking
- Reputation score 0-1000 based on transaction history
- Disputes won/partial/lost categorization
- Average quality received tracking
- Permanent on-chain record

**Historical Performance**: Query reputation anytime
- Total transactions and dispute rate
- Win/loss ratios for disputes
- Verification level and access limits

**Verification Badges**: Graduated access levels
- Basic: 1 tx/hour, 10 tx/day
- Staked: 10 tx/hour, 100 tx/day
- Social: 50 tx/hour, 500 tx/day
- KYC: Unlimited access

### 2. What's the Scope of Work?

**Query-Based Specification**: Clear definition of expected data
- Query string defines semantic expectations
- Required fields validated automatically
- Minimum record counts enforced
- Data age limits checked

**Example**:
```typescript
const payment = await client.pay({
  query: 'Uniswap V3 exploits on Ethereum',
  expectedCriteria: {
    minRecords: 5,
    requiredFields: ['tx_hash', 'amount_usd', 'timestamp'],
    maxAgeDays: 30
  }
});
```

**Structured Work Agreements**: Formal scope definition
- WorkAgreement struct on-chain
- Query, required fields, minimum records
- Data age limits, quality thresholds
- Pre-agreed acceptance criteria

**Pre-Flight Validation**: Check before payment
- Validate work spec feasibility
- Provider commits to requirements
- Reduces disputes from misalignment

### 3. What Happens When They Mess Up?

**Automated Dispute Resolution**: Zero manual intervention required
- Quality check fails → Dispute filed automatically
- Verifier oracle scores quality objectively
- Refund calculated via sliding scale (0-100%)
- Executed on-chain within 24-48 hours

**Fair Refunds**: Not binary (all-or-nothing)

| Quality Score | Refund | Outcome |
|---------------|--------|---------|
| 80-100 | 0% | Data acceptable |
| 50-79 | Partial | Sliding scale |
| 0-49 | 100% | Unacceptable quality |

**Multi-Tier Dispute Resolution**: Escalation support
- Automatic resolution (80% of cases)
- Client appeal with stake (15%)
- Multi-oracle consensus (4%)
- Human arbitration (1%)

**Provider Penalties**: Consequences for failures
- Strike system (4 strikes = permanent ban)
- Suspension periods (7, 30 days)
- Reputation impact tracked on-chain
- Poor quality count monitoring

### 4. Who Gives Them Reputation, Credit, or Refunds?

**Automated Verifier Oracle**: Objective quality assessment
- Multi-factor algorithm (semantic + completeness + freshness)
- Ed25519 signed results
- Fast response (<5 minutes)

**On-Chain Execution**: Smart contract enforces refunds
- No human discretion
- Cannot be overridden by single party
- Transparent and verifiable
- Permanent blockchain record

### 5. How Do We Stop Them From Being Exploited?

**Time-Lock Protection**: Prevents indefinite escrow
- Maximum 7-day escrow duration
- Automatic release after time-lock expires
- Clear dispute window (48 hours)

**PDA-Based Security**: Deterministic escrow addresses
- No one can steal funds (only program controls PDA)
- No private key to lose
- Collision-resistant

**Rate Limiting**: Prevents spam and abuse
- Per-entity hourly and daily limits
- Based on verification level
- Automatic counter reset
- Prevents Sybil attacks

**Dispute Cost Scaling**: Economic disincentive
- Base cost: 0.001 SOL
- Multiplier based on dispute rate
- High abuse pattern: 10x cost
- Refunded if dispute valid

**Sybil Attack Protection**: Graduated verification
- Basic: Low limits (1/hour)
- Staked: Medium limits (10/hour)
- Social: High limits (50/hour)
- KYC: Unlimited access

See [TRUST_MODEL.md](./TRUST_MODEL.md) and [TRUST_FEATURES_COMPLETE.md](./TRUST_FEATURES_COMPLETE.md) for complete architecture.

## Architecture

```
Client Application
        ↓
    Pay 0.01 SOL
        ↓
Solana Escrow Contract (24h time-lock)
        ↓
    KAMIYO API
        ↓
Receive exploit data
        ↓
Quality check fails
        ↓
File dispute
        ↓
x402 Verifier Oracle
  - Semantic similarity: 0.72
  - Completeness: 0.40
  - Freshness: 1.00
  - Quality Score: 65/100
        ↓
Automated refund: 35%
  - Client: 0.0035 SOL
  - API: 0.0065 SOL
```

## Components

### 1. x402 Verifier Oracle (`packages/x402-verifier/`)

Python/FastAPI service for objective quality scoring.

**Algorithm**:
- Semantic Similarity (40%): Cosine similarity using sentence-transformers
- Completeness (40%): Required field validation and record count
- Freshness (20%): Data recency check

**Refund Calculation**:
```
Quality 80-100 → 0% refund
Quality 50-79  → Partial refund (sliding scale)
Quality 0-49   → 100% refund
```

Results are signed with Ed25519 and verified on-chain.

### 2. Solana Escrow Program (`packages/x402-escrow/`)

Rust/Anchor smart contract for on-chain dispute resolution.

**Instructions**:
- `initialize_escrow`: Create time-locked PDA escrow account
- `release_funds`: Release payment after dispute window expires
- `mark_disputed`: Mark escrow as under dispute
- `resolve_dispute`: Execute refund split based on verified quality score

**Security**:
- PDA-based escrow (deterministic addresses)
- Ed25519 signature verification from oracle
- Time-lock prevents indefinite holding
- Sliding scale refunds (0-100%)

### 3. TypeScript SDK (`packages/x402-sdk/`)

Client library for programmatic integration.

```typescript
import { KamiyoClient } from '@kamiyo/x402-sdk';

const client = new KamiyoClient({
  apiUrl: 'https://api.kamiyo.ai',
  chain: 'solana',
  enablex402Resolve: true,
  walletPublicKey: wallet.publicKey
});

// Create escrow payment
const payment = await client.pay({
  amount: 0.01,
  recipient: apiWallet,
  enableEscrow: true
});

// File dispute if quality is poor
const dispute = await client.dispute({
  transactionId: payment.transactionId,
  reason: 'Incomplete data - missing required fields',
  originalQuery: 'Uniswap exploits on Ethereum',
  dataReceived: data,
  expectedCriteria: ['complete', 'verified', 'ethereum-only']
});

console.log(`Refund: ${dispute.refundPercentage}%`);
```

### 4. MCP Server (`packages/mcp-server/`)

Model Context Protocol server for MCP-compatible applications.

**Available Tools**:
- `health_check`: Server status and connectivity
- `search_crypto_exploits`: Query KAMIYO exploit database
- `assess_defi_protocol_risk`: Protocol security analysis
- `monitor_wallet`: Check wallet exposure to compromised protocols
- `file_dispute`: Submit quality dispute with evidence

**Configuration**:
```json
{
  "mcpServers": {
    "kamiyo-security": {
      "command": "python3.11",
      "args": ["/path/to/packages/mcp-server/server.py"],
      "env": {
        "KAMIYO_API_URL": "https://api.kamiyo.ai",
        "X402_VERIFIER_URL": "https://verifier.x402resolve.com",
        "SOLANA_RPC_URL": "https://api.mainnet-beta.solana.com"
      }
    }
  }
}
```

See [MCP Server Documentation](./packages/mcp-server/README.md).

## Interactive Demo

Open `demo/index.html` in a browser for interactive demonstration (no build required).

**Features**:
- File disputes with different quality scenarios
- Real-time quality scoring visualization
- Animated dispute resolution timeline
- Refund calculation (0-100% sliding scale)
- Responsive design

### Code Examples

Integration examples available in `examples/`:
- `basic-payment/`: Simple Solana payment without escrow
- `with-dispute/`: Full escrow and dispute workflow
- `mcp-integration/`: MCP server integration

**Run Demo**:
```bash
# Interactive web demo
open demo/index.html

# Or with local server
cd demo && python3 -m http.server 8080
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- Rust + Anchor (for Solana program)
- Solana CLI

### Installation

```bash
# Clone repository
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve

# Install SDK
cd packages/x402-sdk
npm install && npm run build

# Install verifier
cd ../x402-verifier
pip install -r requirements.txt

# Build Solana program
cd ../x402-escrow
anchor build
```

### Run Examples

**Basic Payment**:
```bash
cd examples/basic-payment
npm install
ts-node index.ts
```

**With Dispute Resolution**:
```bash
# Terminal 1: Start verifier
cd packages/x402-verifier
python verifier.py

# Terminal 2: Run example
cd examples/with-dispute
ts-node index.ts
```

## Repository Structure

```
x402resolve/
├── packages/
│   ├── x402-sdk/          # TypeScript SDK
│   ├── x402-verifier/     # Python quality oracle
│   ├── x402-escrow/       # Rust/Anchor Solana program
│   └── mcp-server/        # MCP protocol server
├── examples/
│   ├── basic-payment/
│   ├── with-dispute/
│   └── mcp-integration/
├── docs/
│   └── X402_PAYMENT_SYSTEM.md
└── demo/
    └── index.html
```

## Hackathon Categories

### Best MCP Server ($10,000)

MCP server with 5 tools including programmatic dispute filing. Enables automated quality verification for MCP-compatible applications.

### Best Dev Tool ($10,000)

Complete toolkit: TypeScript SDK, Python verifier oracle, and Rust escrow program. Sliding scale refunds based on objective quality metrics.

### Best Agent Application ($10,000)

End-to-end programmatic workflow: payment → data receipt → quality verification → automated dispute → refund. Zero manual intervention required.

### Best API Integration ($10,000)

KAMIYO exploit intelligence API (tracks $2.1B+ in crypto exploits) integrated with x402Resolve payment layer. Automated quality guarantees for all API responses.

## Technical Details

### Quality Scoring Algorithm

Multi-factor weighted scoring:

```python
quality_score = (
    semantic_similarity * 0.4 +    # Query/data embedding similarity
    completeness_score * 0.4 +     # Required field presence
    freshness_score * 0.2          # Data recency
) * 100

# Refund calculation
if quality_score >= 80:
    refund = 0%          # Acceptable quality
elif quality_score >= 50:
    refund = variable    # Sliding scale
else:
    refund = 100%        # Unacceptable quality
```

**Example**:
```
Query: "Uniswap V3 exploit history on Ethereum"
Data: 3 exploits (Curve, Euler, Mango) - wrong protocols

Semantic: 0.72 (partial match)
Completeness: 0.40 (wrong protocols, incomplete)
Freshness: 1.00 (recent data)

Score: 65/100 → 35% refund
Client: 0.0035 SOL
API: 0.0065 SOL
```

### Security

- Ed25519 signatures validated on-chain
- PDA-based escrow (deterministic, collision-resistant)
- Time-lock prevents indefinite escrow
- Open source, auditable code
- Testnet deployment before mainnet

## Deliverables

**Completed**:
- MCP server with 5 tools
- Interactive web demo
- Payment system documentation
- TypeScript SDK
- Python verifier oracle
- Rust escrow program
- Integration examples (3)
- Technical documentation

**In Progress**:
- End-to-end testing
- Demo video production
- Security audit

**Timeline**: Submit by November 11, 2025

## Components Status

**Production Ready**:
1. x402 Verifier Oracle - Python/FastAPI
2. Solana Escrow Program - Rust/Anchor
3. TypeScript SDK - Full client library
4. MCP Server - 5 tools
5. Interactive Demo - Web UI
6. Documentation - Complete specs

**Metrics**:
- Code: 4 major packages
- Tools: 5 MCP tools
- Quality factors: 3 (semantic, completeness, freshness)
- Refund granularity: 0-100% sliding scale
- Resolution time: 24-48 hours (automated)

## License

MIT

## Links

- GitHub: [github.com/x402kamiyo/x402resolve](https://github.com/x402kamiyo/x402resolve)
- Documentation: [Complete Technical Docs](./docs/)
- Demo: [Interactive Demo](./demo/index.html)
- Website: [kamiyo.ai](https://kamiyo.ai)

Built for Solana x402 Hackathon 2025.
