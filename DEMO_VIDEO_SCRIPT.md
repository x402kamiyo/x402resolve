# x402Resolve: 3-Minute Demo Video Script

## Overview

**Total Runtime**: 3:00
**Audience**: Hackathon judges, developers, investors
**Goal**: Show end-to-end trustless dispute resolution in action

---

## Script

### [0:00-0:20] Opening Hook (20 seconds)

**[Screen: Animated text on black background]**

**Voiceover**:
> "AI agents make thousands of API payments per day. But what happens when the data is bad?"

**[Screen: Montage of crypto exploit headlines]**
- "$2.3B lost to bad oracle data in 2024"
- "Traditional chargebacks: $50-500, 2-4 weeks"
- "Crypto payments are irreversible..."

**[Screen: x402Resolve logo + tagline]**

**Voiceover**:
> "Introducing x402Resolve: 99% trustless dispute resolution at $0.000005 cost."

---

### [0:20-0:50] The Problem (30 seconds)

**[Screen: Animated agent character + API server]**

**Voiceover**:
> "Meet Alice, an AI trading agent. She pays 0.01 SOL for real-time exploit data from an API."

**[Screen: Payment transaction on Solana Explorer]**

**Voiceover**:
> "But the API returns incomplete, outdated data. Alice's trades fail."

**[Screen: Sad agent character + red X over data]**

**Voiceover**:
> "In traditional finance, Alice waits 2-4 weeks for arbitration, pays $50-500 in fees."

**[Screen: Comparison chart]**
- Traditional: ❌ 2-4 weeks, ❌ $50-500 cost, ❌ Manual process
- x402Resolve: ✅ 48 hours, ✅ $0.000005, ✅ 99% trustless

**Voiceover**:
> "With x402Resolve, Alice gets an automatic refund in 48 hours. Let me show you how."

---

### [1:20-1:50] The Solution: Escrow Payment (30 seconds)

**[Screen: Code editor showing SDK integration]**

**Voiceover**:
> "Step 1: Alice uses the x402 SDK to create an escrow payment."

```typescript
const client = new KamiyoClient({
  apiUrl: 'https://api.kamiyo.ai',
  enablex402Resolve: true  // Enable dispute protection
});

// Pay with escrow (48-hour dispute window)
const payment = await client.pay({
  amount: 0.01,
  recipient: apiWallet,
  enableEscrow: true  // 🔒 Funds locked in trustless PDA
});
```

**[Screen: Solana Explorer showing escrow PDA creation]**

**Voiceover**:
> "Funds are locked in a Program-Derived Address on Solana - no admin keys, no central authority."

**[Screen: Diagram showing escrow flow]**
- Alice → 0.01 SOL → Escrow PDA → (48h wait) → API or Refund

**Voiceover**:
> "The API has 48 hours to deliver quality data. If Alice receives bad data, she can file a dispute."

---

### [1:50-2:20] The Solution: Dispute Filing (30 seconds)

**[Screen: Alice receives bad data, opens dispute form]**

**Voiceover**:
> "Step 2: Alice files a dispute with evidence of poor quality data."

```typescript
// File dispute with quality evidence
const dispute = await client.dispute({
  transactionId: payment.transactionId,
  reason: 'Incomplete exploit data - missing 8/10 expected fields',
  originalQuery: 'Recent Solana exploits',
  dataReceived: badData,  // What Alice actually got
  expectedCriteria: ['protocol', 'amount', 'date', 'tx_hash']
});
```

**[Screen: Switchboard oracle network visualization]**

**Voiceover**:
> "Instead of a centralized server, x402Resolve uses Switchboard - a decentralized oracle network."

**[Screen: Quality scoring breakdown]**
- Semantic Similarity: 0.62/1.0 (40% weight)
- Completeness: 0.45/1.0 (40% weight)
- Freshness: 0.70/1.0 (20% weight)
- **Final Quality Score: 58/100**

**Voiceover**:
> "Switchboard nodes independently compute a quality score using semantic analysis, completeness checks, and freshness metrics."

---

### [2:20-2:50] The Solution: Automatic Resolution (30 seconds)

**[Screen: Escrow program verifying Switchboard result]**

**Voiceover**:
> "Step 3: The Solana escrow program verifies the Switchboard attestation on-chain."

```rust
// Verify Switchboard oracle result (on-chain)
require!(
    switchboard_function.owner == switchboard_on_demand::ID,
    "Invalid oracle"
);

// Calculate refund split
let refund_percentage = if quality_score >= 80 { 0 }
                        else if quality_score >= 50 { (80 - quality_score) * 100 / 80 }
                        else { 100 };
```

**[Screen: Refund calculation]**
- Quality Score: 58/100
- Refund Formula: (80 - 58) / 80 = 27.5%
- Refund to Alice: **0.00275 SOL**
- Payment to API: **0.00725 SOL**

**Voiceover**:
> "With a quality score of 58, Alice gets a 27.5% refund - fair compensation for partial delivery."

**[Screen: Solana Explorer showing refund transaction]**

**Voiceover**:
> "The escrow program automatically splits funds. No admin, no appeals, no delays."

---

### [2:50-3:00] Closing Impact (10 seconds)

**[Screen: Key metrics animated on screen]**

**Voiceover**:
> "x402Resolve: Enabling trustless commerce for the AI agent economy."

**[Screen: Final metrics slide]**
- ✅ 99% Trustless via Switchboard
- ✅ $0.000005 cost per dispute
- ✅ 48-hour resolution
- ✅ 0-100% sliding-scale refunds
- ✅ $259M addressable market

**[Screen: Call to action]**

**Text on screen**:
- GitHub: github.com/x402kamiyo/x402resolve
- Live Demo: x402kamiyo.github.io/x402resolve
- Docs: Full technical details
- Built on Solana | Powered by Switchboard

**Voiceover**:
> "Try the live demo at x402kamiyo.github.io/x402resolve. Built on Solana, powered by Switchboard."

**[Fade to black]**

---

## Visual Assets Needed

### Screen Recordings
1. **SDK Integration**: VS Code showing client.pay() and client.dispute() code
2. **Solana Explorer**:
   - Escrow PDA creation transaction
   - Dispute marking transaction
   - Refund split transaction
3. **Switchboard Dashboard** (if available): Oracle network processing request

### Animations
1. **Agent + API Flow**: Simple stick figure/icon animation
2. **Escrow Diagram**: Funds flowing through PDA
3. **Quality Scoring**: Animated breakdown of 3 factors
4. **Refund Calculation**: Visual math showing 58→27.5%

### Graphics
1. **Comparison Table**: Traditional vs x402Resolve (0:20)
2. **Trustlessness Breakdown Table**: From TRUSTLESS_ARCHITECTURE.md
3. **Final Metrics Slide**: 5 key stats (2:50)

---

## Recording Notes

### Voiceover Tips
- Clear, professional tone (not overly enthusiastic)
- Emphasize "99% trustless", "$0.000005", "48 hours"
- Pronounce "x402" as "ex-four-oh-two"
- Speak at 150-160 words per minute

### Pacing
- 0:00-0:20: Fast (hook viewer)
- 0:20-0:50: Medium (set up problem)
- 0:50-2:50: Slow (technical walkthrough)
- 2:50-3:00: Fast (impact & CTA)

### Technical Accuracy
- Show real Solana devnet transactions
- Use actual Switchboard function output
- Display real quality scores from test data

---

## Alternative: Live Demo Format

**If live demo preferred over scripted video:**

### Structure (3 minutes live)

1. **[0:00-0:30]** Introduction + problem statement
2. **[0:30-1:00]** Show SDK code + run payment creation
3. **[1:00-1:30]** Demonstrate bad data scenario
4. **[1:30-2:00]** File dispute, watch Switchboard process
5. **[2:00-2:30]** Show refund transaction on Solana Explorer
6. **[2:30-3:00]** Recap metrics + Q&A setup

**Pros**: More authentic, shows real system
**Cons**: Risk of technical issues during demo

**Recommendation**: Pre-record with backup live demo link

---

## Post-Production

### Captions
- Add subtitles for accessibility
- Highlight key metrics in bold
- Use color coding: Green for benefits, Red for problems

### Music
- Background: Soft tech/ambient music
- Volume: Low (30% of voiceover)
- No music during code snippets (focus on explanation)

### Export Settings
- Resolution: 1080p minimum
- Format: MP4 (H.264)
- Length: Exactly 3:00 (judges may have time limits)
- File size: <50MB for easy sharing

---

## Distribution

1. **YouTube**: Upload as unlisted, share link in submission
2. **GitHub**: Embed in README.md
3. **Demo Site**: Add video player to x402kamiyo.github.io/x402resolve
4. **Twitter/X**: 30-second teaser clip with full video link
5. **Hackathon Submission**: Direct link + backup Google Drive link

---

## Success Metrics

Video effectiveness measured by:
- ✅ Judges understand "99% trustless" claim
- ✅ Clear visual proof of Switchboard integration
- ✅ End-to-end flow demonstrated without confusion
- ✅ Key metrics (cost, time, trustlessness) communicated
- ✅ Call to action clear (try demo, read docs)

**Goal**: Judges can verify trustlessness claims and see Switchboard integration working end-to-end.
