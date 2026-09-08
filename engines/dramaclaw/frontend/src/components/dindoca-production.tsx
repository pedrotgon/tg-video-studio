import { useState } from "react";
import type { ProjectConfig } from "@/types/project";

export function DindocaProduction({project, config, onSettings}: {project:string; config:ProjectConfig; onSettings:()=>void}) {
  const [editor, setEditor] = useState(false);
  const [film, setFilm] = useState<'concept'|'motion'>('motion');
  const base = `/criativo/projects/${encodeURIComponent(project)}`;
  return <div className="h-full overflow-auto bg-[#f5f0e7] text-[#19382b]">
    <div className="mx-auto max-w-6xl p-5 lg:p-10">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
        <a href="/criativo/" className="text-sm underline underline-offset-4">← Todos os projetos</a>
        <span className="rounded-full border border-[#c5a880] px-3 py-1 text-xs">CRIATIVO / DINDOCA</span>
      </div>
      <div className="grid gap-6 sm:grid-cols-[1.15fr_0.85fr]">
        <section>
          <p className="mb-4 text-xs font-semibold tracking-[0.22em]">CASA DE FAZENDA · DESDE 2016</p>
          <h1 className="max-w-xl font-serif text-4xl leading-[1.05] lg:text-6xl">Tem sabor que<br/>abraça a gente.</h1>
          <p className="my-5 max-w-lg text-base leading-relaxed opacity-80">O universo criativo da Dindoca: uma casa acolhedora, dois anfitriões curiosos e os sabores do interior no centro da mesa.</p>
          <div className="my-6 flex flex-wrap gap-2">
            <a className="rounded-lg bg-[#19382b] px-5 py-3 text-sm font-semibold text-white" href="/dindoca/bento-e-dora-3d.mp4" download>Baixar animação 3D</a>
            <a className="rounded-lg border border-[#19382b]/30 px-5 py-3 text-sm" href={`${base}/episodes`}>Abrir esteira de produção →</a>
          </div>
          <div className="grid grid-cols-3 gap-3 border-y border-[#19382b]/15 py-5 text-sm">
            <div><strong className="block text-2xl">02</strong>Mascotes</div><div><strong className="block text-2xl">03</strong>Planos de criativos</div><div><strong className="block text-2xl">18s</strong>Filme conceito</div>
          </div>
          <div className="mt-6 rounded-xl bg-white/70 p-5">
            <p className="text-xs font-semibold tracking-widest">PRIMEIRO FILME · SUA MESA MERECE CARINHO</p>
            <p className="mt-3 font-serif text-xl leading-relaxed">“{config.campaign?.own_script}”</p>
            <p className="mt-3 text-xs opacity-70">Narração em português, legendas e movimento de câmera. Arte conceitual com estética de massinha; os mascotes ainda não têm animação corporal neste filme.</p>
          </div>
        </section>
        <section className="mx-auto w-full max-w-[340px]">
          <div className="mb-3 flex gap-2 text-xs"><button className={`rounded-full border border-[#19382b]/20 px-3 py-2 ${film==='concept'?'bg-[#19382b] text-white':''}`} aria-pressed={film==='concept'} onClick={()=>setFilm('concept')}>Filme narrado</button><button className={`rounded-full border border-[#19382b]/20 px-3 py-2 ${film==='motion'?'bg-[#19382b] text-white':''}`} aria-pressed={film==='motion'} onClick={()=>setFilm('motion')}>Animação 3D</button></div>
          <video key={film} controls playsInline preload="metadata" poster={film==='concept'?'/dindoca/casa-de-fazenda.png':undefined} className="aspect-[9/16] w-full rounded-2xl bg-[#19382b] shadow-xl" src={film==='concept'?'/dindoca/dindoca-filme-conceito.mp4':'/dindoca/bento-e-dora-3d.mp4'}>{film==='concept'&&<track kind="captions" src="/dindoca/legendas.vtt" srcLang="pt-BR" label="Português"/>}</video>
          <p className="mt-2 text-center text-xs opacity-60">{film==='concept'?'Conceito visual • Produtos ilustrados com IA':'Teste de movimento • 12s • Sem narração'}</p>
        </section>
      </div>
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[['Bento · o anfitrião','Bode de argila creme, lenço verde e humor gentil. Apresenta os sabores da casa.'],['Dora · a companhia da mesa','Galinha amarelo mel, curiosa e alegre. Convida a família para experimentar.'],['Cozinha da fazenda','Madeira, janela verde, cerâmica e luz da manhã. Queijo coalho, goiabada e farinha em destaque.']].map(([title,copy])=><article key={title} className="rounded-xl border border-[#19382b]/15 p-5"><h2 className="font-serif text-xl">{title}</h2><p className="mt-3 text-sm leading-relaxed opacity-75">{copy}</p></article>)}
      </section>
      <div className="my-6 flex flex-wrap gap-4 text-sm underline underline-offset-4"><a href={`${base}/characters`}>Personagens e cenários</a><a href={`${base}/freezone`}>Abrir ambiente criativo</a><button onClick={()=>setEditor(!editor)}>{editor?'Fechar editor de stop motion':'Abrir editor de stop motion'}</button><button onClick={onSettings}>Configurações e briefing completo</button></div>
      {editor && <iframe title="Editor de stop motion do projeto Dindoca" src={`/?motionProject=${encodeURIComponent(project)}&embedded=1#animation`} className="h-[850px] w-full rounded-xl border border-[#19382b]/20"/>}
      <section className="mt-8 rounded-xl bg-[#19382b] p-6 text-[#f5f0e7]"><h2 className="font-serif text-2xl">Qualidade, diferenciação e atendimento.</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed">Patrícia Regis Teixeira · Administradora. Para famílias, senhoras e quem gosta de comer bem. Missão: superar as expectativas do cliente. Próximo passo da campanha: validar produtos, canal de pedidos e condições reais antes da publicação.</p>
        <details className="mt-5 border-t border-white/20 pt-4"><summary className="cursor-pointer text-sm font-semibold">Briefing da empresa e catálogo completo</summary><div className="mt-4 grid gap-5 text-sm leading-relaxed md:grid-cols-2"><div><h3 className="font-semibold">Produtos informados</h3><p className="mt-2">{config.campaign?.business_brief?.products}</p></div><div><h3 className="font-semibold">Objetivos e oportunidades</h3><p className="mt-2">{config.campaign?.objective}</p><p className="mt-2">A desenvolver: {config.campaign?.business_brief?.improvements}.</p><p className="mt-2">Visão de longo prazo: {config.campaign?.business_brief?.vision}.</p><p className="mt-2">Concorrentes: {config.campaign?.business_brief?.competitors}. Equipe: {config.campaign?.business_brief?.employees} pessoa.</p></div></div></details>
      </section>
    </div>
  </div>;
}
