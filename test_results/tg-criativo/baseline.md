# Baseline TG Criativo — Bloco 0

Data: 2026-08-24

## Estado registrado

- O diretório raiz não possuía Git; foi inicializado um repositório local.
- A aba **Simples** abre em `/` e mantém o formulário MoneyPrinterTurbo.
- A aba **Criativo** ainda era um formulário resumido com botão de estúdio externo e iframe.
- Serviços encontrados: TG `5173`, DramaClaw frontend `5174`, gateway `8000`, API DramaClaw `8780`.
- Ambientes, bancos, logs e mídias locais ficaram fora do baseline via `.gitignore`.

## Verificações baseline

| Verificação | Resultado |
| --- | --- |
| `npm run build` | aprovado |
| `cd engines/dramaclaw/frontend && pnpm build` | aprovado, com avisos de chunks grandes/import dinâmico |
| `cd engines/dramaclaw && .venv/bin/python -m pytest --collect-only -q` | 2.487 testes coletados, 2 deselecionados |
| Segredos/ambientes/mídias geradas versionados | não |

## Evidências visuais

- `baseline-simple.png`
- `baseline-creative.png`

O commit `baseline/tg-criativo` registra este ponto recuperável antes da implementação funcional.
