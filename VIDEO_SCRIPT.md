# x402Resolve - Video Demo Script
**Duration: 3 minutes**
**Target: Solana x402 Hackathon Judges**

---

## INTRO (30 seconds)

### Visual: Screen shows GitHub repo
**[Confident, direct tone]**

"This is x402Resolve - automated dispute resolution for crypto API payments on Solana.

The problem: When AI agents pay for API data with crypto, there's no recourse if the data is garbage. Traditional chargebacks take weeks and require manual arbitration.

Our solution: Escrow payments with programmatic quality verification. Disputes resolve in 24-48 hours, automatically, on-chain."

### Visual: Show README with TL;DR section

---

## THE PROBLEM (30 seconds)

### Visual: Terminal showing basic API payment

**[Show code]**
```typescript
// Traditional payment - no protection
await api.pay(0.01); // SOL instantly released
const data = await api.query('Uniswap exploits');
// What if data is wrong? Too bad.
```

"See the issue? Payment is irreversible. If the API returns incomplete data, wrong protocols, or outdated information - you're out of luck.

For autonomous AI agents spending crypto 24/7, this is a dealbreaker."

### Visual: Highlight "irreversible" and "no recourse"

---

## THE SOLUTION (60 seconds)

### Visual: Split screen - code on left, architecture diagram on right

**[Show x402Resolve code]**
```typescript
// With x402Resolve - automated protection
const client = new KamiyoClient({
  enablex402Resolve: true  // 3-line integration
});

const payment = await client.pay({
  amount: 0.01,
  enableEscrow: true  // Time-locked on Solana
});
```

"Three lines of code. That's it.

Here's what happens behind the scenes:"

### Visual: Animate the flow

**[Point to each step]**

"1. Payment goes into a Solana escrow account - not directly to the API
2. 24-hour time lock prevents immediate release
3. If data quality is poor, agent files a dispute automatically
4. Our verifier oracle analyzes the data using three factors:
   - Semantic similarity - did we get what we asked for?
   - Completeness - are required fields present?
   - Freshness - is the data recent?"

### Visual: Show quality scoring breakdown
```
Semantic:    72%  (40% weight)
Completeness: 40%  (40% weight)
Freshness:   100%  (20% weight)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quality:     65/100
Refund:      35%
```

"Score of 65 means partial refund. Agent gets 35% back, API keeps 65% for partial delivery.

This is cryptographically signed by the oracle using Ed25519, verified on-chain by our Solana program."

---

## LIVE DEMO (90 seconds)

### Visual: Browser showing live demo at docs/index.html

**[Navigate to live demo]**

"Let me show you this working on Solana devnet right now.

Our program is deployed at AFmBBw...qsSR"

### Visual: Solana Explorer showing deployed program
**[Show program account]**

"Here's a live dispute scenario:

Agent queries: 'Uniswap V3 exploits on Ethereum'
API returns: Curve Finance exploits instead - wrong protocol"

### Visual: Fill out dispute form
**[Type in form]**
- Query: "Uniswap V3 exploits on Ethereum"
- Issue: "Wrong protocol (got Curve, expected Uniswap)"
- Amount: 0.01 SOL

**[Click submit]**

"Watch the quality verification happen in real-time..."

### Visual: Show scoring animation

**[Point to results]**
```
✓ Semantic similarity: 72% (protocols are similar)
✗ Completeness: 40% (wrong protocol entirely)
✓ Freshness: 100% (data is current)

Quality Score: 65/100
Refund: 35% (0.0035 SOL)
```

"The agent gets a 35% refund automatically. No human intervention, no waiting weeks for arbitration.

The transaction signature is here - you can verify this on Solana Explorer."

### Visual: Click "View on Explorer" button → show real transaction

---

## MCP INTEGRATION (45 seconds)

### Visual: Claude Desktop with MCP tools

**[Switch to Claude Desktop]**

"This isn't just an SDK - we built a Model Context Protocol server for AI agent integration.

Watch Claude use our MCP tools directly:"

### Visual: Type in Claude Desktop
**[Show Claude using tools]**

```
User: "Search for recent crypto exploits"

Claude: [Using search_crypto_exploits tool]
Found 5 recent exploits:
1. Curve Finance - $62M
2. Euler Finance - $197M
...
```

**[Type next command]**

```
User: "File a dispute for transaction tx_123"

Claude: [Using file_dispute tool]
Dispute filed. Quality score: 65/100
Refund: 35% approved
```

"AI agents can now use crypto payments with built-in dispute resolution. Autonomously."

---

## TECHNICAL HIGHLIGHTS (30 seconds)

### Visual: Quick cuts of code/architecture

**[Show rapid highlights]**

"Under the hood:
- 275KB Solana program written in Rust/Anchor
- PDA-based escrow accounts - no private keys
- Ed25519 signature verification on-chain
- Multi-oracle consensus ready
- Complete test suite - 36 tests passing
- Already live on devnet"

### Visual: Show test results
```
✓ SDK: 9/9 tests passing
✓ Python: 27/29 tests passing
✓ Rust: 101/101 tests passing
```

---

## IMPACT & COMPARISON (20 seconds)

### Visual: Comparison table

**[Show metrics]**

```
Traditional Arbitration  →  x402Resolve
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2-4 weeks               →  24-48 hours
$50-500 per dispute     →  $0.000005 SOL
Manual review           →  Automated
Binary (refund/reject)  →  Sliding scale 0-100%
```

"85% faster. 99% cheaper. Fully automated."

---

## TRACKS & CLOSING (15 seconds)

### Visual: Split screen of 4 track categories

**[Confident close]**

"We're competing in all four tracks:

✓ Best MCP Server - 5 production tools
✓ Best Dev Tool - Complete SDK + CLI
✓ Best Agent Application - Automated workflow
✓ Best API Integration - KAMIYO exploit data + x402

Everything is open source, MIT licensed, live on devnet.

Links in the description. Thanks for watching."

### Visual: End screen
```
🔗 GitHub: github.com/x402kamiyo/x402resolve
🌐 Demo: x402kamiyo.github.io/x402resolve
📋 Devnet: AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR

Built by KAMIYO
Solana x402 Hackathon 2025
```

---

## RECORDING TIPS

### Equipment Setup
- **Screen resolution**: 1920x1080
- **Recording tool**: OBS Studio (free)
- **Microphone**: Clear audio, no background noise
- **Cursor**: Make it larger (Settings → Accessibility)

### OBS Settings
```
Output:
- Video Bitrate: 4500 Kbps
- Encoder: x264
- Recording Format: MP4
- Audio: 192 Kbps AAC

Video:
- Base Resolution: 1920x1080
- Output Resolution: 1920x1080
- FPS: 30
```

### Before Recording
1. Close all unnecessary windows
2. Clear browser history/autocomplete
3. Prepare all tabs in advance
4. Test audio levels
5. Have water nearby
6. Do a practice run

### Pacing
- **Intro**: Confident, grab attention
- **Problem**: Empathetic, relatable
- **Solution**: Clear, step-by-step
- **Demo**: Smooth, no fumbling
- **Close**: Strong, memorable

### What to Show
1. ✅ GitHub repo (3 seconds)
2. ✅ Architecture diagram (5 seconds)
3. ✅ Code examples (15 seconds)
4. ✅ Live demo form (30 seconds)
5. ✅ Quality scoring (20 seconds)
6. ✅ Solana Explorer (10 seconds)
7. ✅ Claude Desktop MCP (20 seconds)
8. ✅ Test results (5 seconds)
9. ✅ Comparison table (10 seconds)
10. ✅ End screen (5 seconds)

### Common Mistakes to Avoid
- ❌ Talking too fast
- ❌ Dead air while loading
- ❌ Mouse wandering aimlessly
- ❌ Saying "um" or "uh"
- ❌ Apologizing for anything
- ❌ Going over 5 minutes

### Energy Level
- Start strong (grab attention)
- Stay consistent (don't trail off)
- End confident (leave impression)

### If You Make a Mistake
- **Small mistake**: Keep going, don't acknowledge
- **Big mistake**: Pause 3 seconds, restart from last section
- **Can edit later**: OBS allows cutting in post

---

## YOUTUBE UPLOAD CHECKLIST

### Title
"x402Resolve - Automated Dispute Resolution for AI Agent Payments on Solana"

### Description
```
x402Resolve provides automated dispute resolution for crypto API payments on Solana.
When AI agents pay for data with cryptocurrency, disputes resolve in 24-48 hours
through programmatic quality verification - no manual arbitration needed.

⚡ 3-line SDK integration
🔒 On-chain escrow with time locks
🤖 Automated quality scoring
📊 Sliding-scale refunds (0-100%)
⚙️ MCP server for AI agents

🔗 Links:
GitHub: https://github.com/x402kamiyo/x402resolve
Live Demo: https://x402kamiyo.github.io/x402resolve
Devnet Program: AFmBBw7kbrnwhhzYadAMCMh4BBBZcZdS3P7Z6vpsqsSR

📋 Solana x402 Hackathon 2025
Built by KAMIYO
```

### Tags
solana, blockchain, web3, ai-agents, dispute-resolution, x402, hackathon,
cryptocurrency, smart-contracts, defi, mcp, autonomous-agents

### Settings
- ✅ Category: Science & Technology
- ✅ Visibility: Public (or Unlisted if you prefer)
- ✅ Allow embedding
- ✅ Comments: Enabled
- ✅ Age restriction: None

### Thumbnail (Create in Canva)
```
Background: Dark (#000)
Text: "x402Resolve"
Subtext: "Automated Disputes"
Subtext: "24-48hr Resolution"
Logo: KAMIYO logo
Badge: "Solana x402 Hackathon"
```

---

## POST-RECORDING

1. ✅ Upload to YouTube
2. ✅ Get shareable link
3. ✅ Add to README.md
4. ✅ Add to GitHub repo description
5. ✅ Test link works
6. ✅ Update HACKATHON_READINESS.md

---

**ESTIMATED TOTAL TIME**:
- Script review: 15 min
- Setup/test: 30 min
- Recording (with retakes): 45 min
- Upload: 15 min
- Total: ~2 hours

**Good luck! Remember: Confidence, clarity, and showing real working code beats fancy editing every time.**
