import type { CSSProperties } from "react";
import SideRays from "@/components/react-bits/side-rays";
import styles from "./fourth-screen.module.css";

const copySets = [
  {
    kicker: "SYSTEM 01",
    title: ["Entrar na história", "Estágio de produção"],
    lead: "A partir de uma frase de ponto de partida, os personagens, conflitos, cenários e cenas são divididos em recursos criativos que possam ser continuados e mantidos consistentes.",
  },
  {
    kicker: "SYSTEM 02",
    title: ["O universo permanece", "O mesmo tono de luz"],
    lead: "Os personagens não ficarão solos, nem as cenas não ficarão desviadas. Cada geração vai retornar à mesma direção da história.",
  },
  {
    kicker: "SYSTEM 03",
    title: ["A inspiração é impulsionada", "Virando em imagem"],
    lead: "Não ficar em uma única cena, mas continuar crescendo com divisões, excertos, trailers e produtos editáveis.",
  },
];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

const segment = (position: number, start: number, duration: number) =>
  clamp((position - start) / duration);

export function FourthScreen({
  exitProgress = 0,
  progress,
  sequenceProgress,
}: {
  exitProgress?: number;
  progress: number;
  sequenceProgress: number;
}) {
  if (exitProgress >= 0.99) return null;

  const activeIndex = Math.min(2, Math.floor(sequenceProgress * 3));
  const raysActive = progress > 0.02 && exitProgress < 0.98;
  const sceneStyle = {
    "--fourth-blur": `${(1 - progress) * 10 + exitProgress * 8}px`,
    "--fourth-offset": `${(1 - progress) * 34 - exitProgress * 28}px`,
    "--fourth-opacity": Math.max(0, progress * (1 - exitProgress)),
  } as CSSProperties;

  return (
    <section className={styles.layer} style={sceneStyle}>
      {raysActive ? (
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
      ) : null}
      <div className={styles.inner}>
        <div className={styles.copyArea}>
          {copySets.map((copy, index) => {
            const enter = segment(sequenceProgress, index / 3 - 0.04, 0.16);
            const exit = segment(sequenceProgress, (index + 0.78) / 3, 0.14);
            const copyOpacity = Math.max(0, enter * (1 - exit));
            const copyStyle = {
              "--copy-block-blur": `${(1 - copyOpacity) * 7}px`,
              "--copy-block-opacity": copyOpacity,
              "--copy-block-offset": `${(1 - enter) * 22 - exit * 18}px`,
            } as CSSProperties;

            return (
              <div className={styles.copyBlock} key={copy.kicker} style={copyStyle}>
                <p className={styles.kicker}>{copy.kicker}</p>
                <h2 className={styles.title}>
                  {copy.title.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h2>
                <p className={styles.lead}>{copy.lead}</p>
              </div>
            );
          })}
        </div>

        <div className={styles.grid} aria-label="DramaClaw creator workflow">
          <article className={`${styles.item} ${activeIndex === 0 ? styles.itemActive : ""}`}>
            <span className={styles.number}>01</span>
            <h3>A história é desmembrada</h3>
            <p>Ideia, personagem, conflito, cena e tomada como objetos, quadros ou cenas no contexto do roteiro, nova/script como canva</p>
          </article>
          <article className={`${styles.item} ${activeIndex === 1 ? styles.itemActive : ""}`}>
            <span className={styles.number}>02</span>
            <h3>Locking visual</h3>
            <p>Mantendo o personagem, a cena e as tomadas em uma mesma tonalidade para reduzir a aleatoriedade</p>
          </article>
          <article className={`${styles.item} ${activeIndex === 2 ? styles.itemActive : ""}`}>
            <span className={styles.number}>03</span>
            <h3>Progressão de imagem</h3>
            <p>De um quadro de inspiração continuando até o teaser, previsão e forma mais completa do trabalho</p>
          </article>
        </div>
      </div>
    </section>
  );
}
