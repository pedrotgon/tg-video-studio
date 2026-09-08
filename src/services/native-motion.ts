import { newProject, parseProject } from '../components/stop-motion/model';
import type { ProjectStorage } from './tg-projects';

export function nativeMotionStorage(id: string): ProjectStorage {
  const path = `/api/v1/projects/${encodeURIComponent(id)}/stop-motion`;
  return {
    async load() {
      const response = await fetch(path);
      if (!response.ok) throw new Error('Não foi possível abrir a animação deste projeto.');
      const result = await response.json();
      if (result.data) return parseProject(result.data);
      const project = newProject();
      project.title = 'Dindoca — Sua mesa merece carinho';
      project.client = 'Dindoca Casa de Fazenda';
      project.brief = 'Mascotes Bento e Dora. Sabores do interior, qualidade e acolhimento. Filme conceito da Dindoca.';
      project.ratio = '9:16';
      project.scene.actors = [];
      const image = await fetch('/dindoca/casa-de-fazenda.png');
      if (!image.ok) throw new Error('Não foi possível carregar o cenário.');
      project.backdrop = await new Promise<string>((resolve,reject) => { const reader = new FileReader(); reader.onload=()=>resolve(String(reader.result)); reader.onerror=reject; image.blob().then(blob=>reader.readAsDataURL(blob)).catch(reject); });
      return project;
    },
    async save(project) {
      const response = await fetch(path, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(project)});
      if (!response.ok) throw new Error('Não foi possível salvar no projeto. Baixe uma cópia e tente novamente.');
    },
  };
}
