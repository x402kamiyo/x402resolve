# x402Resolve Hackathon Demo Video Script

**Duration:** 180 seconds (3 minutes)
**Voice:** OpenAI TTS "nova"
**Speed:** 1.05x
**Aspect Ratio:** 16:9 (1920x1080)

---

## Scene Breakdown

### Scene 1: Hook + Problem (0:00 - 0:20, 20s)

**Visual:** Dashboard hero with metrics animation

**Narration:**
```
API payment disputes cost $35 and take 90 days to resolve.
We built x402Resolve to change that: blockchain-based dispute resolution
with quality-verified refunds, resolved in 48 hours for half a cent.
```

**Actions:**
- 0-2s: Fade in dashboard
- 2-8s: Highlight "$35 vs $0.005" comparison
- 8-14s: Zoom to "48 hours" metric
- 14-20s: Pan across quality scoring chart

---

### Scene 2: Technical Architecture (0:20 - 0:45, 25s)

**Visual:** Architecture diagram with animated flow

**Narration:**
```
The architecture is simple. When an agent consumes an API,
payment goes into a Solana escrow account. Our quality oracle
scores the response from zero to one hundred. If quality is below
eighty, the agent gets a proportional refund automatically.
No intermediaries. No admin keys. Pure PDA-based escrow.
```

**Actions:**
- 20-23s: Show architecture diagram
- 23-28s: Animate escrow creation
- 28-33s: Highlight quality oracle flow
- 33-38s: Show refund calculation (65% quality → 35% refund)
- 38-45s: Emphasize "PDA-based escrow" with code snippet

---

### Scene 3: Live Demo - Agent Flow (0:45 - 1:30, 45s)

**Visual:** Terminal + Browser split screen

**Narration:**
```
Watch this autonomous agent in action. It requests exploit data,
receives a four oh two payment required, creates an escrow,
and retries with payment proof. The API returns data. Now the agent
assesses quality: completeness, accuracy, freshness. This response
is incomplete, scoring only sixty-five percent. The agent automatically
files a dispute. The oracle verifies the quality score and executes
a thirty-five percent refund within seconds. The agent paid one milliSOL,
gets point three five back, and keeps the partial data.
```

**Actions:**
- 45-50s: Agent makes initial request
- 50-55s: Receives 402, creates escrow (show Solana Explorer)
- 55-62s: API returns data, terminal shows JSON
- 62-70s: Agent assesses quality (show scoring breakdown)
- 70-78s: Auto-dispute filed (show transaction signature)
- 78-86s: Oracle verification (show quality score: 65)
- 86-90s: Refund executed (show lamports transfer)

---

### Scene 4: Dashboard Deep Dive (1:30 - 2:00, 30s)

**Visual:** Live dashboard with real transactions

**Narration:**
```
The dashboard shows real transactions on Solana devnet.
Here's our deployed program handling escrow creation, quality verification,
and refund distribution. Every transaction is on-chain and transparent.
The reputation system tracks agent behavior: dispute success rate,
average quality received, and transaction volume. High reputation
reduces dispute costs and increases rate limits.
```

**Actions:**
- 90-95s: Show transaction list scrolling
- 95-102s: Click into specific escrow (show account data)
- 102-110s: Navigate to reputation tab
- 110-118s: Highlight reputation metrics (score: 847/1000)
- 118-120s: Show rate limit tiers

---

### Scene 5: Code + Switchboard (2:00 - 2:30, 30s)

**Visual:** VS Code with key program snippets

**Narration:**
```
The escrow program is written in Rust with Anchor.
Signature verification uses Ed twenty-five thousand nineteen.
Time-locks prevent premature releases. The Switchboard integration
enables fully decentralized quality assessment. No single point
of failure. We also built an MCP server for Claude Desktop,
letting AI assistants file disputes autonomously through tool calls.
```

**Actions:**
- 120-125s: Show `resolve_dispute` function
- 125-130s: Highlight Ed25519 verification code
- 130-138s: Jump to Switchboard integration
- 138-145s: Show MCP server `file_dispute` tool
- 145-150s: Quick demo of Claude Desktop integration

---

### Scene 6: Impact + CTA (2:30 - 3:00, 30s)

**Visual:** Metrics dashboard → GitHub repo → contact info

**Narration:**
```
The impact: ninety-nine point nine percent cost reduction.
Ninety-eight percent faster resolution. Production-ready on devnet
with eighty-plus passing tests. This solves payment trust for
autonomous agents across all five hackathon tracks: trustless agents,
API integration, MCP servers, development tools, and agent applications.
Program ID and source code in the description. Built by KAMIYO.
```

**Actions:**
- 150-155s: Zoom into cost comparison chart
- 155-160s: Show test execution results (80+ passing)
- 160-168s: Display all 5 hackathon track badges
- 168-173s: Show GitHub repo + devnet program ID
- 173-177s: Display "KAMIYO | dev@kamiyo.ai"
- 177-180s: Fade to black with x402Resolve logo

---

## Narration Text Only (for TTS generation)

**Scene 1:**
API payment disputes cost thirty-five dollars and take ninety days to resolve. We built x402Resolve to change that: blockchain-based dispute resolution with quality-verified refunds, resolved in forty-eight hours for half a cent.

**Scene 2:**
The architecture is simple. When an agent consumes an API, payment goes into a Solana escrow account. Our quality oracle scores the response from zero to one hundred. If quality is below eighty, the agent gets a proportional refund automatically. No intermediaries. No admin keys. Pure PDA-based escrow.

**Scene 3:**
Watch this autonomous agent in action. It requests exploit data, receives a four oh two payment required, creates an escrow, and retries with payment proof. The API returns data. Now the agent assesses quality: completeness, accuracy, freshness. This response is incomplete, scoring only sixty-five percent. The agent automatically files a dispute. The oracle verifies the quality score and executes a thirty-five percent refund within seconds. The agent paid one milliSOL, gets point three five back, and keeps the partial data.

**Scene 4:**
The dashboard shows real transactions on Solana devnet. Here's our deployed program handling escrow creation, quality verification, and refund distribution. Every transaction is on-chain and transparent. The reputation system tracks agent behavior: dispute success rate, average quality received, and transaction volume. High reputation reduces dispute costs and increases rate limits.

**Scene 5:**
The escrow program is written in Rust with Anchor. Signature verification uses Ed twenty-five thousand nineteen. Time-locks prevent premature releases. The Switchboard integration enables fully decentralized quality assessment. No single point of failure. We also built an MCP server for Claude Desktop, letting AI assistants file disputes autonomously through tool calls.

**Scene 6:**
The impact: ninety-nine point nine percent cost reduction. Ninety-eight percent faster resolution. Production-ready on devnet with eighty-plus passing tests. This solves payment trust for autonomous agents across all five hackathon tracks: trustless agents, API integration, MCP servers, development tools, and agent applications. Program ID and source code in the description. Built by KAMIYO.

---

## Word Count & Timing Analysis

| Scene | Words | Est. Time (175 WPM) | Target |
|-------|-------|---------------------|--------|
| 1 | 35 | 12s | 20s ✓ |
| 2 | 68 | 23s | 25s ✓ |
| 3 | 95 | 33s | 45s ✓ |
| 4 | 68 | 23s | 30s ✓ |
| 5 | 75 | 26s | 30s ✓ |
| 6 | 75 | 26s | 30s ✓ |
| **Total** | **416** | **~143s** | **180s** |

*Note: 175 WPM = professional narration pace. With 1.05x speed and natural pauses, should fit ~180s perfectly.*

---

## Technical Specifications for TTS

```json
{
  "model": "tts-1-hd",
  "voice": "nova",
  "speed": 1.05,
  "response_format": "mp3",
  "scenes": [
    {
      "id": 1,
      "text": "API payment disputes cost thirty-five dollars...",
      "filename": "scene-01-hook.mp3"
    },
    {
      "id": 2,
      "text": "The architecture is simple...",
      "filename": "scene-02-architecture.mp3"
    },
    {
      "id": 3,
      "text": "Watch this autonomous agent in action...",
      "filename": "scene-03-demo.mp3"
    },
    {
      "id": 4,
      "text": "The dashboard shows real transactions...",
      "filename": "scene-04-dashboard.mp3"
    },
    {
      "id": 5,
      "text": "The escrow program is written in Rust...",
      "filename": "scene-05-code.mp3"
    },
    {
      "id": 6,
      "text": "The impact: ninety-nine point nine percent...",
      "filename": "scene-06-impact.mp3"
    }
  ]
}
```

---

## Visual Asset Checklist

**Pre-record:**
- [ ] Dashboard running locally with demo data
- [ ] Solana Explorer tabs pre-loaded
- [ ] VS Code with key files open
- [ ] Terminal with agent demo ready
- [ ] Architecture diagram (Figma/Excalidraw export)

**Overlays needed:**
- [ ] Title card: "x402Resolve"
- [ ] Metrics callouts: "$35 → $0.005", "90d → 48h"
- [ ] Code highlights: function names, signatures
- [ ] Transaction signatures (shortened with "...")
- [ ] Hackathon track badges (5 total)
- [ ] KAMIYO logo + contact

**Transitions:**
- Crossfade (1s) between scenes
- Zoom for emphasis (dashboard → metric)
- Split-screen for demo (terminal + browser)

---

## Background Music

**Recommendation:** Subtle tech ambient (15-20% volume)
- Clean, minimal
- No vocals
- 120-140 BPM
- Fades in/out with narration

**Sources:**
- YouTube Audio Library: "Cipher" by Kevin MacLeod
- Epidemic Sound: "Digital Dreams"
- Free alternative: Bensound "Tenderness" (corporate tech)

---

## Export Settings

```bash
ffmpeg -i final.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 18 \
  -c:a aac \
  -b:a 192k \
  -movflags +faststart \
  x402-hackathon-demo.mp4
```

**Specs:**
- Resolution: 1920x1080
- Framerate: 30fps
- Codec: H.264
- Audio: AAC 192kbps
- Bitrate: ~8Mbps (high quality)
- File size: ~180MB for 3min

---

## Quality Checklist

- [ ] Audio levels consistent across scenes
- [ ] No jarring cuts (smooth transitions)
- [ ] Text overlays readable (minimum 24pt)
- [ ] Cursor movements smooth (not too fast)
- [ ] Code snippets visible (syntax highlighted)
- [ ] Terminal text large enough (16pt minimum)
- [ ] No sensitive keys/data visible
- [ ] Final duration: 175-180 seconds
- [ ] Branding consistent (KAMIYO colors/fonts)
- [ ] CTA clear (program ID, GitHub, contact)
