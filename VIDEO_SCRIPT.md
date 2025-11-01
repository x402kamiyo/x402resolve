# Video Demo Script (3 minutes)

## Intro (30s)
"This is x402Resolve - automated dispute resolution for crypto API payments on Solana.

When AI agents pay for API data with crypto, there's no recourse if the data is poor quality. Traditional chargebacks take weeks and require manual arbitration.

x402Resolve uses escrow payments with programmatic quality verification. Disputes resolve in 24-48 hours, automatically, on-chain."

**Show**: GitHub repo, README TL;DR

## Problem (30s)
Traditional payment - no protection:
```typescript
await api.pay(0.01); // SOL instantly released
const data = await api.query('exploits');
// What if data is wrong? No recourse.
```

Payment is irreversible. If the API returns incomplete or wrong data, you're stuck.

**Show**: Code example, highlight "irreversible"

## Solution (60s)
Three-line integration:
```typescript
const client = new KamiyoClient({ enablex402Resolve: true });
const payment = await client.pay({ amount: 0.01, enableEscrow: true });
const dispute = await client.dispute({ transactionId, reason, evidence });
```

Behind the scenes:
1. Payment → Solana escrow (24-hour time lock)
2. Quality check on data delivery
3. Oracle analyzes: semantic similarity (40%), completeness (40%), freshness (20%)
4. Ed25519 signed score verified on-chain
5. Sliding scale refund: 0-100% based on quality

**Show**: Architecture diagram, quality scoring breakdown

## Live Demo (30s)
"Running on Solana devnet right now. Program deployed at AFmBBw...qsSR"

Dispute scenario:
- Query: "Uniswap V3 exploits on Ethereum"
- Received: Curve Finance exploits (wrong protocol)
- Quality: 65/100
- Refund: 35% (0.0035 SOL)

**Show**: Live demo, fill form, submit, show results with explorer link

## MCP Integration (15s)
"Built MCP server for AI agent integration. Claude can use our tools directly:"

```
User: "Search for recent crypto exploits"
Claude: [Using search_crypto_exploits tool]

User: "File a dispute for transaction tx_123"
Claude: [Using file_dispute tool]
Refund: 35% approved
```

**Show**: Claude Desktop with MCP tools

## Technical Highlights (10s)
- 275KB Solana program (Rust/Anchor)
- PDA-based escrow accounts
- Ed25519 signature verification
- Multi-oracle consensus ready
- 137 tests passing

**Show**: Test results

## Impact (5s)
Traditional arbitration → x402Resolve:
- 2-4 weeks → 24-48 hours
- $50-500 → $0.000005 SOL
- Manual → Automated
- Binary refund → 0-100% sliding scale

**Show**: Comparison table

## Closing (5s)
"Four tracks: MCP Server, Dev Tool, Agent Application, API Integration.

Open source, MIT licensed, live on devnet."

**Show**: GitHub link, demo link, program address

---

## Recording Setup

**Equipment**:
- Screen: 1920x1080
- Tool: OBS Studio
- Mic: Clear audio, no background noise

**OBS Settings**:
- Video Bitrate: 4500 Kbps
- Encoder: x264
- Format: MP4
- Audio: 192 Kbps AAC
- FPS: 30

**Before Recording**:
- Close unnecessary windows
- Clear browser autocomplete
- Prepare all tabs
- Test audio
- Practice run

**Pacing**: Confident, clear, no filler words. Start strong, end confident.

## YouTube Upload

**Title**: "x402Resolve - Automated Dispute Resolution for AI Agent Payments on Solana"

**Description**:
```
x402Resolve provides automated dispute resolution for crypto API payments on Solana.
Disputes resolve in 24-48 hours through programmatic quality verification.

Links:
GitHub: https://github.com/x402kamiyo/x402resolve
Live Demo: https://x402kamiyo.github.io/x402resolve
Devnet Program: AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR

Solana x402 Hackathon 2025
Built by KAMIYO
```

**Tags**: solana, blockchain, web3, ai-agents, dispute-resolution, x402, hackathon, cryptocurrency, smart-contracts, defi, mcp

**Settings**: Public, Science & Technology, Allow embedding, Comments enabled
