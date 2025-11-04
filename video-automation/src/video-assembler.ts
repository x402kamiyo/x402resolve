import ffmpeg from 'fluent-ffmpeg';
import { VideoFile, AudioFile, Script } from './types';
import * as path from 'path';
import * as fs from 'fs/promises';

const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

export class VideoAssembler {
  async compile(
    scenes: VideoFile[],
    audioFiles: AudioFile[],
    script: Script
  ): Promise<string> {
    const outputDir = path.join(process.cwd(), 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const outputPath = path.join(outputDir, 'x402-hackathon-demo.mp4');

    console.log('\n=== Assembling final video ===');

    const concatenated = await this.concatenateScenes(scenes);

    const withAudio = await this.mergeAudio(concatenated, audioFiles);

    console.log(`\nFinal video saved to: ${outputPath}`);

    return withAudio;
  }

  private async concatenateScenes(scenes: VideoFile[]): Promise<string> {
    console.log('Concatenating scenes...');

    const tempDir = path.join(process.cwd(), 'temp');
    const listFile = path.join(tempDir, 'scenes.txt');
    const outputPath = path.join(tempDir, 'concatenated.mp4');

    const fileContent = scenes
      .sort((a, b) => a.sceneId - b.sceneId)
      .map(s => `file '${path.resolve(s.path)}'`)
      .join('\n');

    await fs.writeFile(listFile, fileContent);

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(listFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions([
          '-c', 'copy',
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('  FFmpeg command:', cmd);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`  Progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log('  Concatenation complete');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('  Concatenation error:', err.message);
          reject(err);
        })
        .run();
    });
  }

  private async mergeAudio(
    videoPath: string,
    audioFiles: AudioFile[]
  ): Promise<string> {
    console.log('Merging audio...');

    const tempDir = path.join(process.cwd(), 'temp');
    const audioListFile = path.join(tempDir, 'audio.txt');
    const mergedAudioPath = path.join(tempDir, 'merged-audio.mp3');
    const outputPath = path.join(process.cwd(), 'output', 'x402-hackathon-demo.mp4');

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const audioContent = audioFiles
      .sort((a, b) => a.sceneId - b.sceneId)
      .map(a => `file '${path.resolve(a.path)}'`)
      .join('\n');

    await fs.writeFile(audioListFile, audioContent);

    const concatenatedAudioPath = await new Promise<string>((resolve, reject) => {
      ffmpeg()
        .input(audioListFile)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .output(mergedAudioPath)
        .audioCodec('libmp3lame')
        .on('end', () => {
          console.log('  Audio concatenation complete');
          resolve(mergedAudioPath);
        })
        .on('error', (err) => {
          console.error('  Audio concatenation error:', err.message);
          reject(err);
        })
        .run();
    });

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(concatenatedAudioPath)
        .outputOptions([
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-preset', 'medium',
          '-crf', '23',
          '-movflags', '+faststart',
        ])
        .output(outputPath)
        .on('start', (cmd) => {
          console.log('  FFmpeg command:', cmd);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`  Progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', () => {
          console.log('  Audio merge complete');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('  Audio merge error:', err.message);
          reject(err);
        })
        .run();
    });
  }
}
