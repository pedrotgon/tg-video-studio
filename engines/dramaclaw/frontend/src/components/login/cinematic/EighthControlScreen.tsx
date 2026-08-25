import type { CSSProperties } from "react";
import styles from "./eighth-control-screen.module.css";

const decisions = [
  {
    id: "KEEP",
    title: "Preservar",
    body: "Fixar o personagem, câmera ou fragmento atual como base para geração subsequente.",
  },
  {
    id: "REWRITE",
    title: "Reescrever",
    body: "Só substituir conflitos, diálogos ou direções de câmera, não rejeitando o mundo já estabelecido.",
  },
  {
    id: "EXTEND",
    title: "Expandir",
    body: "Continuar para o próximo episódio, previsão ou toda a branca. ",
  },
  {
    id: "REJECT",
    title: "Reverter ",
    body: "Retornar ao último nó e escolher uma nova caminhada na história. ",
  },
];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export function EighthControlScreen({
  progress,
  sequenceProgress,
  exitProgress = 0,
}: {
  progress: number;
  sequenceProgress: number;
  exitProgress?: number;
}) {
  if (exitProgress >= 0.99) return null;

  if (progress <= 0.01) return null;

  const activeIndex = Math.min(
    decisions.length - 1,
    Math.floor(clamp(sequenceProgress) * decisions.length),
  );
  const style = {
    "--eighth-opacity": progress * (1 - exitProgress),
    "--eighth-offset": `${(1 - progress) * 34 - exitProgress * 28}px`,
    "--eighth-blur": `${exitProgress * 7}px`,
    "--rail-progress": clamp(sequenceProgress * 1.1),
    "--panel-progress": clamp((sequenceProgress - 0.12) / 0.58),
  } as CSSProperties;

  return (
    <section className={styles.layer} style={style}>
      <div className={styles.header}>
        <p>CONTROL 08</p>
        <h2>Seu foco é criar um plano completo de produção</h2>
        <span>
          DramaClaw se concentra no processo de produção contínua de uma série: importação de texto, consistência de personagem, reutilização de cenários, avanço das cenas e colaboração da equipe para entrega. 
        </span>
      </div>

      <div className={styles.rail} aria-hidden="true">
        <span />
      </div>

      <div className={styles.console} aria-label="DramaClaw direction control">
        <div className={styles.consoleHeader}>
          <span>ACTIVE NODE</span>
          <strong>SCENE DIRECTION</strong>
          <em>READY</em>
        </div>

        <div className={styles.consoleBody}>
          <div className={styles.statement}>
            <small>CURRENT OUTPUT</small>
            <strong>Protocolo de Noite Vagar · Sequência de Cena 08</strong>
            <p>Um navio não registrado carrega toda a secretária de uma cidade em si entrou na camada da noite. </p>
          </div>

          <div className={styles.decisionGrid}>
            {decisions.map((decision, index) => {
              const itemProgress = clamp((sequenceProgress - index * 0.16) / 0.32);
              const isActive = index <= activeIndex;

              return (
                <article
                  className={`${styles.decision} ${isActive ? styles.decisionActive : ""}`}
                  key={decision.id}
                  style={{ "--item-progress": itemProgress } as CSSProperties}
                >
                  <div>
                    <span>{decision.id}</span>
                    <h3>{decision.title}</h3>
                  </div>
                  <p>{decision.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
