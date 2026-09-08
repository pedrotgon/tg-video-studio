import { cloneScene, newActor, newProject, parseProject } from '../src/components/stop-motion/model';

const response = await fetch('http://127.0.0.1:8780/api/v1/projects');
const projects = await response.json();
const id = projects.data.find((p: {name:string;id:string}) => p.name === 'Dindoca')?.id;
if (!id) throw new Error('Crie a Dindoca na API original primeiro.');
const endpoint = `http://127.0.0.1:8780/api/v1/projects/${id}/stop-motion`;
const existing = await (await fetch(endpoint)).json();
if (existing.data?.frames?.length || existing.data?.scene?.actors?.length) {
  console.log('Animação existente preservada.');
} else {
  const project = newProject();
  const bento = newActor('goat'); bento.x=-.75; bento.description='Bento, anfitrião da Dindoca. Bode creme com lenço verde e humor gentil.';
  const dora = newActor('hen'); dora.x=.8; dora.scale=.85; dora.description='Dora, galinha alegre que convida para compartilhar a mesa.';
  project.title='Dindoca — Bento e Dora dão boas-vindas';
  project.client='Dindoca Casa de Fazenda';
  project.brief='Teste de movimento 3D editável. Os mascotes acenam e conversam. Use a referência da cozinha na aba Elementos para a direção visual do filme.';
  project.background='#eee2cd'; project.ratio='9:16';
  project.scene={actors:[bento,dora],camera:{angle:0,elevation:8,zoom:1.45}};
  project.frames=Array.from({length:96},(_,i)=>{
    const scene=cloneScene(project.scene), t=i/8;
    scene.actors[0].pose.rightArm = t<6 ? -115 + Math.sin(t*5)*24 : -8;
    scene.actors[0].pose.head=Math.sin(t*2)*6;
    scene.actors[0].pose.mouth=t<6 ? Math.max(0, Math.sin(t*9)) : 0;
    scene.actors[1].pose.leftArm=t>=6 ? 110 + Math.sin(t*5)*24 : 8;
    scene.actors[1].pose.head=Math.sin(t*2+1)*8;
    scene.actors[1].pose.mouth=t>=6 ? Math.max(0,Math.sin(t*9)) : 0;
    return {id:crypto.randomUUID(),scene,hold:1};
  });
  parseProject(project);
  const saved=await fetch(endpoint,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(project)});
  if(!saved.ok) throw new Error(`Falha ao salvar: ${saved.status}`);
  console.log('Dindoca: 96 quadros, 12 segundos, dois mascotes 3D editáveis.');
}
