import { ScrollVideoScene } from "./ScrollVideoScene";
import { cinematicVideos } from "./media";

export function ThirdScreenVideo({
  copyExitProgress = 0,
  copyProgress,
  isActive,
  videoExitProgress = 0,
  videoOpacity,
}: {
  copyExitProgress?: number;
  copyProgress: number;
  isActive: boolean;
  videoExitProgress?: number;
  videoOpacity: number;
}) {
  return (
    <ScrollVideoScene
      align="right"
      copyExitProgress={copyExitProgress}
      copyProgress={copyProgress}
      isActive={isActive}
      kicker="CUT TO THE NEXT"
      subtitle="Importar o roteiro, o resumo ou os episódios de uma série é suficiente. O sistema reconhece automaticamente e estabelece a base para extracção de conteúdo, planejamento de séries e divisão de câmeras."
      title="Deixe que o drama seja o ponto de partida"
      videoExitProgress={videoExitProgress}
      videoOpacity={videoOpacity}
      videoUrl={cinematicVideos.jqr}
    />
  );
}
