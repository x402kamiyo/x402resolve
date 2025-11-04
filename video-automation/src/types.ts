export interface Script {
  metadata: ScriptMetadata;
  scenes: Scene[];
  transitions?: Transition[];
  postProcessing?: PostProcessing;
}

export interface ScriptMetadata {
  title: string;
  duration: number;
  voice: OpenAIVoice;
  speed: number;
  aspectRatio: string;
  resolution: {
    width: number;
    height: number;
  };
  backgroundMusic?: {
    file: string;
    volume: number;
    fadeIn: number;
    fadeOut: number;
  };
}

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface Scene {
  id: number;
  name: string;
  duration: number;
  narration: Narration;
  visuals: SceneVisuals;
  overlays?: Overlay[];
}

export interface Narration {
  text: string;
  voice: OpenAIVoice;
  speed: number;
  outputFile: string;
}

export interface SceneVisuals {
  type: 'browser' | 'terminal' | 'vscode' | 'split-screen';
  url?: string;
  viewport?: {
    width: number;
    height: number;
  };
  actions?: Action[];
  layout?: 'horizontal' | 'vertical';
  screens?: SceneVisuals[];
  commands?: TerminalCommand[];
  files?: VSCodeFile[];
}

export interface Action {
  type: 'wait' | 'scroll' | 'click' | 'type' | 'highlight' | 'screenshot';
  ms?: number;
  to?: number | string;
  selector?: string;
  duration?: number;
  smooth?: boolean;
  text?: string;
  color?: string;
  startTime?: number;
}

export interface TerminalCommand {
  cmd: string;
  delay: number;
  text?: string;
}

export interface VSCodeFile {
  path: string;
  startLine: number;
  endLine: number;
  highlights?: {
    line: number;
    duration: number;
  }[];
}

export interface Overlay {
  type: 'text' | 'image' | 'badge' | 'arrow' | 'code-label' | 'metric-card' | 'badge-row' | 'diagram' | 'callout' | 'logo';
  content: string | string[];
  position: Position;
  startTime: number;
  duration: number;
  style?: OverlayStyle;
  animation?: Animation;
  from?: Position;
  badges?: string[];
}

export interface Position {
  x: number | 'center' | 'left' | 'right';
  y: number | 'center' | 'top' | 'bottom';
}

export interface OverlayStyle {
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  shadow?: string;
  padding?: string;
  borderRadius?: string;
  opacity?: number;
  scale?: number;
  width?: number;
  spacing?: number;
}

export type Animation = 'fadeIn' | 'fadeOut' | 'slideInLeft' | 'slideInRight' | 'slideUp' | 'scaleIn' | 'pulse' | 'staggerIn';

export interface Transition {
  from: number;
  to: number;
  type: 'crossfade' | 'wipe' | 'slide' | 'zoom';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export interface PostProcessing {
  colorGrading?: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  audio?: {
    normalize: boolean;
    noiseReduction: boolean;
    compression?: {
      threshold: number;
      ratio: number;
    };
  };
}

export interface AudioFile {
  sceneId: number;
  path: string;
  duration: number;
}

export interface VideoFile {
  sceneId: number;
  path: string;
  duration: number;
}

export interface GenerationOptions {
  audioOnly?: boolean;
  sceneId?: number;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface Config {
  openai: {
    apiKey: string;
    model: string;
    voice: OpenAIVoice;
    speed: number;
  };
  video: {
    resolution: {
      width: number;
      height: number;
    };
    fps: number;
    bitrate: string;
    codec: string;
    preset: string;
  };
  browser: {
    headless: boolean;
    viewport: {
      width: number;
      height: number;
    };
    slowMo: number;
  };
  recording: {
    display: string;
    audio: boolean;
    format: string;
  };
  paths: {
    temp: string;
    output: string;
    assets: string;
  };
}
