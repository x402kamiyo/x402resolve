import { Script } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ScriptParser {
  async loadScript(filePath: string): Promise<Script> {
    const content = await fs.readFile(filePath, 'utf-8');
    const script: Script = JSON.parse(content);

    this.validateScript(script);

    return script;
  }

  private validateScript(script: Script): void {
    if (!script.metadata) {
      throw new Error('Script missing metadata');
    }

    if (!script.metadata.title) {
      throw new Error('Script metadata missing title');
    }

    if (!script.scenes || script.scenes.length === 0) {
      throw new Error('Script missing scenes');
    }

    for (const scene of script.scenes) {
      if (!scene.id || !scene.name || !scene.duration) {
        throw new Error(`Scene ${scene.id} missing required fields`);
      }

      if (!scene.narration || !scene.narration.text) {
        throw new Error(`Scene ${scene.id} missing narration`);
      }

      if (!scene.visuals) {
        throw new Error(`Scene ${scene.id} missing visuals`);
      }
    }

    if (script.transitions) {
      for (const transition of script.transitions) {
        const fromScene = script.scenes.find(s => s.id === transition.from);
        const toScene = script.scenes.find(s => s.id === transition.to);

        if (!fromScene || !toScene) {
          throw new Error(`Invalid transition: ${transition.from} -> ${transition.to}`);
        }
      }
    }

    const totalDuration = script.scenes.reduce((sum, scene) => sum + scene.duration, 0);
    const expectedDuration = script.metadata.duration;

    if (Math.abs(totalDuration - expectedDuration) > 5) {
      console.warn(`Warning: Total scene duration (${totalDuration}s) differs from expected (${expectedDuration}s)`);
    }
  }
}
