# Manual Video Recording Guide - x402Resolve Product Demo

**Total Duration:** ~177 seconds (2:57)
**Audio Files:** `audio-output/scene-01-*.mp3` through `scene-06-*.mp3`
**Resolution:** 1920x1080
**Frame Rate:** 30fps

---

## Pre-Flight Checklist

### System Setup
- [ ] Screen resolution: 1920x1080
- [ ] Close all notifications/popups
- [ ] Disable "Do Not Disturb" mode
- [ ] Hide desktop icons (optional)
- [ ] Prepare screen recording software (QuickTime/OBS)

### Browser Setup
- [ ] Browser: Chrome/Firefox (latest)
- [ ] Window size: Maximized
- [ ] Zoom: 100%
- [ ] Extensions: Disable or use incognito mode
- [ ] Cursor visibility: Visible but not distracting

### Terminal Setup
- [ ] Terminal: iTerm2 or Terminal.app
- [ ] Font size: 16pt minimum
- [ ] Theme: High contrast (dark background recommended)
- [ ] Location: `/Users/dennisgoslar/Projekter/kamiyo-x402-solana`

### Audio Setup
- [ ] Audio files in `audio-output/` directory
- [ ] Media player ready (VLC/QuickTime)
- [ ] Audio tested (correct files play correctly)
- [ ] Speaker volume: Medium (you won't be recording system audio, just for timing)

---

## Recording Workflow

For each scene:
1. Position applications/windows
2. Queue audio file
3. Start screen recording
4. Wait 2 seconds
5. Play audio + execute actions simultaneously
6. Wait 2 seconds after audio ends
7. Stop recording
8. Save as `scene-{number}.mov`

---

## Scene 1: Hook + Problem (18 seconds)
**Audio:** `scene-01-hook-problem.mp3` (18.0s)

### Setup
- Open: https://x402kamiyo.github.io/x402resolve
- Scroll to top of page
- Hide mouse cursor or position in corner

### Actions Timeline

**0:00-0:03** - Opening frame
- Show hero section with "x402Resolve" title
- Hold steady

**0:03-0:06** - Begin scrolling
- Slowly scroll down to "Trust Model Metrics"
- Smooth motion, not jerky

**0:06-0:10** - Cost comparison
- Pause on: "$35 → $0.005" comparison
- Center in frame

**0:10-0:14** - Resolution time
- Scroll to: "Resolution Time: 24-48 hours"
- Pause to emphasize

**0:14-0:17** - Test coverage
- Continue to: "Test Coverage: 91%"
- Brief pause

**0:17-0:18** - Performance data
- Scroll to "Key Performance Data" section showing fraud reduction
- End scene

### Notes
- Total scroll distance: ~2 screen heights
- Speed: Very deliberate and smooth
- No mouse movement unless necessary

---

## Scene 2: Technical Architecture (22 seconds)
**Audio:** `scene-02-architecture.mp3` (21.7s)

### Setup
- Continue from Scene 1 position OR reload page and scroll to top

### Actions Timeline

**0:00-0:03** - Navigate to Multi-Oracle
- Move cursor to "Multi-Oracle Simulator" tab
- Click deliberately

**0:03-0:07** - Show oracle interface
- Wait for page load (should be instant)
- Show 3-oracle consensus interface
- Pan slowly across the interface

**0:07-0:12** - Oracle explanation
- Scroll down through multi-oracle system explanation
- Show diagram/visual elements
- Smooth scrolling

**0:12-0:14** - Return to main tab
- Move cursor to "Main" tab
- Click to return

**0:14-0:18** - Quality verification process
- Scroll to "Quality Verification Process" timeline
- Show stages: Dispute Filing → Oracle Analysis → Signature Generation
- Pause briefly on each stage

**0:18-0:22** - Refund logic
- Scroll to refund logic diagram
- Highlight:
  - "Below 50%: 100% refund"
  - "50-80%: Sliding scale"
  - "Above 80%: No refund"
- End scene on this view

### Notes
- Tab clicks should be visible and deliberate
- Wait 0.5s after clicking before continuing
- Emphasize the sliding scale concept

---

## Scene 3: Live Demo - Terminal Flow (43 seconds)
**Audio:** `scene-03-live-demo.mp3` (43.2s)

### Setup - CRITICAL
This is the most complex scene. You have two options:

#### Option A: Split Screen (Recommended)
- Terminal: Left half (960px width)
- Browser: Right half (960px width)
- Both visible simultaneously

#### Option B: Terminal Only (If demo doesn't run)
- Full screen terminal
- Pre-record or use screenshots of Solana Explorer
- Insert as picture-in-picture

### Terminal Preparation

**Option 1: Run actual demo**
```bash
cd /Users/dennisgoslar/Projekter/kamiyo-x402-solana
cd examples/autonomous-agent-demo

# Test first (before recording)
npm run demo

# This should output:
# - API request
# - 402 response
# - Escrow creation + signature
# - Payment retry
# - Quality assessment scores
# - Dispute filing + signature
# - Oracle verification
# - Refund execution
```

**Option 2: Use pre-recorded demo (if live demo fails)**
Create a text file with expected output:
```
examples/autonomous-agent-demo/demo-output.txt
```
Then use `cat` to slowly output it, or use `asciinema` for playback.

### Actions Timeline

**0:00-0:05** - Initial request
- Terminal: Run `npm run demo` OR start playback
- Show: "Requesting exploit data from API..."
- Show: "Received 402 Payment Required"
- Browser (right side): Have Solana Explorer open (https://explorer.solana.com/?cluster=devnet)

**0:05-0:12** - Escrow creation
- Terminal shows:
  ```
  Creating escrow account...
  Escrow created: [transaction signature]
  Transaction: https://explorer.solana.com/tx/[sig]?cluster=devnet
  ```
- Browser: Copy transaction signature, paste into Explorer search
- Hit Enter to load transaction

**0:12-0:18** - Payment proof
- Terminal:
  ```
  Retrying with payment proof...
  API response received: 1,247 bytes
  ```
- Browser: Show transaction details:
  - Program: x402-escrow
  - Instruction: initialize_escrow
  - Status: Confirmed (green checkmark)
  - Balance: 1.0 mSOL

**0:18-0:28** - Quality assessment (KEY MOMENT)
- Terminal displays quality scores:
  ```
  Quality Assessment:
    Semantic Similarity: 70%
    Completeness: 60%
    Data Freshness: 90%
    Overall Score: 65%

  Score below threshold (80%)
  Filing dispute...
  ```
- Browser: Keep showing escrow account

**0:28-0:35** - Dispute filed
- Terminal:
  ```
  Dispute filed successfully
  Transaction: [signature]
  Waiting for oracle...
  ```
- Browser: Open new tab or switch, paste dispute transaction signature
- Load dispute transaction in Explorer

**0:35-0:40** - Oracle verification
- Terminal:
  ```
  Oracle verifying quality score...
  Oracle confirmed: 65%
  Executing refund: 35% (0.35 mSOL)
  ```
- Browser: Show dispute resolution transaction:
  - Instruction: resolve_dispute
  - Refund: 0.35 mSOL
  - Status: Confirmed

**0:40-0:43** - Transaction complete
- Terminal:
  ```
  Refund executed: 0.35 mSOL
  Transaction time: 1.8 seconds
  Process complete.
  ```
- Browser: Refresh original escrow account showing updated balance
- End scene

### Notes
- This is the most critical scene - shows the system actually working
- If you can't get the demo to run, use Option B with screenshots
- Timing is tight - practice once before recording
- Transaction signatures must be visible (use monospace font)

### Fallback Plan
If demo won't run, record terminal showing:
```bash
# Show the code instead
cat examples/autonomous-agent-demo/src/index.ts | grep -A 20 "quality assessment"
```
And show dashboard screenshots of past transactions.

---

## Scene 4: Dashboard Metrics (27 seconds)
**Audio:** `scene-04-dashboard.mp3` (27.0s)

### Setup
- Close terminal (if still open)
- Browser: Full screen
- Navigate to: https://x402kamiyo.github.io/x402resolve

### Actions Timeline

**0:00-0:03** - Navigate to metrics
- If not already there, go to homepage
- Click "Project Metrics" tab
- Wait for page load/animations

**0:03-0:08** - Technical metrics
- Show Technical Metrics chart (bar chart with animations)
- Visible metrics:
  - Tests Passing: 101
  - Test Coverage: 91%
  - Documentation Pages: 8
- Let animations complete
- Pause briefly

**0:08-0:14** - Market impact
- Scroll down to "Market Impact by Industry"
- Show chart with industry breakdown:
  - Financial Services: 81% reduction
  - Healthcare: 73% reduction
  - Gaming: 68% reduction
  - E-commerce: 76% reduction
- Hover over bars to show tooltips (optional)

**0:14-0:21** - Performance benchmarks
- Continue scrolling to "Performance Benchmarks" radar chart
- Show 5 metrics:
  - Transaction Speed
  - Oracle Accuracy
  - Cost Efficiency
  - Dispute Resolution Time
  - System Reliability
- Center the chart in frame
- Brief pause

**0:21-0:27** - Oracle reliability
- Scroll to "Oracle Reliability Metrics" section
- Show:
  - Success Rate: 99.9%
  - Average Response Time: 1.2s
  - Consensus Agreement: 98.7%
- End scene with metrics visible

### Notes
- Charts may have entrance animations - wait for them
- Smooth scrolling between sections
- Each section gets 5-7 seconds of screen time
- Hover effects can add visual interest but aren't required

---

## Scene 5: Code Deep Dive (32 seconds)
**Audio:** `scene-05-code-switchboard.mp3` (32.2s)

### Setup
- Browser: Still on dashboard
- Tab may still be on "Project Metrics" or "Main"

### Actions Timeline

**0:00-0:03** - Navigate to SDK
- Click "SDK Integration" tab
- Wait for load

**0:03-0:08** - TypeScript SDK example
- Show TypeScript code block:
  ```typescript
  const client = new KamiyoClient();
  const escrowClient = new EscrowClient(connection);

  await escrowClient.createEscrow({
    amount: 1.0,
    apiProvider: provider.publicKey,
    qualityThreshold: 80
  });
  ```
- Code should be syntax highlighted
- Pause to let viewers read

**0:08-0:14** - Python verifier
- Scroll down to "Python Verifier Integration"
- Show code:
  ```python
  from x402_verifier import MultiOracleSystem

  system = MultiOracleSystem(min_oracles=3)
  quality_score = await system.assess_quality(
    response=api_response,
    expected=expected_output
  )
  ```
- Brief pause

**0:14-0:20** - Rust smart contract
- Scroll to "Rust Smart Contract" section
- Show Anchor program structure:
  ```rust
  #[program]
  pub mod x402_escrow {
    pub fn initialize_escrow(
      ctx: Context<InitializeEscrow>,
      amount: u64,
      time_lock: i64
    ) -> Result<()> {
  ```
- Pause on function signature

**0:20-0:26** - Ed25519 verification
- Scroll to show Ed25519 verification code:
  ```rust
  // Verify oracle signature
  let ix = ed25519_instruction::new_ed25519_instruction(
    &oracle_pubkey,
    &signature_bytes
  );
  ```
- Use cursor to point to key line (optional)
- Pause for 2-3 seconds

**0:26-0:32** - PDA derivation
- Scroll to show PDA code:
  ```rust
  let (escrow_pda, bump) = Pubkey::find_program_address(
    &[b"escrow", agent.key().as_ref(), &tx_id],
    ctx.program_id
  );
  ```
- Highlight the seed structure
- End scene

### Notes
- Code blocks should be syntax highlighted (they should be on the dashboard)
- Pause 2-3 seconds on each code block
- Don't scroll too fast - code needs to be readable
- Cursor can be used to emphasize key lines but isn't required

---

## Scene 6: System Impact & Call to Action (35 seconds)
**Audio:** `scene-06-impact-cta.mp3` (35.5s)

### Setup
- Browser: Still on dashboard
- May be on "SDK Integration" tab from Scene 5

### Actions Timeline

**0:00-0:03** - Return home
- Click "Main" tab to return to homepage
- Wait for load

**0:03-0:08** - Key differentiators
- Scroll to "Key Differentiators" section
- Show metrics:
  - 81% average fraud reduction
  - 48hrs resolution time (85% faster)
  - 99.9% oracle fallback success
  - $0.005 avg dispute cost
- Pause to emphasize

**0:08-0:15** - Cost comparison (CRITICAL)
- Scroll to cost comparison chart/section
- Show side-by-side:
  - **Traditional:** $35, 90 days
  - **x402Resolve:** $0.005, 48 hours
- This is the key value proposition - pause for 3-4 seconds
- Let it sink in visually

**0:15-0:22** - Live on Devnet status
- Scroll up or to "Live on Devnet" section (usually near top)
- Show:
  - **Program ID:** `D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP`
  - **Network:** Solana Devnet
  - **Status:** Active (green indicator)
- Ensure program ID is fully visible and readable

**0:22-0:30** - Footer and contact
- Scroll all the way down to footer
- Show:
  - KAMIYO logo (clear and centered)
  - Contact: dev@kamiyo.ai
  - GitHub repository link
  - Documentation links
- Pause on KAMIYO branding

**0:30-0:35** - Fade to end
- Stop scrolling
- Hold on footer for 2-3 seconds
- Prepare for fade to black (can be added in post)
- End recording

### Notes
- Cost comparison is the strongest visual - emphasize it
- Program ID must be readable (consider zoom if needed)
- KAMIYO branding should be clear at the end
- End with a clean, professional look

---

## Post-Recording: Assembly Instructions

### Step 1: Verify All Recordings
Check each scene file:
```bash
ls -lh scene-*.mov

# Verify duration of each
afplay scene-1.mov  # Test playback
# Repeat for all 6 scenes
```

### Step 2: Create Concatenation File
```bash
cd /path/to/recording-workspace

cat > concat-list.txt << 'EOF'
file 'scene-1.mov'
file 'scene-2.mov'
file 'scene-3.mov'
file 'scene-4.mov'
file 'scene-5.mov'
file 'scene-6.mov'
EOF
```

### Step 3: Combine Videos (Method A - Simple)
```bash
# Quick concatenation (if all files have same codec/format)
ffmpeg -f concat -safe 0 -i concat-list.txt \
  -c copy \
  x402resolve-raw.mp4
```

### Step 4: Combine Videos (Method B - Re-encode for quality)
```bash
# High quality re-encode with proper settings
ffmpeg -f concat -safe 0 -i concat-list.txt \
  -c:v libx264 \
  -preset slow \
  -crf 18 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 192k \
  -ar 48000 \
  -movflags +faststart \
  x402resolve-product-demo.mp4
```

**Encoding settings explained:**
- `-preset slow`: Better quality, slower encode
- `-crf 18`: High quality (lower = better, 18-23 is good range)
- `-pix_fmt yuv420p`: Maximum compatibility
- `-movflags +faststart`: Optimize for web streaming

### Step 5: Add Audio (If recordings don't include audio)
If you recorded video without audio and want to merge later:

```bash
# First, concatenate all audio files
ffmpeg -i audio-output/scene-01-hook-problem.mp3 \
       -i audio-output/scene-02-architecture.mp3 \
       -i audio-output/scene-03-live-demo.mp3 \
       -i audio-output/scene-04-dashboard.mp3 \
       -i audio-output/scene-05-code-switchboard.mp3 \
       -i audio-output/scene-06-impact-cta.mp3 \
       -filter_complex '[0:0][1:0][2:0][3:0][4:0][5:0]concat=n=6:v=0:a=1[out]' \
       -map '[out]' \
       complete-audio.mp3

# Then merge with video
ffmpeg -i x402resolve-raw.mp4 \
       -i complete-audio.mp3 \
       -c:v copy \
       -c:a aac \
       -b:a 192k \
       -shortest \
       x402resolve-final.mp4
```

### Step 6: Verify Final Output
```bash
# Check file properties
ffprobe x402resolve-product-demo.mp4

# Verify duration (should be ~177 seconds)
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 \
  x402resolve-product-demo.mp4

# Quick playback test
open x402resolve-product-demo.mp4
```

---

## Troubleshooting

### Issue: Dashboard won't load
**Solution:**
1. Check internet connection
2. Try: https://x402kamiyo.github.io/x402resolve (with trailing slash)
3. Clear browser cache
4. Wait 30 seconds for GitHub Pages to wake up
5. Fallback: Use localhost if you have the code

### Issue: Terminal demo doesn't run
**Solution:**
1. Check Node.js is installed: `node --version`
2. Navigate to correct directory: `cd examples/autonomous-agent-demo`
3. Install dependencies: `npm install`
4. Check for errors: `npm run demo`
5. Fallback: Use pre-recorded terminal output or screenshots

### Issue: Audio sync is off
**Solution:**
1. Add 0.5-1 second delay at start of each scene
2. Use video editing software (iMovie/DaVinci Resolve) to adjust timing
3. Re-record individual scenes if severely out of sync

### Issue: Text is too small to read
**Solution:**
1. Use browser zoom: Cmd+Plus (Mac) or Ctrl+Plus (Windows)
2. Increase terminal font size: 18pt or 20pt
3. Record at 1080p, not higher resolution

### Issue: Mouse cursor is distracting
**Solution:**
1. macOS: Use QuickTime with "Show Mouse Clicks" enabled
2. Hide cursor between actions
3. Use `⌘+Shift+5` screen recording with cursor hidden option

### Issue: Recording has stutters/lag
**Solution:**
1. Close all other applications
2. Disable browser extensions
3. Record to SSD, not external drive
4. Lower recording quality if needed
5. Use dedicated recording software (OBS)

---

## Quality Checklist

Before considering the video complete, verify:

- [ ] All 6 scenes recorded successfully
- [ ] Each scene has clear video (no blur/pixelation)
- [ ] Text is readable (minimum 14pt equivalent)
- [ ] Smooth scrolling (no jerky movements)
- [ ] No sensitive data visible (API keys, private keys)
- [ ] Terminal output is legible
- [ ] Code syntax highlighting is visible
- [ ] Charts/graphs are clear
- [ ] Total duration: 175-180 seconds
- [ ] Audio is clear (if included)
- [ ] No background noise
- [ ] Transitions are smooth (if edited)
- [ ] Final file size: reasonable (<200MB for 3 min)

---

## Alternative: Use Video Editing Software

If you prefer more control, record each scene with extra padding (5s before/after) and use:

### iMovie (Mac, Free)
1. Import all 6 scene videos
2. Drag to timeline in order
3. Trim start/end of each clip to remove padding
4. Add crossfade transitions (optional, 0.5s)
5. Import combined audio file
6. Align audio with video
7. Export: File → Share → File (High Quality 1080p)

### DaVinci Resolve (Cross-platform, Free)
1. Create new project: 1920x1080, 30fps
2. Import all scenes to Media Pool
3. Drag to timeline in sequence
4. Use blade tool to trim edges
5. Add cross dissolve transitions between scenes
6. Import audio track
7. Sync audio using waveforms or markers
8. Export: Deliver → H.264, 1080p, 8Mbps

### Adobe Premiere Pro (Paid)
1. New sequence: 1080p 30fps
2. Import all assets
3. Arrange on timeline
4. Add transitions: Effects → Video Transitions → Dissolve → Cross Dissolve
5. Sync audio
6. Color correction (optional)
7. Export: File → Export → Media → H.264, Match Source - High Bitrate

---

## Final Notes

- **Practice makes perfect**: Record Scene 1 multiple times until comfortable
- **Don't rush**: Smooth, deliberate actions are more professional than fast, jerky ones
- **Audio is primary**: Follow the audio timing - it dictates the pace
- **Backup plan**: Have screenshots ready as fallback for any scene
- **Time budget**: Budget 30-45 min per scene (including retakes)
- **Total time**: Expect 3-4 hours for all 6 scenes + assembly

**Good luck! The comprehensive script and audio files are ready. You have everything needed to create a professional product demo.**
