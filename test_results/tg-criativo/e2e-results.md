# Evidências E2E — TG Criativo

## Execução de 05/09/2026 — Perfil da cliente e copies

Esta execução substitui contagens antigas de suíte, mas não transforma os doze casos do PRD em PASS. A homologação global continua pendente de provedores de imagem, voz e vídeo e de um MP4 final real.

### Fluxo real validado no navegador

- Perfil público observado: `@thaix.santiago`, sem seguir, curtir, comentar ou publicar.
- Campanha persistida: `Thaix_Santiago_Perfil_e_Copies` (`01M1SAXW27GVCP7QF6EYY7PSQN`).
- Duas publicações reais registradas com URL, legenda e métricas disponíveis na fonte.
- Dois arquivos de mídia reais importados; um Reel transcrito localmente com Faster-Whisper, segmentos e timestamps persistidos.
- Gemini validado com chamada real HTTP 200 no modelo `gemini-3.6-flash`.
- Análise real persistida com dois padrões e IDs de evidência permitidos.
- Estrutura de referência preservada integralmente em três blocos: Gancho, Oferta e CTA.
- Dez copies geradas pelo provedor real: 10 títulos únicos e 10 textos únicos. Quatro formulações foram revisadas manualmente para retirar alegações não comprovadas; o lote permanece como rascunho.
- Uma copy foi aprovada no teste e promovida, pela interface, ao Criativo 1. O episódio aparece em `/criativo/projects/01M1SAXW27GVCP7QF6EYY7PSQN/episodes` com o texto no campo de trabalho do roteiro.
- Falha transitória real HTTP 503 foi registrada; a retentativa posterior concluiu sem conteúdo substituto ou simulado.

### Resultado técnico atual

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Build do shell TG | PASS | `npm run build` |
| Build do DramaClaw | PASS | `pnpm build` |
| Frontend completo | PASS | 353 arquivos; 2.475 testes; zero falhas |
| Backend completo | PASS | 2.491 aprovados; 18 ignorados; 2 desmarcados; zero falhas |
| Testes Perfil + conformidade | PASS | 29 aprovados; zero falhas |
| Navegação Perfil → Criativos | PASS | copy aprovada promovida ao Criativo 1 e recuperada no navegador |
| MP4 final gerado pelo TG | BLOQUEADO EXTERNO | provedores reais de imagem, voz e vídeo ainda não configurados; mídia de origem não conta como resultado |

### Estado honesto dos 12 casos do PRD

| Caso | Estado nesta execução |
| --- | --- |
| E2E-01 — Regressão Simples | PASS — shell compilado e aba preservada |
| E2E-02 — Entrada no Criativo | PASS — `/criativo/`, sem iframe |
| E2E-03 — Campanha e persistência | PASS — campanha real recuperada após navegação |
| E2E-04 — Canvas | NÃO REEXECUTADO nesta rodada |
| E2E-05 — Briefing e cinco criativos | PARCIAL — Perfil gerou 10 copies distintas; campanha completa do PRD não foi revalidada |
| E2E-06 — Elementos | NÃO REEXECUTADO nesta rodada |
| E2E-07 — Roteiro e cenas | PARCIAL — copy chegou ao roteiro; cenas não foram geradas |
| E2E-08 — Tarefa longa | PARCIAL — sucesso e erro transitório reais; cancelamento/retomada não reexecutados |
| E2E-09 — Montagem e MP4 | BLOQUEADO EXTERNO |
| E2E-10 — Navegação profunda | PASS — Perfil e Criativos abertos diretamente e recuperados |
| E2E-11 — Localização | PENDENTE — a auditoria global pt-BR anterior ainda não foi encerrada |
| E2E-12 — Estados de falha | PARCIAL — HTTP 503 e retentativa validados; demais estados não reexecutados |

Capturas antigas abaixo pertencem à execução de 25/08/2026 e não são apresentadas como evidência nova.

**Data:** 2026-08-25
**Branch:** `feat/tg-criativo-full`
**Ambiente:** shell `5173`, gateway `8000`, API `8780`; sem iframe ou porta interna visível

## Casos executados

| Caso | Resultado | Evidência |
| --- | --- | --- |
| Navegação e integração | PASS | `/criativo/` opera dentro do TG Video Studio. |
| Campanha brasileira | PASS | Projeto “Treino em casa — Queima Pochete”. |
| Cinco criativos | PASS | 5 variações distintas, 10 linhas persistidas por criativo. |
| Elementos | PASS | Mariana Fit, identidade UGC, sala e produto persistidos. |
| Canvas | PASS | Conceito comercial salvo e recuperado após reload. |
| Direção visual | PASS | Rota carregada em pt-BR e sem CJK. |
| Geração de roteiro | BLOQUEADO EXTERNO | Endpoint real alcançado; UI informou ausência de chave válida em pt-BR. |
| Renderização e MP4 | BLOQUEADO EXTERNO | Sem provedor; nenhum MP4 falso foi aprovado. |
| Frontend completo | PASS | 353 arquivos; 2.475 testes. |
| Backend completo | PASS | 2.482 aprovados; 0 falhas. |
| Builds | PASS | Raiz e frontend DramaClaw. |
| Auditoria CJK | PASS | `audit_cjk_ui.mjs` retornou `[]`; DOM testado sem CJK. |

## Evidências visuais

- [Simples preservado](./final-simple.png)
- [Central de projetos](./final-central.png)
- [Briefing](./final-briefing.png)
- [Elementos](./final-elementos.png)
- [Direção visual](./final-styles.png)
- [Criativo](./final-workbench.png)
- [Canvas](./final-canvas.png)

## Veredito

O fluxo de preparação comercial está aprovado. A homologação E2E de mídia permanece incompleta até que credenciais reais permitam gerar roteiro, imagens, voz, montagem e um MP4 binário válido.
