import React, { useEffect, useState } from 'react';
import { AlertCircle, Download, ExternalLink, Film, Play, RefreshCw } from 'lucide-react';
import { GenerationJob } from '../types';

interface Props { job: GenerationJob | null; onReset: () => void; }

export const VideoPlayerPreview: React.FC<Props> = ({ job, onReset }) => {
  const rawVideoUrl = job?.videoUrl?.trim();
  const videoUrl = job?.type === 'simple' ? rawVideoUrl?.replace(/\/combined-(\d+)\.mp4$/, '/final-$1.mp4') : rawVideoUrl;
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => setMediaError(false), [job?.id, videoUrl]);

  const isFinished = job?.status === 'completed';
  const hasVideo = Boolean(videoUrl && videoUrl !== '#');
  const hasStudio = Boolean(job?.studioUrl);
  const isError = job?.status === 'error' || Boolean(isFinished && (!hasVideo || mediaError) && !hasStudio);

  return (
    <section className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-xl border border-[#dce1e3] bg-white shadow-[0_4px_16px_-4px_rgba(3,26,38,.08)]" aria-label="Pré-visualização do vídeo">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e4e8ea] px-4">
        <div className="flex items-center gap-2.5">
          <Film className="h-4 w-4 text-brand-gold" />
          <div><h2 className="text-xs font-semibold text-brand-forest">Pré-visualização</h2><p className="text-[10px] text-[#72828a]">{job ? job.title : 'Aguardando produção'}</p></div>
        </div>
        {job && <button type="button" onClick={onReset} className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-[#5e727c] hover:bg-[#f1f3f4] hover:text-brand-forest"><RefreshCw className="h-3.5 w-3.5" /> Novo</button>}
      </header>

      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-[#071117]">
        {!job ? (
          <div className="max-w-[250px] px-6 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[.04]"><Play className="ml-0.5 h-5 w-5 text-brand-gold" /></div>
            <p className="text-xs font-medium text-white">Seu vídeo aparecerá aqui</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/45">Preencha os dados e inicie a produção.</p>
          </div>
        ) : isFinished && hasStudio ? (
          <div className="max-w-[280px] px-6 text-center text-white">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-brand-gold/30 bg-brand-gold/10"><ExternalLink className="h-5 w-5 text-brand-gold" /></div>
            <p className="text-sm font-semibold">Projeto criado</p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/50">A produção está dentro do TG Video Studio. Continue no estúdio para roteiro, personagens, cenas e montagem.</p>
            <a href={job.studioUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-brand-gold px-3.5 text-xs font-semibold text-white">Abrir projeto <ExternalLink className="h-3.5 w-3.5" /></a>
          </div>
        ) : isFinished && hasVideo && !mediaError ? (
          <video src={videoUrl} controls autoPlay loop playsInline preload="auto" onError={() => setMediaError(true)} className="h-full w-full object-contain" />
        ) : job.status === 'error' || (isFinished && (!hasVideo || mediaError)) ? (
          <div className="max-w-[280px] px-6 text-center text-[#ff8d8d]"><AlertCircle className="mx-auto mb-3 h-8 w-8" /><p className="text-xs font-semibold">Não foi possível abrir o vídeo</p><p className="mt-1 text-[11px] text-white/45">{job.error || 'O motor não retornou um MP4 válido.'}</p></div>
        ) : (
          <div className="w-full max-w-[260px] px-6 text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-brand-gold" />
            <p className="mt-3 text-xs font-medium text-white">{job.currentStepMessage}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand-gold transition-all duration-500" style={{ width: `${job.progress}%` }} /></div>
            <p className="mt-2 text-[10px] tabular-nums text-white/45">{job.progress}% concluído</p>
          </div>
        )}
      </div>

      <footer className="flex h-12 shrink-0 items-center justify-between border-t border-[#e4e8ea] px-4">
        <div className="flex items-center gap-2 text-[11px] text-[#667981]"><span className={`h-2 w-2 rounded-full ${isError ? 'bg-[#d64545]' : isFinished ? 'bg-[#22a06b]' : job ? 'bg-brand-gold' : 'bg-[#aebbc1]'}`} /> {isError ? 'Falha na geração' : isFinished ? (hasStudio ? 'Projeto disponível' : 'Vídeo concluído') : job ? 'Produção em andamento' : 'Pronto para gerar'}</div>
        {isFinished && hasVideo && !mediaError && !hasStudio && <a href={videoUrl} download={`video-${job.id}.mp4`} className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-forest px-3 text-[11px] font-semibold text-white hover:bg-brand-light"><Download className="h-3.5 w-3.5 text-brand-gold" /> Baixar .MP4</a>}
      </footer>
    </section>
  );
};
