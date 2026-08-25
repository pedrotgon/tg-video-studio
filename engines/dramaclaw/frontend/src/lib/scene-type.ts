// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
export const SCENE_TYPE_OPTIONS = [
  { value: "interior", label: "Interno" },
  { value: "exterior", label: "Externo" },
  { value: "mixed", label: "Interno e externo" },
  { value: "other", label: "Outro" },
] as const;

const SCENE_TYPE_LABELS = new Map<string, string>(
  SCENE_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

export function sceneTypeLabel(value: string | null | undefined): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return SCENE_TYPE_LABELS.get(trimmed) ?? trimmed;
}

export function sceneTypeOptions(value?: string | null): Array<{ value: string; label: string }> {
  const trimmed = String(value || "").trim();
  if (!trimmed || SCENE_TYPE_LABELS.has(trimmed)) return [...SCENE_TYPE_OPTIONS];
  return [...SCENE_TYPE_OPTIONS, { value: trimmed, label: trimmed }];
}
