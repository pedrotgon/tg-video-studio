export type TabType = 'simple' | 'complex';

export interface SimpleVideoConfig {
  videoSubject: string;
  videoScript?: string;
  keywords?: string;
  voiceName: string;
  videoRatio: '9:16' | '16:9';
  subtitleEnabled: boolean;
  subtitlePosition: 'bottom' | 'center';
}

export interface ComplexScene {
  id: string;
  sceneNumber: number;
  description: string;
  dialogue: string;
  character: string;
  visualPrompt: string;
  durationSeconds: number;
}

export interface ComplexVideoConfig {
  title: string;
  storyPremise: string;
  genre: 'documentary' | 'drama' | 'commercial' | 'short_story' | 'game_story';
  characters: Array<{ name: string; visualDescription: string; voice: string }>;
  scenes: ComplexScene[];
}

export interface GenerationJob {
  id: string;
  type: TabType;
  title: string;
  status: 'idle' | 'generating_script' | 'rendering_audio' | 'fetching_media' | 'compositing' | 'completed' | 'error';
  progress: number;
  currentStepMessage: string;
  videoUrl?: string;
  studioUrl?: string;
  videoSource?: 'backend' | 'local-preview';
  createdAt: string;
  error?: string;
}
