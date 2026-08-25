import type { CSSProperties } from "react";
import DarkVeil from "@/components/react-bits/dark-veil";
import styles from "./seventh-pipeline-screen.module.css";

const steps = [
  {
    id: "01",
    title: "Defina o entrada",
    body: "Uma frase de abertura é desmembrada em personagem, cena e regra de história",
  },
  {
    id: "02",
    title: "Desmembrando os personagens",
    body: "A identidade, o motivo e as relações são encaminhados e não mais flutuantes",
  },
  {
    id: "03",
    title: "Geração de conflito",
    body: "Empurra o evento para a posição necessária, deixe o storyline ascender",
  },
  {
    id: "04",
    title: "Planejamento da câmera",
    body: "Ponto de vista, ritmo e direção da câmera entram em um trajeto controlo",
  },
  {
    id: "05",
    title: "Formação do fragmento",
    body: "Uma ideia de uma foto continua avançando, fazendo cenas, avisos e fragmentos contínuos",
  },
  {
    id: "06",
    title: "Expansão do trabalho",
    body: "Cada resultado pode ser voltado para o processo de produção, gerando novos ramificações",
  },
];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export function SeventhPipelineScreen({
  progress,
  sequenceProgress,
  exitProgress = 0,
  shouldMount = false,
}: {
  progress: number;
  sequenceProgress: number;
  exitProgress?: number;
  shouldMount?: boolean;
}) {
  if (exitProgress >= 0.99) return null;
  if (!shouldMount && progress <= 0.01) return null;

  const activeIndex = Math.min(steps.length - 1, Math.floor(sequenceProgress * steps.length));
  const style = {
    "--seventh-opacity": progress * (1 - exitProgress),
    "--seventh-offset": `${(1 - progress) * 38 - exitProgress * 26}px`,
    "--seventh-blur": `${exitProgress * 7}px`,
    "--pipeline-scale": clamp(sequenceProgress),
  } as CSSProperties;

  return (
    <section className={styles.layer} style={style}>
      <div className={styles.darkVeilBackdrop} aria-hidden="true">
        <DarkVeil
          speed={1}
          hueShift={40}
          noiseIntensity={0}
          scanlineFrequency={0.5}
          scanlineIntensity={0}
          warpAmount={0}
        />
      </div>

      <div className={styles.header}>
        <p>PIPELINE 07</p>
        <h2>Travaje de shorts para expandir a imprevisibilidade da AI em vídeo</h2>
        <span>
          DramaClaw torna a incerteza da criação de vídeo AI mais claro na texto, na propriedade, na câmera e no fluxo de trabalho
        </span>
      </div>

      <div className={styles.pipeline} aria-label="DramaClaw production pipeline">
        <div className={styles.track} aria-hidden="true" />
        <div className={styles.trackFill} aria-hidden="true" />
        {steps.map((step, index) => {
          const nodeProgress = clamp((sequenceProgress - index * 0.135) / 0.18);
          const isActive = index <= activeIndex;

          return (
            <article
              className={`${styles.step} ${isActive ? styles.stepActive : ""}`}
              key={step.id}
              style={{ "--node-progress": nodeProgress } as CSSProperties}
            >
              <div className={styles.node}>
                <span>{step.id}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
