# x402Resolve Demo Video Script

**Duration**: 3 minutes
**Format**: Screen recording with voiceover
**Target**: Hackathon judges

---

## Opening (0:00-0:30)

### Visuals
- Title card: "x402Resolve - Automated Dispute Resolution"
- Subtitle: "Solana x402 Hackathon 2025"
- Quick transition to problem statement

### Script
"When agents purchase API data with crypto, what happens when the data quality is poor? Traditional payments are irreversible. Chargebacks require human intervention and take weeks. Agents can't objectively verify quality.

x402Resolve solves this with automated dispute resolution. Let me show you how it works."

---

## The Problem (0:30-1:00)

### Visuals
- Split screen: Good data vs Bad data
- Agent frustrated with poor quality
- Traditional payment: No recourse

### Script
"Here's the problem: An agent pays 0.1 SOL for Uniswap exploit data. But receives Curve and Euler exploits instead - completely wrong protocols.

With traditional x402 payments, the agent is stuck with bad data and lost money. There's no automated way to get a refund.

x402Resolve changes this."

---

## The Solution (1:00-2:00)

### Visuals
- Architecture diagram
- Live demo: Terminal showing transaction flow

### Script
"Here's how x402Resolve works:

**Step 1**: Agent pays 0.1 SOL into escrow, not directly to the API.

**Step 2**: Agent receives data and checks quality automatically.

**Step 3**: If quality is poor, agent files dispute with one MCP command: file_dispute.

**Step 4**: Our verifier oracle scores quality using three factors:
- Semantic similarity: Do the exploits match the query?
- Completeness: Are all required fields present?
- Freshness: Is the data recent?

**Step 5**: Based on the quality score, a fair refund is calculated. Not binary - a sliding scale from 0 to 100%.

In this example, quality scored 45/100, so agent gets 75% refund automatically. No human intervention. Resolution in 24-48 hours."

### Demo Commands
```bash
# Show escrow creation
solana-explorer: [escrow PDA address]

# Show dispute filing
curl -X POST /api/v1/disputes

# Show quality score result
Quality: 45/100 → 75% refund

# Show on-chain resolution
solana-explorer: [refund transaction]
```

---

## Innovation Highlights (2:00-2:30)

### Visuals
- Feature comparison table
- Architecture diagram

### Script
"What makes x402Resolve unique?

**First**: AI-powered quality scoring. Multi-factor algorithm, not manual review.

**Second**: Sliding scale refunds. Fair for both parties - not all-or-nothing.

**Third**: MCP integration. Agents file disputes automatically, no human needed.

**Fourth**: On-chain verification. Ed25519 signatures, Solana smart contracts, complete transparency.

This is production-ready infrastructure for the agent economy."

---

## Technical Stack (2:30-2:45)

### Visuals
- Component architecture
- Code snippets

### Script
"Built with:
- Solana escrow program in Rust with Anchor
- Python verifier oracle with sentence transformers
- TypeScript SDK with retry logic
- MCP server for agent integration

Complete toolkit - not just a protocol, but production-ready infrastructure."

---

## Closing (2:45-3:00)

### Visuals
- GitHub repo
- Live demo link
- Prize categories

### Script
"x402Resolve competes in four hackathon categories:

Best MCP Server - agents file disputes automatically
Best Dev Tool - complete SDK, oracle, and escrow
Best Agent Application - end-to-end autonomous workflow
Best API Integration - KAMIYO intelligence with quality guarantees

Try it yourself at our interactive demo. No installation required.

x402Resolve: Trust infrastructure for the agent economy."

### End Card
- GitHub: github.com/x402kamiyo/x402resolve
- Demo: [link]
- Documentation: [link]

---

## Production Notes

### Recording Setup
1. Screen recording: OBS or ScreenFlow (1920x1080, 60fps)
2. Audio: Rode NT-USB microphone
3. Background: Clean, professional
4. Lighting: Ring light for camera shots

### Editing Checklist
- [ ] Add title cards
- [ ] Highlight terminal commands
- [ ] Add transitions between sections
- [ ] Color grade for consistency
- [ ] Audio normalization
- [ ] Add background music (subtle)
- [ ] Captions/subtitles
- [ ] Export: MP4, H.264, 1920x1080, 30fps

### B-Roll Footage
- Solana Explorer showing transactions
- Code editor showing key files
- Interactive demo in browser
- Terminal showing successful operations

### Demo Environment
- Clean devnet wallet
- Pre-funded with SOL
- Test data prepared
- All services running
- Network stable

### Backup Plans
- Pre-record terminal commands (in case of network issues)
- Have screenshots ready
- Recorded animations for architecture diagrams

---

## Alternative Formats

### 60-Second Version (Social Media)
- 0:00-0:15: Problem
- 0:15-0:40: Solution demo
- 0:40-0:55: Innovation
- 0:55-1:00: CTA

### 10-Minute Deep Dive (Technical)
- Extend architecture explanation
- Live coding walkthrough
- Deep dive on Ed25519 verification
- Compute optimization discussion
- Security considerations

---

## Review Checklist

Technical Accuracy
- [ ] All commands shown work
- [ ] Transaction hashes valid
- [ ] Quality scores realistic
- [ ] Refund calculations correct

Visual Quality
- [ ] No typos in graphics
- [ ] Colors consistent
- [ ] Text readable at 720p
- [ ] Smooth transitions

Audio Quality
- [ ] No background noise
- [ ] Consistent volume
- [ ] Clear pronunciation
- [ ] Good pacing (not rushed)

Content
- [ ] Problem clearly stated
- [ ] Solution demonstrated
- [ ] Innovation highlighted
- [ ] Call-to-action included

---

## Post-Production

### Publishing
- [ ] YouTube (unlisted link for judges)
- [ ] Twitter (public)
- [ ] GitHub README embed
- [ ] Hackathon submission form

### Promotion
- [ ] Tweet announcement
- [ ] LinkedIn post
- [ ] Discord channels
- [ ] Reddit (if appropriate)

### Analytics
- [ ] View count
- [ ] Watch time
- [ ] Engagement rate
- [ ] Judge feedback
