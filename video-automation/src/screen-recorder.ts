import { ChildProcess, spawn } from 'child_process';
import { config } from './config';
import * as fs from 'fs';
import * as path from 'path';

const ffmpegPath = require('ffmpeg-static');

export class ScreenRecorder {
  private process?: ChildProcess;
  private outputPath?: string;

  async startRecording(outputPath: string): Promise<void> {
    this.outputPath = outputPath;

    const { SCREEN_WIDTH, SCREEN_HEIGHT, FPS } = process.env;
    const width = SCREEN_WIDTH || '1920';
    const height = SCREEN_HEIGHT || '1080';
    const fps = FPS || '30';

    console.log(`Starting screen recording: ${width}x${height} @ ${fps}fps`);

    if (process.platform === 'darwin') {
      this.process = spawn(ffmpegPath, [
        '-f', 'avfoundation',
        '-i', '2',  // Capture screen 0 (device index 2)
        '-r', fps,
        '-s', `${width}x${height}`,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-y',
        outputPath,
      ]);
    } else if (process.platform === 'linux') {
      const display = process.env.DISPLAY || ':0.0';
      this.process = spawn(ffmpegPath, [
        '-f', 'x11grab',
        '-s', `${width}x${height}`,
        '-i', display,
        '-r', fps,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-y',
        outputPath,
      ]);
    } else {
      throw new Error(`Unsupported platform: ${process.platform}`);
    }

    this.process.stderr?.on('data', (data) => {
      const message = data.toString();
      if (process.env.VERBOSE === 'true') {
        console.log('FFmpeg:', message);
      }
    });

    this.process.on('error', (error) => {
      console.error('Screen recording error:', error);
    });

    await this.waitForStart();
  }

  async stopRecording(): Promise<void> {
    if (!this.process) {
      console.warn('No recording process to stop');
      return;
    }

    console.log('Stopping screen recording...');

    this.process.stdin?.write('q');

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.process?.kill('SIGKILL');
        reject(new Error('Recording stop timeout'));
      }, 10000);

      this.process!.on('exit', (code) => {
        clearTimeout(timeout);
        console.log(`Recording stopped with code ${code}`);
        resolve();
      });
    });

    this.process = undefined;

    if (this.outputPath && fs.existsSync(this.outputPath)) {
      const stats = fs.statSync(this.outputPath);
      console.log(`  Output: ${this.outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  }

  private async waitForStart(): Promise<void> {
    console.log('  Waiting for recording to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  isRecording(): boolean {
    return this.process !== undefined;
  }
}
