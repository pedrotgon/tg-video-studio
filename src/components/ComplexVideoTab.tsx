import React, { useState } from 'react';
import { ChevronRight, Clapperboard, Loader2, Play, Sparkles } from 'lucide-react';
import { ComplexVideoConfig, GenerationJob } from '../types';

interface Props { onGenerate: (config: ComplexVideoConfig) => void; activeJob: GenerationJob | null; }

const fieldClass = 'w-full rounded-lg border border-[#dce1e3] bg-white px-3.5 py-2.5 text-sm text-brand-forest outline-none transition placeholder:text-[#819098] focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20';

export const ComplexVideoTab: React.FC<Props> = ({ onGenerate, activeJob }) => {
  const [title, setTitle] = useState('');
  const [premise, setPremise] = useState('');
  const [genre, setGenre] = useState<ComplexVideoConfig['genre']>('documentary');
  const generating = Boolean(activeJob && !['completed', 'error', 'idle'].includes(activeJob.status));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !premise.trim()) return;
    onGenerate({ title, storyPremise: premise, genre, characters: [], scenes: [] });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-gold"><Clapperboard className="h-4 w-4" /> TG Criatividade</div>
          <h1 className="text-[26px] font-bold leading-tight text-brand-forest">Criar produção</h1>
          <p className="mt-1 text-sm text-[#5e727c]">Da ideia à montagem: roteiro, personagens, cenas, vozes e direção visual em um só estúdio.</p>
        </div>
        <span className="mt-1 rounded-full border border-[#dce1e3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5e727c]">Produção completa</span>
      </div>

      <form onSubmit={submit} className="overflow-hidden rounded-xl border border-[#dce1e3] bg-white shadow-[0_4px_16px_-4px_rgba(3,26,38,.08)]">
        <div className="space-y-5 p-5 lg:p-6">
          <div>
            <label htmlFor="project-title" className="mb-1.5 block text-xs font-semibold">Título da produção</label>
            <input id="project-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: O último contrato" className={fieldClass} />
          </div>
          <div>
            <label htmlFor="project-premise" className="mb-1.5 block text-xs font-semibold">Premissa</label>
            <textarea id="project-premise" value={premise} onChange={(event) => setPremise(event.target.value)} rows={7} placeholder="Quem vive essa história, o que está em jogo e como ela deve terminar?" className={`${fieldClass} resize-none`} />
          </div>
          <div>
            <label htmlFor="project-tone" className="mb-1.5 block text-xs font-semibold">Tom</label>
            <select id="project-tone" value={genre} onChange={(event) => setGenre(event.target.value as ComplexVideoConfig['genre'])} className={fieldClass}>
              <option value="documentary">Documentário e mistério</option>
              <option value="drama">Ficção e drama</option>
              <option value="commercial">Institucional e marca</option>
              <option value="short_story">Crônica e storytelling</option>
              <option value="game_story">Cinemática e cultura pop</option>
            </select>
          </div>
          <div className="flex items-start gap-2.5 rounded-lg border border-[#eadcc9] bg-[#fbf7f1] p-3 text-xs leading-relaxed text-[#725a39]">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" /> O projeto será criado no estúdio TG Criatividade. Depois, você poderá dirigir cada etapa com mais controle.
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[#dce1e3] bg-[#fafafa] px-5 py-3.5 lg:px-6">
          <span className="text-[11px] text-[#6f8088]">Roteiro · cenas · voz · estilo · montagem</span>
          <button type="submit" disabled={generating || !title.trim() || !premise.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-forest px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-45">
            {generating ? <><Loader2 className="h-4 w-4 animate-spin text-brand-gold" /> Criando projeto</> : <><Play className="h-4 w-4 fill-brand-gold text-brand-gold" /> Começar produção <ChevronRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
    </div>
  );
};
