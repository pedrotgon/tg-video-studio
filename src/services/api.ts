import { ComplexVideoConfig, GenerationJob, SimpleVideoConfig } from '../types';

const messageFromResponse = async (response: Response) => {
  try {
    const body = await response.json();
    return body.detail || body.message || `Erro HTTP ${response.status}`;
  } catch {
    return `Erro HTTP ${response.status}`;
  }
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const generateSimpleScript = async (videoSubject: string): Promise<string> => {
  const response = await fetch('/api/simple/script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoSubject }),
  });
  if (!response.ok) throw new Error(await messageFromResponse(response));
  const data = await response.json();
  if (typeof data.script !== 'string' || !data.script.trim()) throw new Error('A IA não retornou um roteiro para revisar.');
  return data.script.trim();
};

export const generateSimpleVideo = async (config: SimpleVideoConfig, onProgress: (job: GenerationJob) => void): Promise<GenerationJob> => {
  const initial: GenerationJob = {
    id: `mpt-${Date.now()}`,
    type: 'simple',
    title: config.videoSubject,
    status: 'generating_script',
    progress: 0,
    currentStepMessage: 'Enviando ao MoneyPrinterTurbo…',
    createdAt: new Date().toISOString(),
  };
  onProgress(initial);

  try {
    const create = await fetch('/api/simple/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config),
    });
    if (!create.ok) throw new Error(await messageFromResponse(create));
    const created = await create.json();
    const taskId = created.id as string;

    for (;;) {
      await wait(1500);
      const response = await fetch(`/api/simple/tasks/${encodeURIComponent(taskId)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(await messageFromResponse(response));
      const data = await response.json();
      const job: GenerationJob = { ...initial, ...data, id: taskId, type: 'simple', title: config.videoSubject, videoSource: 'backend' };
      onProgress(job);
      if (job.status === 'completed') {
        if (!job.videoUrl) throw new Error('O motor concluiu a tarefa sem retornar um arquivo de vídeo.');
        return job;
      }
      if (job.status === 'error') throw new Error(job.error || 'Falha no MoneyPrinterTurbo.');
    }
  } catch (error) {
    const failed: GenerationJob = { ...initial, status: 'error', currentStepMessage: 'Não foi possível gerar o vídeo.', error: error instanceof Error ? error.message : String(error) };
    onProgress(failed);
    return failed;
  }
};

export const generateComplexVideo = async (config: ComplexVideoConfig, onProgress: (job: GenerationJob) => void): Promise<GenerationJob> => {
  const initial: GenerationJob = { id: `creative-${Date.now()}`, type: 'complex', title: config.title, status: 'generating_script', progress: 25, currentStepMessage: 'Preparando sua produção…', createdAt: new Date().toISOString() };
  onProgress(initial);
  try {
    const safeProjectName = config.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 120);
    const response = await fetch('/api/complex/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config, title: safeProjectName }) });
    if (!response.ok) throw new Error(await messageFromResponse(response));
    const data = await response.json();
    const completed: GenerationJob = { ...initial, ...data, type: 'complex', title: config.title, status: 'completed', progress: 100 };
    onProgress(completed);
    return completed;
  } catch (error) {
    const failed: GenerationJob = { ...initial, status: 'error', currentStepMessage: 'Não foi possível criar o projeto.', error: error instanceof Error ? error.message : String(error) };
    onProgress(failed);
    return failed;
  }
};
