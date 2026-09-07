export type TabType = 'simple' | 'complex' | 'profile' | 'animation';

export interface SimpleVideoConfig {
  videoSubject: string;
  videoScript?: string;
  tone?: 'direto' | 'proximo' | 'energetico' | 'especialista';
  keywords?: string;
  voiceName: string;
  videoRatio: '9:16' | '16:9';
  subtitleEnabled: boolean;
  subtitlePosition: 'bottom' | 'center';
}

export interface SimpleCopy {
  model?: string;
  id: string;
  title: string;
  angle?: string;
  hook_spoken?: string;
  body?: string;
  cta?: string;
  text: string;
  source_post_id?: string;
}

export interface VerifiedMemoryReference {
  id: string;
  alias: string;
  post_id: string;
  source_url: string;
  caption: string;
  metrics: Record<string, string | number | null>;
  observed_at?: string;
}

export interface CopyQualifierOption {
  id: string;
  label: string;
}

export interface CopyQualifierQuestion {
  id: string;
  question: string;
  options: CopyQualifierOption[];
}

export interface CopyQualification {
  questions: CopyQualifierQuestion[];
  memory: VerifiedMemoryReference | null;
  model?: string;
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
