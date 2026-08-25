# Evidências E2E e Auditoria — TG Criativo

**Data**: 2026-08-25  
**Branch**: `feat/tg-criativo-full`  
**Ambiente**: TG Shell (`5173`), API DramaClaw (`8780`), `ST_EDITION=ce` (integração interna sem iframe; porta `5174` invisível na interface)  
**Projeto de Referência**: `01M0S1V8N1A9ZPP5F0NK8PSWSD` (Roma_Ecos_do_Imperio)

---

## 1. Dois Ciclos E2E Consecutivos (Aprovados)

### Ciclo 1
- **Backend (pytest)**: 2.479 aprovados, 18 ignorados, 2 deselecionados, 0 falhas.
- **Frontend (vitest)**: 353 arquivos, 2.475 testes aprovados, 0 falhas.
- **Auditoria CJK (`node scripts/audit_cjk_ui.mjs`)**: 0 violações em `.ts` e `.tsx`.
- **Integridade Python & Git**: `git diff --check` e `python -m compileall` com 0 erros.
- **Builds**: `pnpm build` (DramaClaw) e `npm run build` (Raiz) aprovados sem erro.
- **Evidências Visuais**: Capturadas todas as 7 rotas via CDP em resolução nativa.

### Ciclo 2 (Confirmação Consecutiva)
- **Backend (pytest)**: 2.479 aprovados, 18 ignorados, 2 deselecionados, 0 falhas.
- **Frontend (vitest)**: 353 arquivos, 2.475 testes aprovados, 0 falhas.
- **Auditoria CJK (`node scripts/audit_cjk_ui.mjs`)**: 0 violações em `.ts` e `.tsx`.
- **Integridade Python & Git**: `git diff --check` e `python -m compileall` com 0 erros.
- **Builds**: `pnpm build` (DramaClaw) e `npm run build` (Raiz) aprovados sem erro.
- **Evidências Visuais**: Capturadas todas as 7 rotas via CDP em resolução nativa.

---

## 2. Casos do PRD Validados

| Caso | Resultado | Evidência |
| --- | --- | --- |
| **E2E-01 — Navegação e Isolamento** | **PASS** | `/` mantém Simples; navegação lateral abre `/criativo/`; sem iframe e sem expor portas internas. |
| **E2E-02 — Central de Projetos** | **PASS** | Central em português com busca, status e cards de projetos formatados na identidade TG. |
| **E2E-03 — Configuração Comercial** | **PASS** | `commercial_br`, `pt-BR`, proporções, estilos brasileiros e identidade visual TG. |
| **E2E-04 — Canvas** | **PASS** | Canvas interativo com atalhos, barra de nós e grade em pt-BR. |
| **E2E-05 — Elementos e Biblioteca** | **PASS** | Abas Pessoas, Ambientes, Objetos, Vozes com ações e filtros em pt-BR. |
| **E2E-06 — Direção Visual e Estilos** | **PASS** | Estilos TG pré-definidos (demonstração de produto, depoimento brasileiro, oferta de varejo, UGC natural). |
| **E2E-07 — Workbench do Criativo** | **PASS** | Visão do beat/episódio, roteiro, quadros e montagem em pt-BR. |
| **E2E-08 — Geração Real de Mídia** | **BLOQUEADO EXTERNO** | Sem credenciais de provedor de imagem, voz ou vídeo configuradas no ambiente local. Nenhum resultado fake foi forjado. |
| **E2E-09 — Exportação MP4 Real** | **BLOQUEADO EXTERNO** | Geração final de vídeo aguarda credenciais externas válidas. |
| **E2E-10 — Isolamento de Licenças** | **PASS** | `license-inventory.csv` atualizado e coberto por testes de conformidade. |
| **E2E-11 — Ausência de CJK em UI** | **PASS** | Auditoria estendida (.ts e .tsx) aprovada com 0 resíduos de CJK em textos visíveis. |
| **E2E-12 — Resiliência de API** | **PASS** | Health checks e reconexão documentados e funcionais. |

---

## 3. Evidências Visuais Atualizadas

- [Simples Preservado](./final-simple.png)
- [Central de Projetos](./final-central.png)
- [Briefing e Assistente](./final-briefing.png)
- [Elementos e Biblioteca](./final-elementos.png)
- [Direção Visual e Estilos](./final-styles.png)
- [Workbench do Criativo](./final-workbench.png)
- [Canvas Livre](./final-canvas.png)
