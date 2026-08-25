// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { AlertTriangle, CheckCircle2, CircleX } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * 精品剧（drama）的导入标准格式与示例。逐行写死而不是塞进 i18n 的长字符串：
 * 这是要按原样展示的样例，任何换行/空格都有意义，不该被译者改动。
 */
const DRAMA_FORMAT_SPEC = [
  "Formato de roteiro (escolha um)",
  "1-1 Sala de estar Noite Interna",
  "1.1 Sala de estar Interna Noite",
  "",
  "Formato por campos",
  "Número da cena: 1",
  "Local: Sala de estar",
  "Tempo: Noite",
  "Interior/Exterior: Interior",
  "",
  "Fonte / Formato Final Draft",
  "INT. SALA DE ESTAR - NOITE",
  "INT. LIVING ROOM - NIGHT",
].join("\n");

const DRAMA_REPAIRABLE_FORMAT = [
  "Episódio 1",
  "",
  "1.1 Sala de estar - Interna - Noite",
  "Pessoas: Ana",
  "▲ Ana termina um treino curto ao lado do sofá.",
  "Ana: Vinte minutos em casa e o treino está feito.",
].join("\n");

const DRAMA_FORMAT_EXAMPLE = [
  "Episódio 1",
  "1-1 Sala de estar Noite Interna",
  "Pessoas: Ana",
  "△【Plano aberto】Ana afasta a mesa de centro e abre o aplicativo no celular.",
  "△ Ana (para a câmera): Sem academia e sem equipamento caro.",
  "△【Plano detalhe】O cronômetro marca vinte minutos.",
  "△ Narração: Uma sequência prática para treinar em casa com orientação.",
  "△【Plano médio】Ana executa o movimento com postura controlada.",
  "△ Texto na tela: Adapte a intensidade ao seu condicionamento.",
  "△【Fechamento】Ana encerra o treino e toca no botão da oferta.",
  "Ana: Clique e conheça o programa completo.",
].join("\n");

export function NovelFormatDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-lg bg-black sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("ingest.novelFormat.title")}</DialogTitle>
        </DialogHeader>

        {/* 滚动条做细做淡：长度由内容/视口比例决定，改不动，只能让它别抢戏。 */}
        <ScrollArea className="max-h-[58vh] [&_[data-slot=scroll-area-scrollbar]]:w-1.5 [&_[data-slot=scroll-area-thumb]]:bg-white/15">
          <div className="space-y-5 pr-3">
            <p className="text-sm leading-6 text-foreground/75">
              {t("ingest.novelFormat.intro")}
            </p>

            <section className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                  <CheckCircle2 className="size-3.5" />
                  {t("ingest.novelFormat.standardStatus")}
                </div>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {t("ingest.novelFormat.standardStatusHint")}
                </p>
              </div>
              <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.06] p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                  <AlertTriangle className="size-3.5" />
                  {t("ingest.novelFormat.warningStatus")}
                </div>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {t("ingest.novelFormat.warningStatusHint")}
                </p>
              </div>
              <div className="rounded-md border border-destructive/25 bg-destructive/[0.07] p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <CircleX className="size-3.5" />
                  {t("ingest.novelFormat.blockingStatus")}
                </div>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {t("ingest.novelFormat.blockingStatusHint")}
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">
                {t("ingest.novelFormat.specLabel")}
              </h3>
              <pre className="whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[13px] leading-7 text-foreground/90">
                {DRAMA_FORMAT_SPEC}
              </pre>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">
                {t("ingest.novelFormat.repairableLabel")}
              </h3>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("ingest.novelFormat.repairableHint")}
              </p>
              <pre className="whitespace-pre-wrap rounded-md border border-amber-500/15 bg-amber-500/[0.04] px-3.5 py-3 text-[13px] leading-7 text-foreground/80">
                {DRAMA_REPAIRABLE_FORMAT}
              </pre>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">
                {t("ingest.novelFormat.rulesLabel")}
              </h3>
              <ul className="list-disc space-y-1.5 pl-5 text-xs leading-5 text-foreground/70">
                <li>{t("ingest.novelFormat.ruleEpisode")}</li>
                <li>{t("ingest.novelFormat.ruleScene")}</li>
                <li>{t("ingest.novelFormat.ruleCharacters")}</li>
                <li>{t("ingest.novelFormat.ruleBody")}</li>
                <li>{t("ingest.novelFormat.ruleDialogue")}</li>
                <li>{t("ingest.novelFormat.ruleLocationChange")}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-medium text-muted-foreground">
                {t("ingest.novelFormat.exampleLabel")}
              </h3>
              <pre className="whitespace-pre-wrap rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[13px] leading-7 text-foreground/70">
                {DRAMA_FORMAT_EXAMPLE}
              </pre>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
