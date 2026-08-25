# Evidências E2E — TG Criativo

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
