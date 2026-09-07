import { Project, duration, frameAtTime } from './model';
import { Stage } from './stage';
export function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export function filename(title: string): string { return title.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 80) || 'stop-motion'; }
export async function exportGif(project: Project, progress: (value: number) => void, signal: AbortSignal): Promise<Blob> {
  if (!project.frames.length) throw new Error('Capture pelo menos um quadro.');
  const stage = new Stage(), worker = new Worker(new URL('./gif.worker.ts', import.meta.url), { type: 'module' });
  const exchange = (message: unknown, transfer: Transferable[] = []) => new Promise<{ bytes?: Uint8Array<ArrayBuffer> }>((resolve, reject) => {
    const cleanup = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); worker.onmessage = null; worker.onerror = null; };
    const abort = () => { cleanup(); reject(new Error('Exportação cancelada.')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('A exportação excedeu o tempo de espera.')); }, 60_000);
    worker.onmessage = event => { cleanup(); if (event.data.type === 'error') reject(new Error(event.data.error)); else resolve(event.data); };
    worker.onerror = () => { cleanup(); reject(new Error('Não foi possível codificar o GIF.')); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else worker.postMessage(message, transfer);
  });
  try {
    await stage.setBackdrop(project.backdrop);
    for (let i = 0; i < project.frames.length; i++) {
      signal.throwIfAborted(); const frame = project.frames[i];
      const canvas = stage.render(frame.scene, project, undefined, undefined, project.ratio === '9:16' ? 360 : 640);
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
      await exchange({ type: 'frame', pixels, width: canvas.width, height: canvas.height, delay: Math.max(20, Math.round(frame.hold / project.fps * 100) * 10) }, [pixels.buffer]);
      progress((i + 1) / project.frames.length);
    }
    const result = await exchange({ type: 'finish' }); return new Blob([result.bytes!], { type: 'image/gif' });
  } finally { worker.terminate(); stage.dispose(); }
}
export async function exportVideo(project: Project, progress: (value: number) => void, signal: AbortSignal): Promise<Blob> {
  const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(type => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type));
  if (!mimeType) throw new Error('Este navegador não exporta WebM. Use Chrome ou Edge, ou exporte GIF.');
  if (!project.frames.length) throw new Error('Capture pelo menos um quadro.');
  const audioContext = project.audio ? new AudioContext() : null;
  let stage: Stage | undefined, stream: MediaStream | undefined, source: AudioBufferSourceNode | undefined;
  let recorder: MediaRecorder | undefined;
  let timer = 0;
  try {
    if (audioContext) await audioContext.resume();
    stage = new Stage(); await stage.setBackdrop(project.backdrop);
    const canvas = stage.render(project.frames[0].scene, project, undefined, undefined, project.ratio === '9:16' ? 540 : 960);
    stream = canvas.captureStream(30);
    if (audioContext) {
      const bytes = await (await fetch(project.audio)).arrayBuffer();
      const buffer = await audioContext.decodeAudioData(bytes); const destination = audioContext.createMediaStreamDestination();
      source = audioContext.createBufferSource(); source.buffer = buffer; source.connect(destination);
      destination.stream.getAudioTracks().forEach(track => stream!.addTrack(track));
    }
    signal.throwIfAborted();
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
    const chunks: Blob[] = [];
    const total = duration(project);
    return await new Promise<Blob>((resolve, reject) => {
      const stop = () => { if (recorder?.state !== 'inactive') recorder?.stop(); };
      const abort = () => { stop(); };
      recorder!.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder!.onerror = () => { signal.removeEventListener('abort', abort); reject(new Error('Falha ao gravar o vídeo.')); };
      recorder!.onstop = () => { signal.removeEventListener('abort', abort); if (signal.aborted) reject(new Error('Exportação cancelada.')); else resolve(new Blob(chunks, { type: mimeType })); };
      signal.addEventListener('abort', abort, { once: true });
      let last = 0; const started = performance.now();
      recorder!.start(250); source?.start();
      const tick = () => {
        if (signal.aborted) return;
        const seconds = (performance.now() - started) / 1000;
        if (seconds >= total) { stop(); return; }
        const index = frameAtTime(project.frames, project.fps, seconds);
        if (index !== last) { stage!.render(project.frames[index].scene, project, undefined, undefined, canvas.width); last = index; }
        progress(seconds / total); timer = window.setTimeout(tick, 10);
      };
      tick();
    });
  } finally {
    clearTimeout(timer);
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    try { source?.stop(); } catch { /* already stopped */ }
    stream?.getTracks().forEach(track => track.stop()); stage?.dispose(); await audioContext?.close();
  }
}
