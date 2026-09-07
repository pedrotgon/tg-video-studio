import { GIFEncoder, quantize, applyPalette } from 'gifenc';
let encoder = GIFEncoder();
self.onmessage = (event: MessageEvent<{ type: string; pixels: Uint8ClampedArray; width: number; height: number; delay: number }>) => {
  try {
    const { type, pixels, width, height, delay } = event.data;
    if (type === 'finish') { encoder.finish(); const bytes = encoder.bytes(); self.postMessage({ type: 'done', bytes }, { transfer: [bytes.buffer] }); encoder = GIFEncoder(); return; }
    const palette = quantize(pixels, 256);
    encoder.writeFrame(applyPalette(pixels, palette), width, height, { palette, delay, repeat: 0 });
    self.postMessage({ type: 'ready' });
  } catch (error) { self.postMessage({ type: 'error', error: error instanceof Error ? error.message : 'Falha ao codificar GIF.' }); }
};
