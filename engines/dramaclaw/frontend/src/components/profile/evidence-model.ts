export type EvidencePost = { id: string; caption: string; source_url: string; observed_at?: string; media_file?: string; metrics?: Record<string, unknown> };
export type EvidenceTranscript = { post_id?: string; audio_status?: string; status?: string; transcript_literal?: string; transcript_clean?: string; text?: string; segments?: unknown[] };
export type EvidenceBlock = { id?: string; post_id?: string; source_kind?: string; literal_text?: string; role?: string };
export const normalizeEvidence = (text: string) => text.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').trim();
export function hasUsefulSpeech(t?: EvidenceTranscript): boolean {
  return t?.audio_status === 'present_speech' && t.status === 'passed' && Boolean(t.transcript_literal?.trim());
}
export function evidenceRows(posts: EvidencePost[], transcripts: EvidenceTranscript[], blocks: EvidenceBlock[]) {
  return posts.map(post => {
    const transcript = transcripts.find(t => t.post_id === post.id);
    const speech = hasUsefulSpeech(transcript);
    const source = speech ? transcript!.transcript_literal! : post.caption;
    const mismatches = blocks.filter(b => {
      if (b.post_id !== post.id || !b.literal_text?.trim()) return false;
      const original = b.source_kind === 'caption' ? post.caption : b.source_kind === 'transcript' && speech ? transcript!.transcript_literal! : '';
      return !normalizeEvidence(original).includes(normalizeEvidence(b.literal_text));
    });
    return { post, transcript, speech, source, mismatches, sourceKind: speech ? 'Fala transcrita' : 'Legenda publicada', audioLabel: speech ? 'Fala útil' : post.media_file ? 'Música / comandos ou fala não confirmada' : 'Mídia ausente' };
  });
}
export function sourceLines(text: string) {
  return text.split(/\n+|(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean).map((text, index) => ({ text, role: /coment|privado|direct/i.test(text) ? 'CTA' : /acesse|aula completa|youtube/i.test(text) ? 'Oferta / acesso' : index === 0 ? 'Abertura' : /consegue|topa|experimenta/i.test(text) ? 'Convite / desafio' : 'Desenvolvimento' }));
}
