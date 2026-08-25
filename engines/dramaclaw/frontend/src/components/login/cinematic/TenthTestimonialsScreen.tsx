import type { CSSProperties } from "react";
import styles from "./tenth-testimonials-screen.module.css";

const quotes = [
  {
    name: "Diretor de curta-metragem",
    tag: "Ensaio de Conceito",
    text: "Não comece mais com uma linha do tempo em branco.Olhe para os conflitos e tiros antes de decidir qual ramo vale a pena fazer.",
  },
  {
    name: "Criador de vídeos com IA",
    tag: "Fragmentação Contínua",
    text: "O mais útil não é gerar um diagrama, mas continuar empurrando um segmento para frente.",
  },
  {
    name: "Roteirista",
    tag: "Teste de Função",
    text: "Uma vez que os personagens, conflitos e cenários são desmontados, posso julgar mais rapidamente se vale a pena continuar a escrever a história.",
  },
  {
    name: "Equipe de Animação",
    tag: "Validação de Ritmo",
    text: "Usamos isso como um ensaio conceitual para ver o ritmo e as filmagens antes de decidir se vamos entrar em produção.",
  },
  {
    name: "Produtor Independente",
    tag: "Geração de Teaser",
    text: "Ele comprime ideias em segmentos que podem ser assistidos e a discussão não para mais nas configurações de texto.",
  },
  {
    name: "Diretor Visual",
    tag: "Extensão da Visão de Mundo",
    text: "O mesmo mundo pode continuar a crescer ramos, e a sensação de perda de controle é mantida, mas a direção ainda é controlável.",
  },
  {
    name: "Planejamento de histórias",
    tag: "Seleção de filial",
    text: "Meus modelos de drama são criativos e me ajudam a rapidamente eliminar as brincadeiras, deixando tempo para os diálogos mais envolventes.",
  },
  {
    name: "Casa de ideias",
    tag: "Exemplares de proposta",
    text: "De uma frase de enredo a um fragmento visual, basta para apoiar uma discussão de criação mais específica.",
  },
  {
    name: "Assistente de diretor",
    tag: "Organização de câmeras",
    text: "Ela me permite organizar as câmeras sem esquecimento. Cada geração é uma oportunidade para voltar à linha de produção.",
  },
];

const rows = [
  quotes.slice(0, 6),
  quotes.slice(3).concat(quotes.slice(0, 3)),
  quotes.slice(6).concat(quotes.slice(0, 6)),
];

export function TenthTestimonialsScreen({
  exitProgress = 0,
  progress,
}: {
  exitProgress?: number;
  progress: number;
}) {
  if (exitProgress >= 0.99) return null;

  if (progress <= 0.01) return null;

  const visible = Math.max(0, progress * (1 - exitProgress));
  const style = {
    "--tenth-opacity": visible,
    "--tenth-offset": `${(1 - progress) * 34 - exitProgress * 28}px`,
    "--tenth-blur": `${exitProgress * 8}px`,
  } as CSSProperties;

  return (
    <section className={styles.layer} style={style}>
      <div className={styles.header}>
        <p>FIELD NOTES 10</p>
        <h2>Não começo com um vazio</h2>
        <span>Pontos curtos, testes de personagem, fragmentos contínuos, vamos direto do enredo para a produção.</span>
      </div>

      <div className={styles.wall} aria-label="Creator feedback">
        {rows.map((row, rowIndex) => (
          <div
            className={`${styles.row} ${rowIndex === 1 ? styles.rowReverse : ""}`}
            key={rowIndex}
          >
            {[...row, ...row].map((quote, index) => (
              <article className={styles.card} key={`${quote.name}-${rowIndex}-${index}`}>
                <div className={styles.cardTop}>
                  <span>{quote.name}</span>
                  <em>{quote.tag}</em>
                </div>
                <p>{quote.text}</p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
