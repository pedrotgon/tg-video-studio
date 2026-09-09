# Memória do TG Video Studio

Arquitetura em camadas inspirada no princípio apresentado por Kelvin Cleto: dados brutos primeiro, síntese pequena para uso diário e automação somente após validação humana.

- `MEMORY.md`: núcleo sempre carregável, menor que 5 KB.
- `_contexto/`: regras da operação.
- `clientes/`: síntese consultada sob demanda.
- `shared/decisoes/`: decisões duráveis.
- `logs/events.ndjson`: trilha de auditoria append-only.

O conteúdo foi adaptado ao TG Video Studio; não replica marca, CTA ou regras comerciais de terceiros.
