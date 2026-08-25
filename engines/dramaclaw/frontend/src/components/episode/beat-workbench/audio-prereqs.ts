// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab

export type VoiceConfigTarget = "characters" | "voices";

export const ASSET_TAB_STORAGE_KEY_PREFIX = "supertale-asset-tab:";

export function assetTabStorageKey(project: string): string {
  return `${ASSET_TAB_STORAGE_KEY_PREFIX}${encodeURIComponent(project)}`;
}

export function audioPrereqTarget(error: string): VoiceConfigTarget | null {
  const message = String(error || "").trim();
  if (!message.includes("Voz do narrador ausente") && !message.includes("解说声线缺失")) return null;
  if (
    message.includes("Legenda do protagonista") ||
    message.includes("Estúdio de personagem") ||
    message.includes("解说主角") ||
    message.includes("角色工作台")
  ) {
    return "characters";
  }
  return "voices";
}

export function audioPrereqMessage(error: string, t: (key: string) => string): string {
  const message = String(error || "").trim();
  if (!message.includes("Voz do narrador ausente") && !message.includes("解说声线缺失")) return message;
  if (
    message.includes("Legenda do protagonista") ||
    message.includes("Estúdio de personagem") ||
    message.includes("解说主角") ||
    message.includes("角色工作台")
  ) {
    return `${message}${t("episode.workbench.audio.prereqHintCharacters")}`;
  }
  return `${message}${t("episode.workbench.audio.prereqHintVoices")}`;
}
