import { Config } from './types';
import dotenv from 'dotenv';

dotenv.config();

export const config: Config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'tts-1-hd',
    voice: 'nova',
    speed: 1.05,
  },
  video: {
    resolution: {
      width: parseInt(process.env.SCREEN_WIDTH || '1920'),
      height: parseInt(process.env.SCREEN_HEIGHT || '1080'),
    },
    fps: parseInt(process.env.FPS || '30'),
    bitrate: '8000k',
    codec: 'libx264',
    preset: 'medium',
  },
  browser: {
    headless: process.env.HEADLESS === 'true',
    viewport: {
      width: 1920,
      height: 1080,
    },
    slowMo: 0,
  },
  recording: {
    display: process.env.DISPLAY || ':0.0',
    audio: false,
    format: 'mp4',
  },
  paths: {
    temp: './temp',
    output: './output',
    assets: './assets',
  },
};

export function validateConfig(): void {
  if (!config.openai.apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }
}
