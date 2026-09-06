import fs from 'node:fs/promises';
const [project, file] = process.argv.slice(2);
const evidence=JSON.parse(await fs.readFile(file,'utf8'));
const base=`http://127.0.0.1:8780/api/v1/projects/${encodeURIComponent(project)}/profile`;
async function send(url,method,body){const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error(`HTTP ${r.status}: ${await r.text()}`);return r.json();}
const current=await fetch(base).then(r=>r.json());
await send(base,'PUT',{...evidence.profile,version:current.data.profile?.version||0});
for(const post of evidence.posts)await send(`${base}/posts`,'POST',post);
console.log(JSON.stringify({profile:evidence.profile.handle,posts:evidence.posts.length,project}));
