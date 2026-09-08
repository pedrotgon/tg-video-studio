import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Check, ChevronDown, Copy, Download, Film, FolderOpen, ImagePlus, Mic, Pause, Play, Plus, Redo2, Save, Trash2, Undo2, X } from 'lucide-react';
import { Actor, ActorKind, catalog, cloneScene, duration, Frame, frameAtTime, MAX_ACTORS, MAX_FRAMES, motionFrames, moveFrame, newActor, newProject, neutralPose, parseProject, Pose, Project } from './model';
import { Stage } from './stage';
import { loadProject as loadLocalProject, saveProject as saveLocalProject } from './storage';
import type { ProjectStorage } from '../../services/tg-projects';
import { download, exportGif, exportVideo, filename } from './export';
import './studio.css';

const message = (error: unknown) => error instanceof Error ? error.message : 'Não foi possível concluir esta ação.';
function Slider({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="sm-slider"><span>{label}<output>{Number(value.toFixed(2))}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
async function readMedia(file: File, kind: 'image' | 'audio'): Promise<string> {
  const image = kind === 'image';
  if (!(image ? ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) : file.type.startsWith('audio/'))) throw new Error(image ? 'Escolha uma imagem PNG, JPEG ou WebP.' : 'Escolha um arquivo de áudio.');
  if (file.size > (image ? 5 : 20) * 1024 * 1024) throw new Error(`O limite é ${image ? 5 : 20} MB por arquivo.`);
  const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.')); reader.readAsDataURL(file); });
  if (!image) return data;
  const bitmap = await createImageBitmap(file);
  try { const canvas = document.createElement('canvas'), scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height)); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale); canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height); const normalized = canvas.toDataURL('image/webp', .9); if (normalized.length > 7_000_000) throw new Error('Escolha uma imagem menor.'); return normalized; } finally { bitmap.close(); }
}
export default function StopMotionStudio({ storage, onBack }: { storage?: ProjectStorage; onBack?: () => void }) {
  const loadProject = storage?.load ?? loadLocalProject;
  const saveProject = storage?.save ?? saveLocalProject;
  const savedLabel = storage ? 'Salvo no projeto TG' : 'Salvo neste dispositivo';
  const [project, setProject] = useState<Project>(newProject);
  const [loaded, setLoaded] = useState(false), [autosave, setAutosave] = useState(true);
  const [saved, setSaved] = useState('Abrindo projeto…'), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<string>(''), [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false), [playIndex, setPlayIndex] = useState(0), [onion, setOnion] = useState(false);
  const [busy, setBusy] = useState<null | 'gif' | 'webm'>(null), [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [stageReady, setStageReady] = useState(false), [stageError, setStageError] = useState('');
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [mobilePanel, setMobilePanel] = useState<'cast' | 'pose'>('cast');
  const canvasRef = useRef<HTMLCanvasElement>(null), stageRef = useRef<Stage | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null), abortRef = useRef<AbortController | null>(null);
  const past = useRef<Project[]>([]), future = useRef<Project[]>([]), saving = useRef(Promise.resolve());
  const thumbCache = useRef(new Map<string, { frame: Frame; settings: string; url: string }>());
  const actor = project.scene.actors.find(a => a.id === selected);
  const frameIndex = project.frames.findIndex(f => f.id === selectedFrame);
  const currentFrame = project.frames[frameIndex];
  const locked = !!busy || playing || !loaded || importing;
  const persistence = useRef({ project, loaded, autosave });
  persistence.current = { project, loaded, autosave };
  const seconds = duration(project);

  useEffect(() => () => { const latest = persistence.current; if (latest.loaded && latest.autosave) saving.current = saving.current.catch(() => {}).then(() => saveProject(latest.project)).catch(() => {}); }, []);

  useEffect(() => { let active = true; loadProject().then(savedProject => { if (!active) return; if (savedProject) setProject(savedProject); setSaved(savedProject ? savedLabel : 'Novo projeto'); }).catch(error => { if (active) { setNotice(message(error)); setSaved('Salvamento automático pausado'); setAutosave(false); } }).finally(() => { if (active) setLoaded(true); }); return () => { active = false; }; }, []);
  useEffect(() => {
    if (!loaded || !autosave) return;
    let active = true; setSaved('Alterações pendentes…');
    const timer = setTimeout(() => { saving.current = saving.current.catch(() => {}).then(() => saveProject(project)); saving.current.then(() => { if (active) setSaved(savedLabel); }).catch(error => { if (active) { setSaved('Falha ao salvar'); setNotice(message(error)); } }); }, 600);
    return () => { active = false; clearTimeout(timer); };
  }, [project, loaded, autosave]);
  useEffect(() => {
    try { stageRef.current = new Stage(canvasRef.current!); setStageReady(true); } catch { setStageError('O palco precisa de WebGL. Ative a aceleração gráfica do navegador ou tente Chrome/Edge. Seu projeto continua disponível para download.'); }
    return () => { abortRef.current?.abort(); stageRef.current?.dispose(); stageRef.current = null; };
  }, []);
  useEffect(() => { if (!selected || !project.scene.actors.some(a => a.id === selected)) setSelected(project.scene.actors[0]?.id ?? ''); }, [project.scene.actors, selected]);

  const visibleScene = playing ? project.frames[playIndex]?.scene ?? project.scene : project.scene;
  const previous = onion && !playing ? project.frames[frameIndex > 0 ? frameIndex - 1 : frameIndex === 0 ? -1 : project.frames.length - 1]?.scene : undefined;
  const draw = useCallback(() => stageRef.current?.render(visibleScene, project, previous, playing || busy ? undefined : selected, project.ratio === '9:16' ? 540 : 960), [visibleScene, project, previous, playing, busy, selected]);
  useEffect(() => {
    if (!stageReady) return;
    let active = true;
    stageRef.current!.setBackdrop(project.backdrop).then(() => { if (active) { draw(); setStageError(''); } }).catch(error => { if (active) setStageError(message(error)); });
    return () => { active = false; };
  }, [draw, stageReady, project.backdrop]);
  useEffect(() => {
    if (!stageReady || playing || busy) return;
    let active = true, timer = 0, index = 0;
    const settings = project.ratio + project.background + project.backdrop;
    const ids = new Set(project.frames.map(f => f.id)); for (const id of thumbCache.current.keys()) if (!ids.has(id)) thumbCache.current.delete(id);
    const tick = () => {
      if (!active || !stageRef.current) return;
      while (index < project.frames.length) {
        const frame = project.frames[index++], cached = thumbCache.current.get(frame.id);
        if (cached?.frame === frame && cached.settings === settings) continue;
        const source = stageRef.current.render(frame.scene, project, undefined, undefined, 160);
        const url = source.toDataURL('image/jpeg', .65);
        thumbCache.current.set(frame.id, { frame, settings, url }); draw();
        setThumbnails(Object.fromEntries([...thumbCache.current].map(([id, entry]) => [id, entry.url])));
        timer = window.setTimeout(tick, 30); return;
      }
    };
    stageRef.current!.setBackdrop(project.backdrop).then(() => { if (active) tick(); }).catch(() => {});
    return () => { active = false; clearTimeout(timer); };
  }, [project.frames, project.ratio, project.background, project.backdrop, stageReady, playing, busy, draw]);

  const commit = useCallback((update: (p: Project) => Project) => {
    if (locked) return;
    past.current = [...past.current.slice(-29), project]; future.current = [];
    setProject(update(project));
  }, [locked, project]);
  const changeActor = (patch: Partial<Actor>) => commit(p => ({ ...p, scene: { ...p.scene, actors: p.scene.actors.map(a => a.id === selected ? { ...a, ...patch } : a) } }));
  const changePose = (key: keyof Pose, value: number) => { if (actor) changeActor({ pose: { ...actor.pose, [key]: value } }); };
  const undo = () => { if (locked) return; const last = past.current.pop(); if (last) { future.current.push(project); setProject(last); setSelectedFrame(null); } };
  const redo = () => { if (locked) return; const next = future.current.pop(); if (next) { past.current.push(project); setProject(next); setSelectedFrame(null); } };
  const capture = () => {
    if (!stageReady || stageError || locked) return;
    if (project.frames.length >= MAX_FRAMES) { setNotice('O projeto chegou ao limite de 240 quadros.'); return; }
    const frame = { id: crypto.randomUUID(), scene: cloneScene(project.scene), hold: 1 };
    commit(p => ({ ...p, frames: [...p.frames, frame] })); setSelectedFrame(frame.id);
  };
  const togglePlay = () => { if (!busy && !importing && project.frames.length) { setPlayIndex(0); setPlaying(value => !value); } };
  useEffect(() => {
    if (!playing) { audioRef.current?.pause(); return; }
    const started = performance.now();
    if (audioRef.current && project.audio) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => setNotice('O áudio não pôde ser reproduzido. Confira o arquivo importado.')); }
    const timer = setInterval(() => { const elapsed = (performance.now() - started) / 1000; if (elapsed >= seconds) { setPlaying(false); return; } setPlayIndex(frameAtTime(project.frames, project.fps, elapsed)); }, 16);
    return () => { clearInterval(timer); audioRef.current?.pause(); };
  }, [playing, project.frames, project.fps, project.audio, seconds]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).closest('input, textarea, select, button, a, [contenteditable]')) return;
      if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
      if (!locked && event.key.toLowerCase() === 'c' && !event.ctrlKey && !event.metaKey) capture();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
    };
    window.addEventListener('keydown', keydown); return () => window.removeEventListener('keydown', keydown);
  });
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (busy || saved !== savedLabel) event.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [busy, saved, savedLabel]);
  useEffect(() => { if (!busy) return; const abortOnHide = () => { if (document.hidden) { abortRef.current?.abort(); setNotice('A exportação foi cancelada porque a aba ficou oculta. Mantenha o estúdio aberto ao exportar vídeo.'); } }; document.addEventListener('visibilitychange', abortOnHide); return () => document.removeEventListener('visibilitychange', abortOnHide); }, [busy]);

  const addActor = (kind: ActorKind) => { if (project.scene.actors.length >= MAX_ACTORS) { setNotice('O limite é de 12 personagens por palco.'); return; } const added = newActor(kind, project.scene.actors.length); commit(p => ({ ...p, scene: { ...p.scene, actors: [...p.scene.actors, added] } })); setSelected(added.id); setMobilePanel('pose'); };
  const addMotion = (motion: 'wave' | 'walk' | 'talk') => { if (!actor) return; if (project.frames.length + 12 > MAX_FRAMES) { setNotice('São necessários 12 espaços livres na timeline.'); return; } const frames = motionFrames(project.scene, selected, motion); commit(p => ({ ...p, frames: [...p.frames, ...frames] })); setNotice('12 quadros adicionados. Você pode editar cada pose.'); };
  const runExport = async (format: 'gif' | 'webm') => {
    setPlaying(false); setBusy(format); setProgress(0); setNotice('');
    const abort = new AbortController(); abortRef.current = abort;
    try { const blob = await (format === 'gif' ? exportGif : exportVideo)(project, setProgress, abort.signal); download(blob, `${filename(project.title)}.${format}`); await storage?.exported?.(blob, format); setNotice(storage?.exported ? 'Arquivo baixado e guardado no histórico do criativo.' : format === 'gif' ? 'GIF exportado. Esse formato não inclui som.' : 'Vídeo baixado. O projeto editável permanece salvo separadamente.'); }
    catch (error) { setNotice(abort.signal.aborted ? 'Exportação cancelada. O projeto foi preservado.' : message(error)); }
    finally { abortRef.current = null; setBusy(null); }
  };
  const importProject = async (file?: File) => {
    if (!file) return;
    setImporting(true);
    try { if (file.size > 40 * 1024 * 1024) throw new Error('O arquivo de projeto ultrapassa 40 MB.'); const imported = parseProject(JSON.parse(await file.text())); commit(() => imported); setSelectedFrame(null); setNotice('Projeto aberto. Use Desfazer para retornar ao anterior.'); } catch (error) { setNotice(message(error)); } finally { setImporting(false); }
  };
  const importMedia = async (file: File | undefined, kind: 'audio' | 'image') => {
    if (!file) return;
    setImporting(true);
    try { const data = await readMedia(file, kind); commit(p => kind === 'image' ? { ...p, backdrop: data } : { ...p, audio: data, audioName: file.name.slice(0, 160) }); } catch (error) { setNotice(message(error)); } finally { setImporting(false); }
  };
  const saveNow = async () => { try { saving.current = saving.current.catch(() => {}).then(() => saveProject(project)); await saving.current; setSaved(savedLabel); setAutosave(true); } catch (error) { setNotice(message(error)); } };
  const leave = async () => {
    setImporting(true);
    try { saving.current = saving.current.catch(() => {}).then(() => saveProject(project)); await saving.current; persistence.current.autosave = false; onBack?.(); }
    catch (error) { setNotice(message(error)); setImporting(false); }
  };

  return <div className="sm-studio" aria-busy={!loaded || !!busy}>
    <header className="sm-header">
      {onBack && <button disabled={locked} onClick={leave}>← Criativos</button>}
      <div className="sm-brand"><span className="sm-brand-icon"><Film size={23} /></span><div><p>TG / ANIMAÇÃO</p><h1>Stop motion</h1></div></div>
      <div className="sm-project-name"><input aria-label="Nome do projeto" maxLength={120} value={project.title} disabled={locked} onChange={e => commit(p => ({ ...p, title: e.target.value }))} /><span><Check size={12} />{saved}</span></div>
      <div className="sm-actions"><button onClick={undo} disabled={locked || !past.current.length} aria-label="Desfazer" title="Desfazer (Ctrl+Z)"><Undo2 size={17} /></button><button onClick={redo} disabled={locked || !future.current.length} aria-label="Refazer"><Redo2 size={17} /></button><button disabled={locked} onClick={saveNow} title={storage ? 'Salvar no projeto TG' : 'Salvar neste dispositivo'}><Save size={16} /><span>Salvar</span></button><button aria-label="Baixar projeto JSON" disabled={!loaded || !!busy} onClick={() => download(new Blob([JSON.stringify(project)], { type: 'application/json' }), `${filename(project.title)}.tg-motion.json`)}><Download size={16} /><span>Projeto</span></button><label className={`sm-button ${locked ? 'disabled' : ''}`}><FolderOpen size={16} /><span>Abrir</span><input aria-label="Abrir projeto JSON" type="file" accept=".json" disabled={locked} onChange={e => { void importProject(e.target.files?.[0]); e.target.value = ''; }} /></label></div>
    </header>
    {notice && <div className="sm-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={16} /></button></div>}
    <div className="sm-mobile-tabs"><button aria-pressed={mobilePanel === 'cast'} onClick={() => setMobilePanel('cast')}>Elenco e cenário</button><button aria-pressed={mobilePanel === 'pose'} onClick={() => setMobilePanel('pose')}>Pose e produção</button></div>
    <div className="sm-workspace">
      <aside className={`sm-panel sm-cast ${mobilePanel === 'cast' ? 'sm-mobile-active' : ''}`}>
        <fieldset disabled={locked}><legend>Seu elenco</legend><p className="sm-hint">Adicione ao palco. Reutilize em cada quadro.</p><div className="sm-catalog">{catalog.map(item => <button key={item.kind} onClick={() => addActor(item.kind)}><span className="sm-swatch" style={{ background: item.color }} /><span><strong>{item.name}</strong><small>{item.label}</small></span><Plus size={15} /></button>)}</div>
        <h2>No palco <span>{project.scene.actors.length}/{MAX_ACTORS}</span></h2><div className="sm-cast-list">{project.scene.actors.map(a => <button key={a.id} className={a.id === selected ? 'selected' : ''} onClick={() => { setSelected(a.id); setMobilePanel('pose'); }}><span className="sm-dot" style={{ background: a.color }} /><span>{a.name || 'Sem nome'}</span><ChevronDown size={14} /></button>)}{!project.scene.actors.length && <p className="sm-hint">Escolha um personagem acima.</p>}</div>
        <h2>Cenário</h2><label className="sm-field">Fundo<input type="color" value={project.background} onChange={e => commit(p => ({ ...p, background: e.target.value }))} /></label><label className="sm-button sm-wide"><ImagePlus size={16} />Importar imagem<input type="file" accept="image/png,image/jpeg,image/webp" disabled={locked} onChange={e => { void importMedia(e.target.files?.[0], 'image'); e.target.value = ''; }} /></label>{project.backdrop && <button className="sm-link" onClick={() => commit(p => ({ ...p, backdrop: '' }))}>Remover cenário importado</button>}
        <label className="sm-field">Formato<select value={project.ratio} onChange={e => commit(p => ({ ...p, ratio: e.target.value as Project['ratio'] }))}><option>16:9</option><option>9:16</option><option>1:1</option></select></label>
        <details><summary>Câmera</summary><Slider label="Ângulo" min={-70} max={70} value={project.scene.camera.angle} onChange={angle => commit(p => ({ ...p, scene: { ...p.scene, camera: { ...p.scene.camera, angle } } }))} /><Slider label="Altura" min={0} max={55} value={project.scene.camera.elevation} onChange={elevation => commit(p => ({ ...p, scene: { ...p.scene, camera: { ...p.scene.camera, elevation } } }))} /><Slider label="Zoom" min={.6} max={1.8} step={.05} value={project.scene.camera.zoom} onChange={zoom => commit(p => ({ ...p, scene: { ...p.scene, camera: { ...p.scene.camera, zoom } } }))} /></details>
        </fieldset>
      </aside>
      <section className="sm-stage-area" aria-label="Palco de animação">
        <div className="sm-stage-top"><span><span className="sm-live-dot" />{playing ? `Reproduzindo · quadro ${playIndex + 1}` : 'Palco 3D'}</span><label><input type="checkbox" checked={onion} disabled={locked} onChange={e => setOnion(e.target.checked)} />Pose anterior</label></div>
        <div className="sm-stage-wrap"><canvas ref={canvasRef} className={project.ratio === '9:16' ? 'portrait' : project.ratio === '1:1' ? 'square' : ''} aria-label="Cena 3D. Selecione personagens no painel Elenco para editar suas poses." onPointerDown={e => { if (locked) return; const id = stageRef.current?.pickAtPointer(e.clientX, e.clientY); if (id) setSelected(id); }} />{stageError && <div className="sm-stage-error" role="alert">{stageError}</div>}</div>
        <div className="sm-stage-bottom"><span>{actor ? actor.name : 'Selecione um personagem'}<small>{currentFrame ? `Editando a partir do quadro ${frameIndex + 1}` : 'Pose livre'}</small></span><div><button disabled={locked || !currentFrame} onClick={() => { commit(p => ({ ...p, frames: p.frames.map(f => f.id === selectedFrame ? { ...f, scene: cloneScene(p.scene) } : f) })); setNotice('Quadro atualizado com a pose do palco.'); }}>Atualizar quadro</button><button className="sm-primary" disabled={locked || !stageReady || !!stageError || project.frames.length >= MAX_FRAMES} onClick={capture}><Camera size={18} />Capturar <kbd>C</kbd></button></div></div>
      </section>
      <aside className={`sm-panel sm-inspector ${mobilePanel === 'pose' ? 'sm-mobile-active' : ''}`}><fieldset disabled={locked}>
        <legend>Personagem</legend>{actor ? <><div className="sm-character-name"><input aria-label="Nome do personagem" maxLength={80} value={actor.name} onChange={e => changeActor({ name: e.target.value })} /><input aria-label="Cor do personagem" type="color" value={actor.color} onChange={e => changeActor({ color: e.target.value })} /><button aria-label="Remover personagem do palco" title="Remover do palco; quadros capturados são preservados" onClick={() => commit(p => ({ ...p, scene: { ...p.scene, actors: p.scene.actors.filter(a => a.id !== selected) } }))}><Trash2 size={16} /></button></div>
        <div className="sm-motion-presets"><button onClick={() => addMotion('wave')}>Acenar</button><button onClick={() => addMotion('walk')}>Caminhar</button><button onClick={() => addMotion('talk')}>Falar</button></div><p className="sm-hint">Cada movimento adiciona 12 quadros. “Falar” é uma pose de boca, sem sincronização automática.</p>
        <Slider label="Braço esquerdo" min={-180} max={180} value={actor.pose.leftArm} onChange={v => changePose('leftArm', v)} /><Slider label="Braço direito" min={-180} max={180} value={actor.pose.rightArm} onChange={v => changePose('rightArm', v)} /><Slider label="Perna esquerda" min={-75} max={75} value={actor.pose.leftLeg} onChange={v => changePose('leftLeg', v)} /><Slider label="Perna direita" min={-75} max={75} value={actor.pose.rightLeg} onChange={v => changePose('rightLeg', v)} /><Slider label="Cabeça" min={-60} max={60} value={actor.pose.head} onChange={v => changePose('head', v)} /><Slider label="Boca" min={0} max={1} step={.05} value={actor.pose.mouth} onChange={v => changePose('mouth', v)} /><button className="sm-link" onClick={() => changeActor({ pose: neutralPose() })}>Restaurar pose neutra</button>
        <details><summary>Posição e tamanho</summary><Slider label="Horizontal" min={-4} max={4} step={.1} value={actor.x} onChange={x => changeActor({ x })} /><Slider label="Profundidade" min={-3} max={3} step={.1} value={actor.z} onChange={z => changeActor({ z })} /><Slider label="Elevação" min={0} max={3} step={.1} value={actor.y} onChange={y => changeActor({ y })} /><Slider label="Rotação" min={-180} max={180} value={actor.rotation} onChange={rotation => changeActor({ rotation })} /><Slider label="Tamanho" min={.3} max={2} step={.05} value={actor.scale} onChange={scale => changeActor({ scale })} /></details><details><summary>Identidade do personagem</summary><textarea aria-label="Identidade do personagem" placeholder="Personalidade, jeito de falar e referências para reutilizar…" maxLength={2000} value={actor.description} onChange={e => changeActor({ description: e.target.value })} /></details></> : <p className="sm-hint">Adicione um personagem para ajustar a pose.</p>}
        <details className="sm-production"><summary>Roteiro, cliente e voz</summary><label className="sm-stacked">Cliente / perfil<input maxLength={160} value={project.client} onChange={e => commit(p => ({ ...p, client: e.target.value }))} placeholder="Nome ou referência do cliente" /></label><label className="sm-stacked">Roteiro<textarea maxLength={4000} value={project.brief} onChange={e => commit(p => ({ ...p, brief: e.target.value }))} placeholder="O que acontece nesta cena?" /></label><label className="sm-button sm-wide"><Mic size={16} />Importar voz ou trilha<input type="file" accept="audio/*" disabled={locked} onChange={e => { void importMedia(e.target.files?.[0], 'audio'); e.target.value = ''; }} /></label><p className="sm-hint">Áudio até 20 MB. O WebM usa a duração da timeline; ajuste os quadros para acomodar a fala.</p>{project.audio && <><p className="sm-audio-name">{project.audioName}</p><button className="sm-link" onClick={() => commit(p => ({ ...p, audio: '', audioName: '' }))}>Remover áudio</button></>}<p className="sm-hint">O perfil e o roteiro são notas deste projeto. Imagens e vozes por IA continuam no Criativo.</p><a className="sm-link" href="/criativo/" target="_blank" rel="noreferrer">Abrir TG Criativo ↗</a></details>
        </fieldset>
        {project.audio && <audio ref={audioRef} src={project.audio} controls className="sm-audio" onLoadedMetadata={e => { if (e.currentTarget.duration > seconds && seconds > 0) setNotice(`Áudio: ${e.currentTarget.duration.toFixed(1)} s. Timeline: ${seconds.toFixed(1)} s. A exportação termina junto com a timeline.`); }} />}
      </aside>
    </div>
    <section className="sm-timeline" aria-label="Timeline de quadros"><div className="sm-timeline-toolbar"><div><button aria-label={playing ? 'Pausar animação' : 'Reproduzir animação'} className="sm-play" disabled={!!busy || !project.frames.length || !stageReady || !!stageError} onClick={togglePlay}>{playing ? <Pause size={18} /> : <Play size={18} />}</button><strong>{project.frames.length} quadros</strong><span className="sm-duration">{seconds.toFixed(1)} s</span><label className="sm-fps"><select aria-label="Quadros por segundo" disabled={locked} value={project.fps} onChange={e => commit(p => ({ ...p, fps: Number(e.target.value) }))}>{[1, 2, 4, 6, 8, 10, 12, 15, 24].map(fps => <option key={fps} value={fps}>{fps} fps</option>)}</select></label></div><div><button disabled={locked || !currentFrame || project.frames.length >= MAX_FRAMES} aria-label="Duplicar quadro" onClick={() => { const copied = { ...currentFrame, id: crypto.randomUUID(), scene: cloneScene(currentFrame.scene) }; commit(p => ({ ...p, frames: [...p.frames.slice(0, frameIndex + 1), copied, ...p.frames.slice(frameIndex + 1)] })); setSelectedFrame(copied.id); }}><Copy size={16} /></button><button aria-label="Mover quadro para esquerda" disabled={locked || frameIndex <= 0} onClick={() => commit(p => ({ ...p, frames: moveFrame(p.frames, selectedFrame!, -1) }))}><ArrowLeft size={16} /></button><button aria-label="Mover quadro para direita" disabled={locked || frameIndex < 0 || frameIndex >= project.frames.length - 1} onClick={() => commit(p => ({ ...p, frames: moveFrame(p.frames, selectedFrame!, 1) }))}><ArrowRight size={16} /></button><button aria-label="Excluir quadro" disabled={locked || !currentFrame} onClick={() => { commit(p => ({ ...p, frames: p.frames.filter(f => f.id !== selectedFrame) })); setSelectedFrame(null); }}><Trash2 size={16} /></button>{currentFrame && <label className="sm-hold">Duração<input aria-label="Duração do quadro em intervalos" type="number" min={1} max={24} disabled={locked} value={currentFrame.hold} onChange={e => { const hold = Math.min(24, Math.max(1, Math.round(Number(e.target.value)))); commit(p => ({ ...p, frames: p.frames.map(f => f.id === selectedFrame ? { ...f, hold } : f) })); }} /><span>×</span></label>}</div></div>
      <div className="sm-filmstrip">{project.frames.length ? project.frames.map((frame, index) => <button key={frame.id} disabled={locked} className={`sm-frame ${(playing ? index === playIndex : frame.id === selectedFrame) ? 'active' : ''}`} onClick={() => { commit(p => ({ ...p, scene: cloneScene(frame.scene) })); setSelectedFrame(frame.id); }}><span className="sm-frame-image">{thumbnails[frame.id] ? <img src={thumbnails[frame.id]} alt="" /> : <Film size={24} />}</span><span><strong>{String(index + 1).padStart(2, '0')}</strong><small>{(frame.hold / project.fps).toFixed(2)} s</small></span></button>) : <div className="sm-empty"><Camera size={25} /><div><strong>A primeira pose vira o primeiro quadro.</strong><p>Ajuste o personagem e capture, ou experimente um movimento pronto.</p></div></div>}</div>
      <footer className="sm-export-bar"><span>Quadro a quadro, do seu jeito.<small>Espaço: reproduzir · C: capturar · Ctrl+Z: desfazer</small></span>{busy ? <div role="status" className="sm-export-progress"><progress value={progress} max={1} /><span>{Math.round(progress * 100)}% · {busy === 'webm' ? 'Mantenha esta aba aberta' : 'Preparando GIF'}</span><button onClick={() => abortRef.current?.abort()}>Cancelar</button></div> : <div><button disabled={locked || !stageReady || !!stageError || !project.frames.length} onClick={() => runExport('gif')}><Download size={16} />GIF sem som</button><button className="sm-primary" disabled={locked || !stageReady || !!stageError || !project.frames.length} onClick={() => runExport('webm')}><Film size={16} />Exportar vídeo</button></div>}</footer>
    </section>
  </div>;
}
