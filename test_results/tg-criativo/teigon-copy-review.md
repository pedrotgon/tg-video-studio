# TEIGON: revisão parcial do fluxo de copies

Data: 2026-09-05, horário local. Notas de engenharia e produto, sem alegação de certificação jurídica ou comercial.

## Technology: 7,0/10
- Pontos fortes: 27 testes focados aprovados; build do shell aprovado; fallback com limite de tempo; modelo real registrado.
- Riscos e vulnerabilidades: indisponibilidade do modelo principal; progresso do fluxo ainda depende de estado React; suíte integral e MP4 não verificados nesta rodada.
- Requisitos inegociáveis: restaurar produção persistida após reload; executar testes completos e validar mídia real.

## Enterprise: 7,0/10
- Pontos fortes: fluxo ligado à cliente e entrega objetiva de dez copies.
- Riscos e vulnerabilidades: teste de tema livre não comprova reprodução da estrutura editorial de Tiago; textos contêm afirmações não sustentadas.
- Requisitos inegociáveis: vincular fonte, estrutura e aprovação de cada copy antes de produção.

## Investment: 5,0/10
- Pontos fortes: Flash Lite respondeu ao teste curto em 1,32 s; alternativa permite continuar quando o principal falha.
- Riscos e vulnerabilidades: custo por lote e ganho de produtividade ainda sem medição; tentativa principal também pode consumir recursos.
- Requisitos inegociáveis: medir tokens, custo e tempo por lote com dados reais; não inventar ROI.

## Governance: 6,0/10
- Pontos fortes: contador de aprovação voltou a zero; quarentena excluída do contexto de qualificação; textos sensíveis conhecidos filtrados.
- Riscos e vulnerabilidades: expressões regulares não comprovam ausência de todas as alegações indevidas; contexto livre pode gerar fatos sem fonte.
- Requisitos inegociáveis: preservar evidência bruta, eventos verificáveis de aprovação e revisão humana; testar fontes em todas as entradas.

## Operation: 7,0/10
- Pontos fortes: perguntas reais, dez cards e modelo de fallback visível; etapas mais discretas e controladas.
- Riscos e vulnerabilidades: Roteiro ainda apresenta a fala sem direção audiovisual completa; migração visual incompleta.
- Requisitos inegociáveis: validar seleção, roteiro, revisão, retomada e geração real do vídeo.

## Negotiation: 4,0/10
- Pontos fortes: entregável em lote compreensível e possibilidade de revisão antes da produção.
- Riscos e vulnerabilidades: preço, SLA, política de revisões e responsabilidade editorial não definidos.
- Requisitos inegociáveis: acordar escopo, revisões e critérios de aceite; não prometer SLA de 99,9% sem evidência operacional.

## Scorecard

Média: 6,0/10. Corte: 8,5/10. Projeto não homologado integralmente.

## Evidências da rodada

- Context7: `/websites/ai_google_dev_gemini-api` e `/googleapis/js-genai`. Configuração REST `generationConfig.thinkingConfig.thinkingLevel=high`.
- Modelo principal do fluxo Simples: `gemini-3.7-flash`; fallback: `gemini-3.1-flash-lite`.
- Teste real no navegador: projeto `01M1SAXW27GVCP7QF6EYY7PSQN`, tema `queima pochete`, escolhas Treino / Direto / Lista.
- Job `205b005bb3e64864956f8633484fd014`: completed, dez copies, dez ganchos textualmente diferentes, modelo real `gemini-3.1-flash-lite`.
- As copies são rascunhos. Diferença textual não comprova dez abordagens eficazes nem factualidade.
- Screenshot `simple-high-ten-copies.png` e `simple-high-generating.png`.
- `npm run build`: aprovado.
- `pytest tests/test_profile_fast_provider.py tests/test_client_profile.py -q`: 27 aprovados.
- Testes de fallback usam transporte simulado exclusivamente na suíte unitária; geração no navegador usou a API real.
- Banco consultado: 15 posts, 17 blocos, 19 itens de memória, zero aprovações de cliente. Observação não equivale a auditoria completa do banco.
- Pendentes: migração completa de componentes 21st.dev, direção audiovisual, QA integral do Perfil, persistência da jornada e MP4 canário.
