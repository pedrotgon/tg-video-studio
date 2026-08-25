import type { CSSProperties } from "react";
import LightRays from "@/components/login/light-rays";
import { LoginCinematicHeader } from "./LoginCinematicHero";
import { businessWechatQrUrl } from "./media";
import styles from "./twelfth-final-screen.module.css";

export function TwelfthFinalScreen({
  onStart,
  progress,
}: {
  onStart: () => void;
  progress: number;
}) {
  if (progress <= 0.01) return null;

  const style = {
    "--final-opacity": progress,
    "--final-offset": `${(1 - progress) * 34}px`,
  } as CSSProperties;

  return (
    <section className={styles.layer} style={style}>
      <LightRays
        className={styles.background}
        raysOrigin="top-center"
        raysColor="#ffffff"
        raysSpeed={1}
        lightSpread={0.5}
        rayLength={3}
        pulsating={false}
        fadeDistance={1}
        saturation={1}
        followMouse={false}
        mouseInfluence={0.1}
        noiseAmount={0}
        distortion={0}
      />
      <LoginCinematicHeader className={styles.header} />
      <div className={styles.content}>
        <img
          className={styles.mark}
          src="/login-cinematic/final-mark.png"
          alt=""
          draggable={false}
          aria-hidden="true"
        />
        <h2>Traga um enredo em uma visualização para criar um mundo vivo.</h2>
        <p>Digite conflitos de personagem ou visão do mundo para que DramaClaw divida em fragmentos de câmera e os expande continuamente.</p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={onStart}>
            Abre a criação infinita
          </button>
          <div className={styles.business}>
            <button type="button" className={styles.secondary}>
              Crie rapidamente uma conta
            </button>
            <div
              className={styles.businessPopover}
              role="dialog"
              aria-label="Contato comercial"
            >
              <div className={styles.businessPanel}>
                <img
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
