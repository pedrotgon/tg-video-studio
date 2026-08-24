# Evidências E2E — TG Criativo

Data: 2026-08-24  
Ambiente: TG `5173`, API `8780`, `ST_EDITION=ce` (o DramaClaw serve a integração interna; `5174` não é exposto na interface)
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
- Suite focada após as correções — **24/24 testes PASS**, 5 arquivos.
- Suite frontend completa — **2.475/2.475 testes PASS**, 353 arquivos.
- Suite backend completa (`.venv/bin/python -m pytest -q`) — **2.469 PASS, 18 ignorados, 2 deselecionados, 0 falhas**.
- `npm run build` — PASS.
- `cd engines/dramaclaw/frontend && pnpm build` — PASS; apenas avisos existentes de chunks grandes/import dinâmico.
- `git diff --check` e `python -m compileall -q src tests` — PASS.
- `pytest --collect-only -q` — executado; os números de execução acima são os efetivamente reportados pelo pytest.

## Evidências visuais

- [Central](./final-central.png)
- [Briefing](./final-briefing.png)
- [Criativos](./final-creatives.png)
- [Estilos](./final-styles.png)
- [Biblioteca e upload](./final-assets.png)
- [Simples preservado](./final-simple.png)

E2E-06 permanece parcial porque o adaptador de navegador disponível não expõe upload de arquivos e não havia arquivos do usuário fornecidos. E2E-08/E2E-09 estão bloqueados por credencial externa: não há chave válida nem configuração de gateway para texto, imagem, voz ou vídeo no ambiente. Não foi criado MP4 demonstrativo, nem resultado simulado. A homologação final de mídia exige configurar um provedor real e então validar HTTP 200, `video/mp4`, tamanho > 0, `ffprobe` e download.
