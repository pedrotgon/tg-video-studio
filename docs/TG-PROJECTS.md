# Primeiro ciclo: projetos próprios do TG

Abra **Criativo** no menu. A Central TG cria projetos e criativos Stop Motion independentes do motor anterior. A esteira existente continua em `/criativo/`, acessível pelo botão da Central.

Cada criativo guarda estado editável na API TG, em SQLite (`.runtime/tg/projects.sqlite`). O histórico guarda arquivos GIF/WebM no mesmo diretório, com limite de 100 MB por exportação. Use `TG_DATA_DIR` para escolher outro diretório persistente. O servidor é o gateway existente: `cd server` e `uv run python main.py`; inicie o frontend com `npm run dev`. Para o novo fluxo não é necessário iniciar o motor anterior.

Na lista de criativos, **Guardar elementos no projeto** copia o elenco, cenário e áudio do último estado salvo para uma biblioteca compartilhada. Novos criativos desse projeto herdam essa biblioteca; criativos existentes mantêm seus elementos. O botão **Criativos** no editor espera o salvamento terminar antes de voltar.

O antigo laboratório local continua acessível por `/#animation`, permitindo baixar o projeto JSON antigo e abri-lo no editor de um novo criativo. Nenhum projeto antigo é migrado ou sobrescrito automaticamente.

Atualizações exigem a revisão atual do criativo. Uma alteração concorrente em outra aba resulta em conflito explícito, sem sobrescrever o servidor. Identificadores de criativo e exportação são verificados dentro do projeto correspondente.

Validação: `npm run build`, `npm run test:stop-motion`, `python -m unittest discover -s server/tests`.

Este ciclo ainda utiliza o gateway local existente, sem autenticação multiusuário. Separação por projeto protege a organização dos dados, mas não substitui autorização por usuário. A publicação da aplicação completa exige o backend em ambiente apropriado; a prévia Sites anterior continua sendo somente o laboratório estático. A retirada integral do motor anterior e migração da esteira continuam como etapas posteriores.
