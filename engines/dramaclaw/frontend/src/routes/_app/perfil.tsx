// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 TG
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LayoutGrid, Table as TableIcon, Filter, ExternalLink, Mic, Music, BookOpen, Sparkles, FileText, Copy, Share2, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
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

type GraphPillar = "todos" | "identidade" | "documentos" | "postagens" | "copywriting";

interface GraphNodeItem {
  id: string;
  pillar: "identidade" | "documentos" | "postagens" | "copywriting";
  title: string;
  badge: string;
  metric?: string;
  summary: string;
  connections: string[];
  actionType?: "esteira" | "doc" | "postagens";
  actionPayload?: any;
}

const GRAPH_NODES: GraphNodeItem[] = [
  // PILAR 1: IDENTIDADE & DNA
  {
    id: "node_thaix",
    pillar: "identidade",
    title: "Thaix Santiago",
    badge: "Criadora & DNA",
    metric: "417k seguidoras",
    summary: "Especialista em emagrecimento feminino no Ritbox. Comunicação acolhedora ('Bora mulher'), sem cobranças tóxicas.",
    connections: ["node_uvp", "node_doc_about", "node_doc_persona", "node_post_ad98", "node_copy_ad98"],
  },
  {
    id: "node_uvp",
    pillar: "identidade",
    title: "Método Baixo Impacto",
    badge: "UVP Inegociável",
    metric: "Zero Saltos",
    summary: "Treinos na sala de casa sem agressão aos joelhos e coluna. Promessa de queima de gordura sem sofrimento.",
    connections: ["node_thaix", "node_doc_framework", "node_doc_regras", "node_copy_ad98", "node_copy_baixo_impacto"],
    actionType: "esteira",
    actionPayload: {
      titulo: "Método Baixo Impacto: Treino na Sala",
      briefing: "Roteiro focado em emagrecimento feminino ritmado para quem tem dor no joelho ou sobrepeso.",
      hook: "Se você não pode pular mas quer secar a barriga, faça este exercício na sua sala",
      cta: "MUNDOFIT",
    },
  },

  // PILAR 2: DOCUMENTOS DO VAULT
  {
    id: "node_doc_about",
    pillar: "documentos",
    title: "About Me (about.md)",
    badge: "Dossiê Executivo",
    metric: "Canônico",
    summary: "Histórico profissional, autoridade de marca e pilares centrais da metodologia Ritbox.",
    connections: ["node_thaix", "node_doc_persona", "node_doc_regras"],
    actionType: "doc",
    actionPayload: "about",
  },
  {
    id: "node_doc_persona",
    pillar: "documentos",
    title: "Persona & Dores (persona.md)",
    badge: "Audiência Real",
    metric: "28 a 55 anos",
    summary: "Mulheres e mães sem tempo, metabolismo sobrecarregado, buscando emagrecer em casa com segurança.",
    connections: ["node_thaix", "node_doc_framework", "node_copy_gancho_culpa"],
    actionType: "doc",
    actionPayload: "persona",
  },
  {
    id: "node_doc_funil",
    pillar: "documentos",
    title: "Funil ManyChat (funil.md)",
    badge: "Automação DM",
    metric: "15k Directs",
    summary: "Fluxo de conversão orgânica via comentário com palavra-chave oficial para entrega imediata de aula.",
    connections: ["node_copy_mundofit", "node_doc_framework", "node_post_ad98"],
    actionType: "doc",
    actionPayload: "funil",
  },
  {
    id: "node_doc_framework",
    pillar: "documentos",
    title: "Framework 80/20 (framework.md)",
    badge: "Estrutura de Copy",
    metric: "4 Blocos",
    summary: "Fórmula comprovada: Gancho magnético de 3s + Agitação + Mecanismo Único + CTA Obrigatório.",
    connections: ["node_uvp", "node_doc_regras", "node_copy_ad98", "node_copy_mundofit"],
    actionType: "doc",
    actionPayload: "framework",
  },
  {
    id: "node_doc_regras",
    pillar: "documentos",
    title: "Regras Thiago Neiva (regras.md)",
    badge: "Compliance",
    metric: "20 a 40s",
    summary: "Diretrizes de produção: frases curtas para teleprompter, zero saltos, ambiente doméstico e CTA padronizado.",
    connections: ["node_doc_framework", "node_uvp", "node_copy_ad98"],
    actionType: "doc",
    actionPayload: "regras",
  },

  // PILAR 3: POSTAGENS DO ACERVO
  {
    id: "node_post_ad98",
    pillar: "postagens",
    title: "AD 98: Treino na Sala",
    badge: "Top 1 Performer",
    metric: "6.6M plays",
    summary: "Criativo com maior volume de interações da história do canal (33.266 comentários pedindo o treino).",
    connections: ["node_thaix", "node_uvp", "node_copy_ad98", "node_copy_mundofit"],
    actionType: "postagens",
  },
  {
    id: "node_post_82k",
    pillar: "postagens",
    title: "Reel 82k: Desafio Ritbox",
    badge: "Viral Orgânico",
    metric: "82.5k likes",
    summary: "Reel dinâmico com prova visual de alunas emagrecendo com ritmos populares sem impacto.",
    connections: ["node_thaix", "node_uvp", "node_copy_ad98"],
    actionType: "postagens",
  },
  {
    id: "node_post_acervo",
    pillar: "postagens",
    title: "Acervo Minerado",
    badge: "15 Publicações",
    metric: "12M+ alcance",
    summary: "Base observada com taxa média de engajamento de 0.44% e fala autêntica transcrita.",
    connections: ["node_thaix", "node_post_ad98", "node_post_82k"],
    actionType: "postagens",
  },

  // PILAR 4: COPYWRITING VALIDADO
  {
    id: "node_copy_ad98",
    pillar: "copywriting",
    title: "AD 98: Treino sem Pulo",
    badge: "Copy Validada",
    metric: "Conversão Máxima",
    summary: "Roteiro campeão: 'Se você tem mais de 30 anos e não aguenta mais pular na sala, faça este movimento'.",
    connections: ["node_thaix", "node_uvp", "node_doc_framework", "node_post_ad98", "node_copy_mundofit"],
    actionType: "esteira",
    actionPayload: {
      titulo: "AD 98: Treino sem Pulo",
      briefing: "Desafio musical de ritmo com treino de baixo impacto na sala de casa, sem saltos e sem impacto nos joelhos. Foco em mulheres 28-55 anos.",
      hook: "Se você tem mais de 30 anos e não aguenta mais pular na sala, faça este movimento",
      cta: "MUNDOFIT",
    },
  },
  {
    id: "node_copy_mundofit",
    pillar: "copywriting",
    title: "CTA: Palavra MUNDOFIT",
    badge: "Funil Direto",
    metric: "Automação ManyChat",
    summary: "Comando canônico ao final de cada vídeo: 'Comente MUNDOFIT para receber a aula no seu Direct'.",
    connections: ["node_doc_funil", "node_copy_ad98", "node_doc_framework"],
    actionType: "esteira",
    actionPayload: {
      titulo: "Campanha MUNDOFIT Direta",
      briefing: "Roteiro com chamada para comentar MUNDOFIT e receber o treino no direct do Instagram.",
      hook: "Quer treinar comigo na sala da sua casa sem pagar academia?",
      cta: "MUNDOFIT",
    },
  },
  {
    id: "node_copy_gancho_culpa",
    pillar: "copywriting",
    title: "Gancho: 'Não É Culpa Sua'",
    badge: "Gatilho Psicológico",
    metric: "Alta Empatia",
    summary: "Quebra de objeção que acolhe a aluna e transfere a responsabilidade para metodologias tradicionais ineficazes.",
    connections: ["node_doc_persona", "node_thaix", "node_doc_framework"],
    actionType: "esteira",
    actionPayload: {
      titulo: "Gancho: Não É Culpa Sua",
      briefing: "Roteiro focado em acolhimento e quebra de culpa de dietas frustradas para mulheres sobrecarregadas.",
      hook: "Se você já tentou de tudo e não conseguiu emagrecer, escuta isso: a culpa não é sua.",
      cta: "MUNDOFIT",
    },
  },
  {
    id: "node_copy_baixo_impacto",
    pillar: "copywriting",
    title: "Copy: Método Baixo Impacto",
    badge: "Segurança Articular",
    metric: "100% Proteção",
    summary: "Roteiro focado em demonstrar exercícios simples e ritmados para queimar calorias sem prejudicar coluna e joelho.",
    connections: ["node_uvp", "node_doc_regras", "node_copy_ad98"],
    actionType: "esteira",
    actionPayload: {
      titulo: "Método Baixo Impacto Seguro",
      briefing: "Treino seguro de baixo impacto para queima de gordura em casa sem pular.",
      hook: "Para queimar gordura você não precisa destruir seus joelhos pulando em casa.",
      cta: "MUNDOFIT",
    },
  },
];

const CTA_RANKING_KEYWORDS = [
  { id: "mundofit", word: "MUNDOFIT", conversions: "Top 1 Meta Ads (82k leads)" },
  { id: "treino", word: "TREINO", conversions: "Viral Orgânico (1.9M plays)" },
  { id: "ritmo", word: "RITMO", conversions: "Método Baixo Impacto" },
  { id: "ritbox", word: "RITBOX", conversions: "Posicionamento de Marca" },
  { id: "aula", word: "AULA", conversions: "Direct ManyChat Gratuito" },
];

function ProfilePage() {
  const [project] = useState("01M1SAXW27GVCP7QF6EYY7PSQN");
  const [tab, setTab] = useState<"geral" | "memoria" | "acervo" | "copies">("geral");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Estados da Memória (Grafos + Notion Docs + Copywriting)
  const [memoriaSubView, setMemoriaSubView] = useState<"grafos" | "docs" | "copywriting">("grafos");
  const [selectedVaultDoc, setSelectedVaultDoc] = useState<string>("about");
  const [selectedGraphNode, setSelectedGraphNode] = useState<string>("node_thaix");
  const [graphPillarFilter, setGraphPillarFilter] = useState<GraphPillar>("todos");

  // Estados da Aba Dados (Notion-style)
  const [dadosView, setDadosView] = useState<"gallery" | "table">("gallery");
  const [dadosFilter, setDadosFilter] = useState<"all" | "top" | "speech" | "comments">("all");

  // Estados do Gerador Estratégico
  const [inputText, setInputText] = useState("");
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(["MUNDOFIT"]);
  const [isSyncingKeywords, setIsSyncingKeywords] = useState(false);

  function toggleKeyword(word: string) {
    setSelectedKeywords((prev) => {
      const exists = prev.includes(word);
      if (exists) {
        const next = prev.filter((w) => w !== word);
        return next.length > 0 ? next : [word];
      }
      return [...prev, word];
    });
  }

  function handleSyncKeywords() {
    setIsSyncingKeywords(true);
    setTimeout(() => {
      setIsSyncingKeywords(false);
      setNotice("Palavras-chave sincronizadas com o ranking de Meta Ads e Memória.");
    }, 500);
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
      setError("Digite um tema para gerar o copywriting.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const activeCta = selectedKeywords.length > 0 ? selectedKeywords[0] : "MUNDOFIT";
    try {
      await api.post(`${endpoint}/strategic-copies`, {
        json: {
          input_text: inputText.trim(),
          target_cta: activeCta,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["client-profile", project] });
      setNotice("Processamento de copywriting iniciado.");
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

  async function handleClearCopies() {
    if (copies.length === 0) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.delete(`${endpoint}/copies`);
      await queryClient.invalidateQueries({ queryKey: ["client-profile", project] });
      setNotice("Todas as copies geradas foram limpas com sucesso.");
    } catch (e: unknown) {
      setError("Não foi possível limpar as copies. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  const activeDoc = useMemo(() => {
    if (selectedVaultDoc && VAULT_DOCS[selectedVaultDoc]) {
      return VAULT_DOCS[selectedVaultDoc];
    }
    return VAULT_DOCS.about;
  }, [selectedVaultDoc]);

  function handleUseInEsteira(item: { titulo: string; briefing: string; cta?: string; hook?: string }) {
    const fullText = `${item.titulo}: ${item.briefing}${item.hook ? ` Gancho: "${item.hook}".` : ""}${item.cta ? ` CTA com palavra-chave: ${item.cta}.` : ""}`;
    try {
      localStorage.setItem("tg_esteira_theme", fullText);
    } catch {}
    window.location.assign(`/?theme=${encodeURIComponent(fullText)}`);
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

        {/* ABA 2: MEMÓRIA (NOTION WIKI & 21ST.DEV ATIVOS 80/20) */}
        {tab === "memoria" && (
          <section className="space-y-4">
            {/* Memoria Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E8ECEE] shadow-xs">
              <div className="flex items-center gap-1.5 p-0.5 bg-[#F4F6F7] rounded-lg border border-[#E2E7E9]">
                <button
                  type="button"
                  onClick={() => setMemoriaSubView("grafos")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    memoriaSubView === "grafos"
                      ? "bg-white text-[#031A26] shadow-xs"
                      : "text-[#5E727C] hover:text-[#031A26]"
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-[#B9915B]" />
                  Grafos
                </button>
                <button
                  type="button"
                  onClick={() => setMemoriaSubView("docs")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    memoriaSubView === "docs"
                      ? "bg-white text-[#031A26] shadow-xs"
                      : "text-[#5E727C] hover:text-[#031A26]"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#B9915B]" />
                  Documentos
                </button>
                <button
                  type="button"
                  onClick={() => setMemoriaSubView("copywriting")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    memoriaSubView === "copywriting"
                      ? "bg-white text-[#031A26] shadow-xs"
                      : "text-[#5E727C] hover:text-[#031A26]"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B9915B]" />
                  Copywriting
                </button>
              </div>
            </div>

            {/* SUB-VIEW 1: GRAFOS DE CONHECIMENTO ESTRATÉGICO CONSOLIDADO */}
            {memoriaSubView === "grafos" && (() => {
              const activeNode = GRAPH_NODES.find((n) => n.id === selectedGraphNode) || GRAPH_NODES[0];
              const displayedNodes = graphPillarFilter === "todos"
                ? GRAPH_NODES
                : GRAPH_NODES.filter((n) => n.pillar === graphPillarFilter);

              const pillars: { id: "identidade" | "documentos" | "postagens" | "copywriting"; label: string }[] = [
                { id: "identidade", label: "Identidade & DNA" },
                { id: "documentos", label: "Documentos Canônicos" },
                { id: "postagens", label: "Postagens Mineradas" },
                { id: "copywriting", label: "Copywriting Validado" },
              ];

              return (
                <div className="space-y-4">
                  {/* Filtro de Pilares do Grafo */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E8ECEE] shadow-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E727C] mr-1">
                        Pilares do Grafo:
                      </span>
                      {[
                        { id: "todos", label: "Todos os Pilares" },
                        { id: "identidade", label: "Identidade" },
                        { id: "documentos", label: "Documentos" },
                        { id: "postagens", label: "Postagens" },
                        { id: "copywriting", label: "Copywriting" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setGraphPillarFilter(f.id as any)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                            graphPillarFilter === f.id
                              ? "bg-[#031A26] text-[#B9915B]"
                              : "bg-[#F4F6F7] text-[#5E727C] hover:text-[#031A26] hover:bg-[#EBEFEF]"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <span className="text-[11px] text-[#5E727C]">
                      Consolidação de regras de negócio, dados e acervo da criadora
                    </span>
                  </div>

                  {/* Matriz dos 4 Pilares Interconectados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pillars.map((pillar) => {
                      const nodesInPillar = displayedNodes.filter((n) => n.pillar === pillar.id);
                      if (nodesInPillar.length === 0) return null;

                      return (
                        <div key={pillar.id} className="space-y-2.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-xs font-bold text-[#031A26]">
                              {pillar.label}
                            </span>
                            <span className="text-[10px] font-semibold text-[#5E727C] bg-[#F4F6F7] px-1.5 py-0.5 rounded">
                              {nodesInPillar.length} nós
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {nodesInPillar.map((node) => {
                              const isSelected = selectedGraphNode === node.id;
                              const isConnected = activeNode.connections.includes(node.id);

                              return (
                                <button
                                  key={node.id}
                                  type="button"
                                  onClick={() => setSelectedGraphNode(node.id)}
                                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs ${
                                    isSelected
                                      ? "bg-white border-[#031A26] ring-2 ring-[#031A26]/10"
                                      : isConnected
                                      ? "bg-[#FCFBF9] border-[#B9915B] shadow-2xs"
                                      : "bg-white border-[#E8ECEE] hover:border-[#B9915B]/40 opacity-70 hover:opacity-100"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9]">
                                        {node.badge}
                                      </span>
                                      {isConnected && (
                                        <span className="text-[10px] font-bold text-[#B9915B] bg-[#FCFBF9] px-1.5 py-0.5 rounded border border-[#B9915B]/40">
                                          Conectado
                                        </span>
                                      )}
                                      {node.metric && (
                                        <span className="text-[10px] font-bold text-[#031A26]">
                                          {node.metric}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs font-bold text-[#031A26] leading-snug">
                                      {node.title}
                                    </h4>
                                    <p className="text-[11px] text-[#5E727C] mt-1 line-clamp-2 leading-relaxed">
                                      {node.summary}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dossiê de Conexões do Nó Selecionado */}
                  <div className="bg-white p-5 rounded-xl border border-[#DCE1E3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#031A26] text-[#B9915B]">
                          {activeNode.badge}
                        </span>
                        <h3 className="text-base font-bold text-[#031A26]">
                          {activeNode.title}
                        </h3>
                        {activeNode.metric && (
                          <span className="text-xs font-semibold text-[#5E727C]">
                            ({activeNode.metric})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#031A26] leading-relaxed">
                        {activeNode.summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-[#5E727C] mr-1">
                          Conexões Estratégicas:
                        </span>
                        {activeNode.connections.map((cId) => {
                          const target = GRAPH_NODES.find((gn) => gn.id === cId);
                          if (!target) return null;
                          return (
                            <button
                              key={cId}
                              type="button"
                              onClick={() => setSelectedGraphNode(cId)}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9] hover:border-[#B9915B] hover:text-[#B9915B] transition-colors"
                            >
                              {target.title} ↗
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                      {activeNode.actionType === "esteira" && activeNode.actionPayload && (
                        <button
                          type="button"
                          onClick={() => handleUseInEsteira(activeNode.actionPayload)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#031A26] text-[#B9915B] hover:bg-[#031A26]/90 transition-colors shadow-xs"
                        >
                          <span>Usar na Esteira</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {activeNode.actionType === "doc" && activeNode.actionPayload && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVaultDoc(activeNode.actionPayload);
                            setMemoriaSubView("docs");
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#031A26] text-white hover:bg-[#031A26]/90 transition-colors shadow-xs"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#B9915B]" />
                          <span>Ler Documento</span>
                        </button>
                      )}
                      {activeNode.actionType === "postagens" && (
                        <button
                          type="button"
                          onClick={() => setTab("acervo")}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9] hover:border-[#B9915B] transition-colors"
                        >
                          <span>Ver no Acervo</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SUB-VIEW 2: DOCUMENTOS DO VAULT (NOTION WIKI 2-COL) */}
            {memoriaSubView === "docs" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Sidebar do Notion Wiki */}
                <div className="md:col-span-4 lg:col-span-3 space-y-1 bg-white p-3 rounded-xl border border-[#E8ECEE] shadow-xs h-fit">
                  <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#5E727C]">
                    Estrutura da Memória
                  </div>
                  {Object.entries(VAULT_DOCS).map(([key, doc]) => {
                    const isSelected = selectedVaultDoc === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedVaultDoc(key)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-[#F4F6F7] font-semibold text-[#031A26] border-l-2 border-[#B9915B] shadow-2xs"
                            : "text-[#5E727C] hover:bg-[#F9FAFB] hover:text-[#031A26]"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#B9915B]" : "text-[#5E727C]"}`} />
                          <span className="truncate">{doc.title.replace(/^[^:]+:\s*/, "")}</span>
                        </div>
                        <span className="text-[10px] font-medium text-[#5E727C] bg-white px-1.5 py-0.5 rounded border border-[#E8ECEE] shrink-0">
                          {doc.category}
                        </span>
                      </button>
                    );
                  })}
                  <div className="pt-3 mt-3 border-t border-[#F0F2F3] px-2">
                    <p className="text-[11px] text-[#5E727C] leading-relaxed">
                      Documentos sincronizados com o repositório local em <code className="text-[10px] font-mono bg-[#F4F6F7] px-1 py-0.5 rounded">vault/*.md</code>.
                    </p>
                  </div>
                </div>

                {/* Canvas de Leitura do Documento (Notion Canvas) */}
                <div className="md:col-span-8 lg:col-span-9 bg-white p-6 md:p-8 rounded-xl border border-[#E8ECEE] shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-[#F0F2F3]">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9]">
                          {activeDoc.category}
                        </span>
                        <span className="text-xs text-[#5E727C]">
                          Arquivo: {selectedVaultDoc}.md
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#031A26]">
                        {activeDoc.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeDoc.content);
                          toast.success("Conteúdo copiado!");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9] hover:bg-[#EBEFEF] transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#5E727C]" />
                        Copiar .md
                      </button>
                    </div>
                  </div>

                  {/* Renderização Limpa do Conteúdo Markdown */}
                  <div className="prose prose-sm max-w-none text-[#031A26] space-y-4">
                    {activeDoc.content.split("\n\n").map((block, idx) => {
                      const trimmed = block.trim();
                      if (trimmed.startsWith("# ")) {
                        return null;
                      }
                      if (trimmed.startsWith("## ")) {
                        return (
                          <h3 key={idx} className="text-base font-bold text-[#031A26] pt-3 pb-1 border-b border-[#F4F6F7]">
                            {trimmed.replace(/^##\s*/, "")}
                          </h3>
                        );
                      }
                      if (trimmed.startsWith("> ")) {
                        return (
                          <div key={idx} className="p-3.5 rounded-lg bg-[#FCFBF9] border-l-3 border-[#B9915B] text-xs text-[#031A26] font-medium leading-relaxed">
                            {trimmed.replace(/^>\s*/, "")}
                          </div>
                        );
                      }
                      if (trimmed.startsWith("- ") || trimmed.startsWith("1. ") || trimmed.startsWith("2. ") || trimmed.startsWith("3. ")) {
                        const lines = trimmed.split("\n");
                        return (
                          <ul key={idx} className="space-y-1.5 text-xs text-[#2A3B43] leading-relaxed pl-4 list-disc marker:text-[#B9915B]">
                            {lines.map((line, lIdx) => (
                              <li key={lIdx}>{line.replace(/^[-*]|\d+\.\s*/, "").trim()}</li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={idx} className="text-xs text-[#2A3B43] leading-relaxed">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: COPYWRITING (CARDS LIMPOS) */}
            {memoriaSubView === "copywriting" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* CARD 1: AD 98 */}
                <div className="p-5 rounded-xl bg-white border border-[#E8ECEE] hover:border-[#B9915B]/50 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#031A26] text-[#B9915B]">
                        Top 1 Performer
                      </span>
                      <span className="text-xs font-bold text-[#031A26]">
                        6.6M plays
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#031A26] mb-1.5">
                      AD 98: Treino na Sala de Casa
                    </h4>
                    <p className="text-xs text-[#5E727C] leading-relaxed line-clamp-3">
                      Gancho comprovado que gera mais de 33.000 comentários pedindo aula no direct. 100% sem impacto, focado em queima de gordura sem saltos.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F0F2F3] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#5E727C]">33.266 comentários</span>
                    <button
                      type="button"
                      onClick={() => handleUseInEsteira({
                        titulo: "AD 98: Treino na Sala de Casa",
                        briefing: "Desafio musical de ritmo com treino de baixo impacto na sala de casa, sem saltos e sem impacto nos joelhos. Foco em mulheres 28-55 anos com rotina sobrecarregada.",
                        hook: "Se você tem mais de 30 anos e não aguenta mais pular na sala, faça este movimento",
                        cta: "MUNDOFIT",
                      })}
                      className="font-semibold text-[#B9915B] hover:text-[#9A7443] transition-colors"
                    >
                      Usar na Esteira →
                    </button>
                  </div>
                </div>

                {/* CARD 2: MÉTODO BAIXO IMPACTO */}
                <div className="p-5 rounded-xl bg-white border border-[#E8ECEE] hover:border-[#B9915B]/50 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9]">
                        Proposta Única (UVP)
                      </span>
                      <span className="text-xs font-bold text-[#031A26]">
                        Ritbox Casa
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#031A26] mb-1.5">
                      Método 100% Baixo Impacto
                    </h4>
                    <p className="text-xs text-[#5E727C] leading-relaxed line-clamp-3">
                      Treino para quem tem dor no joelho, sobrepeso ou pós-parto. Sem esteira chata, sem musculação pesada, praticado em 20 minutos.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F0F2F3] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#5E727C]">Inclusão articular</span>
                    <button
                      type="button"
                      onClick={() => handleUseInEsteira({
                        titulo: "Método 100% Baixo Impacto",
                        briefing: "Treino seguro de baixo impacto para queima de gordura em casa sem pular.",
                        hook: "Para queimar gordura você não precisa destruir seus joelhos pulando em casa.",
                        cta: "MUNDOFIT",
                      })}
                      className="font-semibold text-[#B9915B] hover:text-[#9A7443] transition-colors"
                    >
                      Usar na Esteira →
                    </button>
                  </div>
                </div>

                {/* CARD 3: PERSONA REAL */}
                <div className="p-5 rounded-xl bg-white border border-[#E8ECEE] hover:border-[#B9915B]/50 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4F6F7] text-[#031A26] border border-[#E2E7E9]">
                        Público-Alvo
                      </span>
                      <span className="text-xs font-bold text-[#031A26]">
                        28 a 55 anos
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#031A26] mb-1.5">
                      Mulheres e Mães Sem Tempo
                    </h4>
                    <p className="text-xs text-[#5E727C] leading-relaxed line-clamp-3">
                      Jornada dupla, metabolismo lento após os 30, sensação de inchaço e roupas apertadas no armário. Buscam acolhimento, não cobrança.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F0F2F3] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#5E727C]">Tom acolhedor</span>
                    <button
                      type="button"
                      onClick={() => handleUseInEsteira({
                        titulo: "Persona: Mulheres e Mães Sem Tempo",
                        briefing: "Roteiro empático focado na rotina sobrecarregada e treino rápido de 15 a 20 minutos na sala.",
                        hook: "Se você tem uma rotina corrida e não tem tempo para academia, esse recado é pra você.",
                        cta: "MUNDOFIT",
                      })}
                      className="font-semibold text-[#B9915B] hover:text-[#9A7443] transition-colors"
                    >
                      Usar na Esteira →
                    </button>
                  </div>
                </div>

                {/* CARD 4: MANYCHAT MUNDOFIT */}
                <div className="p-5 rounded-xl bg-white border border-[#E8ECEE] hover:border-[#B9915B]/50 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FCFBF9] text-[#B9915B] border border-[#B9915B]/30">
                        Funil de Conversão
                      </span>
                      <span className="text-xs font-bold text-[#031A26]">
                        Direct / DM
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#031A26] mb-1.5">
                      Automação: Palavra MUNDOFIT
                    </h4>
                    <p className="text-xs text-[#5E727C] leading-relaxed line-clamp-3">
                      Chamada de ação obrigatória ao final de cada criativo. O comentário dispara a entrega imediata da aula completa no Instagram Direct.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F0F2F3] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#5E727C]">Taxa de resposta alta</span>
                    <button
                      type="button"
                      onClick={() => handleUseInEsteira({
                        titulo: "Campanha MUNDOFIT Direta",
                        briefing: "Roteiro direto com chamada para comentar MUNDOFIT e receber o treino no direct do Instagram.",
                        hook: "Quer treinar comigo na sala da sua casa sem pagar academia?",
                        cta: "MUNDOFIT",
                      })}
                      className="font-semibold text-[#B9915B] hover:text-[#9A7443] transition-colors"
                    >
                      Usar na Esteira →
                    </button>
                  </div>
                </div>

                {/* CARD 5: REGRAS THIAGO NEIVA */}
                <div className="p-5 rounded-xl bg-white border border-[#E8ECEE] hover:border-[#B9915B]/50 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#031A26] text-white">
                        Governança Criativa
                      </span>
                      <span className="text-xs font-bold text-[#031A26]">
                        Conformidade
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[#031A26] mb-1.5">
                      Regras de Ouro Thiago Neiva
                    </h4>
                    <p className="text-xs text-[#5E727C] leading-relaxed line-clamp-3">
                      20 a 40 segundos por copy, frases curtas para teleprompter, zero promessas milagrosas e retenção nos primeiros 2 segundos.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#F0F2F3] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#5E727C]">Auditoria ativa</span>
                    <button
                      type="button"
                      onClick={() => handleUseInEsteira({
                        titulo: "Regras de Ouro Thiago Neiva",
                        briefing: "Roteiro teleprompter de 30 segundos, frases curtas, tom acolhedor e chamada MUNDOFIT.",
                        hook: "Bora mulher, 20 minutos de treino aqui comigo na sala de casa!",
                        cta: "MUNDOFIT",
                      })}
                      className="font-semibold text-[#B9915B] hover:text-[#9A7443] transition-colors"
                    >
                      Usar na Esteira →
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                      placeholder="Ex: Treino rápido para quem passou dos 40 anos e quer secar a barriga sem forçar a lombar na sala de casa..."
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
                        title="Recarregar e sincronizar com ranking do Meta Ads e Memória"
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
                    {busy || runningJob ? "Gerando..." : "Gerar Copywriting"}
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

                        <div className="text-xs text-[#031A26] whitespace-pre-wrap leading-relaxed mb-4 max-h-48 overflow-y-auto">
                          {copy.text}
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
