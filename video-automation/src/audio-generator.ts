import OpenAI from 'openai';
import { AudioFile, Narration, Script } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AudioGenerator {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateFromScript(script: Script): Promise<AudioFile[]> {
    console.log('Generating audio for all scenes...');

    const audioFiles: AudioFile[] = [];

    for (const scene of script.scenes) {
      console.log(`  Generating audio for scene ${scene.id}: ${scene.name}`);
      const audio = await this.generateNarration(
        scene.id,
        scene.narration,
        scene.duration
      );
      audioFiles.push(audio);
      console.log(`    Duration: ${audio.duration}s`);
    }

    return audioFiles;
  }

  private async generateNarration(
    sceneId: number,
    narration: Narration,
    fallbackDuration: number
  ): Promise<AudioFile> {
    const outputPath = narration.outputFile;

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const response = await this.openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: narration.voice as any,
      speed: narration.speed,
      input: narration.text,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(outputPath, buffer);

    const duration = await this.getAudioDuration(outputPath);

    return {
      sceneId,
      path: outputPath,
      duration: duration > 0 ? duration : fallbackDuration,
    };
  }

  private async getAudioDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
      );

      return parseFloat(stdout.trim());
    } catch (error) {
      console.error(`Error getting duration for ${filePath}:`, error);
      return 0;
    }
  }
}
