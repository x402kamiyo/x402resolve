import * as dotenv from 'dotenv';
import * as path from 'path';
import { ScriptParser } from './script-parser';
import { AudioGenerator } from './audio-generator';
import { SceneDirector } from './scene-director';
import { VideoAssembler } from './video-assembler';
import { AudioFile, VideoFile } from './types';

dotenv.config();

async function main() {
  console.log('='.repeat(60));
  console.log('x402Resolve Video Automation');
  console.log('='.repeat(60));

  try {
    const scriptPath = path.join(process.cwd(), 'assets', 'script.json');
    const parser = new ScriptParser();

    console.log('\n[1/5] Loading script...');
    const script = await parser.loadScript(scriptPath);
    console.log(`  Loaded ${script.scenes.length} scenes`);
    console.log(`  Total duration: ${script.metadata.duration}s`);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set in environment');
    }

    console.log('\n[2/5] Generating audio with OpenAI TTS...');
    const audioGenerator = new AudioGenerator(apiKey);
    const audioFiles: AudioFile[] = await audioGenerator.generateFromScript(script);
    console.log(`  Generated ${audioFiles.length} audio files`);

    console.log('\n[3/5] Recording scenes...');
    const director = new SceneDirector();
    const videoFiles: VideoFile[] = [];

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      const audio = audioFiles.find(a => a.sceneId === scene.id);

      if (!audio) {
        throw new Error(`Audio not found for scene ${scene.id}`);
      }

      console.log(`\nRecording scene ${i + 1}/${script.scenes.length}...`);
      const videoFile = await director.executeScene(scene, audio);
      videoFiles.push(videoFile);
    }

    await director.cleanup();
    console.log('\n  All scenes recorded successfully');

    console.log('\n[4/5] Assembling final video...');
    const assembler = new VideoAssembler();
    const outputPath = await assembler.compile(videoFiles, audioFiles, script);

    console.log('\n[5/5] Post-processing...');
    console.log('  Applying color grading: skipped (basic implementation)');
    console.log('  Normalizing audio: skipped (basic implementation)');

    console.log('\n' + '='.repeat(60));
    console.log('VIDEO GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Output: ${outputPath}`);
    console.log('');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('ERROR:', error instanceof Error ? error.message : String(error));
    console.error('='.repeat(60));
    process.exit(1);
  }
}

const args = process.argv.slice(2);

if (args.includes('--audio-only')) {
  (async () => {
    console.log('Audio-only mode');
    const scriptPath = path.join(process.cwd(), 'assets', 'script.json');
    const parser = new ScriptParser();
    const script = await parser.loadScript(scriptPath);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not set');
    }

    const audioGenerator = new AudioGenerator(apiKey);
    await audioGenerator.generateFromScript(script);
    console.log('Audio generation complete');
  })();
} else if (args.includes('--dry-run')) {
  (async () => {
    console.log('Dry run - validating script only');
    const scriptPath = path.join(process.cwd(), 'assets', 'script.json');
    const parser = new ScriptParser();
    const script = await parser.loadScript(scriptPath);
    console.log('Script is valid');
    console.log(`Scenes: ${script.scenes.length}`);
    console.log(`Total duration: ${script.metadata.duration}s`);
  })();
} else {
  main();
}
