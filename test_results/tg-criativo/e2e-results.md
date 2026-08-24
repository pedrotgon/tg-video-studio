# Evidências E2E — TG Criativo

Data: 2026-08-24  
Ambiente: TG `5173`, DramaClaw `5174`, API `8780`, `ST_EDITION=ce`  
Campanha principal: `Treino em casa — Queima Pochete`  
Projeto: `01M0TS1S0W5P2M929451SB052D`

## Casos do PRD

| Caso | Resultado | Evidência |
| --- | --- | --- |
| E2E-01 — navegação e isolamento | PASS | `/` mantém Simples; estrela abre `/criativo/`; sem iframe e sem botão de estúdio externo. |
| E2E-02 — criação pelo wizard | PASS | Campanha criada pela Central com fluxo comercial pt-BR. |
| E2E-03 — configuração comercial | PASS | `commercial_br`, `pt-BR`, 5 variações, 30 s, 9:16, legendas, identidade TG, estilo `tg_ugc_natural_br`. |
| E2E-04 — Canvas | PASS | Canvas abre no projeto; controles e textos principais em pt-BR; sem CJK visível. |
| E2E-05 — criativos distintos | PASS | 5 criativos persistidos, com ângulos, hooks, provas, CTAs e roteiros distintos. |
| E2E-06 — ativos | PARCIAL | Biblioteca, categorias, modal e upload em pt-BR; importação real de 2 arquivos não foi executada porque o adaptador de navegador não expõe injeção de arquivos e não foram fornecidos arquivos do usuário. Nenhum ativo falso foi criado. |
| E2E-07 — roteiro | PARCIAL | Rota e workbench de roteiro abrem; geração não foi executada sem briefing/fonte selecionada e sem provedor de mídia. Nenhum roteiro falso foi criado. |
| E2E-08 — geração real | BLOQUEADO EXTERNO | Não há credenciais/configuração de provedor de imagem, voz ou vídeo no ambiente. Não foi iniciada tarefa longa falsa. |
| E2E-09 — MP4 real | BLOQUEADO EXTERNO | Sem provedor configurado não há MP4 real para validar; `ffprobe` não foi executado sobre um resultado inexistente. |
| E2E-10 — rotas DramaClaw | PASS | Freezone, ingest, characters, episodes, styles, tasks e assistant abriram sem 404/Not Found. |
| E2E-11 — idioma | PASS | Sete rotas principais e biblioteca/modal sem CJK visível; superfície TG em pt-BR. |
| E2E-12 — indisponibilidade da API | PASS | Com a API desligada, a SPA exibiu diagnóstico acionável “Central de Projetos indisponível” e “Tentar novamente”; API restaurada em seguida. |

## Validações automatizadas

- `npm run build` — PASS.
- `cd engines/dramaclaw/frontend && pnpm build` — PASS; apenas avisos existentes de chunks grandes/import dinâmico.
- Suite focada após as correções — **43/43 testes PASS**, 7 arquivos.
- Suite completa após o shim de ambiente — **2.474/2.475 testes PASS**, 352 arquivos; 1 falha conhecida no harness MSW/Undici de multipart (`ingest.test.tsx`). A falha ocorre antes do handler MSW, ao interpretar `FormData` com Undici, e não reproduz um erro do fluxo de produção.
- `python -m compileall -q src/novelvideo` — PASS.
- `pytest --collect-only -q` — 2.487 testes coletados, 2 deselecionados.

## Evidências visuais

- [Central](./final-central.png)
- [Briefing](./final-briefing.png)
- [Criativos](./final-creatives.png)
- [Estilos](./final-styles.png)
- [Biblioteca e upload](./final-assets.png)
- [Simples preservado](./final-simple.png)

As lacunas E2E-06, E2E-08 e E2E-09 dependem de entrada/infraestrutura externa; foram registradas sem simulação de resultado.
