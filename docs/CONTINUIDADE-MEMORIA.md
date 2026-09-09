# Continuidade — Perfil, Memória e copies

Trabalhar na branch dev e inspecionar alterações locais antes de editar. Esta entrega foi autorizada para publicação no GitHub. O projeto da Thaís é 01M1SAXW27GVCP7QF6EYY7PSQN. Os dados reais estão no armazenamento local do motor; não substituir por dados de demonstração.

## Estado da entrega e dados

Cinco testes de backend passaram após a implementação da revisão. O build completo passou antes dos últimos ajustes de leitura e navegação. A última tentativa de build falhou por falta de memória do computador; não considerar o build final aprovado. Após reiniciar, módulo do Perfil, CSS e API responderam HTTP 200, o que não equivale a teste visual. A automação do navegador estava indisponível.

O banco local continha 15 posts e 20 copies (dez anteriores e dez novos rascunhos). SQLite, mídias, credenciais e arquivos de runtime não são enviados ao GitHub. Em outra máquina, é necessário migrar o estado por backup seguro; um clone sozinho não recupera esses dados. No mesmo computador, reutilizar os diretórios existentes sem reinicializar projetos. Consultar engines/dramaclaw/state/local/projects.db para localizar o state_dir do projeto. Não imprimir credenciais.

Diretório usado nesta entrega: C:/Users/pedro/Documents/Codex/2026-09-07/https-stop-motion-desk-openai-chatgpt/work/tg-video-studio.

## Implementado

- Memória com fontes, filtros, documentos e resumo executivo da reunião.
- Perfil editável e revisão versionada de copies com status e notas.
- Cada período da copy aparece em bloco próprio, inclusive quando o texto já contém parágrafos. O botão Copiar Roteiro mantém essa separação.
- Gancho duplicado removido quando a fala já começa com ele; texto sem rolagem interna no card.
- Barra lateral com rótulos Perfil, Simples e Criativo.

## Próxima etapa

Confirmar se o serviço mencionado é Apify, OpenAI ou ambos. Não há nova integração configurada nesta etapa. Não solicitar chaves no chat; utilizar o mecanismo seguro de configuração disponível. Verificar os endpoints de ingestão e transcrição existentes antes de criar outro fluxo.

Fluxo desejado: selecionar post ou enviar vídeo → coletar mídia com origem → solicitar transcrição → mostrar estado real do trabalho e permitir copiar a fala → relacionar transcrição à fonte. Distinguir processamento assíncrono de transcrição ao vivo; não prometer tempo real sem suporte do fornecedor.

Validar a experiência de leitura, revisão e gravação com Tiago. Feedback e desempenho ainda são notas manuais; não alegar aprendizado automático ou integração de vendas. A ferramenta de navegador falhou anteriormente; não tratar HTTP 200 como validação visual.

## Operação

Iniciar scripts/start-studio.ps1 no Windows. Interface 5173, frontend Criativo 5174, API Criativo 8780 e gateway 8000. Compilar o frontend nativo com npm run build:ce em engines/dramaclaw/frontend. Testes de revisão: tests/test_editorial_review.py e tests/test_copy_reference.py dentro do motor.
