import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { base, Creative, creativeStorage, ExportItem, request, TGProject } from '../services/tg-projects';
const Editor = lazy(() => import('./stop-motion/StopMotionStudio'));
const control = 'rounded-lg border border-slate-300 bg-white px-4 py-2 disabled:opacity-50';
export default function CreativeHub() {
  const [projects, setProjects] = useState<TGProject[]>([]), [project, setProject] = useState<TGProject | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]), [creative, setCreative] = useState<Creative | null>(null);
  const [title, setTitle] = useState(''), [client, setClient] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false);
  const [exports, setExports] = useState<Record<string, ExportItem[]>>({});
  const [refresh, setRefresh] = useState(0);
  const path = project && creative ? `${base}/${project.id}/creatives/${creative.id}` : '';
  const storage = useMemo(() => creativeStorage(path), [path]);
  useEffect(() => {
    let active = true; setBusy(true);
    const load = async () => {
      if (!project) { const list = await request<TGProject[]>(base); if (active) setProjects(list); }
      else {
        const list = await request<Creative[]>(`${base}/${project.id}/creatives`);
        const history = await Promise.all(list.map(async item => [item.id, await request<ExportItem[]>(`${base}/${project.id}/creatives/${item.id}/exports`)] as const));
        if (active) { setCreatives(list); setExports(Object.fromEntries(history)); }
      }
    };
    load().catch(e => { if (active) setNotice(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [project, refresh]);
  async function create() {
    if (!title.trim()) return;
    setBusy(true); setNotice('');
    try {
      if (project) { const item = await request<Creative>(`${base}/${project.id}/creatives`, 'POST', { title: title.trim() }); setCreative(item); }
      else { const item = await request<TGProject>(base, 'POST', { title: title.trim(), client }); setProject(item); }
      setTitle(''); setClient(''); setRefresh(n => n + 1);
    } catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  }
  async function elements(item: Creative) {
    setBusy(true);
    try { const result = await request<{message: string}>(`${base}/${project!.id}/creatives/${item.id}/elements`, 'POST'); setNotice(result.message); }
    catch (e) { setNotice((e as Error).message); } finally { setBusy(false); }
  }
  if (project && creative) return <Suspense fallback={<p className="p-6">Abrindo animação…</p>}><Editor key={path} storage={storage} onBack={() => { setCreative(null); setRefresh(n => n + 1); }} /></Suspense>;
  return <main className="flex-1 overflow-auto p-5 lg:p-8"><div className="mx-auto max-w-5xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-slate-600">TG CRIATIVO{project ? ` / ${project.client || 'Projeto'}` : ''}</p><h1 className="mt-2 text-3xl font-bold">{project?.title || 'Seus projetos'}</h1></div><a className={control} href="/criativo/">Esteira de produção existente ↗</a></header>
    {project && <button className={control} onClick={() => { setProject(null); setCreatives([]); setTitle(''); setNotice(''); }}>← Todos os projetos</button>}
    <p className="text-slate-600">{project ? 'Crie uma animação e reutilize os elementos deste projeto. Cada peça tem seu próprio roteiro, quadros e exportações.' : 'Organize clientes, ideias e produções em projetos independentes.'}</p>
    {notice && <p role="status" className="rounded-lg bg-amber-50 p-4">{notice} <button className="underline" onClick={() => { setNotice(''); setRefresh(n => n + 1); }}>Atualizar</button></p>}
    <form className="flex flex-wrap gap-3 rounded-xl border bg-white p-5" onSubmit={e => { e.preventDefault(); void create(); }}><input className={control} aria-label={project ? 'Nome do criativo' : 'Nome do projeto'} maxLength={120} required value={title} onChange={e => setTitle(e.target.value)} placeholder={project ? 'Nome da animação' : 'Nome do projeto'} disabled={busy} />{!project && <input className={control} maxLength={160} aria-label="Cliente ou marca" placeholder="Cliente ou marca (opcional)" value={client} onChange={e => setClient(e.target.value)} disabled={busy} />}<button className={`${control} font-semibold`} disabled={busy || !title.trim()}>{project ? '+ Criar Stop Motion' : '+ Criar projeto'}</button></form>
    {busy && <p role="status">Carregando…</p>}
    {!project ? <div className="grid gap-4 sm:grid-cols-2">{projects.map(item => <button key={item.id} className="rounded-xl border bg-white p-6 text-left hover:border-amber-600" onClick={() => { setProject(item); setTitle(''); setNotice(''); }}><h2 className="text-xl font-semibold">{item.title}</h2><p className="mt-2 text-slate-600">{item.client || 'Sem cliente vinculado'}</p></button>)}{!busy && !projects.length && <p>Crie seu primeiro projeto acima.</p>}</div> : <div className="space-y-4">{creatives.map(item => <article key={item.id} className="rounded-xl border bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wide text-slate-500">Stop Motion</p><h2 className="text-xl font-semibold">{item.title}</h2></div><div className="flex flex-wrap gap-2"><button className={control} disabled={busy || !item.revision} onClick={() => elements(item)}>Guardar elementos no projeto</button><button className={control} disabled={busy} onClick={() => setCreative(item)}>Abrir editor →</button></div></div><div className="mt-4 flex flex-wrap gap-3">{(exports[item.id] || []).map(file => <a className="text-sm underline" key={file.id} href={`${base}/${project.id}/creatives/${item.id}/exports/${file.id}`}>{file.format.toUpperCase()} · {file.created_at} UTC</a>)}{!exports[item.id]?.length && <span className="text-sm text-slate-500">Nenhuma exportação salva.</span>}</div></article>)}{!busy && !creatives.length && <p>O projeto está pronto para receber sua primeira animação.</p>}</div>}
  </div></main>;
}
