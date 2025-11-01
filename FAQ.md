# Frequently Asked Questions (FAQ)

Common questions about x402Resolve and automated dispute resolution for AI agent payments.

## Table of Contents

- [General Questions](#general-questions)
- [Technical Questions](#technical-questions)
- [Integration Questions](#integration-questions)
- [Security & Trust](#security--trust)
- [Economics & Pricing](#economics--pricing)
- [Comparison Questions](#comparison-questions)

---

## General Questions

### What is x402Resolve?

x402Resolve is an automated dispute resolution system for cryptocurrency API payments on Solana. It uses time-locked escrow and objective quality verification to protect AI agents from receiving poor-quality data.

**Key features:**
- 24-48 hour resolution (vs 2-4 weeks traditional)
- 0-100% sliding-scale refunds based on actual quality
- $0.000005 cost per dispute (vs $50-500 traditional)
- Fully automated with Ed25519-signed oracle assessments

### Why do we need this?

AI agents make thousands of API payments daily with cryptocurrency. When data quality is poor, there's currently no recourse:
- Crypto payments are irreversible
- Traditional chargebacks don't work for crypto
- Manual arbitration doesn't scale to autonomous agents
- Binary outcomes (full refund or nothing) ignore partial delivery

**The cost:** $259M in annual API fraud losses across industries.

### How does it work?

1. **Payment**: Buyer creates time-locked escrow on Solana
2. **Delivery**: API provider delivers data
3. **Quality Check**: Automated oracle scores data (0-100)
4. **Resolution**: Smart contract executes refund based on score
   - Score ≥80: No refund (acceptable quality)
   - Score 50-79: Partial refund (sliding scale)
   - Score <50: 100% refund (unacceptable)

### Is this live?

Yes! Deployed to Solana Devnet:
- **Program ID:** `AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR`
- **Live Demo:** https://x402kamiyo.github.io/x402resolve
- **Working Examples:** 5 code examples in `/examples`

---

## Technical Questions

### What blockchain does it use?

Solana (Devnet currently, Mainnet-ready).

**Why Solana?**
- Fast transaction finality (~400ms)
- Low costs ($0.000005 per transaction)
- Ed25519 signature verification built-in
- Scales to thousands of disputes per day

### How is quality calculated?

Three-factor algorithm with weighted scoring:

```
Quality Score = (
  Semantic Similarity × 40% +
  Completeness × 40% +
  Freshness × 20%
) × 100
```

**Semantic Similarity:** Cosine similarity between query and results using sentence-transformers
**Completeness:** Required fields validation, record count, data structure
**Freshness:** Data recency (timestamps, age checks)

**Example:**
- Query: "Uniswap V3 exploits"
- Data: 3 Curve exploits (wrong protocol)
- Semantic: 72% (similar but wrong)
- Completeness: 40% (missing fields)
- Freshness: 100% (recent data)
- **Final Score:** 65/100 → 35% refund

### What programming languages are supported?

- **TypeScript/JavaScript:** Full SDK with retry handling
- **Python:** Verifier oracle, MCP server integration
- **Rust:** Solana smart contract (Anchor framework)

**Any language** can interact via:
- REST API (verifier oracle)
- Solana RPC (smart contract)
- MCP protocol (Claude Desktop)

### How long does dispute resolution take?

**Automated resolution:** 2-3 seconds for oracle assessment
**Total time including Solana confirmation:** ~5-10 seconds
**Dispute window:** 24 hours (configurable)

Compare to traditional:
- Crypto chargeback: Not possible
- Credit card chargeback: 2-4 weeks
- Manual arbitration: Days to weeks

### Can I run this locally?

Yes! Complete setup in 5 minutes:

```bash
git clone https://github.com/x402kamiyo/x402resolve
cd x402resolve
./scripts/generate-wallets.sh
cd examples/with-dispute && npm install && ts-node index.ts
```

See [QUICKSTART.md](./QUICKSTART.md) for details.

---

## Integration Questions

### How do I integrate with my API?

Three options:

**Option 1: TypeScript SDK (Easiest)**
```typescript
import { KamiyoClient } from '@kamiyo/x402-sdk';

const client = new KamiyoClient({
  apiUrl: 'https://your-api.com',
  enablex402Resolve: true
});

const payment = await client.pay({
  amount: 0.01,
  enableEscrow: true
});
```

**Option 2: Direct Smart Contract Interaction**
```typescript
import { EscrowClient } from '@kamiyo/x402-sdk';

const escrowClient = new EscrowClient(connection, programId, payer);
await escrowClient.initializeEscrow({...});
```

**Option 3: REST API**
```bash
curl -X POST http://localhost:8000/api/v1/verify \
  -H "Content-Type: application/json" \
  -d '{"query":"...","data":[...]}'
```

See [API Reference](./docs/markdown/API_REFERENCE.md) for complete documentation.

### Does it work with Claude Desktop?

Yes! Via Model Context Protocol (MCP):

**5 Available Tools:**
1. `health_check` - System status
2. `search_crypto_exploits` - Security database
3. `assess_defi_protocol_risk` - Risk analysis
4. `monitor_wallet` - Exposure checking
5. `file_dispute` - Quality disputes

See [MCP Integration Guide](./MCP_INTEGRATION_GUIDE.md) for setup.

### Can AI agents use this autonomously?

Yes! That's the primary use case. Example:

```typescript
// Agent makes API call
const data = await api.search('exploits');

// Agent checks quality
const quality = await verifier.assess(data);

// Agent automatically disputes if needed
if (quality.score < 80) {
  await client.dispute({
    transactionId: payment.id,
    evidence: data
  });
}
```

See `examples/agent-dispute/` for complete autonomous agent example.

### What APIs does it work with?

**Any HTTP API that:**
- Accepts cryptocurrency payments
- Returns structured data (JSON, XML, etc.)
- Can be objectively evaluated

**Current integration:**
- KAMIYO exploit intelligence API
- Extensible to any x402-compliant API

**Examples:**
- Security intelligence APIs
- Financial data APIs
- Weather APIs
- IoT sensor APIs
- Healthcare data APIs

---

## Security & Trust

### How do I know the oracle is honest?

Multiple trust mechanisms:

**1. Ed25519 Signature Verification**
- Oracle signs every assessment
- Signature verified on-chain
- Can't forge or modify results

**2. On-Chain Reputation System**
- Oracle score: 0-1000 points
- 4 strikes = permanent ban
- Public, auditable history

**3. Multi-Oracle Consensus (Phase 2)**
- High-value transactions require 3 oracles
- Median score used
- Outliers detected and penalized

**4. Deterministic Algorithm**
- Semantic similarity: sentence-transformers model
- Completeness: rule-based validation
- Freshness: timestamp checking
- No subjective judgment

### Can the system be gamed?

We've implemented 16 anti-gaming features:

**Sybil Attack Prevention:**
- Graduated verification levels (L1-L4)
- Stake requirements ($10+ SOL)
- Rate limiting per entity

**Spam Prevention:**
- Dispute cost scaling (1x to 10x)
- Hourly/daily rate limits
- Minimum escrow amounts

**Oracle Collusion:**
- Multi-oracle consensus
- Outlier detection
- Slashing for dishonest oracles

See [TRUST_MODEL.md](./TRUST_MODEL.md) for complete details.

### Is the code audited?

**Current status:**
- ✅ Self-audited (see [SECURITY_AUDIT.md](./SECURITY_AUDIT.md))
- ✅ 101/101 tests passing
- ✅ Open source for community review
- ⏳ Professional audit planned for mainnet

**Security features:**
- PDA-based escrow (no private keys)
- Checked arithmetic (no overflow)
- Time-lock protection
- Ed25519 signature verification

### What if the oracle goes offline?

**Fallback mechanisms:**

**Single Oracle:**
- Retry with exponential backoff (1s, 2s, 4s, 8s)
- Fail-over to backup verifier
- Manual dispute escalation

**Multi-Oracle (Phase 2):**
- Selects from pool of verified oracles
- Requires only majority (2 of 3)
- Automatic re-selection if oracle unavailable

**Worst case:**
- Dispute window expires (24h default)
- Funds released to seller
- Buyer can file claim through governance

---

## Economics & Pricing

### How much does it cost?

**Per Dispute:**
- Solana transaction: ~$0.000005
- Oracle verification: $0.00 (currently free)
- Total: **$0.000005**

Compare to:
- Credit card chargeback: $50-500
- PayPal dispute: $15-50
- Manual arbitration: $100-1000

**99.999% cheaper than traditional methods**

### Who pays the costs?

**Default:**
- Buyer pays Solana transaction fee
- Loser pays dispute escalation fees (if any)

**Configurable:**
- Can be split between parties
- Can be included in escrow amount

### What's the escrow amount?

**Configurable:**
- Minimum: 0.001 SOL (~$0.00002)
- Recommended: Payment amount
- Maximum: No limit

**Example:**
- API costs 0.01 SOL
- Escrow: 0.01 SOL
- If 65/100 quality: Buyer gets 0.0035 SOL back

### Is there a subscription fee?

**Current:** No subscription, pay-per-use only

**Future plans:**
- Free tier: <100 disputes/month
- Pro tier: Unlimited disputes, priority support
- Enterprise: Custom SLAs, dedicated oracles

---

## Comparison Questions

### How is this different from PayPal/credit card chargebacks?

| Feature | x402Resolve | PayPal/CC | Advantage |
|---------|-------------|-----------|-----------|
| **Speed** | 2-3 seconds | 2-4 weeks | ✅ 1000x faster |
| **Cost** | $0.000005 | $50-500 | ✅ 99.999% cheaper |
| **Automation** | 100% automated | Manual review | ✅ Scales to millions |
| **Granularity** | 0-100% refund | 100% or 0% | ✅ Fair partial refunds |
| **Crypto** | Native | Not supported | ✅ Works with crypto |
| **AI Agents** | Designed for agents | Humans only | ✅ Agent-first |

### How is this different from other crypto escrow systems?

| Feature | x402Resolve | Traditional Escrow | Advantage |
|---------|-------------|-------------------|-----------|
| **Quality Verification** | Automated AI scoring | Manual inspection | ✅ Objective |
| **Speed** | Seconds | Days/weeks | ✅ 1000x faster |
| **Partial Refunds** | 0-100% sliding scale | Binary (yes/no) | ✅ Fairer |
| **Disputes** | Automated oracle | Human arbitrator | ✅ Scalable |
| **Cost** | $0.000005 | $10-100 | ✅ 99% cheaper |

### Why not just use Chainlink oracles?

**Chainlink:**
- Designed for price feeds
- General-purpose data
- Not optimized for quality assessment

**x402Resolve:**
- Specialized for data quality verification
- 3-factor quality algorithm
- Dispute-specific workflows
- Optimized for AI agent use cases

**We could integrate Chainlink** as one of multiple oracles in Phase 2 multi-oracle consensus.

### Why Solana instead of Ethereum?

| Metric | Solana | Ethereum | Winner |
|--------|--------|----------|--------|
| **Transaction Cost** | $0.000005 | $5-50 | ✅ Solana |
| **Finality** | 400ms | 12-15 min | ✅ Solana |
| **Throughput** | 50k TPS | 15-30 TPS | ✅ Solana |
| **Ed25519 Support** | Native | Requires precompile | ✅ Solana |

**For high-frequency AI agent payments, Solana is the clear choice.**

Ethereum L2s (Arbitrum, Optimism) are also viable and we may expand there in the future.

---

## Deployment & Scaling

### Is this production-ready?

**Current status:** Devnet deployment

**Production-ready for:**
- ✅ Testing and evaluation
- ✅ Hackathon demonstration
- ✅ Proof of concept integrations

**Not yet ready for:**
- ❌ Large-scale mainnet deployment
- ❌ Real money (use devnet SOL only)

**Mainnet timeline:**
- Professional security audit
- Multi-oracle consensus implementation
- Governance system deployment

### How does it scale?

**Current capacity (single oracle):**
- 720 assessments/hour
- ~17,000 disputes/day
- Limited by ML model inference speed

**Multi-oracle capacity (Phase 2):**
- 10+ oracles = 100k+ disputes/day
- Horizontal scaling with oracle pool
- Auto-scaling based on demand

**Solana capacity:**
- 50,000 TPS theoretical
- 65,000 TPS achieved in testing
- Far exceeds oracle capacity

**Bottleneck:** Oracle computation, not blockchain.

### Can I run my own oracle?

**Phase 2 feature (coming soon):**

**Requirements:**
- Stake 10+ SOL
- Run verifier node 24/7
- Pass quality benchmarks
- Maintain >95% uptime

**Rewards:**
- Earn fees per assessment
- Reputation score increases
- Priority selection for high-value disputes

See `docs/markdown/MULTI_ORACLE_DESIGN.md` for details.

---

## Use Cases

### What industries can benefit?

**11 identified industries:**
1. **Healthcare:** $78M/year fraud reduction
2. **IoT:** $65M/year
3. **Financial:** $48M/year
4. **E-commerce:** $18M/year
5. **Legal:** $16M/year
6. **Weather:** $12M/year
7. **Gaming:** Real-time data verification
8. **Social Media:** Content quality assurance
9. **Supply Chain:** Sensor data validation
10. **Insurance:** Claims data verification
11. **DeFi:** Oracle data quality gating

**Total market:** $259M+ annual fraud reduction

### Real-world example?

**Scenario:** AI agent trading bot

1. **Bot subscribes** to crypto price API (0.01 SOL/day)
2. **API provides** price data every 5 minutes
3. **Bot checks** data quality automatically
4. **Issue detected:** Prices are 30 minutes stale
5. **Bot files dispute** with evidence
6. **Quality score:** 40/100 (freshness fail)
7. **Automatic refund:** 100% (0.01 SOL)
8. **Total time:** 5 seconds

**Without x402Resolve:** Bot loses 0.01 SOL, gets bad data, makes losing trades

**With x402Resolve:** Bot gets full refund, switches to backup API, no losses

---

## Future Plans

### What's on the roadmap?

**Phase 2 (Q1 2025):**
- Multi-oracle consensus
- Oracle stake pool
- Mainnet deployment

**Phase 3 (Q2 2025):**
- Governance system
- Advanced quality metrics
- Cross-chain support (Ethereum L2s)

**Phase 4 (Q3 2025):**
- AI-powered quality assessment
- Predictive fraud detection
- Industry-specific quality models

### Will this support other blockchains?

Yes! Planned expansion:
- Ethereum L2s (Arbitrum, Optimism, Base)
- Polygon PoS
- BSC (Binance Smart Chain)
- Avalanche

**Architecture is blockchain-agnostic** - only the smart contract needs to be ported.

### Can I contribute?

Yes! x402Resolve is open source (MIT license).

**Ways to contribute:**
1. **Code:** Submit PRs for features/bugs
2. **Testing:** Try examples, report issues
3. **Documentation:** Improve guides
4. **Integration:** Build on top of x402Resolve
5. **Oracle:** Run a verifier node (Phase 2)

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## Getting Help

### Where can I get support?

1. **Documentation:**
   - [README.md](./README.md) - Overview
   - [QUICKSTART.md](./QUICKSTART.md) - 5-minute setup
   - [API Reference](./docs/markdown/API_REFERENCE.md) - Complete SDK docs
   - [Troubleshooting](./TROUBLESHOOTING.md) - Common issues

2. **Community:**
   - GitHub Issues: https://github.com/x402kamiyo/x402resolve/issues
   - GitHub Discussions: Coming soon

3. **Direct Support:**
   - Email: support@kamiyo.ai
   - Include transaction IDs and error messages

### How do I report a bug?

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) first
2. Search existing GitHub issues
3. Create new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, Node version, etc.)
   - Error messages and logs

### How do I request a feature?

1. Check roadmap in this FAQ
2. Search existing feature requests
3. Create GitHub issue with:
   - Use case description
   - Why it's important
   - Proposed implementation (optional)

---

## Quick Reference

**Live Demo:** https://x402kamiyo.github.io/x402resolve
**GitHub:** https://github.com/x402kamiyo/x402resolve
**Devnet Program:** `AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR`
**Explorer:** https://explorer.solana.com/address/AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR?cluster=devnet

**Support:** support@kamiyo.ai
**Website:** https://kamiyo.ai

---

*Last updated: November 1, 2025*
*Questions not answered here? Email support@kamiyo.ai*
