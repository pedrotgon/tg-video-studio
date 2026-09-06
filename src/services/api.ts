import { ComplexVideoConfig, CopyQualification, GenerationJob, SimpleCopy, SimpleVideoConfig, VerifiedMemoryReference } from '../types';

const messageFromResponse = async (response: Response) => {
  try {
    const body = await response.json();
    return body.detail || body.message || `Erro HTTP ${response.status}`;
  } catch {
    return `Erro HTTP ${response.status}`;
  }
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const generateSimpleCopies = async (
  query: string,
  projectId: string,
  answers: Record<string, string> = {},
  onProgress?: (message: string) => void,
): Promise<{ copies: SimpleCopy[]; memory: VerifiedMemoryReference | null }> => {
  onProgress?.('Consultando a Memória e validando a fonte…');
  const create = await fetch('/api/simple/copies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, projectId, targetCta: 'MUNDOFIT', answers }),
  });
  if (!create.ok) throw new Error(await messageFromResponse(create));
  const created = await create.json() as { id?: string; memory?: VerifiedMemoryReference | null };
  if (!created.id) throw new Error('O gerador não retornou uma tarefa de copies.');
  onProgress?.(created.memory ? `Referência ${created.memory.alias} confirmada no Acervo.` : 'Tema livre: nenhuma evidência da Memória foi vinculada.');
  for (;;) {
    await wait(1500);
    const response = await fetch(`/api/simple/copies/${encodeURIComponent(created.id)}?projectId=${encodeURIComponent(projectId)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(await messageFromResponse(response));
    const task = await response.json() as { status: string; error?: string; copies?: SimpleCopy[] };
    if (task.status === 'completed') {
      if (!task.copies || task.copies.length !== 10) throw new Error('A IA não retornou exatamente 10 copies distintas.');
      return { copies: task.copies, memory: created.memory || null };
    }
    if (['failed', 'cancelled', 'error'].includes(task.status)) throw new Error(task.error || 'A geração de copies falhou.');
    onProgress?.('Gerando 10 variações de fala…');
  }
};

export const qualifySimpleCopy = async (
  query: string,
  projectId: string,
): Promise<CopyQualification> => {
  const response = await fetch('/api/simple/copies/qualify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, projectId, targetCta: 'MUNDOFIT' }),
  });
  if (!response.ok) throw new Error(await messageFromResponse(response));
  const result = await response.json() as CopyQualification;
  if (!Array.isArray(result.questions) || result.questions.length < 3 || result.questions.length > 5) {
    throw new Error('A IA não retornou uma qualificação válida.');
  }
  const invalid = result.questions.some((item) =>
    !item.question.trim()
    || [...item.question].length > 20
    || item.options.length < 2
    || item.options.length > 4
    || item.options.some((option) => !option.label.trim() || [...option.label].length > 10)
  );
  if (invalid) throw new Error('A IA ultrapassou o limite de brevidade da qualificação.');
  return result;
};

export const generateSimpleScript = async (videoSubject: string, tone: SimpleVideoConfig['tone'] = 'direto'): Promise<string> => {
  const response = await fetch('/api/simple/script', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoSubject, tone }),
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
