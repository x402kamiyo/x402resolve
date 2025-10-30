# x402Resolve Integration Examples

Complete examples demonstrating automated dispute resolution integration.

## Available Examples

### 1. Basic Payment

**Difficulty**: Beginner
**Time**: 5 minutes

Simple Solana payment for API access without escrow or disputes.

**Use when:**
- You trust the API provider
- Data quality is not critical
- You want instant payment release

**Features:**
- Direct SOL transfer to API wallet
- Instant payment confirmation
- No dispute capabilities
- Lower gas costs

### 2. With Dispute

**Difficulty**: Intermediate
**Time**: 15 minutes

Complete escrow-based payment with automated dispute resolution.

**Use when:**
- Data quality is critical
- Provider is unknown/untrusted
- You need refund protection
- You want objective quality verification

**Features:**
- Time-locked escrow (24-48h)
- Automated quality scoring
- Sliding scale refunds (0-100%)
- On-chain dispute resolution

### 3. MCP Integration

**Difficulty**: Advanced
**Time**: 30 minutes

MCP server integration for programmatic dispute filing.

**Use when:**
- You're building a programmatic integration
- You want automated quality checks
- You need programmatic disputes
- You're using MCP-compatible applications

**Features:**
- 5 MCP tools available
- Automatic quality detection
- Programmatic dispute filing
- Real-time resolution monitoring

## Quick Start

### Option 1: Interactive Web Demo (No Code)

```bash
# Open in browser
open ../demo/index.html

# Or with local server
cd ../demo
python3 -m http.server 8080
```

**Use for:**
- Understanding the workflow
- Demo videos
- Hackathon judges
- Non-technical users

### Option 2: Run Code Examples

```bash
# 1. Clone repository
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve

# 2. Choose an example
cd examples/basic-payment    # OR with-dispute OR mcp-integration

# 3. Read the README
cat README.md

# 4. Run the example
npm install
ts-node index.ts
```

## Comparison Table

| Feature | Basic Payment | With Dispute | MCP Integration |
|---------|---------------|--------------|-----------------  |
| **Setup Time** | 5 min | 15 min | 30 min |
| **Difficulty** | Beginner | Intermediate | Advanced |
| **Payment Method** | Direct transfer | Escrow | Escrow via MCP |
| **Dispute Support** | No | Yes | Yes |
| **Quality Check** | Manual | Manual | Automated |
| **Refund Support** | No | 0-100% | 0-100% |
| **Resolution** | N/A | Automated | Fully automated |
| **Use Case** | Trusted APIs | Any API | Programmatic access |
| **Code Required** | Yes | Yes | No (MCP config) |
| **Solana TX** | 1 (payment) | 3 (escrow, resolve, refund) | 3 (via MCP) |

## Learning Path

### Path 1: Developer Integration
```
1. basic-payment/     ← Start here to understand payments
2. with-dispute/      ← Add dispute resolution
3. Build your own!    ← Integrate into your app
```

### Path 2: Programmatic Integration
```
1. ../demo/          ← Understand the workflow visually
2. mcp-integration/  ← See MCP integration
3. Customize MCP     ← Add your own tools
```

### Path 3: Hackathon Judges
```
1. ../demo/          ← Interactive demo (no code)
2. Read this README  ← Understand examples
3. Review docs/      ← Technical details
```

## Key Concepts

### Escrow-Based Payments

```
Traditional Payment:
  User → SOL → API Wallet (instant, irreversible)

x402Resolve:
  User → SOL → Escrow PDA (time-locked 24-48h)
              → Dispute window → Quality check
              → Release or Refund
```

### Quality Scoring

```python
quality_score = (
    semantic_coherence * 0.4 +  # Does data match query?
    completeness_score * 0.4 +  # All fields present?
    freshness_score * 0.2       # Is data recent?
) * 100

# Example:
# Query: "Uniswap V3 exploits on Ethereum"
# Data: [Curve, Euler, Mango] ← Wrong protocols
#
# Semantic: 0.60 (protocols don't match)
# Complete: 0.40 (missing tx_hash, source)
# Freshness: 1.00 (recent data)
# → Score: 60*0.4 + 40*0.4 + 100*0.2 = 60/100
# → Refund: 50% (sliding scale)
```

### Automated Refunds

| Quality Score | Refund % | Meaning |
|---------------|----------|---------|
| 90-100 | 0% | High quality |
| 70-89 | 25% | Minor issues |
| 50-69 | 50% | Moderate issues |
| 30-49 | 75% | Significant issues |
| 0-29 | 100% | Poor quality |

## Prerequisites

### All Examples

- Node.js 18+
- Solana CLI
- Devnet SOL (get from faucet)

### With Dispute + MCP Integration

- Python 3.11+
- x402 Verifier Oracle running
- KAMIYO API (optional - can use mock data)

### Installation

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Get devnet SOL
solana airdrop 2 --url devnet

# Install Python dependencies (for verifier)
cd ../packages/x402-verifier
pip3.11 install -r requirements.txt

# Install Node dependencies (for examples)
cd ../../examples/basic-payment
npm install
```

## What Each Example Includes

### basic-payment/
```
├── README.md           # Complete documentation
├── index.ts            # TypeScript implementation
├── package.json        # Dependencies
└── .env.example        # Configuration template
```

### with-dispute/
```
├── README.md           # Step-by-step guide
├── index.ts            # Full dispute workflow
├── package.json        # Dependencies
└── .env.example        # Configuration
```

### mcp-integration/
```
├── README.md           # MCP setup guide
├── mcp_config.json     # Configuration
└── example-flows.md    # Interaction examples
```

## Demo Scenarios

### Scenario 1: Happy Path (No Dispute)

```typescript
// 1. Pay for data
const payment = await client.pay({ amount: 0.01, query: "Ethereum exploits" });

// 2. Receive high-quality data
const data = await fetchData(payment.token);

// 3. Quality is good → Escrow auto-releases after 24h
// No dispute needed
```

### Scenario 2: Poor Quality (Automatic Dispute)

```typescript
// 1. Pay for data
const payment = await client.pay({ amount: 0.01, query: "Uniswap exploits" });

// 2. Receive poor-quality data
const data = await fetchData(payment.token);
// Result: [Curve, Euler, Mango] ← Wrong protocols

// 3. File dispute
const dispute = await client.dispute({
  transactionId: payment.txId,
  reason: "Wrong protocols",
  evidence: "Expected Uniswap, got Curve/Euler/Mango"
});

// 4. Wait for automated resolution (24-48h)
// Quality score: 45/100 → 75% refund
```

### Scenario 3: Programmatic Integration (Fully Automated)

```
User: "Search for Uniswap exploits"
  ↓
App: [Uses search_crypto_exploits MCP tool]
  ↓
API returns poor data (wrong protocols)
  ↓
App: [Automatically detects quality issues]
  ↓
App: [Uses file_dispute MCP tool]
  ↓
App: "Dispute filed. Estimated 75% refund."
  ↓
User gets notification when resolved
```

## Related Documentation

- [x402 Payment System](../docs/X402_PAYMENT_SYSTEM.md) - Complete technical docs
- [MCP Server](../packages/mcp-server/README.md) - MCP tools reference
- [TypeScript SDK](../packages/x402-sdk/README.md) - SDK documentation
- [Verifier Oracle](../packages/x402-verifier/README.md) - Quality scoring details
- [Solana Escrow](../packages/x402-escrow/README.md) - Smart contract docs

## Support

- **Issues**: [GitHub Issues](https://github.com/x402kamiyo/x402resolve/issues)
- **Discussions**: [GitHub Discussions](https://github.com/x402kamiyo/x402resolve/discussions)
- **Discord**: [Join Community]
- **Email**: support@kamiyo.io

## Next Steps

1. **Try the Interactive Demo**: `open ../demo/index.html`
2. **Run Basic Payment**: `cd basic-payment && npm install && ts-node index.ts`
3. **Add Dispute Resolution**: `cd with-dispute && npm install && ts-node index.ts`
4. **Integrate with MCP**: `cd mcp-integration && cat README.md`

---

**Built for Solana x402 Hackathon 2025**

Questions? Check the [main README](../README.md) or [documentation](../docs/).
