import React, { useState } from 'react';
import { Captions, ChevronRight, Layers3, Loader2, Monitor, Play, Smartphone, Sparkles, Volume2, Zap } from 'lucide-react';
import { GenerationJob, SimpleVideoConfig } from '../types';

interface SimpleVideoTabProps {
  onGenerate: (config: SimpleVideoConfig) => void;
  activeJob: GenerationJob | null;
}

const fieldClass = 'w-full rounded-lg border border-[#dce1e3] bg-white px-3.5 py-2.5 text-sm text-brand-forest outline-none transition placeholder:text-[#819098] focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20';

export const SimpleVideoTab: React.FC<SimpleVideoTabProps> = ({ onGenerate, activeJob }) => {
  const [subject, setSubject] = useState('');
  const [script, setScript] = useState('');
  const [voice, setVoice] = useState('pt-BR-FranciscaNeural');
  const [ratio, setRatio] = useState<'9:16' | '16:9'>('9:16');
  const [subtitleEnabled, setSubtitleEnabled] = useState(true);
  const [isManualScript, setIsManualScript] = useState(false);

  const isGenerating = Boolean(activeJob && !['completed', 'error', 'idle'].includes(activeJob.status));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject.trim()) return;
    onGenerate({
      videoSubject: subject,
      videoScript: isManualScript ? script : undefined,
      keywords: 'home workout, bodyweight exercise, core workout, fitness at home, healthy lifestyle',
      voiceName: voice,
      videoRatio: ratio,
      subtitleEnabled,
      subtitlePosition: 'bottom',
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-gold">
            <Zap className="h-4 w-4" /> MoneyPrinterTurbo
          </div>
          <h1 className="text-[26px] font-bold leading-tight text-brand-forest">Criar vídeo rápido</h1>
          <p className="mt-1 text-sm text-[#5e727c]">Do tema ao vídeo final, com roteiro, voz, imagens e legendas.</p>
        </div>
        <span className="mt-1 rounded-full border border-[#dce1e3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#5e727c]">1 clique</span>
      </div>

      <form onSubmit={submit} className="overflow-hidden rounded-xl border border-[#dce1e3] bg-white shadow-[0_4px_16px_-4px_rgba(3,26,38,.08)]">
        <div className="space-y-5 p-5 lg:p-6">
          <div>
            <label htmlFor="video-subject" className="mb-1.5 block text-xs font-semibold text-brand-forest">Tema ou palavra-chave</label>
            <div className="relative">
              <input id="video-subject" required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ex.: 5 mistérios da Roma Antiga" className={`${fieldClass} pr-10`} />
              <Sparkles className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold" />
            </div>
          </div>

          <div className="rounded-lg border border-[#e4e8ea] bg-[#fafafa]">
            <button type="button" onClick={() => setIsManualScript((value) => !value)} className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left">
              <span className="flex items-center gap-2.5 text-xs font-medium text-brand-forest"><Layers3 className="h-4 w-4 text-[#5e727c]" /> Usar roteiro próprio</span>
              <span className={`relative h-5 w-9 rounded-full transition ${isManualScript ? 'bg-brand-gold' : 'bg-[#cbd3d7]'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${isManualScript ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </button>
            {isManualScript && (
              <div className="border-t border-[#e4e8ea] p-3.5">
                <textarea aria-label="Texto do roteiro" value={script} onChange={(event) => setScript(event.target.value)} rows={4} placeholder="Cole o roteiro que será narrado..." className={`${fieldClass} resize-none`} />
              </div>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="voice" className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-forest"><Volume2 className="h-4 w-4 text-brand-gold" /> Voz da narração</label>
              <select id="voice" value={voice} onChange={(event) => setVoice(event.target.value)} className={fieldClass}>
                <option value="pt-BR-FranciscaNeural">Francisca · natural e clara</option>
                <option value="pt-BR-AntonioNeural">Antônio · confiante</option>
                <option value="pt-BR-ThalitaNeural">Thalita · jovem e dinâmica</option>
                <option value="pt-BR-FabioNeural">Fábio · suave e profundo</option>
              </select>
            </div>
            <fieldset>
              <legend className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-forest"><Monitor className="h-4 w-4 text-brand-gold" /> Formato</legend>
              <div className="grid grid-cols-2 gap-2">
                {([['9:16', Smartphone, 'Vertical'], ['16:9', Monitor, 'Horizontal']] as const).map(([value, Icon, label]) => (
                  <button key={value} type="button" aria-pressed={ratio === value} onClick={() => setRatio(value)} className={`flex h-[42px] items-center justify-center gap-2 rounded-lg border text-xs font-medium transition ${ratio === value ? 'border-brand-gold bg-[#fbf7f1] text-brand-forest ring-1 ring-brand-gold/30' : 'border-[#dce1e3] bg-white text-[#5e727c] hover:border-[#aebbc1]'}`}>
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <label className="flex cursor-pointer items-center justify-between border-t border-[#e4e8ea] pt-4">
            <span className="flex items-center gap-2.5 text-xs font-medium text-brand-forest"><Captions className="h-4 w-4 text-brand-gold" /> Legendas dinâmicas</span>
            <input type="checkbox" checked={subtitleEnabled} onChange={(event) => setSubtitleEnabled(event.target.checked)} className="h-4 w-4 accent-[#031a26]" />
          </label>
        </div>

        <div className="flex items-center justify-between border-t border-[#dce1e3] bg-[#fafafa] px-5 py-3.5 lg:px-6">
          <span className="text-[11px] text-[#6f8088]">Vertical · Francisca · legendas ativas</span>
          <button type="submit" disabled={isGenerating || !subject.trim()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-forest px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-45">
            {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin text-brand-gold" /> Gerando {activeJob?.progress}%</> : <><Play className="h-4 w-4 fill-brand-gold text-brand-gold" /> Gerar vídeo <ChevronRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
    </div>
  );
};
