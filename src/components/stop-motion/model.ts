export const MAX_FRAMES = 240;
export const MAX_ACTORS = 12;
export type ActorKind = 'person' | 'rabbit' | 'cat' | 'cup' | 'goat' | 'hen';
export type Pose = { leftArm: number; rightArm: number; leftLeg: number; rightLeg: number; head: number; mouth: number };
export type Actor = { id: string; kind: ActorKind; name: string; color: string; x: number; z: number; y: number; rotation: number; scale: number; pose: Pose; description: string };
export type Scene = { actors: Actor[]; camera: { angle: number; elevation: number; zoom: number } };
export type Frame = { id: string; scene: Scene; hold: number };
export type Project = { version: 1; title: string; brief: string; client: string; fps: number; ratio: '16:9' | '9:16' | '1:1'; background: string; backdrop: string; audio: string; audioName: string; scene: Scene; frames: Frame[] };
export const neutralPose = (): Pose => ({ leftArm: 8, rightArm: -8, leftLeg: 0, rightLeg: 0, head: 0, mouth: 0 });
export const cloneScene = (scene: Scene): Scene => ({ camera: { ...scene.camera }, actors: scene.actors.map(a => ({ ...a, pose: { ...a.pose } })) });
export const catalog: { kind: ActorKind; name: string; color: string; label: string }[] = [
  { kind: 'goat', name: 'Bento', color: '#e4d1ad', label: 'Bode' },
  { kind: 'hen', name: 'Dora', color: '#e8ad43', label: 'Galinha' },
  { kind: 'person', name: 'Lia', color: '#d78948', label: 'Pessoa' },
  { kind: 'rabbit', name: 'Nino', color: '#efe5d1', label: 'Coelho' },
  { kind: 'cat', name: 'Juca', color: '#d69b60', label: 'Gato' },
  { kind: 'cup', name: 'Café', color: '#54a9a4', label: 'Caneca' },
];
export function newActor(kind: ActorKind, index = 0): Actor {
  const template = catalog.find(c => c.kind === kind)!;
  return { id: crypto.randomUUID(), kind, name: template.name, color: template.color, x: (index % 5 - 2) * .8, z: 0, y: 0, rotation: 0, scale: 1, pose: neutralPose(), description: '' };
}
export function newProject(): Project {
  const rabbit = newActor('rabbit'); rabbit.x = -.85;
  const cup = newActor('cup'); cup.x = 1.05; cup.scale = .85;
  return { version: 1, title: 'Uma pausa para o café', brief: '', client: '', fps: 8, ratio: '16:9', background: '#dfebeb', backdrop: '', audio: '', audioName: '', scene: { actors: [rabbit, cup], camera: { angle: 0, elevation: 12, zoom: 1 } }, frames: [] };
}
export function duration(project: Project): number { return project.frames.reduce((sum, frame) => sum + frame.hold, 0) / project.fps; }
export function frameAtTime(frames: Frame[], fps: number, seconds: number): number {
  let tick = Math.max(0, seconds) * fps;
  for (let i = 0; i < frames.length; i++) { tick -= frames[i].hold; if (tick < 0) return i; }
  return Math.max(0, frames.length - 1);
}
export function moveFrame(frames: Frame[], id: string, direction: -1 | 1): Frame[] {
  const from = frames.findIndex(f => f.id === id), to = from + direction;
  if (from < 0 || to < 0 || to >= frames.length) return frames;
  const result = [...frames]; [result[from], result[to]] = [result[to], result[from]]; return result;
}
export function motionFrames(scene: Scene, actorId: string, motion: 'wave' | 'walk' | 'talk'): Frame[] {
  return Array.from({ length: 12 }, (_, i) => {
    const next = cloneScene(scene), actor = next.actors.find(a => a.id === actorId);
    if (actor) {
      const phase = i / 12 * Math.PI * 2;
      if (motion === 'wave') actor.pose.rightArm = -130 + Math.sin(phase * 2) * 25;
      if (motion === 'walk') { actor.pose.leftLeg = Math.sin(phase) * 28; actor.pose.rightLeg = -Math.sin(phase) * 28; actor.pose.leftArm = -Math.sin(phase) * 25; actor.pose.rightArm = Math.sin(phase) * 25; actor.y = Math.min(3, actor.y + Math.abs(Math.sin(phase)) * .06); }
      if (motion === 'talk') { actor.pose.mouth = i % 3 === 0 ? 0 : .4 + (i % 2) * .5; actor.pose.head = Math.sin(phase) * 8; }
    }
    return { id: crypto.randomUUID(), scene: next, hold: 1 };
  });
}

// Reconstruct known fields instead of trusting imported JSON or device storage.
export function parseProject(value: unknown): Project {
  const obj = (x: unknown): Record<string, unknown> => { if (!x || typeof x !== 'object' || Array.isArray(x)) throw new Error('Projeto inválido.'); return x as Record<string, unknown>; };
  const str = (x: unknown, max: number) => { if (typeof x !== 'string' || x.length > max) throw new Error('Texto ou mídia fora do limite.'); return x; };
  const num = (x: unknown, min: number, max: number) => { if (typeof x !== 'number' || !Number.isFinite(x) || x < min || x > max) throw new Error('Valor numérico inválido no projeto.'); return x; };
  const color = (x: unknown) => { const s = str(x, 7); if (!/^#[0-9a-f]{6}$/i.test(s)) throw new Error('Cor inválida.'); return s; };
  const data = (x: unknown, kind: 'audio' | 'image') => { const s = str(x, kind === 'audio' ? 28_000_000 : 7_000_000); if (s && !(kind === 'audio' ? /^data:audio\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/i : /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i).test(s)) throw new Error('Formato de mídia inválido.'); return s; };
  const scene = (x: unknown): Scene => {
    const s = obj(x), c = obj(s.camera);
    if (!Array.isArray(s.actors) || s.actors.length > MAX_ACTORS) throw new Error('Limite de 12 personagens por palco.');
    const actors = s.actors.map((entry): Actor => {
      const a = obj(entry), p = obj(a.pose);
      if (!catalog.some(t => t.kind === a.kind)) throw new Error('Personagem desconhecido.');
      return { id: str(a.id, 100), kind: a.kind as ActorKind, name: str(a.name, 80), color: color(a.color), x: num(a.x, -4, 4), z: num(a.z, -3, 3), y: num(a.y, 0, 3), rotation: num(a.rotation, -180, 180), scale: num(a.scale, .3, 2), description: str(a.description, 2000), pose: { leftArm: num(p.leftArm, -180, 180), rightArm: num(p.rightArm, -180, 180), leftLeg: num(p.leftLeg, -75, 75), rightLeg: num(p.rightLeg, -75, 75), head: num(p.head, -60, 60), mouth: num(p.mouth, 0, 1) } };
    });
    if (new Set(actors.map(a => a.id)).size !== actors.length) throw new Error('Identificadores de personagens duplicados.');
    return { actors, camera: { angle: num(c.angle, -70, 70), elevation: num(c.elevation, 0, 55), zoom: num(c.zoom, .6, 1.8) } };
  };
  const p = obj(value);
  if (p.version !== 1 || !['16:9', '9:16', '1:1'].includes(String(p.ratio))) throw new Error('Versão ou formato de projeto incompatível.');
  if (!Array.isArray(p.frames) || p.frames.length > MAX_FRAMES) throw new Error('Limite de 240 quadros por projeto.');
  const frames = p.frames.map((entry): Frame => { const f = obj(entry); const hold = num(f.hold, 1, 24); if (!Number.isInteger(hold)) throw new Error('Duração de quadro inválida.'); return { id: str(f.id, 100), scene: scene(f.scene), hold }; });
  if (new Set(frames.map(f => f.id)).size !== frames.length) throw new Error('Identificadores de quadros duplicados.');
  return { version: 1, title: str(p.title, 120), brief: str(p.brief, 4000), client: str(p.client, 160), fps: num(p.fps, 1, 24), ratio: p.ratio as Project['ratio'], background: color(p.background), backdrop: data(p.backdrop, 'image'), audio: data(p.audio, 'audio'), audioName: str(p.audioName, 160), scene: scene(p.scene), frames };
}
