import { useState } from 'react';

export type ReviewCopy = { id: string; version: number; title: string; text: string; status: string; source_post_id: string; hook_visual?: string; caption?: string; cta?: string; review_note?: string; performance_note?: string };
export const reviewLabels: Record<string, string> = { draft: 'Rascunho', adjusted: 'Ajustado', approved: 'Aprovado', recorded: 'Gravado', published: 'Publicado', rejected: 'Rejeitado' };

export function CopyReview({ copy, endpoint, onSaved }: { copy: ReviewCopy; endpoint: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(copy);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save() {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/${endpoint}/copies/${encodeURIComponent(copy.id)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: draft.title, text: draft.text, status: draft.status, version: draft.version, hook_visual: draft.hook_visual || '', caption: draft.caption || '', cta: draft.cta || '', review_note: draft.review_note || '', performance_note: draft.performance_note || '' }) });
      if (!response.ok) throw new Error(response.status === 409 ? 'Outra edição foi salva. Feche e abra a revisão para carregar a versão atual.' : 'Não foi possível salvar a revisão. Seu texto permanece aqui.');
      setOpen(false); onSaved(); setMessage('Revisão salva.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erro ao salvar.'); }
    finally { setBusy(false); }
  }
  return <div className="my-3 space-y-3 text-xs">
    <p className="text-[#66736B]">Referência: {copy.source_post_id || 'não informada'} · versão {copy.version}</p>
    <button type="button" className="rounded-lg border border-[#E3E1DA] px-3 py-2 font-semibold" onClick={() => { if (!open) setDraft(copy); setOpen(!open); }}> {open ? 'Fechar revisão' : 'Revisar / editar copy'}</button>
    {open && <div className="space-y-3 rounded-xl bg-[#F7F5F0] p-3">
      {([['title','Título'],['text','Fala limpa para gravação'],['hook_visual','Direção visual'],['caption','Legenda'],['cta','CTA'],['review_note','Feedback de Tiago / motivo da decisão'],['performance_note','Desempenho observado — data, fonte e resultados']] as const).map(([field,label]) => <label key={field} className="block font-medium">{label}<textarea className="mt-1 w-full rounded border border-[#E3E1DA] bg-white p-2 font-normal" rows={field === 'text' ? 6 : 2} value={draft[field] || ''} onChange={e=>setDraft({...draft,[field]:e.target.value})}/></label>)}
      <label className="block">Etapa editorial<select className="ml-2 rounded border p-2" value={draft.status} onChange={e=>setDraft({...draft,status:e.target.value})}>{Object.entries(reviewLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <p>O status registra a decisão da equipe. Aprovar aqui não publica em redes sociais. Registre vendas e reproduções separadamente.</p>
      <button type="button" disabled={busy || !draft.text.trim() || !draft.title.trim()} className="rounded bg-[#19382B] px-3 py-2 text-white disabled:opacity-50" onClick={save}>{busy ? 'Salvando…' : 'Salvar revisão'}</button>
    </div>}
    {message && <p role="status">{message}</p>}
  </div>;
}
