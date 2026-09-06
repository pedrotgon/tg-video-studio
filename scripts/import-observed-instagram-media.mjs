// Downloads only the two explicitly selected assets from a browser observation.
// No cookies are read. Signed CDN URLs remain in ignored local artifacts.
import fs from 'node:fs/promises';
import path from 'node:path';
const [manifestPath, videoId, audioId, destination] = process.argv.slice(2);
if (!manifestPath || !videoId || !audioId || !destination) throw Error('Usage: manifest videoId audioId destination');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
await fs.mkdir(destination, {recursive:true});
for (const [id, name] of [[videoId,'video.mp4'],[audioId,'audio.m4a']]) {
  const asset = [...(manifest.assets||[]),...(manifest.failures||[])].find(a=>a.id===id);
  if (!asset) throw Error('Asset not observed');
  const url = new URL(asset.url);
  if (url.protocol!=='https:' || !url.hostname.endsWith('.fbcdn.net')) throw Error('Unexpected media host');
  url.searchParams.delete('bytestart');url.searchParams.delete('byteend');
  const response = await fetch(url, {signal:AbortSignal.timeout(60000),redirect:'error'});
  if (!response.ok) throw Error(`Media HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || !response.headers.get('content-type')?.includes('video/mp4')) throw Error('Invalid media response');
  await fs.writeFile(path.join(destination,name),bytes,{mode:0o600});
  console.log(JSON.stringify({name,status:response.status,mime:response.headers.get('content-type'),bytes:bytes.length}));
}
