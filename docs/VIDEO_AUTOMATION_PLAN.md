# Automated Hackathon Demo Video Tool - Technical Plan

## Overview

Automated tool to generate a 3-4 minute hackathon submission video with:
- Screen recording of live demos
- Browser automation for interactions
- OpenAI TTS narration
- Synchronized audio/visual editing
- Professional transitions and overlays

## Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│              Video Generation Pipeline              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Script Parser → Audio Generation → Scene Director │
│       ↓              ↓                    ↓         │
│   Timing Data    TTS Files          Automation     │
│                                           ↓         │
│                                   Browser Control   │
│                                           ↓         │
│                                   Screen Recording  │
│                                           ↓         │
│                                    Video Assembly   │
│                                           ↓         │
│                                    Final Export     │
└─────────────────────────────────────────────────────┘
```

## Technology Stack

### Core Components
- **Node.js/TypeScript** - Main orchestration
- **Puppeteer** - Browser automation
- **FFmpeg** - Video processing and assembly
- **OpenAI TTS API** - Voice generation
- **ScreenRecorder (ffmpeg)** - Screen capture

### Dependencies
```json
{
  "puppeteer": "^21.0.0",
  "fluent-ffmpeg": "^2.1.2",
  "openai": "^4.20.0",
  "playwright": "^1.40.0",
  "robotjs": "^0.6.0",
  "jimp": "^0.22.0"
}
```

## Directory Structure

```
video-automation/
├── src/
│   ├── index.ts              # Main orchestrator
│   ├── script-parser.ts      # Parse script.json
│   ├── audio-generator.ts    # OpenAI TTS integration
│   ├── scene-director.ts     # Scene execution coordinator
│   ├── browser-controller.ts # Puppeteer automation
│   ├── screen-recorder.ts    # FFmpeg screen capture
│   ├── video-assembler.ts    # Final video compilation
│   └── config.ts             # Configuration
├── assets/
│   ├── script.json           # Narration script with timing
│   ├── overlays/             # PNG overlays for graphics
│   └── music/                # Background music
├── temp/
│   ├── audio/                # Generated TTS files
│   ├── scenes/               # Individual scene recordings
│   └── screenshots/          # Captured frames
└── output/
    └── x402-hackathon-demo.mp4
```

## Script Format Specification

```json
{
  "metadata": {
    "title": "x402Resolve Hackathon Submission",
    "duration": 210,
    "voice": "alloy",
    "aspectRatio": "16:9",
    "resolution": "1920x1080"
  },
  "scenes": [
    {
      "id": 1,
      "name": "intro",
      "duration": 15,
      "narration": {
        "text": "Script text here...",
        "voice": "alloy",
        "speed": 1.0
      },
      "visuals": {
        "type": "browser",
        "url": "https://x402kamiyo.github.io/x402resolve",
        "actions": [
          {"type": "wait", "ms": 1000},
          {"type": "scroll", "to": "hero", "duration": 2000}
        ]
      },
      "overlays": [
        {
          "type": "text",
          "content": "x402Resolve",
          "position": "center",
          "startTime": 2,
          "duration": 3,
          "style": "title"
        }
      ]
    }
  ]
}
```

## Implementation Phases

### Phase 1: Audio Generation (30 min)
```typescript
class AudioGenerator {
  async generateFromScript(script: Script): Promise<AudioFile[]> {
    // 1. Parse script.json
    // 2. For each scene narration:
    //    - Call OpenAI TTS API
    //    - Save to temp/audio/{scene-id}.mp3
    //    - Calculate exact duration
    // 3. Return audio metadata
  }
}
```

### Phase 2: Scene Automation (60 min)
```typescript
class SceneDirector {
  async executeScene(scene: Scene, audio: AudioFile): Promise<VideoFile> {
    // 1. Start audio playback (silent)
    // 2. Start screen recording
    // 3. Execute browser actions synchronized to narration
    // 4. Stop recording when audio complete
    // 5. Save to temp/scenes/{scene-id}.mp4
  }
}
```

### Phase 3: Browser Control (45 min)
```typescript
class BrowserController {
  async navigate(url: string): Promise<void>
  async scroll(selector: string, duration: number): Promise<void>
  async click(selector: string): Promise<void>
  async type(selector: string, text: string, speed: number): Promise<void>
  async highlight(selector: string, color: string): Promise<void>
  async screenshot(selector: string): Promise<Buffer>
  async waitFor(ms: number): Promise<void>
}
```

### Phase 4: Video Assembly (45 min)
```typescript
class VideoAssembler {
  async compile(scenes: VideoFile[], audio: AudioFile[]): Promise<string> {
    // 1. Concatenate scene videos
    // 2. Merge audio tracks
    // 3. Add transitions (fade, wipe)
    // 4. Apply overlays (text, graphics)
    // 5. Add background music (low volume)
    // 6. Export final MP4
  }
}
```

## Scene Automation Details

### Scene Types

**1. Browser Recording**
- Navigate to URL
- Execute DOM interactions
- Capture in real-time
- Sync with narration timing

**2. Terminal Recording**
- Execute commands
- Capture output
- Type animation effect

**3. Code Walkthrough**
- Open VS Code via URL scheme
- Highlight lines
- Scroll through files

**4. Dashboard/Analytics**
- Navigate live dashboard
- Show real-time data
- Highlight metrics

## Timing Synchronization

```typescript
interface TimingMarker {
  sceneId: number;
  timestamp: number;  // Seconds into narration
  action: Action;
  waitForComplete: boolean;
}

// Example: Sync browser click with narration word
{
  timestamp: 12.5,  // "Now click here" at 12.5s
  action: { type: "click", selector: "#dispute-button" },
  waitForComplete: false
}
```

## Visual Enhancements

### Overlays
- Scene titles (fade in/out)
- Code blocks (syntax highlighted)
- Metrics callouts (animated numbers)
- Arrow pointers (highlight elements)
- Terminal commands (typewriter effect)

### Transitions
- Crossfade (1s)
- Slide (0.5s)
- Zoom (dashboard → specific metric)

### Cursor Effects
- Highlight clicks (ripple effect)
- Draw attention (circles, arrows)
- Smooth movement simulation

## OpenAI Voice Selection

**Recommended: "nova"**
- Natural and professional
- Good for technical content
- Clear pronunciation
- Engaging tone

**Alternative: "alloy"**
- Neutral and trustworthy
- Good for enterprise demos

**Settings:**
```json
{
  "model": "tts-1-hd",
  "voice": "nova",
  "speed": 1.05,
  "response_format": "mp3"
}
```

## Execution Flow

```typescript
async function generateVideo() {
  // 1. Load script
  const script = await loadScript('assets/script.json');

  // 2. Generate all audio
  console.log('Generating narration...');
  const audioFiles = await audioGenerator.generateFromScript(script);

  // 3. Execute each scene
  console.log('Recording scenes...');
  const videoFiles = [];
  for (const scene of script.scenes) {
    const audio = audioFiles.find(a => a.sceneId === scene.id);
    const video = await sceneDirector.executeScene(scene, audio);
    videoFiles.push(video);
  }

  // 4. Assemble final video
  console.log('Assembling video...');
  const finalVideo = await videoAssembler.compile(videoFiles, audioFiles);

  console.log(`Video generated: ${finalVideo}`);
}
```

## Configuration

```typescript
// config.ts
export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'tts-1-hd',
    voice: 'nova',
    speed: 1.05
  },
  video: {
    resolution: { width: 1920, height: 1080 },
    fps: 30,
    bitrate: '5000k',
    codec: 'libx264',
    preset: 'medium'
  },
  browser: {
    headless: false,  // Show browser during recording
    viewport: { width: 1920, height: 1080 },
    slowMo: 0  // Milliseconds to slow down actions
  },
  recording: {
    display: ':0.0',  // X11 display (macOS screen capture)
    audio: false,  // Don't record system audio
    format: 'mp4'
  }
};
```

## Error Handling

```typescript
class VideoGenerationError extends Error {
  constructor(
    public phase: 'audio' | 'scene' | 'assembly',
    public sceneId?: number,
    message?: string
  ) {
    super(message);
  }
}

// Retry logic for API calls
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

## Testing Strategy

```typescript
// Dry run mode - skip recording, just verify timing
npm run dry-run

// Single scene testing
npm run scene 3

// Audio-only generation
npm run audio-only

// Full production
npm run generate
```

## Performance Considerations

- Generate audio upfront (parallel API calls)
- Record scenes sequentially (resource intensive)
- Use hardware acceleration for encoding
- Clean up temp files after each scene
- Estimated total generation time: 8-12 minutes

## Deliverables

1. **Tool Source Code** (`video-automation/src/`)
2. **Script JSON** (`assets/script.json`)
3. **README** with usage instructions
4. **Example Output** (`output/x402-hackathon-demo.mp4`)
5. **Scene Previews** (individual scene files for review)

## Usage

```bash
# Install dependencies
cd video-automation
npm install

# Set API key
export OPENAI_API_KEY="sk-..."

# Set environment
export SOLANA_RPC_URL="https://api.devnet.solana.com"
export ESCROW_PROGRAM_ID="D9adezZ12cosX3GG2jK6PpbwMFLHzcCYVpcPCFcaciYP"

# Generate video
npm run generate

# Output: output/x402-hackathon-demo.mp4
```

## Timeline

- **Setup & Dependencies**: 15 min
- **Audio Generator**: 30 min
- **Browser Controller**: 45 min
- **Scene Director**: 60 min
- **Video Assembler**: 45 min
- **Script JSON Creation**: 30 min
- **Testing & Refinement**: 60 min

**Total Development**: ~4.5 hours
**Video Generation**: ~10 minutes
