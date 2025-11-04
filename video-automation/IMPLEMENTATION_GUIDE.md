# Video Automation Tool - Implementation Guide for Sonnet Agent

## Overview

This tool automates the generation of a 3-minute hackathon demo video with:
- OpenAI TTS narration (voice: "nova")
- Synchronized browser automation
- Screen recording
- Dynamic overlays and effects
- Professional assembly and export

## Implementation Breakdown

### Core Components (Priority Order)

#### 1. Script Parser (`src/script-parser.ts`)
**Complexity:** Low | **Time:** 20 min

```typescript
import { Script } from './types';
import * as fs from 'fs/promises';

export class ScriptParser {
  async loadScript(path: string): Promise<Script> {
    // Read and parse JSON
    // Validate structure
    // Return typed Script object
  }

  validateScript(script: Script): void {
    // Check required fields
    // Validate scene references
    // Ensure timing consistency
  }
}
```

**Implementation Notes:**
- Simple JSON parsing with validation
- Type checking against Script interface
- Error handling for malformed scripts

---

#### 2. Audio Generator (`src/audio-generator.ts`)
**Complexity:** Medium | **Time:** 30 min

```typescript
import OpenAI from 'openai';
import { AudioFile, Narration } from './types';
import * as fs from 'fs/promises';

export class AudioGenerator {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateFromScript(script: Script): Promise<AudioFile[]> {
    const audioFiles: AudioFile[] = [];

    for (const scene of script.scenes) {
      const audio = await this.generateNarration(
        scene.id,
        scene.narration
      );
      audioFiles.push(audio);
    }

    return audioFiles;
  }

  private async generateNarration(
    sceneId: number,
    narration: Narration
  ): Promise<AudioFile> {
    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: narration.voice,
      speed: narration.speed,
      input: narration.text,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const path = narration.outputFile;

    await fs.mkdir(dirname(path), { recursive: true });
    await fs.writeFile(path, buffer);

    const duration = await this.getAudioDuration(path);

    return { sceneId, path, duration };
  }

  private async getAudioDuration(path: string): Promise<number> {
    // Use ffprobe to get exact duration
    // Return in seconds
  }
}
```

**Implementation Notes:**
- Parallel API calls for all scenes (Promise.all)
- Retry logic with exponential backoff
- Duration extraction via ffprobe
- Error handling for API failures

**OpenAI API Example:**
```bash
curl https://api.openai.com/v1/audio/speech \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1-hd",
    "voice": "nova",
    "speed": 1.05,
    "input": "API payment disputes cost thirty-five dollars..."
  }' \
  --output scene-01.mp3
```

---

#### 3. Browser Controller (`src/browser-controller.ts`)
**Complexity:** Medium | **Time:** 45 min

```typescript
import puppeteer, { Browser, Page } from 'puppeteer';
import { Action } from './types';

export class BrowserController {
  private browser?: Browser;
  private page?: Page;

  async launch(headless: boolean = false): Promise<void> {
    this.browser = await puppeteer.launch({
      headless,
      args: ['--window-size=1920,1080'],
      defaultViewport: { width: 1920, height: 1080 },
    });

    this.page = await this.browser.newPage();
  }

  async navigate(url: string): Promise<void> {
    await this.page!.goto(url, { waitUntil: 'networkidle2' });
  }

  async executeActions(actions: Action[]): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action);
    }
  }

  private async executeAction(action: Action): Promise<void> {
    switch (action.type) {
      case 'wait':
        await this.wait(action.ms!);
        break;
      case 'scroll':
        await this.scroll(action.selector || action.to!, action.duration!);
        break;
      case 'click':
        await this.click(action.selector!);
        break;
      case 'type':
        await this.type(action.selector!, action.text!);
        break;
      case 'highlight':
        await this.highlight(action.selector!, action.color!);
        break;
      case 'screenshot':
        await this.screenshot(action.selector!);
        break;
    }
  }

  private async scroll(
    target: string | number,
    duration: number
  ): Promise<void> {
    if (typeof target === 'number') {
      await this.page!.evaluate((y, dur) => {
        window.scrollTo({ top: y, behavior: 'smooth' });
      }, target, duration);
    } else {
      await this.page!.evaluate((sel, dur) => {
        const el = document.querySelector(sel);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, target, duration);
    }

    await this.wait(duration);
  }

  private async click(selector: string): Promise<void> {
    await this.page!.click(selector);
    await this.wait(500);
  }

  private async type(selector: string, text: string): Promise<void> {
    await this.page!.type(selector, text, { delay: 100 });
  }

  private async highlight(
    selector: string,
    color: string
  ): Promise<void> {
    await this.page!.evaluate((sel, col) => {
      const el = document.querySelector(sel);
      if (el) {
        (el as HTMLElement).style.outline = `3px solid ${col}`;
        (el as HTMLElement).style.outlineOffset = '3px';
      }
    }, selector, color);
  }

  private async screenshot(selector: string): Promise<Buffer> {
    const element = await this.page!.$(selector);
    return await element!.screenshot() as Buffer;
  }

  private async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    await this.browser?.close();
  }
}
```

**Implementation Notes:**
- Non-headless for screen recording
- Smooth scrolling with timing
- CSS-based highlighting
- Screenshot capture for debugging

---

#### 4. Screen Recorder (`src/screen-recorder.ts`)
**Complexity:** High | **Time:** 45 min

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { ChildProcess, spawn } from 'child_process';
import { config } from './config';

export class ScreenRecorder {
  private process?: ChildProcess;

  async startRecording(outputPath: string): Promise<void> {
    const { width, height } = config.video.resolution;
    const { fps } = config.video;

    // macOS screen recording
    if (process.platform === 'darwin') {
      this.process = spawn('ffmpeg', [
        '-f', 'avfoundation',
        '-i', '1',  // Screen 1
        '-r', fps.toString(),
        '-s', `${width}x${height}`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-y',
        outputPath,
      ]);
    } else {
      // Linux X11 recording
      this.process = spawn('ffmpeg', [
        '-f', 'x11grab',
        '-s', `${width}x${height}`,
        '-i', config.recording.display,
        '-r', fps.toString(),
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-y',
        outputPath,
      ]);
    }

    await this.waitForStart();
  }

  async stopRecording(): Promise<void> {
    if (!this.process) return;

    this.process.stdin?.write('q');

    await new Promise<void>((resolve) => {
      this.process!.on('exit', () => resolve());
    });

    this.process = undefined;
  }

  private async waitForStart(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

**Implementation Notes:**
- Platform-specific recording (macOS vs Linux)
- FFmpeg spawn process management
- Graceful shutdown with 'q' command
- Error handling for missing display

**macOS Setup:**
```bash
# Grant screen recording permission
System Preferences → Security & Privacy → Screen Recording
Add Terminal/iTerm2

# Test recording
ffmpeg -f avfoundation -list_devices true -i ""
```

---

#### 5. Scene Director (`src/scene-director.ts`)
**Complexity:** High | **Time:** 60 min

```typescript
import { Scene, AudioFile, VideoFile } from './types';
import { BrowserController } from './browser-controller';
import { ScreenRecorder } from './screen-recorder';
import { join } from 'path';
import { config } from './config';

export class SceneDirector {
  private browser: BrowserController;
  private recorder: ScreenRecorder;

  constructor() {
    this.browser = new BrowserController();
    this.recorder = new ScreenRecorder();
  }

  async executeScene(
    scene: Scene,
    audio: AudioFile
  ): Promise<VideoFile> {
    const outputPath = join(
      config.paths.temp,
      'scenes',
      `scene-${scene.id}.mp4`
    );

    console.log(`Recording scene ${scene.id}: ${scene.name}`);

    // Start recording
    await this.recorder.startRecording(outputPath);

    // Launch browser
    await this.browser.launch(config.browser.headless);

    // Execute scene based on type
    if (scene.visuals.type === 'browser') {
      await this.executeBrowserScene(scene);
    } else if (scene.visuals.type === 'terminal') {
      await this.executeTerminalScene(scene);
    } else if (scene.visuals.type === 'split-screen') {
      await this.executeSplitScreenScene(scene);
    }

    // Wait for scene duration
    await this.wait(scene.duration * 1000);

    // Stop recording
    await this.browser.close();
    await this.recorder.stopRecording();

    console.log(`Scene ${scene.id} recorded: ${outputPath}`);

    return {
      sceneId: scene.id,
      path: outputPath,
      duration: audio.duration,
    };
  }

  private async executeBrowserScene(scene: Scene): Promise<void> {
    await this.browser.navigate(scene.visuals.url!);
    await this.browser.executeActions(scene.visuals.actions || []);
  }

  private async executeTerminalScene(scene: Scene): Promise<void> {
    // Open terminal in browser (xterm.js or similar)
    // Execute commands with typing animation
    // Capture output
  }

  private async executeSplitScreenScene(scene: Scene): Promise<void> {
    // Launch multiple browser instances
    // Arrange side-by-side
    // Execute parallel actions
  }

  private async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Implementation Notes:**
- Coordinate recording, browser, and timing
- Type-specific scene handlers
- Synchronization with audio duration
- Resource cleanup

---

#### 6. Video Assembler (`src/video-assembler.ts`)
**Complexity:** High | **Time:** 60 min

```typescript
import ffmpeg from 'fluent-ffmpeg';
import { VideoFile, AudioFile, Script } from './types';
import { join } from 'path';
import { config } from './config';

export class VideoAssembler {
  async compile(
    scenes: VideoFile[],
    audioFiles: AudioFile[],
    script: Script
  ): Promise<string> {
    const outputPath = join(
      config.paths.output,
      'x402-hackathon-demo.mp4'
    );

    console.log('Assembling final video...');

    // 1. Concatenate scene videos
    const concatenated = await this.concatenateScenes(scenes, script);

    // 2. Merge audio
    const withAudio = await this.mergeAudio(
      concatenated,
      audioFiles,
      script
    );

    // 3. Apply overlays (if defined)
    const withOverlays = await this.applyOverlays(withAudio, script);

    // 4. Final encoding with quality settings
    await this.finalEncode(withOverlays, outputPath);

    console.log(`Video complete: ${outputPath}`);

    return outputPath;
  }

  private async concatenateScenes(
    scenes: VideoFile[],
    script: Script
  ): Promise<string> {
    const tempPath = join(config.paths.temp, 'concatenated.mp4');
    const listFile = join(config.paths.temp, 'scenes.txt');

    // Create FFmpeg concat file
    const fileContent = scenes
      .map(s => `file '${s.path}'`)
      .join('\n');

    await fs.writeFile(listFile, fileContent);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
          '-c copy',
          '-movflags', '+faststart'
        ])
        .output(tempPath)
        .on('end', () => resolve(tempPath))
        .on('error', reject)
        .run();
    });
  }

  private async mergeAudio(
    videoPath: string,
    audioFiles: AudioFile[],
    script: Script
  ): Promise<string> {
    const tempPath = join(config.paths.temp, 'with-audio.mp4');

    // Calculate audio offsets based on scene timings
    const audioConcat = this.createAudioConcat(audioFiles);

    return new Promise((resolve, reject) => {
      const cmd = ffmpeg()
        .input(videoPath)
        .input(audioConcat);

      // Add background music if specified
      if (script.metadata.backgroundMusic) {
        cmd.input(script.metadata.backgroundMusic.file);
        cmd.complexFilter([
          `[1:a]volume=${script.metadata.backgroundMusic.volume}[bg]`,
          '[2:a][bg]amix=inputs=2:duration=first[a]'
        ]);
        cmd.outputOptions(['-map', '0:v', '-map', '[a]']);
      } else {
        cmd.outputOptions(['-map', '0:v', '-map', '1:a']);
      }

      cmd
        .outputOptions([
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k'
        ])
        .output(tempPath)
        .on('end', () => resolve(tempPath))
        .on('error', reject)
        .run();
    });
  }

  private async applyOverlays(
    videoPath: string,
    script: Script
  ): Promise<string> {
    // Use FFmpeg drawtext filter for text overlays
    // Apply at specified timestamps
    // Return path to video with overlays
  }

  private async finalEncode(
    sourcePath: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(sourcePath)
        .outputOptions([
          '-c:v', config.video.codec,
          '-preset', config.video.preset,
          '-crf', '18',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', '+faststart'
        ])
        .output(outputPath)
        .on('progress', (progress) => {
          console.log(`Encoding: ${progress.percent?.toFixed(1)}%`);
        })
        .on('end', () => resolve())
        .on('error', reject)
        .run();
    });
  }

  private createAudioConcat(audioFiles: AudioFile[]): string {
    // Create concatenated audio file
    // Return path
  }
}
```

**Implementation Notes:**
- FFmpeg concat demuxer for scene merging
- Audio mixing with background music
- Complex filter graphs for overlays
- High-quality final encoding (CRF 18)

---

#### 7. Main Orchestrator (`src/index.ts`)
**Complexity:** Low | **Time:** 20 min

```typescript
import { ScriptParser } from './script-parser';
import { AudioGenerator } from './audio-generator';
import { SceneDirector } from './scene-director';
import { VideoAssembler } from './video-assembler';
import { config, validateConfig } from './config';
import { GenerationOptions } from './types';

async function generateVideo(options: GenerationOptions = {}): Promise<void> {
  try {
    validateConfig();

    console.log('x402Resolve Video Generation');
    console.log('============================\n');

    // 1. Load script
    const parser = new ScriptParser();
    const script = await parser.loadScript('assets/script.json');
    console.log(`Loaded script: ${script.metadata.title}`);
    console.log(`Total duration: ${script.metadata.duration}s\n`);

    // 2. Generate audio
    console.log('Generating narration...');
    const audioGen = new AudioGenerator(config.openai.apiKey);
    const audioFiles = await audioGen.generateFromScript(script);
    console.log(`Generated ${audioFiles.length} audio files\n`);

    if (options.audioOnly) {
      console.log('Audio-only mode complete');
      return;
    }

    // 3. Record scenes
    console.log('Recording scenes...');
    const director = new SceneDirector();
    const videoFiles = [];

    for (const scene of script.scenes) {
      if (options.sceneId && scene.id !== options.sceneId) {
        continue;
      }

      const audio = audioFiles.find(a => a.sceneId === scene.id)!;
      const video = await director.executeScene(scene, audio);
      videoFiles.push(video);
    }

    if (options.sceneId) {
      console.log(`Scene ${options.sceneId} recorded`);
      return;
    }

    // 4. Assemble final video
    console.log('\nAssembling final video...');
    const assembler = new VideoAssembler();
    const outputPath = await assembler.compile(
      videoFiles,
      audioFiles,
      script
    );

    console.log('\n✓ Video generation complete!');
    console.log(`Output: ${outputPath}`);

  } catch (error) {
    console.error('Error generating video:', error);
    process.exit(1);
  }
}

// Parse CLI args
const args = process.argv.slice(2);
const options: GenerationOptions = {
  audioOnly: args.includes('--audio-only'),
  sceneId: args.includes('--scene') ?
    parseInt(args[args.indexOf('--scene') + 1]) :
    undefined,
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
};

generateVideo(options);
```

---

## Implementation Timeline

| Component | Time | Priority |
|-----------|------|----------|
| Script Parser | 20m | 1 |
| Audio Generator | 30m | 2 |
| Browser Controller | 45m | 3 |
| Screen Recorder | 45m | 4 |
| Scene Director | 60m | 5 |
| Video Assembler | 60m | 6 |
| Main Orchestrator | 20m | 7 |
| **Total** | **4h 40m** | |

## Testing Strategy

```bash
# Phase 1: Audio generation
npm run audio-only
# Verify: temp/audio/*.mp3 files created

# Phase 2: Single scene
npm run scene 1
# Verify: temp/scenes/scene-1.mp4 created

# Phase 3: Full generation
npm run generate
# Verify: output/x402-hackathon-demo.mp4 created
```

## Dependencies Installation

```bash
cd video-automation
npm install

# Install FFmpeg
brew install ffmpeg  # macOS
apt-get install ffmpeg  # Linux
```

## Critical Implementation Details

### 1. Timing Synchronization
Actions must align with narration timestamps:
```typescript
const actionTime = action.startTime || 0;
const delay = actionTime * 1000 - elapsedTime;
if (delay > 0) await wait(delay);
await executeAction(action);
```

### 2. FFmpeg Process Management
Graceful shutdown is critical:
```typescript
process.stdin?.write('q');  // Quit FFmpeg
await waitForExit();         // Wait for file finalization
```

### 3. Error Recovery
Retry OpenAI API calls:
```typescript
for (let i = 0; i < 3; i++) {
  try {
    return await openai.audio.speech.create(...);
  } catch (err) {
    if (i === 2) throw err;
    await sleep(2 ** i * 1000);
  }
}
```

### 4. Resource Cleanup
Always close browser and processes:
```typescript
try {
  await executeScene();
} finally {
  await browser.close();
  await recorder.stopRecording();
}
```

## Known Challenges

1. **macOS Screen Recording Permission**
   - Requires manual approval in System Preferences
   - Test before full run

2. **FFmpeg Platform Differences**
   - macOS: avfoundation
   - Linux: x11grab
   - Detect platform and use appropriate input

3. **Overlay Timing**
   - Complex filter graphs for text overlays
   - Consider using separate tool (After Effects script) for overlays
   - Or render overlays with canvas and composite

4. **Browser Timing Variance**
   - Network delays affect page load
   - Add buffer time after navigation
   - Use `waitUntil: 'networkidle2'`

## Simplification Options

If time-constrained:

1. **Skip complex overlays**: Record plain screen, add overlays in post with simple tool
2. **Manual split-screen**: Record terminal and browser separately, composite later
3. **Pre-recorded demos**: Use existing demo runs instead of live automation
4. **Simple concatenation**: Skip fancy transitions, use straight cuts

## Success Criteria

- [ ] 3-minute video generated
- [ ] All 6 scenes included
- [ ] Audio synchronized with visuals
- [ ] 1080p resolution
- [ ] File size < 200MB
- [ ] Playable in all major browsers
- [ ] Professional appearance

## Next Steps for Agent

1. Implement components in priority order
2. Test each component independently
3. Run audio-only first (fastest feedback)
4. Test single scene before full run
5. Iterate on timing and quality
6. Generate final video

Good luck!
