import { newProject, parseProject, Project } from '../components/stop-motion/model';
export interface ProjectStorage { load: () => Promise<Project | null>; save: (project: Project) => Promise<void>; exported?: (blob: Blob, format: 'gif' | 'webm') => Promise<void> }
export type TGProject = { id: string; title: string; client: string };
export type Creative = { id: string; title: string; revision: number };
export type ExportItem = { id: string; format: string; created_at: string };
export const base = '/api/tg/projects';
export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try { response = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error('Não foi possível conectar ao servidor TG.'); }
  if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(typeof data.detail === 'string' ? data.detail : 'Não foi possível concluir a operação no servidor TG.'); }
  try { return await response.json(); } catch { throw new Error('O servidor TG não está disponível neste endereço.'); }
}
export function creativeStorage(path: string): ProjectStorage {
  let revision: number | null = null;
  let pending = Promise.resolve();
  return {
    async load() {
      const data = await request<{ revision: number; title: string; client: string; sequence: unknown; library: Record<string, unknown> | null }>(path);
      const result = data.sequence ? parseProject(data.sequence) : newProject();
      if (!data.sequence) { result.title = data.title; result.client = data.client; if (data.library) { Object.assign(result, { backdrop: data.library.backdrop, background: data.library.background, audio: data.library.audio, audioName: data.library.audioName }); result.scene.actors = data.library.actors as Project['scene']['actors']; } }
      const parsed = parseProject(result); revision = data.revision; return parsed;
    },
    save(project) {
      pending = pending.catch(() => {}).then(async () => {
        if (revision === null) throw new Error('Reabra o criativo antes de salvar. Não foi possível carregar a versão do servidor.');
        const data = await request<{ revision: number }>(path, 'PUT', { revision, sequence: project }); revision = data.revision;
      }); return pending;
    },
    async exported(blob, format) {
      const response = await fetch(`${path}/exports/${format}`, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob });
      if (!response.ok) throw new Error('O arquivo foi baixado, mas não pôde ser guardado no projeto.');
    },
  };
}
