# PRD — TG Criativo dentro do TG Video Studio

**Status:** pronto para implementação  
**Versão do documento:** 1.0  
**Data:** 24 de agosto de 2026  
**Produto:** TG Video Studio  
**Escopo desta entrega:** somente a aba **Criativo**  
**Motor-base:** DramaClaw Community Edition 1.3.2  
**Responsável pela próxima etapa:** modelo implementador (Luna Alto)  

> Este documento é autossuficiente. O implementador deve assumir que não possui acesso à conversa que o originou. Leia o PRD inteiro antes de alterar qualquer arquivo e execute os blocos da seção 8 em ordem.

---

## 1. Resumo executivo

### 1.1 O que será construído

O TG Video Studio terá dois modos complementares:

- **Simples:** produção rápida operada pelo MoneyPrinterTurbo. Está fora do escopo desta entrega e não pode sofrer regressão.
- **Criativo:** estúdio completo operado pelo DramaClaw, incorporado ao TG Video Studio como se tivesse sido concebido originalmente pela TG para o mercado brasileiro.

A aba **Criativo**, identificada pelo ícone de estrela, deixará de ser um formulário resumido com um botão para abrir outro estúdio. Ao ser selecionada, ela abrirá diretamente a **Central de Projetos** do TG Criativo. O usuário criará uma campanha, entrará no projeto e trabalhará em duas trilhas complementares:

1. **Canvas Criativo:** espaço visual livre com nós de texto, imagem, vídeo e áudio.
2. **Produção:** fluxo guiado de briefing, elementos, criativos, roteiro, cenas, voz, vídeo, montagem e exportação.

Todas as capacidades individuais do DramaClaw CE devem permanecer disponíveis. A adaptação muda marca, experiência, idioma, terminologia, padrões e prompts; não reduz o motor.

### 1.2 Resultado esperado

O usuário deve perceber um único produto, em uma única URL, com estética TG e linguagem brasileira. Ele não deve ver:

- a marca DramaClaw, SuperTale, Xia, Xiaji ou Xiahua;
- textos em mandarim ou inglês nas telas do fluxo Criativo;
- o botão **Abrir estúdio completo**;
- iframe, barra de carregamento de “motor externo” ou porta `5174`;
- padrões voltados a novelas chinesas como experiência inicial;
- uma interface predominantemente azul ou escura.

### 1.3 Princípios de produto

1. **Preservar o motor, adaptar o domínio.** Internamente, `episode`, `character` e `prop` podem continuar existindo para compatibilidade; externamente, tornam-se Criativo, Pessoa/Avatar e Produto/Objeto.
2. **Simplicidade progressiva.** A entrada é fácil; controles avançados aparecem quando necessários.
3. **Uma origem, um produto.** Toda a navegação ocorre em `http://localhost:5173`, sem iframe e sem URL externa visível.
4. **Português brasileiro de verdade.** Não basta traduzir palavras: exemplos, padrões, formatos, vozes e prompts devem refletir o mercado brasileiro.
5. **Capacidade completa.** Nenhuma tela funcional do DramaClaw será removida apenas para encurtar a implementação.
6. **Assertividade antes de velocidade.** Uma etapa só é concluída quando seus critérios de aceite passam.

### 1.4 Evidência técnica da decisão

O DramaClaw 1.3.2 já contém a base necessária: FastAPI, React, projetos, armazenamento local, biblioteca de ativos, geração de roteiros, cenas, storyboards, primeiros quadros, TTS, vídeo, composição, Canvas, estilos, assistente e central de tarefas. A documentação oficial também afirma que o fluxo se aplica a anúncios curtos e vídeos de produto, não apenas dramas.

Não será criado um segundo backend. O backend existente será mantido como motor e receberá uma camada pequena e explícita de adaptação comercial brasileira.

---

## 2. Estado atual, diagnóstico e handoff

### 2.1 Caminhos e serviços atuais

```text
/Users/pedrotgon/Developer/Start AI/tg-video-studio
├── src/                              # shell atual do TG Video Studio
├── server/                           # gateway FastAPI do TG
├── engines/moneyprinter/             # motor da aba Simples — NÃO ALTERAR
├── engines/dramaclaw/                # DramaClaw CE 1.3.2
│   ├── src/novelvideo/               # backend e pipeline
│   └── frontend/                     # frontend React/TanStack Router
└── scripts/start-studio.sh           # inicialização local
```

| Serviço atual | Porta | Função |
|---|---:|---|
| TG frontend | 5173 | shell com abas Simples e Criatividade |
| DramaClaw frontend | 5174 | estúdio completo separado |
| TG gateway | 8000 | adaptação do MoneyPrinter e criação simples de projeto DramaClaw |
| DramaClaw API | 8780 | motor completo do Criativo |

### 2.2 Problemas confirmados no código atual

1. `src/App.tsx` exibe **Abrir estúdio completo** e alterna para `EngineWorkspace`.
2. `EngineWorkspace.tsx` carrega o DramaClaw em um `<iframe>` apontando para a porta `5174`.
3. `ComplexVideoTab.tsx` representa o Criativo como um formulário pequeno e não como o produto completo.
4. `generateComplexVideo()` apenas cria um projeto e marca o job como 100%; isso não representa uma produção concluída.
5. O gateway retorna `studioUrl` absoluto para `127.0.0.1:5174`.
6. A tradução `pt` contém muitos textos ainda em inglês e alguns em mandarim.
7. A tela de ingestão usa padrões chineses (`chinese_period_drama`, etnias chinesa/japonesa/coreana etc.).
8. O CSS do DramaClaw contém várias definições conflitantes de tema: azul original, tema escuro e overrides TG repetidos. A cascata é frágil.
9. O script `scripts/run_test_battery.mjs` registra “sucesso” sem asserções reais e usa seletores frágeis. Ele não comprova E2E.
10. O diretório raiz ainda não possui repositório Git; não há baseline recuperável da integração atual.

### 2.3 Baseline validado

- DramaClaw local: **1.3.2**, igual à release oficial mais recente na data deste PRD.
- Backend: Python 3.11 + FastAPI, tarefas em processo, SSE, SQLite e mídia local.
- Frontend DramaClaw: React 19 + Vite + TanStack Router + TanStack Query + i18next + Tailwind 4.
- Frontend TG: React 18 + Vite + Tailwind 3.
- Locale atual padrão: `pt`, porém incompleto.
- Design TG já parcialmente aplicado: Forest Green, Champagne Gold, DM Sans e Plus Jakarta Sans.

### 2.4 Instrução de início para o modelo implementador

Copiar e usar literalmente:

> Implemente integralmente o arquivo `PRD-TG-CRIATIVO.md`. Leia o documento inteiro antes de editar. Comece pelo Bloco 0 e execute um bloco por vez. Não altere a experiência, os componentes, os endpoints nem o motor da aba Simples, salvo a mudança mínima de navegação que direciona o ícone Criativo para `/criativo/`. Não use iframe. Não declare sucesso sem executar os critérios de aceite e registrar evidências. Se uma integração real depender de chave ou saldo externo ausente, conclua tudo que for local, registre o bloqueio exato e não substitua o resultado por mídia de exemplo.

---

## 3. Objetivos, não objetivos e métricas

### 3.1 Objetivos obrigatórios

**O1 — Integração real:** a aba Criativo abre o DramaClaw adaptado dentro do mesmo produto e domínio.

**O2 — Paridade funcional:** todas as telas e capacidades CE listadas na seção 6 permanecem acessíveis.

**O3 — Mercado brasileiro:** o fluxo é orientado a campanhas e criativos para TikTok, Instagram Reels, Stories, Feed e YouTube Shorts.

**O4 — pt-BR completo:** nenhuma string visível do fluxo principal aparece em mandarim ou inglês.

**O5 — Aparência TG:** fundo claro, navegação Forest Green, acentos Champagne Gold, tipografia TG e hierarquia visual profissional.

**O6 — Produção verdadeira:** jobs, progresso, erros, retomada e MP4 final vêm do backend real; não há progresso simulado.

**O7 — Isolamento:** a aba Simples continua compilando e funcionando como antes.

**O8 — Handoff sustentável:** a adaptação evita renomear os contratos internos do DramaClaw sem necessidade, reduzindo conflitos com atualizações futuras.

### 3.2 Não objetivos desta entrega

- Reescrever o DramaClaw do zero.
- Criar um novo motor de vídeo.
- Alterar o MoneyPrinterTurbo ou redesenhar a aba Simples.
- Construir multiusuário, cobrança, cotas, RBAC ou colaboração em equipe.
- Publicar um SaaS hospedado para terceiros usando a licença CE.
- Criar aplicativo móvel nativo.
- Prometer compatibilidade completa com telas pequenas; o estúdio é desktop-first, com mínimo suportado de 1280 px.
- Traduzir comentários internos do código; a exigência é para strings renderizadas, mensagens de API e conteúdo gerado.
- Remover recursos avançados apenas porque não são usados no primeiro vídeo.

### 3.3 Métricas de aceite

| Métrica | Alvo obrigatório |
|---|---:|
| URLs visíveis fora de `localhost:5173` durante o uso | 0 |
| iframes no fluxo Criativo | 0 |
| strings visíveis em mandarim no fluxo testado | 0 |
| strings visíveis em inglês no fluxo testado | 0, exceto nomes próprios de modelos |
| rotas funcionais do inventário da seção 6 | 100% |
| builds TypeScript aprovados | 2 de 2 |
| regressões E2E na aba Simples | 0 |
| projetos que sobrevivem a reload | 100% |
| download final com MIME `video/mp4` e arquivo não vazio | 100% |
| tarefas longas com progresso real e retomada | 100% do cenário canário |

---

## 4. Usuários, proposta de valor e experiência

### 4.1 Usuário principal

Criador, gestor de tráfego, social media ou infoprodutor brasileiro que precisa transformar um briefing, roteiro ou material bruto em múltiplos criativos comerciais para redes sociais, preservando pessoas, produtos, cenários, vozes e direção visual.

### 4.2 Trabalhos a realizar

- “Quero organizar uma campanha e suas referências em um único lugar.”
- “Quero transformar uma oferta em cinco variações criativas com ângulos diferentes.”
- “Quero manter a mesma pessoa, produto e identidade visual entre cenas.”
- “Quero revisar roteiro, cena, voz e vídeo antes da montagem.”
- “Quero testar livremente no Canvas e promover o melhor resultado para a produção.”
- “Quero acompanhar tarefas demoradas, corrigir falhas e retomar sem perder o projeto.”
- “Quero baixar um MP4 final e seus ativos.”

### 4.3 Jornada principal

```text
TG Video Studio
  → ícone ✦ Criativo
  → Central de Projetos
  → Nova campanha
  → Canvas Criativo do projeto
  → Briefing e referências
  → Pessoas, produtos, cenários e vozes
  → Criativos/variações
  → Roteiro
  → Cenas: texto → quadro → imagem → áudio → vídeo
  → Montagem e exportação
  → Player + Baixar MP4
```

### 4.4 Primeira experiência

Ao clicar no ícone Criativo:

1. A URL muda para `/criativo/`.
2. A rail lateral TG permanece visível com a estrela ativa.
3. A tela mostra **Central de Projetos**, não um formulário de geração e não um iframe.
4. Um CTA **Nova campanha** abre o wizard.
5. Ao concluir o wizard, o projeto é criado e abre diretamente no **Canvas Criativo**.
6. Um seletor no topo alterna entre **Canvas** e **Produção**.

### 4.5 Wizard Nova campanha

Campos obrigatórios:

| Campo | Tipo | Exemplo |
|---|---|---|
| Nome da campanha | texto | Treino em casa — Agosto |
| Objetivo | seleção | Conversão |
| Canal principal | seleção | Instagram Reels |
| Formato criativo | seleção | UGC direto |
| Público | texto | Mulheres de 25–44 anos com rotina corrida |
| Produto/oferta | texto | Programa de treino em casa |
| Promessa central | texto | Treinos curtos que cabem na rotina |
| CTA | texto | Conheça o programa |
| Quantidade de variações | 1–10 | 5 |
| Duração | 15/30/45/60 s | 30 s |
| Proporção | 9:16/1:1/4:5/16:9 | 9:16 |

Campos opcionais em **Mais contexto**:

- roteiro próprio;
- tom de voz;
- objeções do público;
- benefícios e provas permitidas;
- palavras obrigatórias e proibidas;
- referências de anúncios;
- identidade visual e arquivos de marca;
- pessoa/porta-voz e voz de referência.

O wizard não deve prometer que já gerou vídeo. Ele cria a campanha e prepara seu espaço de produção.

---

## 5. Arquitetura de produto e técnica

### 5.1 Decisão principal: composição por rota, sem iframe

Manter os dois frontends durante esta entrega, mas servi-los sob a mesma origem:

```text
http://localhost:5173/
├── / e /simples/*             → frontend TG atual
├── /criativo/*                → frontend DramaClaw adaptado
├── /api/simple/*              → gateway TG → MoneyPrinterTurbo
├── /api/complex/*             → compatibilidade temporária do gateway
├── /api/v1/*                  → DramaClaw FastAPI :8780
└── /static/*                  → mídia estática do DramaClaw :8780
```

Na experiência do usuário, isso é um único aplicativo. Internamente, a composição por rota preserva a aplicação madura do DramaClaw e evita reescrever centenas de componentes no shell pequeno do TG.

### 5.2 Requisitos da composição

1. O frontend DramaClaw deve aceitar um `basePath` configurável com valor `/criativo/`.
2. O TanStack Router deve resolver rotas e links sob esse prefixo.
3. Assets, locale, `version.json`, workers e rotas de download devem respeitar o prefixo ou usar caminhos que o servidor encaminhe corretamente.
4. Em desenvolvimento, o Vite da porta 5173 deve encaminhar `/criativo/*` para o Vite da porta 5174, sem expor a porta ao navegador.
5. `/api/v1` e `/static` devem ser encaminhados diretamente ao DramaClaw antes da regra genérica `/api`.
6. Em produção, uma única camada HTTP deve servir os dois bundles e aplicar fallback SPA por prefixo.
7. O `<iframe>` e `EngineWorkspace` não podem fazer parte do caminho ativo.
8. A rail TG deve existir também no layout do frontend Criativo. O item **Simples** retorna a `/`; o item **Criativo** permanece ativo.

### 5.3 Regra de isolamento

Arquivos protegidos contra alteração funcional:

```text
src/components/SimpleVideoTab.tsx
src/components/VideoPlayerPreview.tsx
engines/moneyprinter/**
server/main.py                 # rotas /api/simple/** não podem mudar
```

Alterações mínimas permitidas no shell:

- `src/App.tsx`: remover o caminho ativo do formulário/iframe Criativo e navegar para `/criativo/`.
- `src/components/Sidebar.tsx`: permitir navegação por URL sem alterar a aparência da aba Simples.
- `vite.config.ts`: adicionar proxies e precedência de rotas.
- `scripts/start-studio.sh`: manter os serviços e ajustar apenas o necessário para a origem única.

### 5.4 Camada de domínio brasileira

Não renomear tabelas, endpoints ou entidades internas do DramaClaw. Adicionar um perfil opcional de conteúdo:

```json
{
  "content_profile": "commercial_br",
  "market": "pt-BR",
  "campaign": {
    "name": "Treino em casa — Agosto",
    "objective": "conversion",
    "primary_channel": "instagram_reels",
    "creative_format": "ugc_direct",
    "audience": "Mulheres de 25–44 anos com rotina corrida",
    "offer": "Programa de treino em casa",
    "core_promise": "Treinos curtos que cabem na rotina",
    "cta": "Conheça o programa",
    "objections": ["falta de tempo", "não gostar de academia"],
    "required_terms": [],
    "forbidden_terms": []
  },
  "output": {
    "variants": 5,
    "duration_seconds": 30,
    "aspect_ratio": "9:16",
    "captions": true
  },
  "brand": {
    "tone": "direto, acolhedor e confiante",
    "primary_color": "#19382B",
    "accent_color": "#C5A880",
    "logo_asset_id": null
  }
}
```

Regras:

- Persistir o objeto no config JSON já associado ao projeto; não criar banco paralelo.
- Adicionar tipos equivalentes em Python e TypeScript.
- Usar `spine_template="narrated"` como base compatível, mas selecionar prompts por `content_profile="commercial_br"`.
- Projetos antigos sem `content_profile` continuam funcionando com o comportamento original.
- `episode` continua sendo a entidade interna; na interface comercial, é exibido como **Criativo**.
- Cada criativo representa uma variação de gancho, ângulo, prova ou CTA dentro da mesma campanha.

### 5.5 Adaptação de prompts

Criar uma família separada de prompts `commercial_br`, sem sobrescrever os prompts de drama. Ela deve orientar:

- português brasileiro natural;
- gancho nos primeiros 1–3 segundos;
- uma ideia principal por criativo;
- estrutura compatível com 15–60 segundos;
- descrição visual filmável/gerável;
- CTA proporcional ao objetivo;
- variação real entre criativos;
- consistência de pessoa, produto e ambiente;
- ausência de referências culturais chinesas por padrão;
- prevenção de alegações impossíveis, garantias e linguagem enganosa;
- adequação ao canal e à proporção escolhidos.

Não traduzir prompts chineses palavra por palavra. Escrever prompts nativos para o contexto comercial brasileiro, mantendo o schema de saída exigido pelo motor.

### 5.6 Armazenamento e tarefas

Preservar a arquitetura do DramaClaw CE:

```text
state/<user>/<project>/data.db       # dados estruturados
output/<user>/<project>/...          # imagens, áudio, vídeo e exportações
```

- A criação, atualização, arquivo, restauração e exclusão de projetos continua usando a API atual.
- Jobs continuam no `TaskBackend` in-process e publicam progresso por SSE.
- Reload deve reidratar projeto e tarefas pelo backend.
- Não armazenar estado crítico somente em React ou `localStorage`.
- Não simular 100% no frontend.

### 5.7 Modelos e provedores

Preservar os modos oficiais do DramaClaw 1.3.2:

- configuração oficial;
- gateway compatível com NewAPI/OpenAI;
- modo híbrido;
- ComfyUI local quando configurado;
- catálogo de capacidades fornecido pelo backend.

O frontend não deve codificar uma lista fixa de modelos de imagem/vídeo. Deve consumir o catálogo do backend, como exige a versão 1.3.2.

### 5.8 Licença — gate obrigatório

O DramaClaw CE usa Elastic License 2.0. A própria documentação permite modificar, integrar e entregar trabalho a clientes, mas proíbe oferecer o CE a terceiros como serviço hospedado/gerenciado.

Antes de publicar externamente:

- manter avisos de licença e copyright;
- confirmar se a entrega será self-hosted/interna;
- se o plano for SaaS hospedado para clientes, interromper a publicação e obter licença comercial com os mantenedores;
- registrar essa decisão no README de implantação.

Este item é um alerta de engenharia e não substitui aconselhamento jurídico.

---

## 6. Especificação funcional completa

### 6.1 Mapa de navegação do TG Criativo

```text
Central de Projetos
└── Campanha
    ├── Canvas
    └── Produção
        ├── Briefing
        ├── Elementos
        │   ├── Pessoas e avatares
        │   ├── Produtos e objetos
        │   ├── Cenários
        │   └── Vozes
        ├── Criativos
        │   └── Criativo 01…N
        │       ├── Roteiro
        │       ├── Cenas
        │       │   ├── Texto
        │       │   ├── Quadro
        │       │   ├── Imagem
        │       │   ├── Áudio
        │       │   └── Vídeo
        │       └── Montagem
        ├── Diretor IA
        ├── Direção visual
        └── Tarefas
```

### 6.2 Matriz de equivalência

| DramaClaw interno/original | TG Criativo pt-BR | Regra |
|---|---|---|
| Project dashboard | Central de Projetos | Tela inicial da aba Criativo |
| Project | Campanha/Projeto | “Campanha” no wizard; “Projeto” em mensagens genéricas |
| Freezone / Xiahua | Canvas | Manter canvas infinito e nós |
| Mainline / Xiaji | Produção | Fluxo guiado completo |
| Ingest / Text | Briefing | Aceitar brief, roteiro, transcrição e referência |
| Characters | Pessoas e avatares | Manter identidade, retrato, variações e voz |
| Props | Produtos e objetos | Manter referência, geração e consistência |
| Scenes | Cenários | Manter biblioteca, master, panorama e Director World |
| Episodes | Criativos | Um criativo por variação |
| Episode | Criativo | Ex.: Criativo 01 |
| Script | Roteiro | Manter geração, revisão, edição e reparo |
| Beats / Shots | Cenas | Unidade de produção audiovisual |
| Text | Texto | Copy, fala, narração e descrição visual |
| Sketch | Quadro | Storyboard/rascunho visual |
| Render | Imagem | Primeiro quadro ou imagem final da cena |
| Audio | Áudio | Voz, narração e efeitos |
| Video | Vídeo | Geração e referências multimodais |
| Compose | Montagem | Composição, legendas e exportação |
| Styles | Direção visual | Presets, referência e consistência |
| Xia Director | Diretor IA | Assistente contextual do projeto |
| Task Center | Tarefas | Progresso, logs, cancelar, tentar novamente |
| Cast | Pessoas | Nunca exibir “elenco” como seção principal |
| Series | Campanha | Nunca exibir “série” no perfil comercial |

### 6.3 Central de Projetos

Preservar e adaptar:

- listar projetos ativos;
- pesquisar e ordenar;
- criar campanha;
- abrir projeto;
- abrir Canvas diretamente;
- duplicar quando suportado;
- arquivar e desarquivar;
- mover para lixeira;
- restaurar;
- excluir definitivamente com confirmação;
- mostrar última edição e quantidade de criativos;
- estados vazios, loading, erro e retry;
- cards claros, sem pastas azuis ou estética infantil.

O card deve mostrar: nome, objetivo, canal, formato, última alteração e progresso agregado. Dados ausentes em projeto legado podem usar fallback neutro.

### 6.4 Canvas Criativo

Preservar integralmente:

- múltiplos canvases por projeto;
- criar, renomear, salvar e excluir canvas;
- autosave com controle de versão/conflito;
- histórico;
- zoom, pan, minimapa e seleção;
- nós de texto, imagem, vídeo, áudio e marcação;
- upload múltiplo de imagens, vídeos e áudios;
- geração com modelos compatíveis;
- conexões entre nós e uso de referências;
- presets e skills;
- busca no histórico de ativos;
- promoção do resultado aprovado para a Produção;
- integração com biblioteca do projeto;
- feedback de progresso e erro por nó;
- cancelar e tentar novamente;
- Director World/3GS onde suportado.

Presets iniciais brasileiros:

1. UGC direto para Reels/TikTok.
2. Demonstração de produto.
3. Depoimento com prova permitida.
4. Oferta de varejo.
5. Storytelling de marca.
6. Conteúdo educacional curto.
7. Corte de entrevista/podcast.
8. Institucional premium.

### 6.5 Briefing

A tela atual de ingestão deve virar **Briefing**, com quatro entradas:

- **Preencher briefing** — formulário estruturado do wizard, editável.
- **Colar roteiro ou texto** — conteúdo livre.
- **Enviar arquivo** — formatos suportados pelo motor.
- **Adicionar referência** — texto/transcrição e arquivos de apoio.

Manter upload, validação de formato, progresso, cancelamento, reconstrução segura e visualização da estrutura derivada.

Substituir configurações iniciais:

- `spine_template`: oculto no perfil comercial; usar `narrated` internamente.
- `visual_style`: presets brasileiros da seção 7.4.
- `narration_style`: primeira pessoa, terceira pessoa, conversa, demonstração.
- `ethnicity`: remover da UI comercial. Usar **Representação** com padrão “Brasil diverso” e referências visuais opcionais.

O mapa derivado deve mostrar **mensagens, pessoas, produtos, objeções, provas, cenas e sequência**, não “relações de personagens de uma novela”.

### 6.6 Elementos

#### Pessoas e avatares

Manter criação, edição, exclusão, retrato, identidades, histórico, restauração, referência visual, variações e amostras de voz. Adaptar os campos para:

- nome/apelido;
- papel no criativo: porta-voz, cliente, especialista, narrador, figurante;
- aparência e guarda-roupa;
- comportamento diante da câmera;
- restrições de representação;
- imagem de referência;
- voz de referência.

#### Produtos e objetos

Manter geração, upload, edição, exclusão, referência e consistência. Acrescentar categorias de UI: produto principal, embalagem, acessório, objeto de cena, logomarca e material gráfico.

#### Cenários

Manter criação, edição, imagem master, referências, panorama, variações, geração assíncrona e recursos 3GS/Director World. Exemplos iniciais: casa brasileira contemporânea, academia, escritório, comércio, rua urbana, estúdio UGC e fundo de produto.

#### Vozes

Manter gravação, upload, corte, exclusão, cópia e preview. Priorizar pt-BR; mostrar claramente provedor, voz, gênero opcional, estilo e amostra. Não inferir gênero ou sotaque quando o provedor não informar.

### 6.7 Criativos

O planejamento original de episódios deve gerar **N criativos** conforme `output.variants`.

Cada variação precisa declarar:

```json
{
  "creative_number": 1,
  "name": "Rotina corrida",
  "angle": "falta de tempo",
  "hook": "Sem tempo para academia?",
  "promise": "treino curto dentro da rotina",
  "proof": "demonstração do método",
  "cta": "Conheça o programa",
  "duration_seconds": 30,
  "channel": "instagram_reels",
  "aspect_ratio": "9:16"
}
```

Requisitos:

- as variações não podem ser apenas paráfrases;
- o usuário pode adicionar, remover, renomear e reordenar;
- cada criativo possui status por etapa;
- abrir um criativo restaura a última subetapa visitada;
- o planejamento pode ser refeito sem apagar resultados aprovados sem confirmação.

### 6.8 Roteiro

Preservar:

- gerar roteiro;
- usar roteiro próprio;
- editar texto bruto e adaptado;
- visualizar linhas estruturadas;
- revisar/reparar saída;
- planejar pessoas, cenários e objetos;
- salvar e regenerar com confirmação;
- usar descrição visual, diálogo, narração, áudio, efeitos e duração.

Estrutura recomendada por criativo:

```text
Gancho → Contexto/problema → Demonstração/prova → Benefício → CTA
```

Essa estrutura é um padrão, não uma trava. Formatos educacionais e institucionais podem usar estruturas adequadas ao objetivo.

### 6.9 Cenas

Manter a bancada de produção em cinco subtabs:

1. **Texto:** copy, fala, narração, descrição visual, duração e referências.
2. **Quadro:** storyboard/rascunho, geração, seleção e edição.
3. **Imagem:** primeiro quadro ou imagem renderizada, seleção e referências.
4. **Áudio:** TTS/voz, emoção, preview, upload e regeneração.
5. **Vídeo:** texto-para-vídeo, imagem-para-vídeo e modos de referência permitidos pelo modelo.

Cada cena deve mostrar status, dependências, custo estimado quando disponível, erros acionáveis e ações de cancelar/repetir.

### 6.10 Montagem e exportação

Preservar:

- validação de pré-requisitos;
- ordenação das cenas;
- composição de vídeo e áudio;
- legendas;
- preview;
- exportação MP4;
- arquivo de legendas quando suportado;
- pacote de ativos;
- progresso real;
- retomada/cancelamento;
- player HTML5 e download.

Aceite do MP4:

- HTTP 200;
- `Content-Type: video/mp4`;
- tamanho maior que 100 KB no cenário de teste;
- assinatura/container reconhecido por `ffprobe`;
- vídeo e áudio decodificáveis quando a produção contém áudio;
- duração maior que zero;
- link não pode ser `#`, `blob:` efêmero como única fonte ou arquivo de amostra fixo.

### 6.11 Direção visual

Preservar criação, edição, exclusão, análise por imagem, preview, prompt positivo, instruções de exclusão, tags e estilo padrão do projeto.

O padrão inicial não pode ser `chinese_period_drama`. Para novos projetos comerciais brasileiros, usar `tg_ugc_natural_br` ou o preset escolhido no wizard.

### 6.12 Diretor IA

Rebatizar o assistente como **Diretor IA**. Ele deve:

- ler o estado real do projeto;
- identificar pendências;
- sugerir próximo passo;
- ajudar com roteiro, cenas, ativos e consistência;
- executar somente ações confirmadas quando forem destrutivas ou gerarem custo;
- responder em pt-BR;
- usar terminologia TG da matriz de equivalência.

Se a surface do assistente estiver desativada na CE atual, a UI deve ocultar a entrada sem quebrar a navegação. Não exibir botão morto.

### 6.13 Tarefas

Preservar central e barra de tarefas:

- fila e tarefas em execução;
- percentual e etapa;
- logs úteis em pt-BR quando originados pela camada TG;
- cancelar;
- tentar novamente;
- limpar concluídas;
- SSE reconectável;
- recuperação após reload;
- erro com causa e ação recomendada.

### 6.14 Configurações

Manter acesso às configurações necessárias:

- provedor/model gateway;
- catálogo de modelos e capacidades;
- armazenamento de mídia;
- idioma fixado por padrão em Português (Brasil);
- modelos de texto, imagem, vídeo e áudio;
- modo oficial, customizado, híbrido e ComfyUI quando disponível;
- status de configuração incompleta.

Ocultar elementos de billing, conta ou surfaces exclusivos da EE quando não existem na CE, sem criar simulações.

---

## 7. Localização, conteúdo e design system

### 7.1 Idioma

- Locale canônico: `pt-BR`.
- Fallback: `pt-BR`, nunca mandarim.
- Manter inglês e chinês apenas como locales opcionais internos, se desejado; não são necessários para aceite.
- Definir `<html lang="pt-BR">`.
- Formatar datas, números e horários com `Intl` em `pt-BR` e timezone local.
- Revisar plural, gênero gramatical e microcopy; não usar tradução automática bruta como entrega final.

### 7.2 Gate de tradução

1. Inventariar todas as chaves usadas pelas rotas da seção 6.
2. Completar `translation.json` em pt-BR.
3. Remover strings hardcoded visíveis em inglês ou mandarim das rotas ativas.
4. Criar teste que renderiza as rotas e falha quando encontra ideogramas CJK em texto visível.
5. Criar allowlist mínima para nomes próprios de modelo, arquivos enviados e conteúdo do usuário.
6. Falhar quando a UI renderizar a própria chave i18n (`episode.nav.*`, por exemplo).

### 7.3 Identidade TG

Tokens obrigatórios:

```css
:root {
  --tg-forest: #19382B;
  --tg-forest-hover: #234C3B;
  --tg-champagne: #C5A880;
  --tg-page: #F7F7F5;
  --tg-surface: #FFFFFF;
  --tg-cloud: #F0EEE9;
  --tg-text: #19382B;
  --tg-muted: #5F7268;
  --tg-border: #DED9D0;
  --tg-success: #238A5A;
  --tg-warning: #B7791F;
  --tg-danger: #B54747;
}
```

Tipografia:

- títulos: Plus Jakarta Sans, 600–800;
- interface e corpo: DM Sans, 400–700;
- fallback: system-ui, sans-serif.

### 7.4 Presets visuais brasileiros iniciais

| ID interno | Nome na UI | Uso |
|---|---|---|
| `tg_ugc_natural_br` | UGC natural | Conteúdo autêntico, luz natural, celular |
| `tg_direct_response` | Performance direto | Oferta, benefício e CTA fortes |
| `tg_product_premium` | Produto premium | Close, textura, acabamento e luz controlada |
| `tg_retail_offer` | Oferta de varejo | Preço, produto, ritmo e legibilidade |
| `tg_brand_story` | Storytelling de marca | Narrativa emocional e consistência |
| `tg_educational_clean` | Educacional limpo | Clareza, demonstração e gráficos discretos |
| `tg_podcast_cut` | Corte de conversa | Legendas, enquadramento e ritmo social |
| `tg_institutional` | Institucional | Credibilidade, equipe e operação |
| `tg_food_appetite` | Gastronomia | Textura, vapor, cor e apelo sensorial |
| `tg_fitness_wellness` | Fitness e bem-estar | Movimento realista sem promessa enganosa |

Presets chineses podem permanecer disponíveis em uma categoria **Outros estilos**, mas nunca como padrão nem com texto em mandarim.

### 7.5 Regras visuais

- fundo geral claro `--tg-page`;
- cards e áreas de trabalho brancos;
- rail esquerda Forest Green;
- item ativo e ações primárias com Champagne Gold usado com parcimônia;
- texto principal Forest Green;
- sem cyan/elétrico;
- sem fundo azul-marinho ocupando toda a aplicação;
- bordas finas, raios de 10–14 px e sombras discretas;
- o Canvas pode usar grade sutil, mas permanece claro por padrão;
- estados de loading, vazio e erro devem parecer parte do produto;
- WCAG AA para texto e controles;
- foco de teclado visível;
- `prefers-reduced-motion` respeitado.

### 7.6 Regra de implementação CSS

Não continuar empilhando overrides globais. Consolidar o tema do frontend DramaClaw:

1. preservar os tokens funcionais necessários;
2. definir o tema TG em um único bloco canônico carregado por último;
3. remover duplicações conflitantes criadas pela adaptação anterior;
4. evitar seletores genéricos como `[class*="cyan"]` como solução final;
5. atualizar `engines/dramaclaw/DESIGN.md` junto com `frontend/src/index.css`.

---

## 8. Plano de implementação em sete blocos

### Regra de execução

Executar um bloco por vez. Ao terminar, registrar arquivos alterados, comandos executados, resultado dos testes e evidência visual. Não avançar com gate vermelho.

| Bloco | Entrega | Arquivos principais | Concluído quando |
|---:|---|---|---|
| 0 | Baseline e segurança | `.gitignore`, documentação, inventário | há snapshot recuperável, segredos/mídia fora do Git e builds baseline registrados |
| 1 | Origem única e navegação | `src/App.tsx`, `Sidebar.tsx`, Vite configs, router Drama | estrela abre `/criativo/`, sem iframe, sem porta 5174 visível |
| 2 | Shell e design TG | layout/header Drama, `index.css`, `DESIGN.md` | Central de Projetos clara, rail TG e tokens únicos |
| 3 | pt-BR e taxonomia | i18n, labels, mensagens, presets | rotas principais sem mandarim/inglês e glossário aplicado |
| 4 | Perfil comercial brasileiro | schemas, config, prompts, wizard, briefing | campanha persiste campos e gera N variações semanticamente diferentes |
| 5 | Paridade funcional completa | Canvas, elementos, criativos, cenas, montagem, tarefas, settings | todas as telas da seção 6 acessíveis e operacionais |
| 6 | QA E2E, hardening e entrega | testes, scripts, README, evidências | builds verdes, regressão zero no Simples e MP4 real validado |

### Bloco 0 — Baseline e segurança

1. Criar `.gitignore` antes de qualquer commit, cobrindo no mínimo:

```gitignore
node_modules/
dist/
.venv/
__pycache__/
.runtime/
.env
.env.*
!.env.example
engines/**/state/
engines/**/output/
engines/**/storage/
engines/**/runtime/
*.mp4
*.mov
*.wav
*.log
.DS_Store
```

2. Verificar arquivos maiores que 20 MB e possíveis segredos antes do baseline.
3. Inicializar Git local se ainda não existir e criar um commit baseline recuperável.
4. Registrar resultados de:

```bash
npm run build
cd engines/dramaclaw/frontend && pnpm build
cd engines/dramaclaw && .venv/bin/python -m pytest --collect-only -q
```

5. Capturar screenshots baseline das abas Simples e Criativo.

**Gate:** nenhuma mídia gerada, credencial, banco local ou ambiente virtual está versionado.

### Bloco 1 — Origem única e navegação

1. Remover o botão **Abrir estúdio completo** do fluxo ativo.
2. Remover `EngineWorkspace` e `<iframe>` do caminho Criativo.
3. Navegar o ícone estrela para `/criativo/`.
4. Configurar base path do frontend DramaClaw.
5. Configurar proxy de `/criativo`, `/api/v1` e `/static` com precedência correta.
6. Adicionar rail TG ao layout DramaClaw; Simples retorna a `/`.
7. Garantir refresh em uma rota profunda, como `/criativo/projects/<id>/styles`.

**Gate:** DevTools mostra um único origin; `document.querySelectorAll('iframe').length === 0`.

### Bloco 2 — Shell e design TG

1. Consolidar tokens.
2. Forçar tema claro como padrão.
3. Redesenhar Central de Projetos, header, navegação de projeto e estados.
4. Substituir marcas e ícones DramaClaw/SuperTale por TG Criativo, preservando atribuições legais fora da apresentação principal.
5. Remover azul/cyan e componentes lúdicos que conflitam com o produto profissional; não remover funções de tarefa ou navegação.
6. Atualizar `DESIGN.md`.

**Gate:** screenshot 1440×900 aprovado visualmente e contraste AA nos controles principais.

### Bloco 3 — pt-BR e taxonomia

1. Criar locale pt-BR canônico.
2. Aplicar matriz da seção 6.2.
3. Traduzir strings de todas as rotas ativas, diálogos, toasts, erros e estados.
4. Remover defaults chineses da primeira experiência.
5. Adicionar testes de chaves ausentes, CJK visível e fallback indevido.

**Gate:** varredura E2E não encontra texto em mandarim/inglês, salvo allowlist documentada.

### Bloco 4 — Perfil comercial brasileiro

1. Adicionar `content_profile` e `commercial_br` aos schemas de projeto.
2. Criar wizard Nova campanha.
3. Persistir campanha, saída e marca no config existente.
4. Adaptar Briefing e seu conteúdo derivado.
5. Criar prompts comerciais pt-BR versionados e testes de schema.
6. Gerar N criativos usando internamente a entidade `episode`.
7. Garantir compatibilidade de projetos legados.

**Gate:** após reload, os campos permanecem; cinco variações apresentam ganchos/ângulos distintos e schema válido.

### Bloco 5 — Paridade funcional

Percorrer e validar, sem atalhos:

- Central de Projetos;
- Canvas;
- Briefing;
- Pessoas/avatares;
- Produtos/objetos;
- Cenários;
- Vozes;
- Criativos;
- Roteiro;
- Cenas: texto, quadro, imagem, áudio e vídeo;
- Montagem;
- Direção visual;
- Diretor IA quando disponível;
- Tarefas;
- Configurações.

**Gate:** matriz de paridade preenchida com status, evidência e nenhum item obrigatório “pendente”.

### Bloco 6 — QA E2E e entrega

1. Substituir logs de sucesso por asserções reais.
2. Executar os casos da seção 9.
3. Rodar builds e testes.
4. Executar uma produção canário com provedores reais configurados.
5. Validar MP4 com `ffprobe`.
6. Registrar screenshots e vídeo demonstrativo do fluxo.
7. Documentar inicialização, configuração, limitações e licença.
8. Só declarar pronto com todos os gates obrigatórios verdes.

### Ordem de corte se houver pressão de prazo

1. Cortar refinamentos de motion.
2. Cortar presets além dos quatro primeiros.
3. Ocultar Diretor IA se a surface oficial estiver indisponível.
4. Adiar Director World/3GS somente se estiver sem dependências locais, mantendo a entrada claramente marcada como indisponível.

### Nunca cortar

- origem única sem iframe;
- Central de Projetos;
- Canvas;
- Briefing;
- elementos;
- criativos/variações;
- roteiro;
- cenas;
- montagem e MP4;
- tarefas e erros reais;
- pt-BR;
- isolamento da aba Simples;
- licença e segurança de credenciais.

---

## 9. Estratégia de QA e critérios E2E

### 9.1 Pirâmide de testes

**Unitários:** mapeamento de domínio, locale, schemas, prompt builders, config e helpers de rota.

**Integração:** API de projetos, persistência do perfil comercial, planejamento de variações, tarefas, SSE, assets e exportação.

**E2E:** navegador real cobrindo a jornada completa, com asserções de URL, texto, estado, rede, arquivo e vídeo.

### 9.2 Casos obrigatórios

#### E2E-01 — Regressão da aba Simples

1. Abrir `/`.
2. Confirmar Simples ativa.
3. Confirmar campos, voz, formato e legendas.
4. Executar o teste simples existente com backend real quando configurado.
5. Confirmar que nenhuma mudança visual/funcional inesperada ocorreu.

**Aceite:** comportamento e screenshot equivalentes ao baseline.

#### E2E-02 — Entrada no Criativo

1. Clicar na estrela.
2. Confirmar URL `/criativo/`.
3. Confirmar **Central de Projetos**.
4. Confirmar estrela ativa e fundo claro.
5. Confirmar ausência de **Abrir estúdio completo**, iframe e porta 5174.

#### E2E-03 — Nova campanha e persistência

Criar a campanha de teste:

```text
Nome: Treino em casa — Queima Pochete
Objetivo: Conversão
Canal: Instagram Reels
Formato: UGC direto
Público: Mulheres de 25–44 anos com rotina corrida
Oferta: Programa de treino em casa
Promessa: Treinos curtos que cabem na rotina
CTA: Conheça o programa
Variações: 5
Duração: 30 segundos
Proporção: 9:16
```

Recarregar a página.

**Aceite:** dados persistem e o projeto abre no Canvas.

#### E2E-04 — Canvas

1. Criar texto de gancho.
2. Adicionar imagem de referência.
3. Conectar a um nó de vídeo.
4. Salvar, recarregar e confirmar persistência.
5. Promover um ativo para a Produção.

#### E2E-05 — Briefing e cinco criativos

1. Completar o briefing.
2. Gerar planejamento.
3. Confirmar cinco criativos.
4. Confirmar variação de ângulo e gancho.

**Aceite:** nenhum item é mera duplicata textual; todos possuem duração, canal, proporção e CTA.

#### E2E-06 — Elementos

Criar ou importar uma pessoa, um produto e um cenário. Confirmar edição, referência, persistência e seleção nas cenas.

#### E2E-07 — Roteiro e cenas

Abrir Criativo 01, gerar ou inserir roteiro, editar uma linha, criar cenas e percorrer Texto, Quadro, Imagem, Áudio e Vídeo.

**Aceite:** estados e dependências são reais e restaurados após reload.

#### E2E-08 — Tarefa longa

Iniciar geração, observar SSE, recarregar a página e confirmar retomada. Testar cancelamento em uma tarefa descartável e retry em falha controlada.

#### E2E-09 — Montagem e MP4

Compor o Criativo 01, reproduzir no player, baixar o MP4 e executar:

```bash
ffprobe -v error -show_entries format=duration,format_name,size -of json <arquivo.mp4>
```

**Aceite:** container válido, duração e tamanho maiores que zero e MIME `video/mp4`.

#### E2E-10 — Navegação profunda

Abrir diretamente e recarregar rotas de Canvas, Briefing, Elementos, Criativos, Direção visual e Tarefas.

**Aceite:** nenhum 404 e nenhum retorno indevido à Central.

#### E2E-11 — Localização

Coletar `innerText` das rotas obrigatórias e falhar em:

- ideogramas CJK;
- chaves i18n renderizadas;
- frases inglesas fora da allowlist;
- marcas DramaClaw, SuperTale, Xiaji e Xiahua na UI principal.

#### E2E-12 — Estados de falha

Com a API DramaClaw indisponível, mostrar erro acionável em pt-BR. Com provedor sem configuração, mostrar o requisito real; não simular conclusão.

### 9.3 Comandos mínimos de verificação

```bash
# Shell TG
npm run build

# Frontend Criativo
cd engines/dramaclaw/frontend
pnpm build
pnpm test

# Backend DramaClaw
cd ..
.venv/bin/python -m pytest

# Inicialização integrada
cd ../..
bash scripts/start-studio.sh
```

Se a suíte completa do backend exceder o tempo disponível, executar primeiro testes focados nas áreas alteradas e depois a suíte padrão antes da entrega final. Não omitir testes por conveniência.

### 9.4 Evidências obrigatórias

Salvar em `test_results/tg-criativo/`, sem versionar vídeos grandes:

- `01-central-projetos.png`;
- `02-nova-campanha.png`;
- `03-canvas.png`;
- `04-briefing.png`;
- `05-elementos.png`;
- `06-cinco-criativos.png`;
- `07-cenas.png`;
- `08-montagem-player.png`;
- `09-tarefas.png`;
- `qa-report.md`;
- `e2e-results.json`.

### 9.5 Definição de pronto

O produto só está pronto quando:

- todos os objetivos O1–O8 foram atendidos;
- todos os blocos possuem gate verde;
- os 12 casos E2E obrigatórios passaram ou um bloqueio externo foi documentado com evidência;
- um MP4 real foi produzido e validado, se houver chave/saldo de modelo disponível;
- a aba Simples não sofreu regressão;
- não há iframe, mídia fake, link `#` ou progresso simulado;
- o README explica como iniciar e configurar;
- a decisão de licença está registrada.

Um bloqueio externo de chave/saldo não autoriza declarar geração real aprovada. Ele deve ser apresentado como bloqueio, enquanto todos os testes determinísticos e de integração local permanecem obrigatórios.

---

## 10. Decisões, riscos, manutenção e trabalho futuro

### 10.1 Log de decisões

| Decisão | Motivo | Trade-off |
|---|---|---|
| Preservar DramaClaw 1.3.2 | já contém o pipeline completo e é a release atual | exige acompanhar upstream |
| Composição por rota | entrega um produto único sem reescrever o frontend maduro | dois bundles continuam existindo internamente |
| Proibir iframe | roteamento, acessibilidade, download, sessão e UX ficam coerentes | requer configurar base path/proxy |
| Manter entidades internas | reduz risco de quebrar API e banco | exige camada de terminologia na UI |
| `commercial_br` como perfil | separa prompts e defaults brasileiros do fluxo legado | adiciona campos opcionais ao config |
| `episode` → Criativo somente na UI | reaproveita planejamento e produção existentes | documentação deve explicar o mapeamento |
| Tema claro obrigatório | pedido explícito e coerência TG | dark mode fica fora do MVP |
| pt-BR canônico | produto brasileiro, não tradução genérica | exige revisão além de i18n automático |
| Catálogo de modelos pelo backend | compatível com DramaClaw 1.3.2 | UI depende do contrato de capacidades |
| Teste real + testes determinísticos | comprova integração sem tornar toda suíte cara | canário requer chave e saldo |
| Não tocar na aba Simples | protege a parte já validada | shell só pode mudar minimamente |
| Manter licença/atribuição | obrigação ELv2 | SaaS hospedado exige licença comercial |

### 10.2 Riscos e mitigação

| Risco | Severidade | Mitigação |
|---|---:|---|
| CSS TG ser sobrescrito pela cascata original | Alta | consolidar tokens, remover duplicação e testar computed styles |
| Rotas profundas quebrarem sob `/criativo` | Alta | base path único, fallback SPA e E2E de reload |
| `/api` do TG capturar `/api/v1` | Alta | proxy específico antes do genérico |
| Tradução incompleta | Alta | inventário de chaves + scanner de UI renderizada |
| Prompts ainda produzirem drama chinês | Alta | perfil `commercial_br`, fixtures e revisão de saída |
| Reescrita excessiva dificultar upgrades | Alta | adapter layer e mínimo de mudanças no core |
| Modelo externo indisponível ou caro | Média | mock contratual + canário real controlado; nunca mídia fake |
| Tarefa in-process morrer com o backend | Média | documentar limite CE, persistir checkpoint e testar retomada suportada |
| Licença incompatível com SaaS | Crítica | gate comercial antes de qualquer hospedagem externa |
| Projeto sem Git perder trabalho | Alta | Bloco 0 obrigatório |
| Script E2E declarar falso positivo | Alta | asserções, exit code e artefatos verificáveis |

### 10.3 Estratégia de atualização do DramaClaw

1. Registrar a versão upstream e o commit-base.
2. Manter alterações TG concentradas em:
   - integração/base path;
   - design tokens/layout;
   - locale pt-BR;
   - perfil e prompts `commercial_br`;
   - testes TG.
3. Evitar alterações espalhadas em geradores e stores sem necessidade.
4. A cada release upstream: ler changelog, atualizar em branch separada, rodar contrato e E2E, revisar conflitos e somente então integrar.
5. Nunca remover avisos SPDX/copyright dos arquivos derivados.

### 10.4 Trabalho futuro

- autenticação e multiusuário com licença adequada;
- colaboração e comentários por projeto;
- brand kits reutilizáveis entre campanhas;
- biblioteca de benchmarks de criativos vencedores;
- importação estruturada de anúncios e métricas;
- templates por nicho com revisão de políticas;
- aprovação de cliente e versionamento de entregas;
- publicação direta em canais sociais;
- dashboard de performance e aprendizado entre variações;
- unificação física dos dois frontends em um monorepo/package compartilhado, somente quando houver benefício comprovado;
- app móvel de revisão, não de edição completa.

### 10.5 Fontes primárias consultadas

- Repositório oficial: https://github.com/dramaclaw/dramaclaw
- Arquitetura oficial: https://github.com/dramaclaw/dramaclaw/blob/main/docs/en/concepts/architecture.md
- Funcionalidades oficiais: https://github.com/dramaclaw/dramaclaw/blob/main/docs/en/concepts/features.md
- MCP oficial: https://github.com/dramaclaw/dramaclaw/blob/main/docs/en/guides/mcp-claude-code.md
- Releases oficiais: https://github.com/dramaclaw/dramaclaw/releases/tag/v1.3.2
- Licença local: `engines/dramaclaw/docs/en/license.md`
- Design local: `engines/dramaclaw/DESIGN.md`

### 10.6 Checklist final do implementador

- [ ] Li o PRD inteiro antes de editar.
- [ ] Criei baseline recuperável e protegi segredos/mídia.
- [ ] Não alterei o motor nem a experiência da aba Simples.
- [ ] Removi iframe e botão de estúdio externo.
- [ ] Toda a experiência Criativo usa a origem `localhost:5173`.
- [ ] Central de Projetos é a primeira tela.
- [ ] Projeto novo abre no Canvas.
- [ ] Canvas e Produção completos estão disponíveis.
- [ ] Perfil `commercial_br` persiste no projeto.
- [ ] Cinco criativos possuem variações reais.
- [ ] UI principal está integralmente em pt-BR.
- [ ] Tema claro TG está consistente e sem cyan/azul dominante.
- [ ] Progresso e erros vêm do backend.
- [ ] Player e MP4 real foram validados.
- [ ] Builds, testes e E2E passaram.
- [ ] Evidências foram salvas.
- [ ] README e gate de licença foram atualizados.

---

**Palavra de início da implementação:**  
`Implemente o PRD-TG-CRIATIVO.md começando pelo Bloco 0. Pare somente diante de bloqueio externo comprovado ou depois da definição de pronto.`
