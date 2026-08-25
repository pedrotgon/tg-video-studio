// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
export type ViewerPurpose = "mainline" | "freezone" | "asset" | "beat";

export function viewerPurposeLabel(purpose: ViewerPurpose | undefined): string {
  if (purpose === "freezone") return "Canvas";
  if (purpose === "asset") return "Biblioteca de ativos";
  if (purpose === "beat") return "Produção de quadro";
  return "Fluxo principal";
}
