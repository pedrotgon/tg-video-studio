import { useState, type CSSProperties } from "react";
import { Plus } from "lucide-react";
import loginStyles from "@/components/login/login.module.css";
import SideRays from "@/components/react-bits/side-rays";
import styles from "./eleventh-faq-screen.module.css";
import { businessWechatQrUrl } from "./media";

const faqs = [
  {
    question: "Quais são as diferenças entre DramaClaw e ferramentas de geração de vídeo padrão? ",
    answer:
      "Ferramentas padrão geralmente se concentram em uma única instrução, um episódio ou uma imagem. DramaClaw é projetado para projetos completos: desde importação de texto, acumulação de recursos, planejamento da série e planificação de cenas até a exportação sintética. Isso criou um loop de produção reutilizável, colaborável e rastreável. ",
  },
  {
    question: "Qual é o melhor lugar para começar? ",
    answer:
      "Recomendamos começar com o fluxo de trabalho principal: importação de texto de DramaClaw, confirmação de personagem/cenário/prop/linha de voz, planejamento de cenas e geração de roteiro e cena, finalmente, entre no painel de sintetização para exportação. O objetivo inicial não é criar uma obra-prima, mas sim correr um episódio. ",
  },
  {
    question: "Quais são as funções de DramaClaw e DramaArt? ",
    answer:
      "O espelho de camarão é a principal linha de produção, adequada para episódios descontínuos, estáveis e progressivos; a pintura de camarão é a bancada de trabalho do diretor, adequada para acabamento de lentes-chave, exploração de múltiplas versões, finalização de ativos e processamento de vídeo complexo.Projetos formais geralmente são lentes comuns com espelhos de camarão, e é difícil para as lentes entrarem em pinturas de camarão.",
  },
  {
    question: "Os resultados na pintura de camarão substituirão automaticamente os ativos da linha principal?",
    answer:
      "Não. O conteúdo gerado ou carregado em desenhos de camarão é um candidato por padrão.Somente depois de clicar explicitamente em Escrever de volta e selecionar um slot de destino, como um personagem, cena, adereço, esboço de batida, primeiro quadro ou vídeo, o resultado entrará na linha principal oficial do projeto.",
  },
  {
    question: "Por que organizar personagens, cenas, adereços e vozes primeiro?",
    answer:
      "A razão pela qual a criação de vídeo com IA é a mais fácil de retrabalhar muitas vezes não é o último passo da geração de vídeo, mas a instabilidade dos personagens na frente, cenas pouco claras, falta de referência para adereços e linhas de som inconsistentes.As lagoas de camarão transformam esses conteúdos em ativos primeiro, o que pode reduzir significativamente a confusão dos estágios subsequentes da câmera.",
  },
  {
    question: "Para quais tipos de conteúdo o DramaClaw é adequado?",
    answer:
      "Adequado para esquetes de IA, comédias, novos tweets, peças narrativas, campanhas publicitárias, vídeos de treinamento educacional e projetos de equipe que exigem manutenção de longo prazo de personagens IP e conteúdo da série.Os criadores individuais podem usá-lo para executar o processo e as equipes podem usá-lo para colaborar na produção.",
  },
  {
    question: "Como o trabalho em equipe deve ser dividido?",
    answer:
      "Recomenda-se dividir o trabalho de acordo com o link: o responsável gerencia o projeto, o custo e a inspeção de qualidade; o roteirista lida com o texto e o roteiro; a arte mantém os personagens, cenas e adereços; o tiro/diretor é responsável pela performance do tiro; a operação de vídeo lida com o primeiro quadro, vídeo e síntese.As permissões podem ser atribuídas pelo visualizador, editor, administrador e proprietário.",
  },
  {
    question: "O que deve ser verificado primeiro quando o efeito de geração é instável?",
    answer:
      "Primeiro, verifique onde está o problema: se o texto está claro, se a identidade do personagem está correta, se a cena e os adereços são referenciados, se o esboço explica claramente a foto, se o primeiro quadro é estável e se o áudio corresponde.Em vez de gerar vídeo repetidamente desde o início, primeiro corrija o ativo upstream e as descrições das lentes.",
  },
  {
    question: "O que é “Faça seu Universo DC”?",
    answer:
      "DC não é apenas um acrônimo para DramaClaw, mas também representa o próprio universo de conteúdo de cada criador.A DramaClaw quer ajudar os criadores a construir personagens, visão de mundo, ativos de cena e recursos de produção de conteúdo serializado, começando com uma história.",
  },
  {
    question: "Para onde devo ir depois de fazer login?",
    answer:
      "Após login, você entrará no centro de gerenciamento de projetos. Você pode abrir projetos existentes ou criar novos para iniciar uma nova série. Cada projeto é um espaço independente que contém texto, recursos, projetos, cenas, vídeos, tarefas e resultados de sintaxe.",
  },
];

export function EleventhFaqScreen({
  exitProgress = 0,
  progress,
}: {
  exitProgress?: number;
  progress: number;
}) {
  const [openIndex, setOpenIndex] = useState(-1);

  if (exitProgress >= 0.99) return null;
  if (progress <= 0.01) return null;

  const style = {
    "--faq-opacity": progress * (1 - exitProgress),
    "--faq-offset": `${(1 - progress) * 34 - exitProgress * 28}px`,
    "--faq-blur": `${exitProgress * 7}px`,
  } as CSSProperties;

  return (
    <section className={styles.layer} style={style}>
      <SideRays
        className={styles.rays}
        speed={2.5}
        rayColor1="#eab308"
        rayColor2="#96c8ff"
        intensity={2}
        spread={2}
        origin="top-right"
        tilt={0}
        saturation={1.5}
        blend={0.75}
        falloff={1.6}
        opacity={1}
      />
      <div className={styles.inner}>
        <header className={styles.header}>
          <h2>Pergunta, resposta direta</h2>
          <span>Sobre a geração, controle, colaboração e acesso comercial, apenas preserva as questões que realmente afetam a decisão. </span>
        </header>

        <div className={styles.list}>
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <article
                className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
                key={item.question}
              >
                <button
                  type="button"
                  className={styles.question}
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpenIndex(isOpen ? -1 : index);
                  }}
                >
                  <span>{item.question}</span>
                  <Plus aria-hidden="true" />
                </button>
                <div className={styles.answer} aria-hidden={!isOpen}>
                  <div className={styles.answerInner}>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.footer}>
          <p>Outras perguntas específicas?</p>
          <div className={`${loginStyles.businessWechat} ${styles.contactHover}`}>
            <button
              type="button"
              className={`${loginStyles.businessWechatTrigger} ${styles.contactButton}`}
              aria-label="Abrir contato comercial"
            >
              Entre em contato com o comércio
            </button>
            <div
              className={`${loginStyles.businessWechatPopover} ${styles.contactPopover}`}
              role="dialog"
              aria-label="Contato comercial"
            >
              <div className={`${loginStyles.businessWechatPanel} ${styles.contactPanel}`}>
                <img
                  className={styles.contactQr}
                  src={businessWechatQrUrl}
                  alt="Código de dois dimensões do WeChat para comércio"
                  draggable={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
