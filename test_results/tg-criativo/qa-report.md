# Relatório QA — TG Criativo

Data: 2026-08-25
Branch: `feat/tg-criativo-full`
Projeto E2E: `01M0TS1S0W5P2M929451SB052D`

## Resultado

| Área | Resultado |
| --- | --- |
| Build raiz | PASS |
| Build DramaClaw | PASS |
| Frontend | 2.475/2.475 PASS |
| Backend | 2.482 PASS, 18 ignorados, 2 deselecionados, 0 falhas |
| Auditoria CJK | 0 violações estáticas; 0 nas rotas E2E inspecionadas |
| Canvas | Conceito salvo e persistido após recarregar |
| Campanha | 5 criativos distintos, 10 linhas cada, persistidos |
| Elementos | Pessoa, identidade, ambiente e produto persistidos |
| Geração por IA | BLOQUEIO EXTERNO: nenhuma chave de provedor configurada |
| MP4 | NÃO HOMOLOGADO: geração real depende do provedor |

## Cenário exercitado

Influenciadora brasileira vendendo o **Método Barriga Leve em Casa** para mulheres de 25–44 anos. Foram cadastrados Mariana Fit, identidade UGC, sala de treino e produto digital. Os cinco ângulos cobrem dor, demonstração, objeção, comparação e rotina, com alegações responsáveis e sem promessa de perda localizada.

## Correções confirmadas

- O gerador usa o texto editado e persistido do criativo, não apenas conteúdo bruto de importação.
- Mensagens, tarefas, metadados e erros expostos ao usuário foram saneados para pt-BR.
- Terminologia de pessoas, ambientes, objetos, roteiro e Canvas foi corrigida.
- A ausência de credenciais produz bloqueio claro; nenhum resultado de amostra é tratado como produção real.

## Pendência externa

Configurar chave válida em **Configurações > Modelos e canais** e repetir roteiro, quadros, voz, montagem e validação binária do MP4. O fluxo local configurável está aprovado; a renderização final ainda não.
