import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Captions, Check, ChevronDown, ChevronRight, FileCheck2,
  Loader2, Monitor, Play, Smartphone, Sparkles, Volume2,
} from 'lucide-react';
import { CopyQualifierQuestion, GenerationJob, SimpleCopy, SimpleVideoConfig, VerifiedMemoryReference } from '../types';
import { generateSimpleCopies, qualifySimpleCopy } from '../services/api';
import { ProductionStepper } from './ui/production-stepper';

interface Props {
  onGenerate: (config: SimpleVideoConfig) => void;
  activeJob: GenerationJob | null;
  onStepChange?: (step: number) => void;
}

const PROFILE_PROJECT_ID = '01M1SAXW27GVCP7QF6EYY7PSQN';
const steps = ['Copy', 'Roteiro', 'Tom e voz', 'Revisão', 'Vídeo'];
const field = 'w-full rounded-lg border border-[#dce1e3] bg-white px-3.5 py-2.5 text-sm text-brand-forest outline-none transition placeholder:text-[#819098] focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20';

export const SimpleVideoTab: React.FC<Props> = ({ onGenerate, activeJob, onStepChange }) => {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState('');
  const [copies, setCopies] = useState<SimpleCopy[]>([]);
  const [questions, setQuestions] = useState<CopyQualifierQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [copyPhase, setCopyPhase] = useState<'input' | 'qualify' | 'summary' | 'results'>('input');
  const [selectedCopy, setSelectedCopy] = useState<SimpleCopy | null>(null);
  const [memory, setMemory] = useState<VerifiedMemoryReference | null>(null);
  const [tone, setTone] = useState<NonNullable<SimpleVideoConfig['tone']>>('direto');
  const [voice, setVoice] = useState('pt-BR-FranciscaNeural');
  const [ratio, setRatio] = useState<'9:16' | '16:9'>('9:16');
  const [subtitles, setSubtitles] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [model, setModel] = useState('');
  const isGenerating = Boolean(activeJob && !['completed', 'error', 'idle'].includes(activeJob.status));

  const go = (next: number) => {
    setStep(next);
    onStepChange?.(next);
  };
  useEffect(() => { if (activeJob) go(5); }, [activeJob?.id]);

  const resetQualification = () => {
    setQuestions([]);
    setAnswers({});
    setQuestionIndex(0);
    setCopyPhase('input');
    setCopies([]);
    setMemory(null);
    setSelectedCopy(null);
    setModel('');
    setMessage('');
  };

  const startQualification = async () => {
    if (!query.trim() || busy) return;
    setBusy(true); setError(''); setMessage(''); setCopies([]); setMemory(null);
    try {
      setMessage('Lendo a Memória e preparando o direcionamento…');
      const result = await qualifySimpleCopy(query.trim(), PROFILE_PROJECT_ID);
      setQuestions(result.questions);
      setModel(result.model || '');
      setQuestionIndex(0);
      setAnswers({});
      setMemory(result.memory);
      setCopyPhase('qualify');
      setMessage('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível preparar as perguntas.');
    } finally {
      setBusy(false);
    }
  };

  const createCopies = async () => {
    if (!query.trim() || busy || questions.some((question) => !answers[question.id])) return;
    setBusy(true); setError(''); setMessage(''); setCopies([]);
    try {
      const confirmedDirection = Object.fromEntries(
        questions.map((question) => [question.question, answerLabel(question)]),
      );
      const result = await generateSimpleCopies(query.trim(), PROFILE_PROJECT_ID, confirmedDirection, setMessage);
      setCopies(result.copies);
      setModel(result.copies[0]?.model || model);
      setMemory(result.memory || memory);
      setCopyPhase('results');
      setMessage('10 copies prontas para análise.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar as copies.');
    } finally {
      setBusy(false);
    }
  };

  const answerQuestion = (question: CopyQualifierQuestion, optionId: string) => {
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    if (questionIndex < questions.length - 1) setQuestionIndex((current) => current + 1);
    else setCopyPhase('summary');
  };

  const answerLabel = (question: CopyQualifierQuestion) =>
    question.options.find((option) => option.id === answers[question.id])?.label || '';

  const chooseCopy = (item: SimpleCopy) => {
    setSelectedCopy(item);
    go(2);
  };
  const production = (): SimpleVideoConfig => ({
    videoSubject: selectedCopy?.title || query,
    videoScript: selectedCopy?.text,
    tone,
    keywords: 'home workout, bodyweight exercise, core workout, fitness at home, healthy lifestyle',
    voiceName: voice,
    videoRatio: ratio,
    subtitleEnabled: subtitles,
    subtitlePosition: 'bottom',
  });
  const canVisit = (number: number) => number === 1 || Boolean(selectedCopy);

  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="pt-1">
      <h1 className="text-[24px] font-bold leading-tight text-brand-forest">Esteira de criação de conteúdo</h1>
      <p className="mt-1 text-sm text-[#5e727c]">Escolha uma copy e transforme em vídeo.</p>
    </div>

    <ProductionStepper steps={steps} current={step} disabled={busy || isGenerating} canVisit={canVisit} onChange={go} />
    {model && <p className="text-xs text-[#66736b]">{model === 'gemini-3.7-flash' ? 'Gemini 3.7 Flash · High' : `Modelo alternativo: ${model}`}</p>}

    {step === 1 && <section className="rounded-xl border border-[#dce1e3] bg-white p-5 shadow-[0_4px_16px_-4px_rgba(3,26,38,.08)] lg:p-6">
      <div className="mb-4"><h2 className="text-base font-semibold text-brand-forest">Gerar copies</h2><p className="mt-0.5 text-xs text-[#6f8088]">Digite um tema ou um alias da Memória, como AD 98.</p></div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,3fr)_minmax(150px,1fr)]">
        <input value={query} onChange={(event) => { setQuery(event.target.value); setError(''); resetQualification(); }} onKeyDown={(event) => { if (event.key === 'Enter') startQualification(); }} placeholder="Tema ou referência: AD 98" aria-label="Tema ou referência da memória" className={field} />
        <button type="button" onClick={startQualification} disabled={!query.trim() || busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-forest px-4 text-xs font-semibold text-white disabled:opacity-45">{busy && copyPhase === 'input' ? <Loader2 className="h-4 w-4 animate-spin text-brand-gold" /> : <Sparkles className="h-4 w-4 text-brand-gold" />}{busy && copyPhase === 'input' ? 'Pensando…' : 'Continuar'}</button>
      </div>
      {(message || error) && <p role={error ? 'alert' : 'status'} className={`mt-3 rounded-md border px-3 py-2 text-xs ${error ? 'border-[#edc7c1] bg-[#fff6f4] text-[#9d3d30]' : 'border-[#dce1e3] bg-[#fafafa] text-[#5e727c]'}`}>{error || message}</p>}
      {memory && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#c9dfd2] bg-[#f5fbf7] px-3 py-2 text-xs text-[#256a45]"><span><strong>{memory.alias}</strong> confirmado pelo post {memory.post_id}.</span><a href={memory.source_url} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">Ver fonte</a></div>}
      {copyPhase === 'qualify' && questions[questionIndex] && <div className="mt-5 rounded-xl border border-[#e4e8ea] bg-[#fafafa] p-4" aria-live="polite">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-gold">Direção {questionIndex + 1}/{questions.length}</span>
          <div className="flex gap-1" aria-hidden="true">{questions.map((question, index) => <span key={question.id} className={`h-1.5 w-5 rounded-full ${index <= questionIndex ? 'bg-brand-gold' : 'bg-[#dce1e3]'}`} />)}</div>
        </div>
        <h3 className="text-base font-semibold text-brand-forest">{questions[questionIndex].question}</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={questions[questionIndex].question}>
          {questions[questionIndex].options.map((option) => {
            const selected = answers[questions[questionIndex].id] === option.id;
            return <button key={option.id} type="button" role="radio" aria-checked={selected} onClick={() => answerQuestion(questions[questionIndex], option.id)} className={`group flex min-h-14 items-center justify-between rounded-xl border px-3.5 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 ${selected ? 'border-brand-gold bg-[#fbf7f1] text-brand-forest shadow-[0_4px_12px_-6px_rgba(3,26,38,.2)]' : 'border-[#dce1e3] bg-white text-[#43565f] hover:border-[#c5a880]'}`}><span>{option.label}</span><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${selected ? 'border-brand-gold bg-brand-gold text-white' : 'border-[#c9d0d3] bg-white'}`}>{selected && <Check className="h-2.5 w-2.5" />}</span></button>;
          })}
        </div>
        {questionIndex > 0 && <button type="button" onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#6f8088]"><ArrowLeft className="h-3 w-3" /> Voltar</button>}
      </div>}
      {copyPhase === 'summary' && <div className="mt-5 rounded-xl border border-[#c9dfd2] bg-[#f5fbf7] p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2b8a5b]">Direção pronta</p><h3 className="mt-0.5 text-sm font-semibold text-brand-forest">Revise antes de gerar</h3></div><button type="button" onClick={() => { setQuestionIndex(0); setCopyPhase('qualify'); }} className="text-[11px] font-semibold text-[#5e727c] underline underline-offset-2">Editar</button></div>
        <div className="mt-3 flex flex-wrap gap-1.5">{questions.map((question) => <span key={question.id} className="rounded-full border border-[#d6e5dc] bg-white px-2.5 py-1 text-[10px] text-brand-forest"><strong>{question.question}</strong> {answerLabel(question)}</span>)}</div>
        <button type="button" onClick={createCopies} disabled={busy} className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-forest px-4 text-xs font-semibold text-white disabled:opacity-45">{busy ? <Loader2 className="h-4 w-4 animate-spin text-brand-gold" /> : <Sparkles className="h-4 w-4 text-brand-gold" />}{busy ? 'Gerando…' : 'Gerar 10 copies'}</button>
      </div>}
      {copies.length > 0 && <div className="mt-5 grid gap-3 md:grid-cols-2">
        {copies.map((item, index) => <article key={item.id} className="rounded-lg border border-[#e4e8ea] bg-[#fafafa] p-3.5">
          <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] font-semibold uppercase tracking-wide text-brand-gold">Copy {String(index + 1).padStart(2, '0')}</span><h3 className="mt-0.5 text-sm font-semibold leading-snug text-brand-forest">{item.title}</h3>{item.angle && <p className="mt-1 text-[11px] text-[#6f8088]">{item.angle}</p>}</div><button type="button" onClick={() => chooseCopy(item)} className="shrink-0 rounded-md bg-brand-forest px-2.5 py-1.5 text-[10px] font-semibold text-white">Usar</button></div>
          {item.hook_spoken && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-[#43565f]">“{item.hook_spoken}”</p>}
          <details className="group mt-3 border-t border-[#e4e8ea] pt-2"><summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold text-[#5e727c]">Ver fala completa <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" /></summary><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-brand-forest">{item.text}</p></details>
        </article>)}
      </div>}
    </section>}

    {step === 2 && selectedCopy && <Panel title="2. Roteiro" subtitle="No modo rápido, a copy aprovada será a narração; o motor monta a sequência visual.">
      <div className="rounded-lg border border-[#e4e8ea] bg-[#fafafa] p-4"><p className="text-[10px] font-semibold uppercase tracking-wide text-brand-gold">Fala aprovada</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-brand-forest">{selectedCopy.text}</p></div>
      <Nav back={() => go(1)} backLabel="Copies" next={() => go(3)} nextLabel="Tom e voz" />
    </Panel>}

    {step === 3 && <Panel title="3. Tom e voz" subtitle="Escolha a entrega da fala e o formato do vídeo.">
      <div className="grid gap-5 md:grid-cols-2"><Select label="Tom" value={tone} onChange={(value) => setTone(value as NonNullable<SimpleVideoConfig['tone']>)} options={[['direto', 'Direto e objetivo'], ['proximo', 'Próximo e acolhedor'], ['energetico', 'Energético e motivador'], ['especialista', 'Especialista e didático']]} /><Select label="Voz" value={voice} onChange={setVoice} options={[['pt-BR-FranciscaNeural', 'Francisca · natural e clara'], ['pt-BR-AntonioNeural', 'Antônio · confiante'], ['pt-BR-ThalitaNeural', 'Thalita · jovem e dinâmica'], ['pt-BR-FabioNeural', 'Fábio · suave e profundo']]} /></div>
      <div className="grid gap-5 md:grid-cols-2"><fieldset><legend className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-forest"><Monitor className="h-4 w-4 text-brand-gold" /> Formato</legend><div className="grid grid-cols-2 gap-2">{([['9:16', Smartphone, 'Vertical'], ['16:9', Monitor, 'Horizontal']] as const).map(([value, Icon, label]) => <button key={value} type="button" aria-pressed={ratio === value} onClick={() => setRatio(value)} className={`flex h-[42px] items-center justify-center gap-2 rounded-lg border text-xs font-medium ${ratio === value ? 'border-brand-gold bg-[#fbf7f1] text-brand-forest ring-1 ring-brand-gold/30' : 'border-[#dce1e3] text-[#5e727c]'}`}><Icon className="h-4 w-4" />{label}</button>)}</div></fieldset><label className="flex cursor-pointer items-center justify-between self-end rounded-lg border border-[#e4e8ea] px-3.5 py-3"><span className="flex items-center gap-2 text-xs font-medium text-brand-forest"><Captions className="h-4 w-4 text-brand-gold" /> Legendas dinâmicas</span><input type="checkbox" checked={subtitles} onChange={(event) => setSubtitles(event.target.checked)} className="h-4 w-4 accent-[#031a26]" /></label></div>
      <Nav back={() => go(2)} backLabel="Roteiro" next={() => go(4)} nextLabel="Revisar" />
    </Panel>}

    {step === 4 && selectedCopy && <Panel title="4. Revisão" subtitle="Confirme a fala e as configurações antes de produzir.">
      <div className="rounded-lg border border-[#e4e8ea] bg-[#fafafa] p-4"><dl className="grid gap-4 text-xs md:grid-cols-3"><div><dt className="text-[#72828a]">Copy</dt><dd className="mt-1 font-medium text-brand-forest">{selectedCopy.title}</dd></div><div><dt className="text-[#72828a]">Tom e voz</dt><dd className="mt-1 font-medium text-brand-forest">{tone} · {voice.replace('pt-BR-', '').replace('Neural', '')}</dd></div><div><dt className="text-[#72828a]">Entrega</dt><dd className="mt-1 font-medium text-brand-forest">{ratio === '9:16' ? 'Vertical' : 'Horizontal'} · {subtitles ? 'legendas ativas' : 'sem legendas'}</dd></div></dl><p className="mt-4 border-t border-[#e4e8ea] pt-4 whitespace-pre-wrap text-sm leading-relaxed text-brand-forest">{selectedCopy.text}</p></div>
      <Nav back={() => go(3)} backLabel="Editar" next={() => go(5)} nextLabel="Ir para vídeo" />
    </Panel>}

    {step === 5 && <Panel title="5. Vídeo" subtitle="Produza e acompanhe o MP4 real no painel ao lado.">
      {activeJob && <div className={`rounded-lg border p-4 text-sm ${activeJob.status === 'error' ? 'border-[#edc7c1] bg-[#fff6f4] text-[#9d3d30]' : activeJob.status === 'completed' ? 'border-[#c9dfd2] bg-[#f5fbf7] text-[#256a45]' : 'border-[#ead5b2] bg-[#fbf7f1] text-[#735016]'}`}><p className="font-semibold">{activeJob.currentStepMessage}</p><p className="mt-1 text-xs">{activeJob.status === 'error' ? activeJob.error : activeJob.status === 'completed' ? 'Vídeo disponível no player.' : `${activeJob.progress}% concluído`}</p></div>}
      <div className="flex justify-between"><button type="button" disabled={isGenerating} onClick={() => go(4)} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[#5e727c] disabled:opacity-45"><ArrowLeft className="h-4 w-4" /> Revisão</button>{!activeJob && <button type="button" onClick={() => onGenerate(production())} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-forest px-4 text-xs font-semibold text-white"><Play className="h-4 w-4 fill-brand-gold text-brand-gold" /> Produzir vídeo</button>}</div>
    </Panel>}
  </div>;
};

const Panel: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => <section className="space-y-5 rounded-xl border border-[#dce1e3] bg-white p-5 shadow-[0_4px_16px_-4px_rgba(3,26,38,.08)] lg:p-6"><div className="flex gap-3"><FileCheck2 className="mt-0.5 h-5 w-5 text-brand-gold" /><div><h2 className="text-base font-semibold text-brand-forest">{title}</h2><p className="mt-0.5 text-xs text-[#6f8088]">{subtitle}</p></div></div>{children}</section>;
const Nav: React.FC<{ back: () => void; backLabel: string; next: () => void; nextLabel: string }> = ({ back, backLabel, next, nextLabel }) => <div className="flex justify-between"><button type="button" onClick={back} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-[#5e727c]"><ArrowLeft className="h-4 w-4" />{backLabel}</button><button type="button" onClick={next} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-forest px-4 text-xs font-semibold text-white">{nextLabel}<ChevronRight className="h-4 w-4" /></button></div>;
const Select: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: string[][] }> = ({ label, value, onChange, options }) => <div><label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-brand-forest"><Volume2 className="h-4 w-4 text-brand-gold" />{label}</label><select value={value} onChange={(event) => onChange(event.target.value)} className={field}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></div>;
