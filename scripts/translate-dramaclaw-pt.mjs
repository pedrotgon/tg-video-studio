import fs from 'node:fs/promises';

const sourcePath = new URL('../engines/dramaclaw/frontend/public/locales/en/translation.json', import.meta.url);
const targetPath = new URL('../engines/dramaclaw/frontend/public/locales/pt/translation.json', import.meta.url);
const checkpointPath = new URL('../.runtime/dramaclaw-pt-checkpoint.json', import.meta.url);
const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'));

const strings = [];
function collect(value) {
  if (typeof value === 'string') strings.push(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object') Object.values(value).forEach(collect);
}
collect(source);
const unique = [...new Set(strings)];
const translated = new Map();
try {
  const checkpoint = JSON.parse(await fs.readFile(checkpointPath, 'utf8'));
  Object.entries(checkpoint).forEach(([original, value]) => translated.set(original, String(value)));
} catch {}

const chunks = [];
const pending = unique.filter((value) => !translated.has(value));
for (let index = 0; index < pending.length; index += 140) chunks.push(pending.slice(index, index + 140));
let saveChain = Promise.resolve();

function saveCheckpoint() {
  saveChain = saveChain.then(() => fs.writeFile(checkpointPath, JSON.stringify(Object.fromEntries(translated))));
  return saveChain;
}

async function translateChunk(chunk, chunkIndex) {
  const input = Object.fromEntries(chunk.map((value, index) => [String(index), value]));
  const prompt = `Traduza os valores deste JSON de inglês para português brasileiro natural e conciso para uma interface profissional de produção audiovisual. Preserve exatamente placeholders como {{name}}, tags, atalhos, URLs, nomes de modelos, extensões e códigos. Não altere as chaves numéricas. Responda somente com um objeto JSON válido com todas as chaves.\n${JSON.stringify(input)}`;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gemma3:4b', prompt, stream: false, format: 'json', options: { temperature: 0, num_ctx: 16384 } }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.json();
      const output = JSON.parse(body.response);
      if (Object.keys(output).length !== chunk.length) throw new Error(`esperado ${chunk.length}, recebido ${Object.keys(output).length}`);
      chunk.forEach((original, index) => translated.set(original, String(output[String(index)] ?? original)));
      await saveCheckpoint();
      process.stdout.write(`lote ${chunkIndex + 1}/${chunks.length} traduzido\n`);
      return;
    } catch (error) {
      if (attempt === 3) {
        process.stderr.write(`lote ${chunkIndex + 1} manteve fallback em inglês: ${error}\n`);
        chunk.forEach((original) => translated.set(original, original));
        await saveCheckpoint();
        return;
      }
    }
  }
}

let next = 0;
async function worker() {
  while (next < chunks.length) {
    const index = next++;
    await translateChunk(chunks[index], index);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);

function rebuild(value) {
  if (typeof value === 'string') return translated.get(value) ?? value;
  if (Array.isArray(value)) return value.map(rebuild);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, rebuild(child)]));
  return value;
}

await fs.mkdir(new URL('../engines/dramaclaw/frontend/public/locales/pt/', import.meta.url), { recursive: true });
await fs.writeFile(targetPath, `${JSON.stringify(rebuild(source), null, 2)}\n`);
process.stdout.write(`pt-BR concluído: ${unique.length} textos, ${chunks.length} lotes\n`);
