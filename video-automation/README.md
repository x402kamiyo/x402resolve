# x402Resolve Video Automation Tool

Automated video generation for hackathon submission with synchronized narration, screen recording, and visual effects.

## Features

- OpenAI TTS narration with timing synchronization
- Automated browser interactions via Puppeteer
- Screen recording with FFmpeg
- Dynamic overlays and annotations
- Professional transitions and effects
- 3-minute output optimized for hackathon submission

## Prerequisites

```bash
# System dependencies
brew install ffmpeg           # macOS
apt-get install ffmpeg        # Linux

# Node.js 18+
node --version
```

## Installation

```bash
cd video-automation
npm install
```

## Environment Setup

Create `.env`:

```bash
# OpenAI API
OPENAI_API_KEY=sk-...

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
ESCROW_PROGRAM_ID=D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP

# Local services
API_URL=https://x402resolve.kamiyo.ai
DASHBOARD_URL=https://x402kamiyo.github.io/x402resolve
```

## Project Structure

```
video-automation/
├── src/
│   ├── index.ts              # Main entry point
│   ├── audio-generator.ts    # OpenAI TTS integration
│   ├── scene-director.ts     # Scene execution
│   ├── browser-controller.ts # Puppeteer automation
│   ├── screen-recorder.ts    # FFmpeg recording
│   ├── video-assembler.ts    # Final compilation
│   ├── script-parser.ts      # JSON script loader
│   └── config.ts             # Configuration
├── assets/
│   ├── script.json           # Narration & scene definitions
│   ├── overlays/             # PNG graphics
│   └── music/                # Background audio
├── temp/                     # Generated during build
│   ├── audio/                # TTS MP3 files
│   ├── scenes/               # Scene recordings
│   └── screenshots/          # Debug captures
└── output/
    └── x402-hackathon-demo.mp4
```

## Usage

### Generate Full Video

```bash
npm run generate
```

Output: `output/x402-hackathon-demo.mp4`

### Development Workflows

```bash
# Generate audio only (test TTS)
npm run audio-only

# Test single scene
npm run scene 3

# Dry run (validate timing without recording)
npm run dry-run

# Clean temporary files
npm run clean
```

## Script Format

The `assets/script.json` defines all scenes:

```json
{
  "metadata": {
    "title": "x402Resolve",
    "duration": 180,
    "voice": "nova",
    "speed": 1.05
  },
  "scenes": [
    {
      "id": 1,
      "name": "intro",
      "duration": 20,
      "narration": {
        "text": "Script text...",
        "voice": "nova",
        "speed": 1.05
      },
      "visuals": {
        "type": "browser",
        "url": "https://...",
        "actions": [
          {"type": "scroll", "to": 0, "duration": 2000}
        ]
      },
      "overlays": [
        {
          "type": "text",
          "content": "Title",
          "position": {"x": "center", "y": 100}
        }
      ]
    }
  ]
}
```

## Action Types

### Browser Actions
- `wait` - Pause for milliseconds
- `scroll` - Scroll to element or position
- `click` - Click element
- `type` - Type text into input
- `highlight` - Add visual highlight
- `screenshot` - Capture frame

### Overlay Types
- `text` - Text overlay
- `image` - PNG/SVG graphic
- `badge` - Styled badge
- `arrow` - Directional pointer
- `code-label` - Code annotation

### Animations
- `fadeIn` / `fadeOut`
- `slideInLeft` / `slideInRight`
- `scaleIn`
- `pulse`
- `staggerIn` (for badge rows)

## Timing Synchronization

Actions are synchronized to narration timestamps:

```json
{
  "narration": {
    "text": "Now we create the escrow..."
  },
  "actions": [
    {"type": "wait", "ms": 2000},
    {"type": "click", "selector": "#create-escrow", "startTime": 5.5}
  ]
}
```

The `startTime` field (in seconds) triggers the action at that point in the narration.

## FFmpeg Recording

Screen recording uses FFmpeg with optimized settings:

```typescript
// Screen capture (macOS)
ffmpeg -f avfoundation -i "1" -r 30 -s 1920x1080 output.mp4

// Linux
ffmpeg -f x11grab -s 1920x1080 -i :0.0 -r 30 output.mp4
```

## OpenAI TTS Configuration

```typescript
const response = await openai.audio.speech.create({
  model: 'tts-1-hd',
  voice: 'nova',
  speed: 1.05,
  input: narrationText,
  response_format: 'mp3'
});
```

**Voice Options:**
- `nova` - Professional, clear (recommended)
- `alloy` - Neutral, trustworthy
- `echo` - Warm, engaging
- `fable` - Expressive
- `onyx` - Deep, authoritative
- `shimmer` - Bright, energetic

## Video Assembly Pipeline

1. **Audio Generation**: Convert all narration to MP3
2. **Scene Recording**: Execute browser automation + screen capture
3. **Scene Processing**: Add overlays, transitions
4. **Assembly**: Concatenate scenes, merge audio
5. **Post-Processing**: Color grading, normalization
6. **Export**: Final MP4 with H.264 codec

## Performance

- Audio generation: ~30 seconds (6 scenes)
- Scene recording: ~4-6 minutes (real-time + overhead)
- Video assembly: ~2-3 minutes
- **Total runtime**: ~8-10 minutes

## Output Specifications

- **Resolution**: 1920x1080 (Full HD)
- **Framerate**: 30fps
- **Codec**: H.264 (libx264)
- **Audio**: AAC 192kbps
- **Bitrate**: ~8Mbps
- **File size**: ~180MB (3 minutes)

## Troubleshooting

### Audio generation fails
```bash
# Check API key
echo $OPENAI_API_KEY

# Test API directly
curl https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","input":"test","voice":"nova"}' \
  --output test.mp3
```

### Screen recording issues (macOS)
```bash
# Grant screen recording permission:
# System Preferences → Security & Privacy → Screen Recording
# Add Terminal or iTerm2
```

### Browser automation fails
```bash
# Install Chromium
npx puppeteer browsers install chrome

# Check Puppeteer
node -e "require('puppeteer').launch().then(b => b.close())"
```

### FFmpeg not found
```bash
# macOS
brew install ffmpeg

# Linux
apt-get install ffmpeg

# Verify
ffmpeg -version
```

## Customization

### Change voice
Edit `assets/script.json`:
```json
{
  "metadata": {
    "voice": "alloy"  // Change here
  }
}
```

### Adjust timing
Modify scene `duration` in script.json and regenerate.

### Add custom overlays
1. Add PNG to `assets/overlays/`
2. Reference in scene:
```json
{
  "type": "image",
  "content": "assets/overlays/custom.png"
}
```

### Change background music
Replace `assets/music/background.mp3` with your track.

## CLI Commands

```bash
# Full generation
npm run generate

# Audio only
npm run audio-only

# Single scene (by ID)
npm run scene 3

# Dry run (timing validation)
npm run dry-run

# Clean temp files
npm run clean

# Development mode (verbose logging)
npm run dev

# Production build
npm run build
```

## Architecture

```
┌──────────────────────────────────────────┐
│           Main Orchestrator              │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────┐     │
│  │ 1. Script Parser               │     │
│  │    - Load script.json          │     │
│  │    - Validate structure        │     │
│  └────────────────────────────────┘     │
│              ↓                           │
│  ┌────────────────────────────────┐     │
│  │ 2. Audio Generator             │     │
│  │    - OpenAI TTS API calls      │     │
│  │    - Generate MP3 files        │     │
│  │    - Calculate exact durations │     │
│  └────────────────────────────────┘     │
│              ↓                           │
│  ┌────────────────────────────────┐     │
│  │ 3. Scene Director              │     │
│  │    - For each scene:           │     │
│  │      • Start screen recording  │     │
│  │      • Execute browser actions │     │
│  │      • Sync with audio timing  │     │
│  │      • Stop recording          │     │
│  └────────────────────────────────┘     │
│              ↓                           │
│  ┌────────────────────────────────┐     │
│  │ 4. Video Assembler             │     │
│  │    - Concatenate scenes        │     │
│  │    - Apply transitions         │     │
│  │    - Merge audio tracks        │     │
│  │    - Add overlays              │     │
│  │    - Export final MP4          │     │
│  └────────────────────────────────┘     │
└──────────────────────────────────────────┘
```

## Development Notes

### Adding new scene types

1. Define type in `SceneVisuals` interface
2. Implement handler in `SceneDirector`
3. Add to script.json

Example:
```typescript
// src/scene-director.ts
async executeTerminalScene(scene: Scene): Promise<string> {
  // Implementation
}
```

### Custom overlay types

```typescript
// src/video-assembler.ts
interface CustomOverlay extends Overlay {
  type: 'custom';
  customProp: string;
}

async renderCustomOverlay(overlay: CustomOverlay): Promise<void> {
  // Implementation
}
```

## License

MIT | KAMIYO

## Contact

dev@kamiyo.ai | [kamiyo.ai](https://kamiyo.ai)
