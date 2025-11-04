import { Scene, AudioFile, VideoFile } from './types';
import { BrowserController } from './browser-controller';
import { ScreenRecorder } from './screen-recorder';
import * as path from 'path';
import * as fs from 'fs/promises';

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
    const tempDir = path.join(process.cwd(), 'temp', 'scenes');
    await fs.mkdir(tempDir, { recursive: true });

    const outputPath = path.join(tempDir, `scene-${scene.id}.mp4`);

    console.log(`\n=== Recording scene ${scene.id}: ${scene.name} ===`);
    console.log(`  Duration: ${scene.duration}s`);
    console.log(`  Type: ${scene.visuals.type}`);

    await this.recorder.startRecording(outputPath);

    const headless = process.env.HEADLESS === 'true';
    await this.browser.launch(headless);

    if (scene.visuals.type === 'browser') {
      await this.executeBrowserScene(scene);
    } else if (scene.visuals.type === 'terminal') {
      await this.executeTerminalScene(scene);
    } else if (scene.visuals.type === 'split-screen') {
      console.warn('Split-screen not yet implemented, using browser fallback');
      await this.executeBrowserScene(scene);
    } else {
      console.warn(`Unknown visual type: ${scene.visuals.type}`);
    }

    console.log(`  Waiting for scene duration (${scene.duration}s)...`);
    await this.wait(scene.duration * 1000);

    await this.browser.close();
    await this.recorder.stopRecording();

    console.log(`  Scene ${scene.id} recorded successfully`);

    return {
      sceneId: scene.id,
      path: outputPath,
      duration: audio.duration,
    };
  }

  private async executeBrowserScene(scene: Scene): Promise<void> {
    if (!scene.visuals.url) {
      throw new Error(`Scene ${scene.id} missing URL`);
    }

    console.log(`  Navigating to: ${scene.visuals.url}`);
    await this.browser.navigate(scene.visuals.url);

    if (scene.visuals.actions && scene.visuals.actions.length > 0) {
      console.log(`  Executing ${scene.visuals.actions.length} actions`);
      await this.browser.executeActions(scene.visuals.actions);
    }
  }

  private async executeTerminalScene(scene: Scene): Promise<void> {
    console.warn('Terminal scenes not yet implemented');
    await this.wait(scene.duration * 1000);
  }

  private async wait(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup(): Promise<void> {
    await this.browser.close();
    if (this.recorder.isRecording()) {
      await this.recorder.stopRecording();
    }
  }
}
