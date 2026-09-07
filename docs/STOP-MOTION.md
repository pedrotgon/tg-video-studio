# TG Stop Motion

O modo **Animação** amplia o TG Video Studio com um palco 3D local. Abra pelo menu ou por `/#animation`. Os modos Simples, Criativo e Perfil preservam seu fluxo. A implementação foi feita sobre `b5e14be`, na branch `feat/stop-motion-studio`.

## Produzir uma cena

1. Adicione pessoa, coelho, gato ou caneca e personalize nome, cor e identidade.
2. Ajuste posição, escala, braços, pernas, cabeça, boca e câmera. A seleção também funciona pelo palco.
3. Capture quadros ou use Acenar, Caminhar e Falar para acrescentar ciclos de 12 quadros. Caminhar é um ciclo no lugar; Falar é um movimento de boca, sem sincronização labial automática.
4. Selecione um quadro para recuperar sua cena. Mudanças no palco só substituem esse quadro ao clicar em **Atualizar quadro**. **Capturar** sempre acrescenta um quadro ao final.
5. Duplique, exclua e reordene usando os botões da timeline. Duração mantém a pose por múltiplos do intervalo de um quadro. A opção Pose anterior mostra o quadro anterior como referência translúcida e não entra no vídeo.
6. Importe PNG, JPEG ou WebP para o cenário e áudio para voz/trilha. O áudio começa no início e é limitado à duração da timeline; prolongue os quadros para acomodar a fala.
7. Exporte GIF sem som ou WebM com áudio. WebM grava em tempo real; mantenha a aba visível. É possível cancelar sem perder o projeto.

## Projetos e limites

Salvamento automático no IndexedDB do navegador, com download/importação de JSON incluindo cenário, áudio e cenas editáveis. Isso é armazenamento **neste dispositivo**, não sincronização de conta. O navegador pode limpar dados locais; baixe o projeto para backup e transporte. A abertura de outro projeto e as edições têm até 30 estados de desfazer/refazer durante a sessão.

- Até 12 personagens e 240 quadros por projeto.
- Cenário de até 5 MB, reduzido para no máximo 1600 pixels no maior lado.
- Áudio de até 20 MB; projeto JSON de até 40 MB.
- GIF: 640 pixels de largura, ou 360 para vertical. A duração é arredondada à unidade de 10 ms do formato GIF.
- WebM: 960 pixels de largura, ou 540 para vertical. O suporte aos codecs depende do navegador. Não há exportação MP4 nesta versão.
- WebGL é necessário; uma mensagem é exibida se a inicialização falhar.

## Relação com DramaClaw e IA

O DramaClaw vendorizado em `engines/dramaclaw` contém projetos, personagens, geração de imagens e amostras de voz. Não é necessário executar sua infraestrutura Python nem baixar pesos/modelos 3D para usar o novo palco. Os quatro personagens são geometrias originais articuladas em Three.js.

Cliente/perfil, roteiro e identidade são notas locais deste projeto. **Não há sincronização automática** desses campos com os perfis do DramaClaw. O link Abrir TG Criativo leva ao estúdio existente; imagens e áudios produzidos lá podem ser baixados e importados no palco. Não foi criado um chat que simule respostas de IA ou chamadas fictícias de geração.

Para evoluir: vincular projetos autenticados do DramaClaw e sua biblioteca de personagens, persistir arquivos nos contratos de mídia existentes, integrar uma voz de produção e gerar poses estruturadas a partir de roteiro. Isso precisa respeitar as credenciais e provedores configurados no ambiente real. A primeira versão não invoca APIs pagas, clona vozes ou depende de chaves externas.

## Arquitetura e validação

`StopMotionStudio` é carregado sob demanda. Three.js só chega ao navegador ao entrar em Animação. A timeline armazena estado de cena; miniaturas são derivadas e não incham o arquivo. Renderização acontece sob demanda, sem loop 3D constante quando o editor está parado. GIF é codificado em worker, um quadro por vez, para manter a interface responsiva. Streams, contextos gráficos e áudio são liberados no encerramento.

`npm run test:stop-motion` verifica isolamento das poses, tempo e reordenação dos quadros, importação inválida e persistência de cenário/áudio/perfis. `npm run build` verifica TypeScript e o empacotamento de produção. A validação visual e os codecs do navegador precisam ser conferidos no dispositivo de uso. O gateway e os serviços DramaClaw/MoneyPrinterTurbo não foram iniciados nesta integração.

O front-end completo continua dependendo do gateway para os modos já existentes. Não deve ser publicado como uma aplicação inteiramente estática alegando que essas APIs estarão disponíveis.
