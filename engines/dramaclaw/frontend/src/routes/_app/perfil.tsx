// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 TG
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { EvidenceMemory } from "@/components/profile/EvidenceMemory";
import { hasUsefulSpeech } from "@/components/profile/evidence-model";
import type { EvidenceTranscript } from "@/components/profile/evidence-model";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LayoutGrid, Table as TableIcon, Filter, ExternalLink, Mic, Music, RefreshCw } from "lucide-react";
import "@/components/profile/profile.css";

export const Route = createFileRoute("/_app/perfil")({
  component: ProfilePage,
});

type Post = {
  id: string;
  version: number;
  source_url: string;
  caption: string;
  metrics: Record<string, string | null>;
  observed_at: string;
  media_file?: string;
  type?: string;
  thumbnail_url?: string;
  video_url?: string;
};

type Profile = {
  handle: string;
  name: string;
  bio: string;
  facts: string;
  method: string;
  followers_display: string;
  source_observed_at: string;
  version: number;
};

type CopyItem = {
  id: string;
  version: number;
  title: string;
  angle?: string;
  hook_visual?: string;
  hook_spoken?: string;
  body?: string;
  cta?: string;
  caption?: string;
  text: string;
  status: "draft" | "approved";
  source_post_id: string;
  target_cta?: string;
  briefing?: string;
  promoted_episode?: number;
};

type MemoryGroup = "identidade" | "audiencia" | "acervo" | "estrutura" | "validacao" | "producao";
type EvidenceStatus = "observado" | "inferido" | "hipotese" | "bloqueado";
type ValidationStatus = "client_approved" | "commercially_validated" | "aprovado" | "em_teste" | "reprovado" | "sem_validacao";

type CoverageSummary = {
  posts_total: number;
  media_files_total: number;
  useful_speech_total: number;
  blocked_no_media_total: number;
  music_no_speech_total: number;
  copy_blocks_total: number;
  relations_total: number;
  memory_items_total: number;
  observed_items_total: number;
  inferred_items_total: number;
  hypotheses_total: number;
  blocked_items_total: number;
  client_approved_total: number;
  commercially_validated_total: number;
  validation_events_total?: number;
  sem_validacao_total?: number;
  sensitive_claims_blocked_total?: number;
};

type ValidationEventDoc = {
  id: string;
  target_kind?: string;
  target_id: string;
  event_type: "client_approval" | "commercial_validation" | "technical_qa" | "sanitization_demotion" | string;
  approver_name?: string;
  approver_role?: string;
  channel?: string;
  evidence_ref?: string;
  timestamp?: string;
  notes?: string;
  status?: string;
  created_at?: string;
  audit_log?: string;
  previous_status?: string;
  new_status?: string;
  decided_by?: string;
};

type RelationDoc = {
  source_id: string;
  target_id: string;
  relation_type: string;
  status: EvidenceStatus;
  confidence?: number;
  source_ids?: string[];
};

type CopyBlock = {
  id?: string;
  funcao?: string;
  role?: string;
  texto?: string;
  literal_text?: string;
  status: EvidenceStatus;
  source_kind?: string;
  source_ids?: string[];
  post_id?: string;
  start_char?: number;
  end_char?: number;
  start_sec?: number;
  end_sec?: number;
  is_sensitive?: boolean;
  policy_status?: "allowed" | "blocked_from_generator" | "quarantined";
  policy_risk?: "low" | "high";
  policy_reason?: string;
};

type MemoryRelation = {
  alvo_id: string;
  tipo_relacao: string;
  status: EvidenceStatus;
};

type MemoryItem = {
  id: string;
  alias: string;
  tipo: MemoryGroup;
  titulo: string;
  texto_resumo: string;
  fonte_url?: string | null;
  post_id?: string | null;
  metricas?: Record<string, any>;
  observado_em: string;
  status_de_evidencia: EvidenceStatus;
  status_de_validacao: ValidationStatus;
  blocos_de_copy?: CopyBlock[];
  relacoes: MemoryRelation[];
  versao: number;
  copy_falada?: string;
  estrutura_de_copy?: Record<string, string>;
  cta?: string;
  publico?: string;
  hipotese?: string;
  evidencias_usadas?: string[];
  performance_posterior?: Record<string, any>;
  x: number;
  y: number;
  r: number;
  coluna: number;
  validation_event_ids?: string[];
  is_sensitive?: boolean;
  policy_status?: string;
  policy_reason?: string;
};


type Data = {
  profile: Profile | null;
  posts: Post[];
  copies: CopyItem[];
  transcripts?: EvidenceTranscript[];
  memory_items?: MemoryItem[];
  copy_blocks?: CopyBlock[];
  relations?: RelationDoc[];
  validation_events?: ValidationEventDoc[];
  coverage_summary?: CoverageSummary;
  jobs: { id: string; operation: string; status: string; error?: string }[];
  diagnostics?: { text_configured: boolean; text_model?: string; text_status?: string; whisper_installed: boolean };
};

const emptyProfile: Profile = {
  handle: "thaix.santiago",
  name: "THAIX | Emagrecimento Feminino & Ritbox",
  bio: "Ajudo mulheres reais a emagrecerem na sala de casa sem dor nos joelhos.",
  facts: "417 mil seguidoras ativas. Mais de 12 milhões de visualizações em vídeos de treino ritmado.",
  method: "Ritbox de baixo impacto. Treino na batida da música sem impacto articular.",
  followers_display: "417 mil",
  source_observed_at: "",
  version: 1,
};

const CTA_RANKING_KEYWORDS = [
  {id:'quero',word:'QUERO',conversions:'Presente nas referências'},
  {id:'mundofit',word:'MUNDOFIT',conversions:'Presente nas referências'},
  {id:'verao',word:'VERÃO',conversions:'Campanha histórica; confirmar oferta'},
];

function ProfilePage() {
  const [project] = useState("01M1SAXW27GVCP7QF6EYY7PSQN");
  const [tab, setTab] = useState<"geral" | "memoria" | "acervo" | "copies">("memoria");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [sourcePostId, setSourcePostId] = useState("DcUjm2eyjbC");
  // Estados da Aba Dados (Notion-style)
  const [dadosView, setDadosView] = useState<"gallery" | "table">("gallery");
  const [dadosFilter, setDadosFilter] = useState<"all" | "top" | "speech" | "comments">("all");

  // Estados do Gerador Estratégico
  const [inputText, setInputText] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(["QUERO"]);
  const [isSyncingKeywords, setIsSyncingKeywords] = useState(false);

  function toggleKeyword(word: string) { setSelectedKeywords([word]); }

  async function handleSyncKeywords() {
    setIsSyncingKeywords(true);
    try { await query.refetch(); setNotice("Acervo recarregado. Palavras-chave são referências editoriais, sem ranking de conversão."); }
    finally { setIsSyncingKeywords(false); }
  }

  const queryClient = useQueryClient();
  const endpoint = `api/v1/projects/${encodeURIComponent(project)}/profile`;
  const query = useQuery({
    queryKey: ["client-profile", project],
    refetchInterval: 4000,
    queryFn: () => api.get(endpoint).json<{ data: Data }>(),
  });
  const data = query.data?.data;

  useEffect(() => {
    if (data?.profile) {
      setProfile(data.profile);
    }
  }, [data?.profile?.version]);

  const posts = data?.posts || [];
  const copies = data?.copies || [];
  const runningJob = data?.jobs?.find((j) => j.status === "running");

  const totalPlaysNum = posts.reduce(
    (tot, p) => tot + Number(p.metrics?.plays || p.metrics?.views || 0),
    0,
  );
  const totalCommentsNum = posts.reduce(
    (tot, p) => tot + Number(p.metrics?.comments || 0),
    0,
  );

  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toString();
  };

  const transcriptsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (data?.transcripts || []).forEach((t) => {
      const pid = t.post_id || "";
      const hasSpeech = hasUsefulSpeech(t);
      if (pid) map.set(pid, hasSpeech);
    });
    return map;
  }, [data?.transcripts]);

  const formatCadence = (text: string): string[] => {
    if (!text) return [];
    const normalized = text.replace(/\r\n/g, "\n");
    if (normalized.includes("\n")) {
      return normalized.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    }
    return normalized
      .replace(/([.!?])\s+(?=[A-ZÀ-Ú"'\d])/g, "$1\n")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const plays = Number(p.metrics?.plays || p.metrics?.views || 0);
      const comments = Number(p.metrics?.comments || 0);
      if (dadosFilter === "top") return plays >= 100_000;
      if (dadosFilter === "speech") return transcriptsMap.get(p.id) === true;
      if (dadosFilter === "comments") return comments >= 1_000;
      return true;
    });
  }, [posts, dadosFilter, transcriptsMap]);

  const copyToClipboard = (text: string, id: string) => {
    const formatted = formatCadence(text).join("\n\n");
    navigator.clipboard.writeText(formatted);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  async function handleGenerateCopies() {
    if (!inputText.trim()) {
      setError("Digite um tema para gerar o copywriting.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const activeCta = selectedKeywords.length > 0 ? selectedKeywords[0] : "MUNDOFIT";

    try {
      const resp = await fetch(`/api/v1/projects/${encodeURIComponent(project)}/profile/strategic-copies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input_text: inputText.trim(),
          source_post_id: sourcePostId || null,
          target_cta: activeCta,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || "Falha ao solicitar geração de copies.");
      }

      const res = await resp.json();
      if (res.data?.id) {
        setNotice("Gerando 10 copies estratégicas...");
        await queryClient.invalidateQueries({ queryKey: ["client-profile", project] });
      }
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao gerar copies.");
    } finally {
      setBusy(false);
    }
  }

  async function handleClearCopies() {
    try {
      setBusy(true);
      const resp = await fetch(`/api/v1/projects/${encodeURIComponent(project)}/profile/copies`, {
        method: "DELETE",
      });
      if (!resp.ok) {
        throw new Error("Falha ao limpar copies.");
      }
      setNotice("Copies removidas com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["client-profile", project] });
    } catch (err: any) {
      setError(err.message || "Erro ao limpar copies.");
    } finally {
      setBusy(false);
    }
  }

  function handleUseInEsteira(item: { titulo: string; briefing: string; cta?: string; hook?: string }) {
    const theme = item.titulo || item.briefing;
    try {
      localStorage.setItem("tg_esteira_theme", theme);
      if (item.briefing) {
        localStorage.setItem("tg_esteira_script", formatCadence(item.briefing).join("\n\n"));
      }
    } catch {}
    window.location.assign(`/?theme=${encodeURIComponent(theme)}`);
  }

  return (
    <main className="tg-profile min-h-screen bg-[#FAFAFA] text-[#031A26] pb-16">
      <div className="max-w-5xl mx-auto px-6 pt-5 space-y-3.5">
        {/* Topo Limpo estilo Esteira de Conteúdo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[24px] font-bold leading-tight text-[#031A26]">
              Thaix Santiago
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#F4F6F7] text-[#5E727C] border border-[#E2E7E9] font-medium">
              @{profile.handle || "thaix.santiago"}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#F4F6F7] text-[#5E727C] border border-[#E2E7E9] font-medium">
              {profile.followers_display || "417 mil"} seguidoras
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE1E3] bg-white text-xs font-semibold text-[#031A26] hover:border-[#B9915B] transition-colors shadow-xs"
            >
              <span>Esteira de Vídeo</span>
              <span className="text-[#B9915B]">→</span>
            </a>
            <a
              href="https://www.instagram.com/thaix.santiago/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE1E3] bg-white text-xs font-semibold text-[#031A26] hover:border-[#B9915B] transition-colors shadow-xs"
            >
              <span>Instagram</span>
              <ExternalLink className="w-3 h-3 text-[#B9915B]" />
            </a>
          </div>
        </div>

        {/* Navegação por Abas Limpas no Topo */}
        <nav className="flex gap-6 border-b border-[#E2E7E9]">
          {[
            { id: "geral", label: "Geral" },
            { id: "memoria", label: "Memória" },
            { id: "acervo", label: "Postagens" },
            { id: "copies", label: "Copywriting" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 ${
                tab === t.id
                  ? "border-[#031A26] text-[#031A26]"
                  : "border-transparent text-[#5E727C] hover:text-[#031A26]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}
        {notice && (
          <div className="p-3.5 rounded-lg bg-[#F4F6F7] border border-[#E2E7E9] text-[#031A26] text-xs font-medium flex items-center justify-between">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} className="text-[#5E727C] hover:text-[#031A26] text-xs font-bold">×</button>
          </div>
        )}

        {/* ABA 1: GERAL */}
        {tab === "geral" && (
          <section className="space-y-6">
            {/* Grid de KPIs Dinâmicos da API */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-[#DCE1E3] shadow-sm">
                <span className="text-[11px] font-semibold uppercase text-[#5E727C] tracking-wider">
                  Alcance Observado
                </span>
                <div className="text-2xl font-extrabold text-[#031A26] mt-1">
                  {totalPlaysNum.toLocaleString("pt-BR")}
                </div>
                <span className="text-xs text-[#5E727C]">Plays somados ({data?.coverage_summary?.media_files_total ?? posts.filter((p) => p.media_file).length} vídeos com mídia)</span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#DCE1E3] shadow-sm">
                <span className="text-[11px] font-semibold uppercase text-[#5E727C] tracking-wider">
                  Total de Comentários
                </span>
                <div className="text-2xl font-extrabold text-[#031A26] mt-1">
                  {totalCommentsNum.toLocaleString("pt-BR")}
                </div>
                <span className="text-xs text-[#5E727C]">Interações da audiência observadas</span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#DCE1E3] shadow-sm">
                <span className="text-[11px] font-semibold uppercase text-[#5E727C] tracking-wider">
                  Engajamento Médio
                </span>
                <div className="text-2xl font-extrabold text-[#031A26] mt-1">
                  {totalPlaysNum > 0 ? ((totalCommentsNum / totalPlaysNum) * 100).toFixed(2) + "%" : "0%"}
                </div>
                <span className="text-xs text-[#5E727C]">Taxa comentários / alcance</span>
              </div>

              <div className="bg-white p-5 rounded-xl border border-[#DCE1E3] shadow-sm">
                <span className="text-[11px] font-semibold uppercase text-[#5E727C] tracking-wider">
                  Conteúdos Minerados
                </span>
                <div className="text-2xl font-extrabold text-[#031A26] mt-1">
                  {data?.coverage_summary?.posts_total ?? posts.length}
                </div>
                <span className="text-xs text-[#5E727C]">{data?.coverage_summary?.useful_speech_total ?? 0} com fala autêntica</span>
              </div>
            </div>

            {/* ABOUT ME & DOSSIÊ EXECUTIVO DA CRIADORA */}
            <div className="bg-white p-6 rounded-xl border border-[#DCE1E3] shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#F0F2F3]">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#031A26] to-[#B9915B] flex items-center justify-center text-white font-extrabold text-xl shadow-sm shrink-0 border border-[#DCE1E3]">
                    {posts[0]?.thumbnail_url && (
                      <img
                        src={posts[0].thumbnail_url}
                        alt="Thaix Santiago"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                    <span className="absolute inset-0 flex items-center justify-center font-extrabold text-lg pointer-events-none text-white drop-shadow-xs">TS</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-[#031A26]">About Me: Thaix Santiago</h2>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9]">
                        Perfil Ativo • 417k seguidoras
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FCFBF9] text-[#B9915B] border border-[#B9915B]/30">
                        12M+ visualizações
                      </span>
                    </div>
                    <p className="text-xs text-[#5E727C] mt-0.5">
                      Criadora &amp; Especialista em Emagrecimento Feminino no Ritbox • Método Baixo Impacto
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTab("memoria");
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#031A26] text-white hover:bg-[#031A26]/90 transition-colors shadow-xs"
                  >
                    <span>Dossiê Vault (.md)</span>
                    <span>→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("acervo")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#F5F4F3] text-[#031A26] border border-[#DCE1E3] hover:border-[#B9915B] transition-colors"
                  >
                    <span>Postagens ({posts.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("copies")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#F5F4F3] text-[#031A26] border border-[#DCE1E3] hover:border-[#B9915B] transition-colors"
                  >
                    <span>Copywriting</span>
                  </button>
                  <a
                    href="https://www.instagram.com/thaix.santiago/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#F5F4F3] text-[#031A26] border border-[#DCE1E3] hover:border-[#B9915B] transition-colors"
                  >
                    <span>@thaix.santiago</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#B9915B]" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 pt-5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E727C] mb-2">
                    1. Proposta Única (UVP)
                  </h3>
                  <p className="text-xs text-[#031A26] leading-relaxed">
                    Emagrecimento prático e divertido na sala de casa, aliando queima calórica ao ritmo da música com <strong>100% de baixo impacto</strong> (sem saltos, sem agredir joelhos ou coluna).
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E727C] mb-2">
                    2. Persona &amp; Dores Reais
                  </h3>
                  <p className="text-xs text-[#031A26] leading-relaxed">
                    Mulheres de 28 a 55 anos, mães, rotina sobrecarregada, aversão à academia tradicional e necessidade de treinar em 15 a 20 minutos com segurança e leveza.
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E727C] mb-2">
                    3. Funil &amp; Conversão ManyChat
                  </h3>
                  <p className="text-xs text-[#031A26] leading-relaxed">
                    CTA mandatório com a palavra-chave <strong>MUNDOFIT</strong> para disparar automação ManyChat com entrega da aula completa gratuita no Direct. Roteiros teleprompter de 20 a 40s.
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#5E727C] mb-2">
                    4. Regras de Ouro Thiago Neiva
                  </h3>
                  <p className="text-xs text-[#031A26] leading-relaxed">
                    Zero salto articular. Linguagem acolhedora de amiga ("meninas", "vem comigo"). Ação imediata nos primeiros 2 segundos com quebra de padrão musical.
                  </p>
                </div>
              </div>
            </div>

            {/* Ranking dos Campeões */}
            <div className="bg-white p-6 rounded-xl border border-[#DCE1E3] shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[#031A26]">
                    Ranking dos Campeões
                  </h2>
                  <p className="text-xs text-[#5E727C]">
                    Publicações com maior poder de atração e retenção comprovados.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#F5F4F3] text-[#031A26] border border-[#DCE1E3]">
                  80/20 Comprovado
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Campeão 1 */}
                <div className="p-4 rounded-xl border border-[#B9915B] bg-[#FCFBF9] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#031A26] text-[#B9915B]">
                        1º Lugar
                      </span>
                      <span className="text-xs font-bold text-[#031A26]">6.601.593 plays</span>
                    </div>
                    <h3 className="font-bold text-sm line-clamp-2 text-[#031A26] mb-1">
                      "Emagrece! na música é MUITO MAIS DIVERTIDO"
                    </h3>
                    <p className="text-xs text-[#5E727C] line-clamp-3 mb-3">
                      Desafio musical para aguentar a música toda. Gancho de retenção contagiante com conversão no CTA MUNDOFIT.
                    </p>
                  </div>
                  <div className="border-t border-[#DCE1E3] pt-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#031A26]">33.266 comentários</span>
                    <a
                      href="https://www.instagram.com/p/Da_JAVQSCPu/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#B9915B] font-bold hover:underline"
                    >
                      Instagram ↗
                    </a>
                  </div>
                </div>

                {/* Campeão 2 */}
                <div className="p-4 rounded-xl border border-[#DCE1E3] bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F5F4F3] text-[#031A26] border border-[#DCE1E3]">
                        2º Lugar
                      </span>
                      <span className="text-xs font-bold text-[#031A26]">4.099.020 plays</span>
                    </div>
                    <h3 className="font-bold text-sm line-clamp-2 text-[#031A26] mb-1">
                      "Se quer emagrecer rápido comece fazer esse treino BAIXO IMPACTO"
                    </h3>
                    <p className="text-xs text-[#5E727C] line-clamp-3 mb-3">
                      Ataque à dor articular. Treino sem pulos para queimar calorias na sala sem agredir joelhos ou coluna.
                    </p>
                  </div>
                  <div className="border-t border-[#DCE1E3] pt-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#031A26]">7.069 comentários</span>
                    <a
                      href="https://www.instagram.com/p/DauwjqVBoHh/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#B9915B] font-bold hover:underline"
                    >
                      Instagram ↗
                    </a>
                  </div>
                </div>

                {/* Campeão 3 */}
                <div className="p-4 rounded-xl border border-[#DCE1E3] bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F5F4F3] text-[#031A26] border border-[#DCE1E3]">
                        3º Lugar
                      </span>
                      <span className="text-xs font-bold text-[#031A26]">613.828 plays</span>
                    </div>
                    <h3 className="font-bold text-sm line-clamp-2 text-[#031A26] mb-1">
                      "Que bom que estava com vocês"
                    </h3>
                    <p className="text-xs text-[#5E727C] line-clamp-3 mb-3">
                      Validação social, pertencimento e energia de alunas praticando o método dentro de casa.
                    </p>
                  </div>
                  <div className="border-t border-[#DCE1E3] pt-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#031A26]">2.113 comentários</span>
                    <span className="text-xs text-[#5E727C]">Alta Conexão</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direcionador Estratégico & Posicionamento */}
            <div className="bg-white p-6 rounded-xl border border-[#DCE1E3] shadow-sm">
              <h2 className="text-lg font-bold text-[#031A26] mb-1">
                Direcionador Estratégico & Posicionamento
              </h2>
              <p className="text-xs text-[#5E727C] mb-5">
                Pilares observados no perfil da Thaix para orientar toda e qualquer copy.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#F5F4F3] border border-[#DCE1E3]">
                  <h3 className="text-sm font-bold text-[#031A26] mb-1">1. Nicho & Proposta Única</h3>
                  <p className="text-xs text-[#031A26]/85 leading-relaxed">
                    Emagrecimento feminino prático para mulheres reais. O diferencial central é aliar queima calórica a treinos de <strong>baixo impacto na música (Ritbox)</strong>, eliminando o tédio de esteiras e o risco de lesões articulares.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#F5F4F3] border border-[#DCE1E3]">
                  <h3 className="text-sm font-bold text-[#031A26] mb-1">2. Persona & Dores Centrais</h3>
                  <p className="text-xs text-[#031A26]/85 leading-relaxed">
                    Mulheres adultas, mães, rotina sobrecarregada, sem tempo para academia tradicional. Sentem vergonha de ambientes de musculação e buscam se exercitar na sala de casa de forma leve e divertida.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#F5F4F3] border border-[#DCE1E3]">
                  <h3 className="text-sm font-bold text-[#031A26] mb-1">3. Gatilhos de Retenção (Ganchos)</h3>
                  <p className="text-xs text-[#031A26]/85 leading-relaxed">
                    Desafios musicais ("você aguenta a música toda?"), quebra de objeção imediata ("sem pulos para não doer joelho") e quebra de padrão com energia contagiante logo nos primeiros 2 segundos.
                  </p>
<p className="text-xs text-[#031A26]/85 leading-relaxed">
                    Chamada orientada a palavra-chave nos comentários (ex: <strong>"MUNDOFIT"</strong>) com envio de aula completa e gratuita no Direct (estratégia nativa de automação ManyChat).
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {tab === "memoria" && <EvidenceMemory posts={posts} transcripts={data?.transcripts || []} blocks={data?.copy_blocks || []} onReference={id => { setSourcePostId(id); setSelectedKeywords([/MUNDOFIT/i.test(posts.find(p=>p.id===id)?.caption || '')?'MUNDOFIT':'QUERO']); setTab('copies'); }} />}

        {/* ABA 3: DADOS (NOTION / 21ST.DEV CLEAN DESIGN) */}
        {tab === "acervo" && (
          <section className="space-y-4">
            {/* Toolbar Notion-style */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8ECEE] shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 p-0.5 bg-[#F4F6F7] rounded-lg border border-[#E2E7E9]">
                  <button
                    type="button"
                    onClick={() => setDadosView("gallery")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      dadosView === "gallery"
                        ? "bg-white text-[#031A26] shadow-xs"
                        : "text-[#5E727C] hover:text-[#031A26]"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    Galeria
                  </button>
                  <button
                    type="button"
                    onClick={() => setDadosView("table")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      dadosView === "table"
                        ? "bg-white text-[#031A26] shadow-xs"
                        : "text-[#5E727C] hover:text-[#031A26]"
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    Tabela
                  </button>
                </div>
                <span className="text-xs text-[#5E727C] font-medium hidden md:inline">
                  {filteredPosts.length} de {posts.length} publicações
                </span>
              </div>

              {/* Seletor de visualizações e filtros */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#5E727C]" />
                <select
                  value={dadosFilter}
                  onChange={(e) => setDadosFilter(e.target.value as any)}
                  className="text-xs font-medium bg-[#F4F6F7] hover:bg-[#EBEFEF] text-[#031A26] border border-[#DCE1E3] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#B9915B] cursor-pointer"
                >
                  <option value="all">Todas as publicações</option>
                  <option value="top">Top Alcance (&gt;100k plays)</option>
                  <option value="speech">Com Fala Detectada</option>
                  <option value="comments">Mais Comentados (&gt;1k)</option>
                </select>
              </div>
            </div>

            {/* VISÃO GALERIA */}
            {dadosView === "gallery" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => {
                  const plays = Number(post.metrics?.plays || post.metrics?.views || 0);
                  const likes = Number(post.metrics?.likes || 0);
                  const comments = Number(post.metrics?.comments || 0);
                  const er = plays > 0 ? (((likes + comments) / plays) * 100).toFixed(1) : "0.0";
                  const hasSpeech = transcriptsMap.get(post.id);

                  return (
                    <div
                      key={post.id}
                      className="group bg-white rounded-xl border border-[#E8ECEE] hover:border-[#B9915B]/50 transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {post.thumbnail_url ? (
                          <div className="relative w-full aspect-[4/3] bg-[#031A26]/5 overflow-hidden">
                            <img
                              src={post.thumbnail_url}
                              alt={post.caption || "Reel"}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#031A26]/85 via-transparent to-black/20" />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs border border-white/20">
                                {post.type || "Reel"}
                              </span>
                              {hasSpeech ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#031A26] text-[#B9915B] backdrop-blur-xs border border-[#B9915B]/30">
                                  <Mic className="w-2.5 h-2.5" /> Fala Auditada
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/50 text-slate-300 backdrop-blur-xs border border-white/10">
                                  <Music className="w-2.5 h-2.5" /> Trilha
                                </span>
                              )}
                            </div>
                            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-bold drop-shadow-xs">
                              <span>▶ {formatCompact(plays)} plays</span>
                              <span className="text-[11px] font-medium opacity-90">ER {er}%</span>
                            </div>
                          </div>
                        ) : null}

                        <div className="p-4">
                          {!post.thumbnail_url && (
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F5F4F3] text-[#031A26] border border-[#E8ECEE]">
                                  {post.type || "Reel"}
                                </span>
                                {hasSpeech ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9]">
                                    <Mic className="w-2.5 h-2.5" /> Fala Auditada
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]">
                                    <Music className="w-2.5 h-2.5" /> Trilha / Sem fala
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-black text-[#031A26] tracking-tight">
                                {formatCompact(plays)} <span className="font-normal text-[10px] text-[#5E727C]">plays</span>
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-[#2A3B43] line-clamp-3 leading-relaxed font-normal">
                            {post.caption || "Sem legenda observada."}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 pb-3 pt-2 border-t border-[#F0F2F3] flex items-center justify-between text-[11px] text-[#5E727C]">
                        <div className="flex items-center gap-2.5">
                          <span title="Curtidas">❤️ {formatCompact(likes)}</span>
                          <span title="Comentários">💬 {formatCompact(comments)}</span>
                          <span title="Taxa de Engajamento" className="text-[#031A26] font-medium">ER {er}%</span>
                        </div>
                        <a
                          href={post.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#B9915B] hover:text-[#9A7443] transition-colors"
                        >
                          Instagram <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VISÃO TABELA NOTION */}
            {dadosView === "table" && (
              <div className="bg-white rounded-xl border border-[#E8ECEE] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#E8ECEE] text-[#5E727C] font-semibold text-[11px]">
                        <th className="py-2.5 px-3.5">Publicação</th>
                        <th className="py-2.5 px-3">Formato</th>
                        <th className="py-2.5 px-3">Reproduções</th>
                        <th className="py-2.5 px-3">Curtidas</th>
                        <th className="py-2.5 px-3">Comentários</th>
                        <th className="py-2.5 px-3">Engajamento (ER)</th>
                        <th className="py-2.5 px-3">Áudio</th>
                        <th className="py-2.5 px-3 text-right">Origem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F2F3]">
                      {filteredPosts.map((post) => {
                        const plays = Number(post.metrics?.plays || post.metrics?.views || 0);
                        const likes = Number(post.metrics?.likes || 0);
                        const comments = Number(post.metrics?.comments || 0);
                        const er = plays > 0 ? (((likes + comments) / plays) * 100).toFixed(1) : "0.0";
                        const hasSpeech = transcriptsMap.get(post.id);

                        return (
                          <tr key={post.id} className="hover:bg-[#F9FAFB] transition-colors">
                            <td className="py-2.5 px-3.5 font-medium text-[#031A26] max-w-[320px]">
                              <div className="flex items-center gap-2.5">
                                {post.thumbnail_url ? (
                                  <img
                                    src={post.thumbnail_url}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    className="w-8 h-8 rounded object-cover border border-[#E8ECEE] shrink-0"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : null}
                                <span className="truncate" title={post.caption}>
                                  {post.caption || post.id}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F5F4F3] text-[#031A26]">
                                {post.type || "Reel"}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-[#031A26]">
                              {formatCompact(plays)}
                            </td>
                            <td className="py-2.5 px-3 text-[#5E727C]">
                              {formatCompact(likes)}
                            </td>
                            <td className="py-2.5 px-3 text-[#5E727C]">
                              {formatCompact(comments)}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#031A26]">
                              {er}%
                            </td>
                            <td className="py-2.5 px-3">
                              {hasSpeech ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#031A26]">
                                  <Mic className="w-3 h-3" /> Fala
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#9CA3AF]">
                                  <Music className="w-3 h-3" /> Trilha
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <a
                                href={post.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-[#B9915B] hover:underline"
                              >
                                Link <ExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ABA 4: COPYWRITING */}
        {tab === "copies" && (
          <section className="space-y-6">
            <div className="rounded-xl border border-[#E3E1DA] bg-white p-4"><label className="text-sm font-semibold">Referência publicada<select aria-label="Referência para novas copies" className="mt-2 w-full rounded-lg border p-3 text-sm" value={sourcePostId} onChange={e=>setSourcePostId(e.target.value)}><option value="">Sem referência específica</option>{posts.map(p=><option key={p.id} value={p.id}>{p.caption.slice(0,100) || p.id}</option>)}</select></label><p className="mt-2 text-xs text-[#66736B]">Publicada = referência editorial. Novas versões são rascunhos. Gerar usa o fornecedor configurado; selecionar referência não inicia geração.</p></div>

            {/* Box de Geração de Copywriting */}
            <div className="bg-white p-5 rounded-xl border border-[#DCE1E3] shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Lado Esquerdo: Tema */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-[#031A26] mb-1.5">
                      Tema
                    </label>
                    <Textarea
                      placeholder="Ex: Transformar o desafio da música em um convite falado, preservando a referência e sem acrescentar promessas."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="text-xs resize-none border-[#DCE1E3] rounded-lg p-3 min-h-[160px] focus:border-[#031A26]"
                    />
                  </div>
                </div>

                {/* Lado Direito: Palavra-Chave do CTA (Ranking Top 5 + Recarregar) e Gerar Copywriting */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#031A26]">
                        Palavra-Chave do CTA
                      </span>
                      <button
                        type="button"
                        onClick={handleSyncKeywords}
                        title="Recarregar referências do acervo"
                        className="p-1 rounded text-[#5E727C] hover:text-[#031A26] hover:bg-[#F4F6F7] transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingKeywords ? "animate-spin text-[#B9915B]" : ""}`} />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {CTA_RANKING_KEYWORDS.map((kw) => {
                        const isChecked = selectedKeywords.includes(kw.word);
                        return (
                          <label
                            key={kw.id}
                            className={`flex items-center justify-between px-2.5 py-1 rounded-md text-xs cursor-pointer border transition-colors ${
                              isChecked
                                ? "bg-[#F4F6F7] border-[#031A26]/25 text-[#031A26] font-semibold"
                                : "bg-white border-[#E2E7E9] text-[#5E727C] hover:border-[#DCE1E3]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleKeyword(kw.word)}
                                className="rounded border-[#DCE1E3] text-[#031A26] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="font-mono text-xs font-bold">{kw.word}</span>
                            </div>
                            <span className="text-[10px] text-[#5E727C] font-normal">{kw.conversions}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateCopies}
                    disabled={busy || !inputText.trim() || !!runningJob}
                    className="w-full bg-[#031A26] text-white hover:bg-[#031A26]/90 text-xs font-bold py-2 mt-3 rounded-lg shadow-xs"
                  >
                    {busy || runningJob ? "Gerando..." : "Gerar 10 copies"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista das Copies Geradas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#031A26]">
                  Copies Geradas ({copies.length})
                </h3>
                {copies.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCopies}
                    className="text-xs text-[#5E727C] hover:text-[#031A26] underline underline-offset-4 font-medium transition-colors cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {copies.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-[#DCE1E3] text-[#5E727C] text-xs">
                  Nenhuma copy gerada ainda. Digite um tema acima e clique em <strong>Gerar Copywriting</strong>.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {copies.map((copy, index) => (
                    <div
                      key={copy.id}
                      className="bg-white p-5 rounded-xl border border-[#DCE1E3] shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#031A26] text-[#B9915B]">
                            Ângulo {index + 1}: {copy.angle || "Estratégico"}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {copy.status === "approved" ? "Aprovada" : "Rascunho"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#031A26] mb-2">
                          {copy.title}
                        </h4>

                        {copy.hook_spoken && (
                          <div className="p-2.5 rounded bg-[#FCFBF9] border border-[#B9915B]/30 mb-3">
                            <span className="text-[10px] font-bold text-[#B9915B] uppercase block mb-0.5">
                              Gancho (Primeiros 3s)
                            </span>
                            <p className="text-xs font-semibold text-[#031A26]">
                              "{copy.hook_spoken}"
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-[#031A26] leading-relaxed mb-4 max-h-56 overflow-y-auto space-y-2">
                          {formatCadence(copy.text).map((sentence, sIdx) => (
                            <p key={sIdx} className="m-0 leading-relaxed">
                              {sentence}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[#DCE1E3] pt-3 flex items-center justify-between">
                        <span className="text-xs text-[#5E727C] font-medium">
                          CTA: <strong>{copy.target_cta || selectedKeywords[0] || "MUNDOFIT"}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUseInEsteira({
                              titulo: copy.title,
                              briefing: copy.text,
                              hook: copy.hook_spoken,
                              cta: copy.target_cta || selectedKeywords[0] || "MUNDOFIT",
                            })}
                            className="text-xs font-semibold text-[#B9915B] hover:text-[#9A7443] transition-colors"
                          >
                            Usar na Esteira →
                          </button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(copy.text, copy.id)}
                            className="text-xs font-bold border-[#DCE1E3]"
                          >
                            {copiedId === copy.id ? "Copiado" : "Copiar Roteiro"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
