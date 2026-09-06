// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 TG
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LayoutGrid, Table as TableIcon, Filter, ExternalLink, Mic, Music } from "lucide-react";
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

type EdgeDef = {
  source: string;
  target: string;
  label: string;
  status: EvidenceStatus;
};

type Data = {
  profile: Profile | null;
  posts: Post[];
  copies: CopyItem[];
  transcripts?: Array<{ post_id?: string; text?: string; segments?: any[]; language?: string }>;
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

// 6 Documentos Markdown Oficiais (Memória da Cliente)
const VAULT_DOCS: Record<string, { title: string; category: string; content: string }> = {
  about: {
    title: "About Me: Thaix Santiago",
    category: "About Me",
    content: `# About Me: Thaix Santiago

> Dossiê mestre de apresentação, posicionamento e regras de negócio da criadora.

## Quem é Thaix Santiago
Influenciadora e criadora de conteúdo fitness focada em emagrecimento feminino através do Ritbox de baixo impacto. Seu perfil oficial (@thaix.santiago) reúne 417 mil seguidoras ativas e mais de 12 milhões de visualizações somadas.

## Proposta Única de Valor (UVP)
Perda de peso sem sofrimento para mulheres adultas que não têm tempo nem paciência para a musculação tradicional. O diferencial competitivo inegociável é o treino 100% de baixo impacto, realizado na sala de casa, sem saltos e sem dor no joelho.

## Pilares de Autoridade e Prova
1. Top 1 Viral: 6.601.593 plays e 33.266 comentários (Post Da_JAVQSCPu).
2. Top 2 Viral: 4.099.020 plays e 7.069 comentários (Post DauwjqVBoHh).
3. Top 3 Viral: 613.828 plays e 2.113 comentários (Post DcXgIputsre).

## Funil e Regras de Negócio
- Palavra-chave Mestre: MUNDOFIT (aciona automação ManyChat com entrega da aula completa no Direct).
- Formato das Copies: 20 a 40 segundos, frases curtas para teleprompter, gancho ativo nos primeiros 2 segundos.
- Tom de Voz: Enérgico, acolhedor ("meninas", "vem comigo", "sem pular", "na sala de casa").`,
  },
  identidade: {
    title: "Identidade: Thaix Santiago",
    category: "Identidade",
    content: `# Identidade: Thaix Santiago

> Registro mestre de posicionamento, autoridade e proposta única da criadora.

## Dados Confirmados
- Nome: Thaix Santiago (@thaix.santiago)
- Base Ativa: 417 mil seguidoras no Instagram
- Volume Observado: Mais de 12 milhões de visualizações somadas
- Nicho: Emagrecimento feminino através do Ritbox na sala de casa

## Proposta Única de Valor
Emagrecimento prático e descomplicado para mulheres reais que não têm tempo ou paciência para esteira e musculação tradicional. O diferencial é aliar música contagiante a exercícios de baixo impacto realizados na sala de casa.

## Pilares de Autoridade
1. Validação por Volume: Vídeos que ultrapassam 6.6M e 4.1M de visualizações orgânicas.
2. Método Seguro: Movimentos 100% sem saltos, permitindo que mulheres com dor nos joelhos ou sobrepeso treinem sem risco.
3. Comunidade Engajada: Mais de 50.000 comentários gerados nos vídeos de convite para aulas.`,
  },
  persona: {
    title: "Persona: Perfil e Dores Reais",
    category: "Persona",
    content: `# Persona: Perfil e Dores Reais

> Mapeamento da aluna ideal atendida pelo perfil e suas resistências cotidianas.

## Perfil da Aluna
- Gênero e Faixa Etária: Mulheres entre 28 e 55 anos.
- Contexto de Vida: Mães, rotina agitada, jornada dupla, falta de tempo para academia.
- Autoimagem: Sentem-se desconfortáveis no espelho e com roupas apertadas.

## Dores Centrais (Gatilhos de Atração)
1. Falta de Tempo: Impossibilidade de dedicar 1h a 2h diárias entre trânsito e permanência na academia.
2. Dores Articulares: Desconforto nos joelhos e lombar que impedem pular corda, correr ou agachar com peso.
3. Fricção com Academia: Vergonha do ambiente, medo de julgamentos e sensação de inadequação nos aparelhos.
4. Tédio e Desistência: Abandono recorrente de esteiras e dietas radicais punitivas.

## Desejos Primários
- Queimar calorias de forma divertida e leve.
- Fazer em 15 a 20 minutos dentro do quarto ou da sala.
- Recuperar disposição diária e autoestima.`,
  },
  tom: {
    title: "Tom: Voz e Estilo de Comunicação",
    category: "Tom",
    content: `# Tom: Voz e Estilo de Comunicação

> Diretrizes de linguagem, ritmo, entonação e postura comunicativa da Thaix.

## Postura Vocal
- Energia Contagiante: Sorridente, vibrante, com entusiasmo genuíno que transmite motivação imediata.
- Acolhedora e Empática: Fala de igual para igual, sem arrogância de atleta inalcançável.
- Firme e Confiante: Conduz o treino com autoridade amigável, incentivando a aluna a não desistir no meio da música.

## Vocabulário e Expressões Nativas
- Termos Habituais: "meninas", "na sala de casa", "sem pular", "sem dor no joelho", "vem comigo", "na batida da música".
- Comandos de Ação: "Comente MUNDOFIT", "salva esse vídeo", "compartilha com a amiga que precisa".
- Linguagem Corporal: Gestos enérgicos, olhar direto para a lente, movimento fluido sincronizado com o áudio.

## O Que Evitar
- Jargões técnicos de musculação (ex: "hipertrofia miofibrilar", "deficit calórico estrito").
- Tom punitivo ou de culpa.
- Introduções longas nos primeiros 3 segundos.`,
  },
  framework: {
    title: "Framework: Engenharia 80/20 dos Virais",
    category: "Framework",
    content: `# Framework: Engenharia 80/20 dos Virais

> Estrutura anatômica validada nos 3 posts campeões (6.6M, 4.1M e 613k plays).

## Anatomia do Roteiro de Alta Conversão

### 1. Gancho (0 a 3 segundos)
- Função: Quebrar o padrão visual e prender o scroll no primeiro instante.
- Padrão Desafio Musical: "Você consegue fazer essa música inteira sem parar?!" (6.6M plays).
- Padrão Ataque à Objeção: "Se quer emagrecer rápido comece fazer esse treino BAIXO IMPACTO sem dor no joelho." (4.1M plays).

### 2. Desenvolvimento / Corpo (4 a 30 segundos)
- Função: Demonstrar o movimento no ritmo do som, mantendo a sensação de facilidade e diversão.
- Hold Rate: Movimentação contínua com variações simples de braços e pernas, sem saltos.
- Narrativa Falada: Explicar em 2 frases por que o exercício queima calorias sem sobrecarregar articulações.

### 3. Mecânica de Conversão / CTA (Últimos 5 segundos)
- Função: Gerar volume massivo de comentários para sinalizar alto engajamento ao algoritmo do Instagram.
- Comando Direto: "Comente a palavra MUNDOFIT aqui embaixo que eu vou te mandar a aula completa no Direct agora mesmo."
- Entrega Automatizada: ManyChat enviando a aula gratuita no Direct, iniciando o funil de aquisição.`,
  },
  regras: {
    title: "Regras: Diretrizes Inegociáveis de Copywriting",
    category: "Regras",
    content: `# Regras: Diretrizes Inegociáveis de Copywriting

> Parâmetros obrigatórios para a geração de roteiros em nome de Thaix Santiago.

## Regras Estruturais
1. Ação nos Primeiros 2 Segundos: O vídeo deve iniciar com movimento corporal ativo e fala imediata, sem enrolação.
2. Duração Máxima de 40 Segundos: Manter o roteiro concentrado para preservar retenção elevada.
3. Teleprompter Amigável: Frases curtas, pontuação marcada e ritmo de fala conversacional.

## Regras de Conteúdo e Segurança
4. Zero Salto e Zero Impacto: Proibido sugerir pulos, corridas no lugar com impacto ou movimentos que agridam joelho e coluna.
5. Ambiente Sempre Doméstico: O contexto deve sempre reforçar que a aluna precisa apenas de um metro quadrado na sala de casa.
6. Palavra-Chave Obrigatória no CTA: Todo roteiro deve finalizar instruindo a comentar a palavra-chave oficial (padrão: MUNDOFIT) nos comentários.`,
  },
};

// 6 Grupos Operacionais de Memória
const GROUP_CONFIG: Record<
  MemoryGroup,
  { label: string; bg: string; fill: string; border: string; text: string }
> = {
  identidade: {
    label: "Identidade",
    bg: "bg-[#B9915B]/10",
    fill: "#B9915B",
    border: "border-[#B9915B]",
    text: "text-[#B9915B]",
  },
  audiencia: {
    label: "Audiência",
    bg: "bg-[#1E3A5F]/15",
    fill: "#1E3A5F",
    border: "border-[#1E3A5F]",
    text: "text-[#93C5FD]",
  },
  acervo: {
    label: "Acervo",
    bg: "bg-[#031A26]/10",
    fill: "#031A26",
    border: "border-white/40",
    text: "text-white",
  },
  estrutura: {
    label: "Estruturas",
    bg: "bg-[#C5A880]/15",
    fill: "#C5A880",
    border: "border-[#C5A880]",
    text: "text-[#C5A880]",
  },
  validacao: {
    label: "Validação",
    bg: "bg-[#8C6D3B]/15",
    fill: "#8C6D3B",
    border: "border-[#8C6D3B]",
    text: "text-[#D4AF37]",
  },
  producao: {
    label: "Produção",
    bg: "bg-[#D4AF37]/15",
    fill: "#D4AF37",
    border: "border-[#D4AF37]",
    text: "text-[#D4AF37]",
  },
};

function ProfilePage() {
  const [project] = useState("01M1SAXW27GVCP7QF6EYY7PSQN");
  const [tab, setTab] = useState<"geral" | "memoria" | "acervo" | "copies">("geral");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados da Memória e Dossiê Relacional
  const [selectedGroup, setSelectedGroup] = useState<string>("Todos");
  const [selectedNodeId, setSelectedNodeId] = useState<string>("mem_prod_ad98");
  const [searchQuery, setSearchQuery] = useState("");
  const [memoriaSubView, setMemoriaSubView] = useState<"grafo" | "docs">("grafo");
  const [selectedVaultDoc, setSelectedVaultDoc] = useState<string>("about");
  const [hoveredEdge, setHoveredEdge] = useState<EdgeDef | null>(null);

  // Estados da Aba Dados (Notion-style)
  const [dadosView, setDadosView] = useState<"gallery" | "table">("gallery");
  const [dadosFilter, setDadosFilter] = useState<"all" | "top" | "speech" | "comments">("all");

  // Estados do Gerador Estratégico
  const [inputText, setInputText] = useState("");
  const [targetCta, setTargetCta] = useState("MUNDOFIT");

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
      const hasSpeech = Boolean(t.text && t.text.trim().length > 15);
      if (pid) map.set(pid, hasSpeech);
    });
    map.set("Dce8x59SSP2", true);
    map.set("Dcv2Yt4RBmX", true);
    return map;
  }, [data?.transcripts]);

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
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  async function handleGenerateCopies() {
    if (!inputText.trim()) {
      setError("Digite um tema ou briefing para gerar as 10 copies.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post(`${endpoint}/strategic-copies`, {
        json: {
          input_text: inputText.trim(),
          target_cta: targetCta.trim() || "MUNDOFIT",
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["client-profile", project] });
      setNotice("Processamento iniciado no servidor.");
      setTab("copies");
    } catch (e: unknown) {
      let detail = "Não foi possível gerar copies. Tente novamente.";
      const resp = (e as { response?: Response }).response;
      if (resp) {
        const payload = await resp.clone().json().catch(() => null);
        if (typeof payload?.detail === "string") detail = payload.detail;
      }
      setError(detail);
    } finally {
      setBusy(false);
    }
  }

  // Carregamento 100% dinâmico dos Itens da Memória da API
  const memoryItems = useMemo<MemoryItem[]>(() => {
    if (!data?.memory_items || data.memory_items.length === 0) {
      return [];
    }
    return data.memory_items.map((item, idx) => {
      const col = item.coluna ?? 1;
      const defaultX = col === 1 ? 130 : col === 2 ? 380 : col === 3 ? 630 : 855;
      return {
        ...item,
        x: item.x ?? defaultX,
        y: item.y ?? (85 + (idx % 7) * 85),
        r: item.r ?? 22,
        coluna: col,
        blocos_de_copy: item.blocos_de_copy ?? [],
        relacoes: item.relacoes ?? [],
      };
    });
  }, [data?.memory_items]);

  // Carregamento 100% dinâmico das Relações da API
  const edgesList = useMemo<EdgeDef[]>(() => {
    if (data?.relations && data.relations.length > 0) {
      return data.relations.map((r) => ({
        source: r.source_id,
        target: r.target_id,
        label: r.relation_type,
        status: (r.status as EvidenceStatus) || "observado",
      }));
    }
    return [];
  }, [data?.relations]);

  // Filtragem dos Itens por Grupo, Evidência, Validação e Busca
  const filteredItems = useMemo(() => {
    return memoryItems.filter((item) => {
      let matchFilter = true;
      if (selectedGroup === "Todos") {
        matchFilter = true;
      } else if (["observado", "inferido", "hipotese", "bloqueado"].includes(selectedGroup)) {
        matchFilter = item.status_de_evidencia === selectedGroup;
      } else if (selectedGroup === "client_approved") {
        matchFilter = item.status_de_validacao === "client_approved" || item.status_de_validacao === "aprovado";
      } else if (selectedGroup === "commercially_validated") {
        matchFilter = item.status_de_validacao === "commercially_validated";
      } else if (selectedGroup === "sem_validacao") {
        matchFilter = item.status_de_validacao === "sem_validacao";
      } else {
        matchFilter = item.tipo === selectedGroup;
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchFilter;
      const matchSearch =
        item.id.toLowerCase().includes(q) ||
        item.alias.toLowerCase().includes(q) ||
        item.titulo.toLowerCase().includes(q) ||
        item.texto_resumo.toLowerCase().includes(q) ||
        (item.cta && item.cta.toLowerCase().includes(q));
      return matchFilter && matchSearch;
    });
  }, [memoryItems, selectedGroup, searchQuery]);

  const activeItem = useMemo<MemoryItem | undefined>(() => {
    if (memoryItems.length === 0) return undefined;
    return memoryItems.find((m) => m.id === selectedNodeId) || memoryItems[0];
  }, [memoryItems, selectedNodeId]);

  const { connectedNodeIds, activeEdges } = useMemo(() => {
    const ids = new Set<string>();
    const edges: EdgeDef[] = [];
    if (!activeItem) return { connectedNodeIds: ids, activeEdges: edges };
    edgesList.forEach((edge) => {
      if (edge.source === activeItem.id) {
        ids.add(edge.target);
        edges.push(edge);
      } else if (edge.target === activeItem.id) {
        ids.add(edge.source);
        edges.push(edge);
      }
    });
    return { connectedNodeIds: ids, activeEdges: edges };
  }, [activeItem, edgesList]);

  const activeDoc = useMemo(() => {
    if (selectedVaultDoc && VAULT_DOCS[selectedVaultDoc]) {
      return VAULT_DOCS[selectedVaultDoc];
    }
    if (!activeItem) return VAULT_DOCS.about;
    if (activeItem.tipo === "identidade") return VAULT_DOCS.identidade;
    if (activeItem.tipo === "audiencia") return VAULT_DOCS.persona;
    if (activeItem.tipo === "estrutura") return VAULT_DOCS.framework;
    if (activeItem.tipo === "producao") return VAULT_DOCS.regras;
    return VAULT_DOCS.about;
  }, [selectedVaultDoc, activeItem?.tipo]);

  function handleUseAd98InGenerator() {
    setInputText(
      "Ativo Validado AD 98: Desafio musical de ritmo com treino de baixo impacto na sala de casa, sem saltos e sem impacto nos joelhos. Foco em mulheres 28-55 anos com rotina sobrecarregada."
    );
    setTargetCta("MUNDOFIT");
    setTab("copies");
    setNotice("Briefing do AD 98 carregado no Gerador de Copies. Pronto para gerar 10 roteiros.");
  }

  return (
    <main className="tg-profile min-h-screen bg-[#F5F4F3] text-[#031A26] pb-16">
      {/* Header Executivo Nexus-Style */}
      <header className="border-b border-[#DCE1E3] bg-white px-8 py-5 mb-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-semibold bg-[#031A26] text-[#B9915B]">
                Perfil Estratégico
              </span>
              <span className="text-xs text-[#5E727C]">Central da Agência TG</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#031A26]">
              {profile.name || "THAIX | Emagrecimento Feminino & Ritbox"}
            </h1>
            <p className="text-sm text-[#5E727C]">
              DNA da criadora, mapa relacional de audiência e motor de copies 80/20.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-bold text-[#031A26]">
                @{profile.handle || "thaix.santiago"}
              </div>
              <div className="text-xs text-[#5E727C]">
                {profile.followers_display || "417 mil"} seguidoras • Base Ativa
              </div>
            </div>
            <div className="size-11 rounded-full bg-[#031A26] text-[#B9915B] font-bold text-sm grid place-items-center shadow-sm border border-[#B9915B]/40">
              TH
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 space-y-6">
        {/* Navegação por Abas Limpas */}
        <nav className="flex gap-8 border-b border-[#DCE1E3] bg-transparent pt-1">
          <button
            type="button"
            onClick={() => setTab("geral")}
            className={`pb-3 text-sm transition-colors border-b-2 ${
              tab === "geral"
                ? "border-[#031A26] text-[#031A26] font-bold"
                : "border-transparent text-[#5E727C] hover:text-[#031A26] font-medium"
            }`}
          >
            Geral
          </button>
          <button
            type="button"
            onClick={() => setTab("memoria")}
            className={`pb-3 text-sm transition-colors border-b-2 ${
              tab === "memoria"
                ? "border-[#031A26] text-[#031A26] font-bold"
                : "border-transparent text-[#5E727C] hover:text-[#031A26] font-medium"
            }`}
          >
            Memória
          </button>
          <button
            type="button"
            onClick={() => setTab("acervo")}
            className={`pb-3 text-sm transition-colors border-b-2 ${
              tab === "acervo"
                ? "border-[#031A26] text-[#031A26] font-bold"
                : "border-transparent text-[#5E727C] hover:text-[#031A26] font-medium"
            }`}
          >
            Dados
          </button>
          <button
            type="button"
            onClick={() => setTab("copies")}
            className={`pb-3 text-sm transition-colors border-b-2 ${
              tab === "copies"
                ? "border-[#031A26] text-[#031A26] font-bold"
                : "border-transparent text-[#5E727C] hover:text-[#031A26] font-medium"
            }`}
          >
            Copies
          </button>
        </nav>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        {notice && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {notice}
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
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
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
                      setMemoriaSubView("docs");
                      setSelectedVaultDoc("about");
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
                    <span>Dados ({posts.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("copies")}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#F5F4F3] text-[#031A26] border border-[#DCE1E3] hover:border-[#B9915B] transition-colors"
                  >
                    <span>10 Copies</span>
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
                </div>

                <div className="p-4 rounded-lg bg-[#F5F4F3] border border-[#DCE1E3]">
                  <h3 className="text-sm font-bold text-[#031A26] mb-1">4. Mecânica de Conversão (CTA)</h3>
                  <p className="text-xs text-[#031A26]/85 leading-relaxed">
                    Chamada orientada a palavra-chave nos comentários (ex: <strong>"MUNDOFIT"</strong>) com envio de aula completa e gratuita no Direct (estratégia nativa de automação ManyChat).
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ABA 2: MEMÓRIA (MAPA RELACIONAL DOS 5 TÓPICOS) */}
        {/* ABA 2: MEMÓRIA (DOSSIÊ RELACIONAL OPERACIONAL) */}
        {tab === "memoria" && (
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-[#DCE1E3] shadow-sm">
              {/* Header do Dossiê */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#031A26] text-[#B9915B]">
                      Memória Operacional
                    </span>
                    <span className="text-xs text-[#5E727C]">
                      Dossiê Relacional Verificado • 6 Grupos de Ativos
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#031A26]">
                    Memória Estratégica: Thaix Santiago
                  </h2>
                  <p className="text-xs text-[#5E727C]">
                    Contexto estruturado para geração de copies, roteiros e direcionamento criativo sem alucinação.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMemoriaSubView("grafo")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      memoriaSubView === "grafo"
                        ? "bg-[#031A26] text-white"
                        : "bg-[#F5F4F3] text-[#5E727C] hover:text-[#031A26]"
                    }`}
                  >
                    Dossiê Relacional (Grafo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoriaSubView("docs")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      memoriaSubView === "docs"
                        ? "bg-[#031A26] text-white"
                        : "bg-[#F5F4F3] text-[#5E727C] hover:text-[#031A26]"
                    }`}
                  >
                    Documentos Vault (.md)
                  </button>
                </div>
              </div>

              {/* Painel de Cobertura e KPIs Auditados da API (Tempo Real) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-[#FCFBF9] rounded-lg border border-[#B9915B]/30">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#B9915B]">
                    Acervo & Arquivos
                  </div>
                  <div className="text-base font-extrabold text-[#031A26] mt-0.5">
                    {data?.coverage_summary?.media_files_total ?? 0} de {data?.coverage_summary?.posts_total ?? 0} vídeos
                  </div>
                  <div className="text-[11px] text-[#5E727C]">
                    {data?.coverage_summary?.blocked_no_media_total ?? 0} sem arquivo de mídia
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C]">
                    Fala Auditada vs Música
                  </div>
                  <div className="text-base font-extrabold text-emerald-800 mt-0.5">
                    {data?.coverage_summary?.useful_speech_total ?? 0} com fala autêntica
                  </div>
                  <div className="text-[11px] text-[#5E727C]">
                    {data?.coverage_summary?.music_no_speech_total ?? 0} apenas música/ritmo
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C]">
                    Evidências da Memória
                  </div>
                  <div className="text-base font-extrabold text-[#031A26] mt-0.5">
                    {data?.coverage_summary?.observed_items_total ?? 0} fatos • {data?.coverage_summary?.inferred_items_total ?? 0} padrões
                  </div>
                  <div className="text-[11px] text-[#5E727C]">
                    {data?.coverage_summary?.hypotheses_total ?? 0} hipótese • {data?.coverage_summary?.blocked_items_total ?? 0} bloqueado
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C]">
                    Validação & Auditoria
                  </div>
                  <div className="text-base font-extrabold text-[#031A26] mt-0.5">
                    {data?.coverage_summary?.client_approved_total ?? 0} aprovados cliente
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {data?.coverage_summary?.validation_events_total ?? 0} auditorias • {data?.coverage_summary?.sensitive_claims_blocked_total ?? 0} claims retidos
                  </div>
                </div>
              </div>

              {/* Barra de Filtros por Evidência, Validação, Grupo e Busca */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 p-2 rounded-lg bg-[#F5F4F3] border border-[#DCE1E3]">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedGroup("Todos")}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedGroup === "Todos"
                        ? "bg-[#031A26] text-[#B9915B] shadow-sm"
                        : "bg-white text-[#5E727C] hover:text-[#031A26] border border-[#DCE1E3]"
                    }`}
                  >
                    Todos ({memoryItems.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGroup("observado")}
                    className={`px-2 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedGroup === "observado"
                        ? "bg-[#031A26] text-emerald-400 shadow-sm"
                        : "bg-white text-emerald-800 hover:text-[#031A26] border border-[#DCE1E3]"
                    }`}
                  >
                    ● Fatos ({data?.coverage_summary?.observed_items_total ?? 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGroup("inferido")}
                    className={`px-2 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedGroup === "inferido"
                        ? "bg-[#031A26] text-sky-400 shadow-sm"
                        : "bg-white text-sky-800 hover:text-[#031A26] border border-[#DCE1E3]"
                    }`}
                  >
                    ▲ Padrões ({data?.coverage_summary?.inferred_items_total ?? 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGroup("hipotese")}
                    className={`px-2 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedGroup === "hipotese"
                        ? "bg-[#031A26] text-amber-400 shadow-sm"
                        : "bg-white text-amber-800 hover:text-[#031A26] border border-[#DCE1E3]"
                    }`}
                  >
                    ◆ Hipóteses ({data?.coverage_summary?.hypotheses_total ?? 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGroup("client_approved")}
                    className={`px-2 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedGroup === "client_approved"
                        ? "bg-[#031A26] text-[#B9915B] shadow-sm"
                        : "bg-white text-[#031A26] hover:text-[#B9915B] border border-[#DCE1E3]"
                    }`}
                  >
                    ✓ Aprovados ({data?.coverage_summary?.client_approved_total ?? 0})
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGroup("sem_validacao")}
                    className={`px-2 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedGroup === "sem_validacao"
                        ? "bg-[#031A26] text-slate-300 shadow-sm"
                        : "bg-white text-slate-600 hover:text-[#031A26] border border-[#DCE1E3]"
                    }`}
                  >
                    ○ Sem Validação ({data?.coverage_summary?.sem_validacao_total ?? 0})
                  </button>

                  <div className="h-4 w-px bg-[#DCE1E3] mx-1" />

                  {(["identidade", "audiencia", "acervo", "estrutura", "validacao", "producao"] as const).map((grp) => {
                    const cfg = GROUP_CONFIG[grp];
                    const count = memoryItems.filter((m) => m.tipo === grp).length;
                    return (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setSelectedGroup(grp)}
                        className={`px-2 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          selectedGroup === grp
                            ? "bg-[#031A26] text-[#B9915B] shadow-sm"
                            : "bg-white text-[#5E727C] hover:text-[#031A26] border border-[#DCE1E3]"
                        }`}
                      >
                        <span
                          className="size-2 rounded-full inline-block"
                          style={{ backgroundColor: cfg.fill }}
                        />
                        {cfg.label} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="w-full md:w-72">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por ID, alias (ex: AD 98), CTA ou tema..."
                    className="h-8 text-xs bg-white border-[#DCE1E3]"
                  />
                </div>
              </div>

              {memoriaSubView === "grafo" ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Canvas SVG Interativo com 4 Colunas L-to-R (Evidências -> Padrões -> Validação -> Produção) */}
                  <div className="lg:col-span-7 bg-[#031A26] rounded-xl border border-[#B9915B]/30 p-2 shadow-inner relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#B9915B] uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded border border-white/10">
                        {filteredItems.length} nós no escopo
                      </span>
                      {selectedGroup !== "Todos" && (
                        <span className="text-[10px] font-bold text-white/90 bg-white/15 px-2 py-0.5 rounded">
                          Filtro: {GROUP_CONFIG[selectedGroup as MemoryGroup]?.label || selectedGroup}
                        </span>
                      )}
                    </div>

                    <div className="w-full h-[640px] relative">
                      <svg viewBox="0 0 980 740" className="w-full h-full select-none cursor-pointer">
                        <defs>
                          <pattern id="memoria-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.05)" />
                          </pattern>
                        </defs>
                        <rect width="980" height="740" fill="url(#memoria-grid)" />

                        {/* 4 Colunas Estruturais (Containers de Fluxo Esquerda -> Direita) */}
                        <g opacity="0.35">
                          {/* Coluna 1 */}
                          <rect x="20" y="20" width="220" height="700" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                          <text x="130" y="42" textAnchor="middle" fill="#B9915B" fontSize="10" fontWeight="700" letterSpacing="0.08em">
                            1. EVIDÊNCIAS & ORIGEM
                          </text>

                          {/* Coluna 2 */}
                          <rect x="260" y="20" width="230" height="700" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                          <text x="375" y="42" textAnchor="middle" fill="#C5A880" fontSize="10" fontWeight="700" letterSpacing="0.08em">
                            2. PADRÕES DE COPY
                          </text>

                          {/* Coluna 3 */}
                          <rect x="510" y="20" width="220" height="700" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                          <text x="620" y="42" textAnchor="middle" fill="#D4AF37" fontSize="10" fontWeight="700" letterSpacing="0.08em">
                            3. VALIDAÇÃO & HIPÓTESES
                          </text>

                          {/* Coluna 4 */}
                          <rect x="750" y="20" width="210" height="700" rx="10" fill="rgba(185,145,91,0.04)" stroke="rgba(185,145,91,0.25)" strokeWidth="1" />
                          <text x="855" y="42" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="700" letterSpacing="0.08em">
                            4. PRODUÇÃO OPERACIONAL
                          </text>
                        </g>

                        {/* Conexões (Edges Relacionais Dinâmicas com Semântica de Evidência) */}
                        <g>
                          {edgesList.map((edge, idx) => {
                            const sourceItem = memoryItems.find((n) => n.id === edge.source);
                            const targetItem = memoryItems.find((n) => n.id === edge.target);
                            if (!sourceItem || !targetItem) return null;

                            const isSelectedEdge =
                              sourceItem.id === selectedNodeId || targetItem.id === selectedNodeId;
                            const isHovered =
                              hoveredEdge?.source === edge.source && hoveredEdge?.target === edge.target;

                            // Estilo da Aresta: Sólida para fatos observados, Tracejada para inferências, Pontilhada para hipóteses
                            let dashArray = "none";
                            if (edge.status === "inferido") dashArray = "6,4";
                            if (edge.status === "hipotese") dashArray = "2,3";

                            const strokeColor = isSelectedEdge || isHovered ? "#B9915B" : "rgba(255, 255, 255, 0.18)";
                            const strokeW = isSelectedEdge || isHovered ? 2.4 : 1.2;
                            const opacity = isSelectedEdge || isHovered ? 1 : 0.45;

                            const midX = (sourceItem.x + targetItem.x) / 2;
                            const midY = (sourceItem.y + targetItem.y) / 2;

                            return (
                              <g
                                key={idx}
                                onMouseEnter={() => setHoveredEdge(edge)}
                                onMouseLeave={() => setHoveredEdge(null)}
                              >
                                <line
                                  x1={sourceItem.x}
                                  y1={sourceItem.y}
                                  x2={targetItem.x}
                                  y2={targetItem.y}
                                  stroke={strokeColor}
                                  strokeWidth={strokeW}
                                  strokeDasharray={dashArray}
                                  strokeOpacity={opacity}
                                />
                                {/* Rótulo da relação exibido apenas no foco/hover */}
                                {(isSelectedEdge || isHovered) && (
                                  <g transform={`translate(${midX}, ${midY})`}>
                                    <rect
                                      x={-((edge.label.length * 5.2) / 2 + 6)}
                                      y={-9}
                                      width={edge.label.length * 5.2 + 12}
                                      height={18}
                                      rx={4}
                                      fill="#031A26"
                                      stroke="#B9915B"
                                      strokeWidth={1}
                                    />
                                    <text
                                      x={0}
                                      y={3}
                                      textAnchor="middle"
                                      fill="#B9915B"
                                      fontSize="9"
                                      fontWeight="600"
                                      fontFamily="monospace"
                                    >
                                      {edge.label}
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}
                        </g>

                        {/* Vértices (Nós Operacionais com Cores e Tamanhos Semânticos) */}
                        <g>
                          {memoryItems.map((item) => {
                            const isSelected = item.id === selectedNodeId;
                            const isNeighbor = connectedNodeIds.has(item.id);
                            const isVisible = filteredItems.some((fi) => fi.id === item.id);
                            const isAD98 = item.id === "mem_prod_ad98";

                            if (!isVisible) return null;

                            const groupCfg = GROUP_CONFIG[item.tipo] || GROUP_CONFIG.identidade;
                            const fill = isSelected ? "#B9915B" : groupCfg.fill;

                            // Esmaecimento de nós fora da vizinhança direta quando um nó está selecionado
                            const nodeOpacity = isSelected || isNeighbor || selectedGroup !== "Todos" ? 1 : 0.25;

                            return (
                              <g
                                key={item.id}
                                onClick={() => setSelectedNodeId(item.id)}
                                className="transition-transform duration-150"
                              >
                                {isSelected && (
                                  <circle
                                    cx={item.x}
                                    cy={item.y}
                                    r={item.r + 7}
                                    fill="none"
                                    stroke="#B9915B"
                                    strokeWidth={2}
                                    strokeOpacity={0.7}
                                    className="animate-pulse"
                                  />
                                )}

                                {isAD98 && !isSelected && (
                                  <circle
                                    cx={item.x}
                                    cy={item.y}
                                    r={item.r + 4}
                                    fill="none"
                                    stroke="#D4AF37"
                                    strokeWidth={1.5}
                                    strokeDasharray="4,2"
                                    strokeOpacity={0.6}
                                  />
                                )}

                                <circle
                                  cx={item.x}
                                  cy={item.y}
                                  r={item.r}
                                  fill={fill}
                                  stroke={isSelected ? "#FFFFFF" : isNeighbor ? "#B9915B" : "rgba(255,255,255,0.4)"}
                                  strokeWidth={isSelected ? 2.8 : isAD98 ? 2.2 : 1.2}
                                  opacity={nodeOpacity}
                                />

                                {/* Texto do Nó (Legível sem Zoom) */}
                                <text
                                  x={item.x}
                                  y={item.y + item.r + 12}
                                  textAnchor="middle"
                                  fill={isSelected ? "#FFFFFF" : isNeighbor ? "#B9915B" : "rgba(255,255,255,0.85)"}
                                  fontSize={isSelected || isAD98 ? 11 : 9.5}
                                  fontWeight={isSelected || isAD98 ? 700 : 500}
                                  fontFamily="Plus Jakarta Sans, sans-serif"
                                  opacity={nodeOpacity}
                                >
                                  {item.alias}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      </svg>
                    </div>

                    {/* Barra de Legenda do Grafo */}
                    <div className="border-t border-white/10 pt-2 px-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-white/60">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white/80">Relações:</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 bg-[#B9915B]" /> Fato (Sólida)</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 border-b border-dashed border-[#B9915B]" /> Inferência (Tracejada)</span>
                        <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5 border-b border-dotted border-[#B9915B]" /> Hipótese (Pontilhada)</span>
                      </div>
                      <div className="text-[10px] text-[#B9915B]">
                        Clique em qualquer nó para focar e abrir o dossiê detalhado
                      </div>
                    </div>
                  </div>

                  {/* Painel Lateral: Dossiê Estruturado do Ativo Selecionado */}
                  {!activeItem ? (
                    <div className="lg:col-span-5 bg-[#F5F4F3] p-8 rounded-xl border border-[#DCE1E3] flex flex-col items-center justify-center text-center space-y-2">
                      <div className="size-10 rounded-full bg-[#031A26]/10 flex items-center justify-center text-lg text-[#B9915B]">●</div>
                      <div className="font-bold text-[#031A26]">Nenhum nó selecionado</div>
                      <div className="text-xs text-[#5E727C] max-w-xs">Clique em qualquer nó do grafo ou utilize a barra de busca para inspecionar o dossiê com fontes auditadas.</div>
                    </div>
                  ) : (
                    <div className="lg:col-span-5 bg-[#F5F4F3] p-5 rounded-xl border border-[#DCE1E3] flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        {/* Header do Ativo */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#031A26] text-[#B9915B]">
                              {GROUP_CONFIG[activeItem.tipo]?.label || activeItem.tipo}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                activeItem.status_de_evidencia === "observado"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : activeItem.status_de_evidencia === "inferido"
                                  ? "bg-sky-100 text-sky-800 border border-sky-300"
                                  : activeItem.status_de_evidencia === "bloqueado"
                                  ? "bg-rose-100 text-rose-800 border border-rose-300"
                                  : "bg-amber-100 text-amber-800 border border-amber-300"
                              }`}
                            >
                              {activeItem.status_de_evidencia === "observado"
                                ? "● Fato Observado"
                                : activeItem.status_de_evidencia === "inferido"
                                ? "▲ Inferência Fundamentada"
                                : activeItem.status_de_evidencia === "bloqueado"
                                ? "✖ Bloqueado (Mídia Ausente)"
                                : "◆ Hipótese em Teste"}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                activeItem.status_de_validacao === "client_approved" || activeItem.status_de_validacao === "aprovado"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : activeItem.status_de_validacao === "commercially_validated"
                                  ? "bg-blue-50 text-blue-800 border-blue-300"
                                  : activeItem.status_de_validacao === "em_teste"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-slate-100 text-slate-600 border-slate-300"
                              }`}
                            >
                              {activeItem.status_de_validacao === "client_approved" || activeItem.status_de_validacao === "aprovado"
                                ? "✓ Aprovado pelo Cliente"
                                : activeItem.status_de_validacao === "commercially_validated"
                                ? "★ Validado Comercialmente"
                                : activeItem.status_de_validacao === "em_teste"
                                ? "◆ Em Teste / Hipótese"
                                : "○ Sem Validação Comercial"}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-[#031A26]">
                            {activeItem.alias}
                          </h3>
                          <div className="text-xs font-semibold text-[#5E727C]">
                            {activeItem.titulo}
                          </div>
                        </div>

                        {/* 1. O QUE É */}
                        <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C] block mb-1">
                            1. O que é
                          </span>
                          <p className="text-xs text-[#031A26] leading-relaxed">
                            {activeItem.texto_resumo || "Sem descrição registrada."}
                          </p>
                        </div>

                        {/* 2. POR QUE IMPORTA */}
                        <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C] block mb-1">
                            2. Por que importa (Impacto Operacional)
                          </span>
                          <p className="text-xs text-[#031A26] leading-relaxed">
                            {activeItem.hipotese ||
                              (activeItem.tipo === "acervo"
                                ? "Evidência pública e verificável de volume que valida a retenção de público no Instagram."
                                : activeItem.tipo === "estrutura"
                                ? "Padrão anatômico reutilizável para compor novos roteiros de alta retenção."
                                : activeItem.tipo === "validacao"
                                ? "Métrica comprovada para separar teses vencedoras de meras suposições criativas."
                                : "Contexto mestre de posicionamento que orienta o tom e as diretrizes de copy.")}
                          </p>

                          {/* Destaque Especial para o Ativo Mestre AD 98 */}
                          {activeItem.id === "mem_prod_ad98" && (
                            <div className="mt-3 pt-3 border-t border-[#DCE1E3] space-y-2">
                              <div className="text-[11px] font-bold text-[#B9915B]">
                                Multiplicação em 10 Novas Copies
                              </div>
                              <div className="text-xs text-[#5E727C]">
                                Este ativo combina o gancho musical vencedor (6.6M plays), mecanismo sem saltos e CTA MUNDOFIT.
                              </div>
                              <Button
                                onClick={handleUseAd98InGenerator}
                                className="w-full bg-[#031A26] text-[#B9915B] hover:bg-[#031A26]/90 border border-[#B9915B]/40 text-xs font-bold py-2 mt-1"
                              >
                                Usar AD 98 no Gerador (10 Copies) →
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* 3. EVIDÊNCIAS & DADOS OBSERVADOS */}
                        <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C] block mb-2">
                            3. Evidências & Dados Verificados
                          </span>

                          {/* Métricas Reais se existirem */}
                          {activeItem.metricas && Object.keys(activeItem.metricas).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2 mb-3 p-2 bg-[#F5F4F3] rounded border border-[#DCE1E3]">
                              {activeItem.metricas.plays && (
                                <div>
                                  <span className="text-[10px] font-semibold text-[#5E727C] block">Plays Observados</span>
                                  <span className="text-xs font-bold text-[#031A26]">
                                    {Number(activeItem.metricas.plays).toLocaleString("pt-BR")}
                                  </span>
                                </div>
                              )}
                              {activeItem.metricas.comments && (
                                <div>
                                  <span className="text-[10px] font-semibold text-[#5E727C] block">Comentários</span>
                                  <span className="text-xs font-bold text-[#031A26]">
                                    {Number(activeItem.metricas.comments).toLocaleString("pt-BR")}
                                  </span>
                                </div>
                              )}
                              {activeItem.metricas.likes && (
                                <div>
                                  <span className="text-[10px] font-semibold text-[#5E727C] block">Curtidas</span>
                                  <span className="text-xs font-bold text-[#031A26]">
                                    {Number(activeItem.metricas.likes).toLocaleString("pt-BR")}
                                  </span>
                                </div>
                              )}
                              {activeItem.metricas.followers && (
                                <div>
                                  <span className="text-[10px] font-semibold text-[#5E727C] block">Seguidoras</span>
                                  <span className="text-xs font-bold text-[#031A26]">
                                    {activeItem.metricas.followers}
                                  </span>
                                </div>
                              )}
                              <div className="col-span-2 text-[10px] text-[#5E727C] pt-1 border-t border-[#DCE1E3]">
                                Data da observação: {activeItem.observado_em ? "05/09/2026" : "sem evidência registrada"}
                              </div>
                            </div>
                          ) : null}

                          {/* Transcrição de Áudio / Diagnóstico de Fala */}
                          {activeItem.copy_falada && (
                            <div className={`mb-3 p-2.5 rounded text-xs border ${
                              activeItem.copy_falada.includes("SEM FALA DISCURSIVA") || activeItem.copy_falada.includes("sem evidência de fala")
                                ? "bg-slate-50 border-slate-200 text-slate-700"
                                : "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                            }`}>
                              <span className={`font-bold block text-[10px] uppercase mb-0.5 ${
                                activeItem.copy_falada.includes("SEM FALA DISCURSIVA") || activeItem.copy_falada.includes("sem evidência de fala")
                                  ? "text-slate-600"
                                  : "text-emerald-800"
                              }`}>
                                {activeItem.copy_falada.includes("SEM FALA DISCURSIVA") || activeItem.copy_falada.includes("sem evidência de fala")
                                  ? "Diagnóstico de Áudio (Sem Fala Criadora)"
                                  : "Transcrição Autêntica de Fala (Faster Whisper)"}
                              </span>
                              {activeItem.copy_falada}
                            </div>
                          )}

                          {/* Blocos Anatômicos da Copy com Offsets, Timestamps e Compliance */}
                          {activeItem.blocos_de_copy && activeItem.blocos_de_copy.length > 0 ? (
                            <div className="space-y-2 mb-2">
                              <span className="text-[10px] font-bold text-[#5E727C] block">
                                Blocos Anatômicos da Copy (Offsets & Timestamps Auditados):
                              </span>
                              {activeItem.blocos_de_copy.map((bloco, bIdx) => {
                                const func = (bloco.funcao || bloco.role || "").toLowerCase();
                                const text = bloco.texto || bloco.literal_text || "";
                                const isBlocked = bloco.policy_status === "blocked_from_generator" || bloco.policy_status === "quarantined";
                                return (
                                <div
                                  key={bIdx}
                                  className={`p-2.5 rounded border text-xs leading-relaxed ${
                                    isBlocked
                                      ? "bg-rose-50 border-rose-300 text-[#031A26]"
                                      : func.includes("gancho")
                                      ? "bg-[#FCFBF9] border-[#B9915B]/50 text-[#031A26]"
                                      : func.includes("mecanismo") || func.includes("promessa")
                                      ? "bg-[#F0F7FF] border-[#0B3345]/30 text-[#031A26]"
                                      : func.includes("cta")
                                      ? "bg-[#FFFBEB] border-amber-400 text-[#031A26]"
                                      : "bg-[#F8FAFC] border-slate-300 text-[#031A26]"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#B9915B]">
                                      {bloco.funcao || bloco.role || "bloco"}
                                    </span>
                                    <span className="text-[9px] font-mono text-[#5E727C]">
                                      {bloco.status}
                                    </span>
                                  </div>

                                  {isBlocked && (
                                    <div className="mb-1.5 px-2 py-0.5 rounded bg-rose-100 border border-rose-300 text-[10px] font-semibold text-rose-900 flex items-center gap-1">
                                      <span>⚠️ RETIDO COMPLIANCE:</span>
                                      <span>{bloco.policy_reason || "Alegação sensível de saúde (bloqueado no gerador)"}</span>
                                    </div>
                                  )}

                                  <div className="font-medium">"{text}"</div>

                                  {/* Rastreabilidade Exata: Caracteres e Áudio */}
                                  <div className="mt-1.5 pt-1.5 border-t border-black/5 flex flex-wrap items-center gap-2 text-[10px] text-[#5E727C] font-mono">
                                    {bloco.start_char != null && bloco.end_char != null && (
                                      <span className="bg-white/80 px-1.5 py-0.5 rounded border border-black/10">
                                        legenda chars: [{bloco.start_char}..{bloco.end_char}]
                                      </span>
                                    )}
                                    {bloco.start_sec != null && bloco.end_sec != null && (
                                      <span className="bg-white/80 px-1.5 py-0.5 rounded border border-black/10 text-emerald-800">
                                        áudio: [{bloco.start_sec}s → {bloco.end_sec}s]
                                      </span>
                                    )}
                                    {bloco.source_ids && bloco.source_ids.length > 0 && (
                                      <span className="text-slate-500">
                                        fonte: {bloco.source_ids.join(", ")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          ) : null}

                          {/* Caso não haja métricas nem blocos */}
                          {(!activeItem.metricas || Object.keys(activeItem.metricas).length === 0) &&
                            (!activeItem.blocos_de_copy || activeItem.blocos_de_copy.length === 0) &&
                            !activeItem.copy_falada && (
                              <div className="text-xs text-[#5E727C] italic">
                                Sem evidência direta registrada. Nó de diretriz ou hipótese.
                              </div>
                            )}
                        </div>

                        {/* 4. CONEXÕES RELACIONAIS */}
                        <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C] block mb-2">
                            4. Conexões Relacionais ({activeEdges.length})
                          </span>
                          {activeEdges.length === 0 ? (
                            <div className="text-xs text-[#5E727C] italic">
                              Nenhuma conexão mapeada neste nó.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              {activeEdges.map((edge, eIdx) => {
                                const otherId = edge.source === activeItem.id ? edge.target : edge.source;
                                const otherItem = memoryItems.find((m) => m.id === otherId);
                                if (!otherItem) return null;
                                return (
                                  <button
                                    key={eIdx}
                                    type="button"
                                    onClick={() => setSelectedNodeId(otherItem.id)}
                                    className="flex items-center justify-between p-2 rounded bg-[#F5F4F3] hover:bg-[#031A26] hover:text-[#B9915B] text-left border border-[#DCE1E3] transition-colors group text-xs"
                                  >
                                    <div>
                                      <span className="font-bold block text-[#031A26] group-hover:text-[#B9915B]">
                                        {otherItem.alias}
                                      </span>
                                      <span className="text-[10px] text-[#5E727C] group-hover:text-white/80 font-mono">
                                        {edge.label} • {edge.status}
                                      </span>
                                    </div>
                                    <span className="text-xs font-bold text-[#B9915B]">→</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 5. FONTE & RASTREABILIDADE */}
                        <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C] block mb-1">
                            5. Fonte & Rastreabilidade
                          </span>
                          <div className="text-xs text-[#5E727C] space-y-1">
                            <div>
                              Fonte Oficial:{" "}
                              {activeItem.fonte_url ? (
                                <a
                                  href={activeItem.fonte_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#B9915B] font-bold hover:underline"
                                >
                                  Instagram Oficial ↗
                                </a>
                              ) : (
                                "Registro interno do projeto"
                              )}
                            </div>
                            {activeItem.post_id && (
                              <div>Post ID: <span className="font-mono text-[#031A26]">{activeItem.post_id}</span></div>
                            )}
                            <div>Versão do esquema: v{activeItem.versao}</div>
                          </div>
                        </div>

                        {/* 6. EVENTOS DE AUDITORIA & VALIDAÇÃO */}
                        <div className="p-3 bg-white rounded-lg border border-[#DCE1E3]">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E727C]">
                              6. Auditoria & Validações ({data?.validation_events?.length ?? 0})
                            </span>
                            <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              0 validation_event = 0 aprovação
                            </span>
                          </div>
                          {(!data?.validation_events || data.validation_events.length === 0) ? (
                            <div className="text-xs text-[#5E727C] italic">
                              Nenhum evento de validação registrado para este projeto.
                            </div>
                          ) : (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {data.validation_events.map((evt) => (
                                <div key={evt.id} className="p-2 rounded bg-[#F8FAFC] border border-slate-200 text-xs">
                                  <div className="flex items-center justify-between font-mono text-[10px] text-[#5E727C]">
                                    <span className="font-bold text-[#031A26] uppercase">{evt.event_type}</span>
                                    <span>{evt.status} • {evt.created_at?.slice(0, 10)}</span>
                                  </div>
                                  <div className="text-[#031A26] text-[11px] mt-0.5 font-medium leading-tight">{evt.audit_log}</div>
                                  <div className="text-[10px] text-[#5E727C] mt-1 flex items-center justify-between pt-1 border-t border-slate-100">
                                    <span>Alvo: <strong className="font-mono">{evt.target_id}</strong> ({evt.previous_status} → {evt.new_status})</span>
                                    <span>Por: {evt.decided_by}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acesso Secundário ao Markdown Completo */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (activeItem) {
                            if (activeItem.tipo === "identidade") setSelectedVaultDoc("identidade");
                            else if (activeItem.tipo === "audiencia") setSelectedVaultDoc("persona");
                            else if (activeItem.tipo === "estrutura") setSelectedVaultDoc("framework");
                            else if (activeItem.tipo === "producao") setSelectedVaultDoc("regras");
                            else setSelectedVaultDoc("about");
                          } else {
                            setSelectedVaultDoc("about");
                          }
                          setMemoriaSubView("docs");
                        }}
                        className="w-full text-xs font-bold mt-2 border-[#DCE1E3] bg-white text-[#031A26]"
                      >
                        Ver Documento Vault Completo ({activeDoc.title})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* Subview dos Documentos Vault (.md) */
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {Object.entries(VAULT_DOCS).map(([key, doc]) => {
                      const isSelected = selectedVaultDoc === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedVaultDoc(key)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "bg-[#031A26] text-white border-[#031A26] shadow-xs"
                              : "bg-white text-[#031A26] border-[#DCE1E3] hover:border-[#B9915B]"
                          }`}
                        >
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                              isSelected ? "text-[#B9915B]" : "text-[#5E727C]"
                            }`}
                          >
                            {doc.category}
                          </span>
                          <span className="text-xs font-bold block truncate">
                            {key}.md
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-[#F5F4F3] p-6 rounded-xl border border-[#DCE1E3]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#031A26] text-[#B9915B] mr-2">
                          {activeDoc.category}
                        </span>
                        <span className="text-sm font-bold text-[#031A26]">
                          {activeDoc.title}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMemoriaSubView("grafo")}
                        className="text-xs font-bold"
                      >
                        ← Voltar ao Dossiê Relacional
                      </Button>
                    </div>

                    <pre className="text-xs font-mono text-[#031A26] whitespace-pre-wrap bg-white p-6 rounded-xl border border-[#DCE1E3] leading-relaxed max-h-[500px] overflow-y-auto">
                      {activeDoc.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

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
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 backdrop-blur-xs border border-emerald-500/30">
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
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
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
                          <span title="Taxa de Engajamento" className="text-[#059669] font-medium">ER {er}%</span>
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
                            <td className="py-2.5 px-3 font-semibold text-[#059669]">
                              {er}%
                            </td>
                            <td className="py-2.5 px-3">
                              {hasSpeech ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#059669]">
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

        {/* ABA 4: COPIES */}
        {tab === "copies" && (
          <section className="space-y-6">
            {/* Box de Geração de 10 Copies */}
            <div className="bg-white p-6 rounded-xl border border-[#DCE1E3] shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[#031A26]">
                    Gerador Estratégico de Copies (Fórmula 80/20)
                  </h2>
                  <p className="text-xs text-[#5E727C]">
                    Insira um tema ou briefing. O motor gera 10 roteiros completos cobrindo os 10 ângulos virais comprovados da Thaix.
                  </p>
                </div>
                {runningJob && (
                  <span className="text-xs font-semibold px-3 py-1 rounded bg-[#F5F4F3] text-[#031A26] border border-[#DCE1E3] animate-pulse">
                    Processando com IA...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-[#031A26] mb-1">
                    Tema ou Briefing
                  </label>
                  <Textarea
                    placeholder="Ex: Treino rápido para quem passou dos 40 anos e quer secar a barriga sem forçar a lombar na sala de casa..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="text-xs"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="block text-xs font-bold text-[#031A26] mb-1">
                      Palavra-Chave do CTA
                    </label>
                    <Input
                      value={targetCta}
                      onChange={(e) => setTargetCta(e.target.value)}
                      placeholder="MUNDOFIT"
                      className="text-xs"
                    />
                  </div>
                  <Button
                    onClick={handleGenerateCopies}
                    disabled={busy || !inputText.trim() || !!runningJob}
                    className="w-full bg-[#031A26] text-white hover:bg-[#031A26]/90 text-xs font-bold py-2 mt-3"
                  >
                    {busy || runningJob ? "Gerando..." : "Gerar 10 Copies"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista das Copies Geradas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#031A26]">
                  Roteiros Gerados ({copies.length})
                </h3>
                <span className="text-xs text-[#5E727C]">
                  Prontos para gravação e teleprompter
                </span>
              </div>

              {copies.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-[#DCE1E3] text-[#5E727C] text-xs">
                  Nenhuma copy gerada ainda. Digite um tema acima e clique em <strong>Gerar 10 Copies</strong>.
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

                        <div className="text-xs text-[#031A26] whitespace-pre-wrap leading-relaxed mb-4 max-h-48 overflow-y-auto">
                          {copy.text}
                        </div>
                      </div>

                      <div className="border-t border-[#DCE1E3] pt-3 flex items-center justify-between">
                        <span className="text-xs text-[#5E727C] font-medium">
                          CTA: <strong>{copy.target_cta || targetCta}</strong>
                        </span>
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
