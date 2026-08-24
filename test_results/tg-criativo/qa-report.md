# Relatório QA — TG Criativo

Data: 2026-08-24  
Projeto: `01M0TS1S0W5P2M929451SB052D`  
Baseline: `76d21db`

## Resultado

| Área | Resultado |
| --- | --- |
| Build raiz (`npm run build`) | PASS |
| Build DramaClaw (`cd engines/dramaclaw/frontend && pnpm build`) | PASS |
| Frontend | 2.475 PASS / 2.475 |
| Backend | 2.469 PASS / 18 ignorados / 2 deselecionados / 0 falhas |
| Licenças | Inventário sem arquivos rastreados ausentes |
| Navegador | Rotas Criativo auditadas em `5173`; sem iframe, sem `5174` visível |
| Idioma | Rotas auditadas sem CJK e sem DramaClaw/SuperTale/Xia visíveis |
| Provedores | BLOQUEIO EXTERNO: nenhuma credencial válida configurada |
| MP4 | BLOQUEIO EXTERNO: não há geração real sem provedor |

## Escopo validado

Central de Projetos, briefing/importação, elementos, criativos, roteiro, cenas, Canvas, estilos, tarefas, configurações e navegação TG foram exercitados ou abertos no navegador. Os cinco criativos da campanha foram conferidos no backend com título, ângulo, hook, promessa, prova, CTA, roteiro e três cenas distintos.

## Bloqueio de homologação de mídia

O painel de configurações informa que o gateway ativo não está configurado. As variáveis de ambiente disponíveis não contêm credenciais de provedor. Portanto, os casos de geração, retry/cancelamento/retomada de tarefa de mídia e validação de MP4 foram mantidos como bloqueados, sem inventar sucesso ou mídia de amostra. Para fechar a homologação, configurar credenciais reais e repetir E2E-08/E2E-09.
