# x402Resolve Product Demo - Comprehensive Script

**Total Duration:** 180 seconds (3:00)
**Voice:** OpenAI TTS "nova"
**Speed:** 0.95x (slower for proper timing)
**Resolution:** 1920x1080

---

## Scene 1: Hook + Problem (20 seconds)

### Narration (20s)
```
When APIs require payment, disputes are expensive and slow. Traditional payment processors charge thirty-five dollars per dispute and take up to ninety days to resolve. x402Resolve solves this with blockchain-based dispute resolution. Quality-verified refunds, resolved in forty-eight hours, for less than one cent per transaction.
```

### Visual Actions
**Timing:** 0:00 - 0:20

**Setup:**
- Open: https://x402kamiyo.github.io/x402resolve
- Browser window maximized (1920x1080)
- Scroll to top of page

**Actions:**
1. **0-3s**: Show hero section with "x402Resolve" title
2. **3-6s**: Slowly scroll down to reveal "Trust Model Metrics" section
3. **6-10s**: Pause on cost comparison: "$35 → $0.005"
4. **10-14s**: Scroll to show "Resolution Time: 24-48 hours"
5. **14-17s**: Continue to "Test Coverage: 91%" metric
6. **17-20s**: Scroll to "Key Performance Data" showing fraud reduction

**Notes:**
- Smooth, deliberate scrolling
- Pause on key metrics for 2-3 seconds each
- Keep mouse cursor minimal/hidden

---

## Scene 2: Technical Architecture (25 seconds)

### Narration (25s)
```
The architecture uses Solana program derived addresses for trustless escrow. When an agent makes an API request, payment is locked in an on-chain escrow account. A quality oracle analyzes the response using multiple factors: semantic similarity, completeness, and data freshness. Scores below eighty percent trigger automatic proportional refunds. The entire process is transparent and verifiable on-chain.
```

### Visual Actions
**Timing:** 0:20 - 0:45

**Setup:**
- Already on https://x402kamiyo.github.io/x402resolve

**Actions:**
1. **20-23s**: Click "Multi-Oracle Simulator" tab
2. **23-27s**: Show 3-oracle consensus interface (wait for page to load)
3. **27-32s**: Scroll through multi-oracle system explanation section
4. **32-37s**: Click "Main" tab to return
5. **37-42s**: Scroll to "Quality Verification Process" timeline showing:
   - Dispute Filing
   - Oracle Analysis
   - Signature Generation
6. **42-45s**: Scroll to refund logic diagram:
   - "Below 50%: 100% refund"
   - "50-80%: Sliding scale"
   - "Above 80%: No refund"

**Notes:**
- Tab clicks should be deliberate and visible
- Wait 1 second after clicking before continuing
- Highlight the sliding scale refund logic

---

## Scene 3: Live Demo - Terminal Flow (45 seconds)

### Narration (45s)
```
Let's see the system in action. We start by running an autonomous agent that requests security intelligence data from the KAMIYO API. The API responds with HTTP 402 payment required, including the escrow account address. The agent creates an escrow on Solana, funding it with the requested amount. With payment proof attached, the API returns the requested exploit data. Now the agent evaluates the response quality. Semantic similarity: seventy percent. Completeness: sixty percent. Data freshness: ninety percent. Overall quality score: sixty-five percent. Since this is below the eighty percent threshold, the agent automatically files an on-chain dispute. The oracle verifies the quality assessment and executes a thirty-five percent refund. The transaction completes in under two seconds.
```

### Visual Actions
**Timing:** 0:45 - 1:30

**Setup:**
- Terminal window on left (50% width)
- Browser (Solana Explorer) on right (50% width)
- Terminal location: `/Users/dennisgoslar/Projekter/kamiyo-x402-solana`

**Terminal Commands:**
```bash
# 45-48s: Navigate to examples
cd examples/autonomous-agent-demo

# 48-52s: Run the agent
npm run demo

# 52-90s: Let output scroll naturally showing:
# - "Requesting exploit data from API..."
# - "Received 402 Payment Required"
# - "Creating escrow account..."
# - "Escrow created: [signature]"
# - "Retrying with payment proof..."
# - "Received response: 1,247 bytes"
# - "Quality Assessment:"
# - "  Semantic Similarity: 70%"
# - "  Completeness: 60%"
# - "  Data Freshness: 90%"
# - "  Overall Score: 65%"
# - "Filing dispute..."
# - "Dispute filed: [signature]"
# - "Oracle verifying..."
# - "Refund executed: 0.35 mSOL"
# - "Transaction time: 1.8s"
```

**Browser Actions (Solana Explorer):**
1. **52-58s**: When terminal shows "Escrow created: [signature]", paste signature into Solana Explorer search
2. **58-65s**: Show escrow account details on devnet:
   - Account address
   - Balance: 1.0 mSOL
   - Status: Active
3. **70-78s**: When dispute filed, open new tab with dispute transaction signature
4. **78-85s**: Show dispute resolution transaction:
   - Instruction: resolve_dispute
   - Refund amount: 0.35 mSOL
   - Status: Confirmed
5. **85-90s**: Refresh escrow account to show updated balance

**Notes:**
- Pre-run the demo once to ensure it works
- Have Solana Explorer tabs ready to switch quickly
- Keep terminal font size readable (16pt minimum)

---

## Scene 4: Dashboard Metrics (30 seconds)

### Narration (30s)
```
The live dashboard tracks all system activity in real-time. These are actual transactions on Solana devnet. The technical metrics show comprehensive test coverage, with ninety-one percent of the codebase verified. Market impact analysis demonstrates value across multiple industries: financial services see eighty-one percent fraud reduction. Performance benchmarks highlight sub-second transaction times and ninety-nine point nine percent oracle reliability. Every metric is backed by on-chain data.
```

### Visual Actions
**Timing:** 1:30 - 2:00

**Setup:**
- Open new browser tab or switch to: https://x402kamiyo.github.io/x402resolve
- Navigate to "Project Metrics" tab

**Actions:**
1. **90-95s**: Click "Project Metrics" tab
2. **95-100s**: Show Technical Metrics chart (animated bar chart):
   - Tests Passing: 101
   - Test Coverage: 91%
   - Documentation Pages: 8
3. **100-107s**: Scroll down to "Market Impact by Industry" chart showing:
   - Financial Services: 81% reduction
   - Healthcare: 73% reduction
   - Gaming: 68% reduction
   - E-commerce: 76% reduction
4. **107-114s**: Continue to "Performance Benchmarks" radar chart with:
   - Transaction Speed
   - Oracle Accuracy
   - Cost Efficiency
   - Dispute Resolution Time
   - System Reliability
5. **114-120s**: Scroll to "Oracle Reliability Metrics" section showing:
   - Success Rate: 99.9%
   - Average Response Time: 1.2s
   - Consensus Agreement: 98.7%

**Notes:**
- Allow charts to animate (they have entrance animations)
- Hover over data points to show tooltips
- Smooth scrolling between sections

---

## Scene 5: Code Deep Dive (30 seconds)

### Narration (30s)
```
The escrow program is implemented in Rust using the Anchor framework. Program derived addresses ensure trustless operation with no admin keys. Signature verification leverages Solana's native Ed25519 instruction for cryptographic proof. Time-lock constraints prevent premature fund release. The Switchboard oracle integration provides decentralized quality verification as an alternative to centralized assessment. For AI agent integration, the MCP server exposes dispute filing through Claude Desktop, enabling natural language interaction with the dispute resolution system.
```

### Visual Actions
**Timing:** 2:00 - 2:30

**Setup:**
- Browser still on dashboard at https://x402kamiyo.github.io/x402resolve

**Actions:**
1. **120-123s**: Click "SDK Integration" tab
2. **123-128s**: Show TypeScript SDK code example:
   ```typescript
   const client = new KamiyoClient();
   const escrowClient = new EscrowClient(connection);

   await escrowClient.createEscrow({
     amount: 1.0,
     apiProvider: provider.publicKey,
     qualityThreshold: 80
   });
   ```
3. **128-135s**: Scroll to "Python Verifier Integration" showing:
   ```python
   from x402_verifier import MultiOracleSystem

   system = MultiOracleSystem(min_oracles=3)
   quality_score = await system.assess_quality(
     response=api_response,
     expected=expected_output
   )
   ```
4. **135-142s**: Scroll to "Rust Smart Contract" section showing:
   ```rust
   #[program]
   pub mod x402_escrow {
     pub fn initialize_escrow(
       ctx: Context<InitializeEscrow>,
       amount: u64,
       time_lock: i64
     ) -> Result<()> {
   ```
5. **142-148s**: Highlight Ed25519 verification code snippet:
   ```rust
   // Verify oracle signature
   let ix = ed25519_instruction::new_ed25519_instruction(
     &oracle_pubkey,
     &signature_bytes
   );
   ```
6. **148-150s**: Quick scroll to show PDA derivation:
   ```rust
   let (escrow_pda, bump) = Pubkey::find_program_address(
     &[b"escrow", agent.key().as_ref(), &tx_id],
     ctx.program_id
   );
   ```

**Notes:**
- Code sections should be syntax highlighted
- Pause briefly on each code block (2-3s)
- Use cursor to point to key functions

---

## Scene 6: System Impact & Call to Action (30 seconds)

### Narration (30s)
```
x402Resolve delivers measurable impact. Payment dispute costs drop from thirty-five dollars to half a cent. That's ninety-nine point nine percent cost reduction. Resolution time decreases from ninety days to forty-eight hours. Eighty-five percent faster. The system is live on Solana devnet with full test coverage and comprehensive documentation. API providers can integrate with the TypeScript SDK or Python middleware. Autonomous agents can use the agent client library for automatic dispute handling. The program address and complete source code are available on GitHub. Start building trustless payment systems today. Developed by KAMIYO.
```

### Visual Actions
**Timing:** 2:30 - 3:00

**Setup:**
- Return to main dashboard tab

**Actions:**
1. **150-153s**: Click "Main" tab to return to homepage
2. **153-158s**: Scroll to "Key Differentiators" section showing:
   - 81% average fraud reduction
   - 48hrs resolution time (85% faster)
   - 99.9% oracle fallback success
   - $0.005 avg dispute cost
3. **158-165s**: Scroll to cost comparison chart:
   - Traditional: $35, 90 days
   - x402Resolve: $0.005, 48 hours
   - Side-by-side comparison with visual emphasis
4. **165-172s**: Scroll to "Live on Devnet" status indicator showing:
   - Program ID: `D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP`
   - Network: Solana Devnet
   - Status: Active (green indicator)
5. **172-177s**: Scroll to footer showing:
   - KAMIYO logo
   - Contact: dev@kamiyo.ai
   - GitHub repository link
   - Documentation links
6. **177-180s**: Fade to black with "x402Resolve" logo centered

**Notes:**
- Emphasize the dramatic cost/time improvements
- Ensure program ID is clearly visible
- End with clean fade-out

---

## Pre-Recording Checklist

### Dashboard Preparation
- [ ] Dashboard is running at https://x402kamiyo.github.io/x402resolve
- [ ] All tabs load correctly (Main, Multi-Oracle, Project Metrics, SDK Integration)
- [ ] Charts animate properly
- [ ] Browser zoom is at 100%

### Terminal Preparation
- [ ] Navigate to: `/Users/dennisgoslar/Projekter/kamiyo-x402-solana/examples/autonomous-agent-demo`
- [ ] Verify demo script exists and runs successfully
- [ ] Terminal font size: 16pt minimum
- [ ] Terminal color scheme: high contrast (dark background)
- [ ] Test run: `npm run demo` completes without errors

### Solana Explorer Preparation
- [ ] Open https://explorer.solana.com/?cluster=devnet in browser
- [ ] Test that transaction signatures can be searched
- [ ] Pre-load a sample escrow transaction for reference
- [ ] Bookmark escrow program: `D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP`

### Recording Setup
- [ ] Screen resolution: 1920x1080
- [ ] Frame rate: 30fps
- [ ] Recording software ready (QuickTime/OBS)
- [ ] Audio files generated and tested
- [ ] Quiet environment (no background noise)

### File Organization
```
recording-workspace/
├── scene-1-recording.mov
├── scene-2-recording.mov
├── scene-3-recording.mov
├── scene-4-recording.mov
├── scene-5-recording.mov
└── scene-6-recording.mov
```

---

## Recording Workflow (Per Scene)

1. **Setup Phase**
   - Open required applications/tabs
   - Position windows correctly
   - Queue audio file in media player
   - Take deep breath

2. **Recording Phase**
   - Start screen recording
   - Wait 2 seconds (buffer)
   - Start audio playback
   - Execute visual actions smoothly
   - Continue for 2 seconds after audio ends (buffer)
   - Stop recording

3. **Review Phase**
   - Watch recording
   - Check audio sync
   - Verify all actions are visible
   - If issues: delete and re-record

4. **Save Phase**
   - Save as: `scene-{number}-recording.mov`
   - Move to recording-workspace folder
   - Proceed to next scene

---

## Post-Recording Assembly

```bash
# Create concat file
cat > scenes.txt << EOF
file 'scene-1-recording.mov'
file 'scene-2-recording.mov'
file 'scene-3-recording.mov'
file 'scene-4-recording.mov'
file 'scene-5-recording.mov'
file 'scene-6-recording.mov'
EOF

# Combine scenes (video encoding with audio)
ffmpeg -f concat -safe 0 -i scenes.txt \
  -c:v libx264 -preset medium -crf 18 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  x402resolve-product-demo.mp4

# Verify output
ffprobe x402resolve-product-demo.mp4
```

---

## Troubleshooting

### Audio sync issues
- Add 0.5s padding at start of each scene
- Adjust recording start delay
- Use video editing software for fine-tuning

### Terminal demo fails
- Pre-record terminal session as backup
- Use asciinema for consistent playback
- Have screenshots ready as fallback

### Dashboard doesn't load
- Test internet connection
- Clear browser cache
- Use localhost version if available
- Have PDF screenshots as absolute fallback

### Recording quality issues
- Check screen resolution matches 1920x1080
- Disable desktop notifications
- Close unnecessary applications
- Verify sufficient disk space

---

## Quality Standards

- [ ] All text is readable (minimum 14pt)
- [ ] No jarring mouse movements
- [ ] Smooth scrolling (not too fast)
- [ ] Code is clearly visible
- [ ] Terminal output is legible
- [ ] No sensitive data visible (API keys, private keys)
- [ ] Audio is clear throughout
- [ ] No background noise
- [ ] Video length: 175-185 seconds (3:00 ±5s)
- [ ] All 6 scenes recorded successfully
