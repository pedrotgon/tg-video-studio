// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
// 组节点背景色预设（参考 libtv 的组配色）。value 为基础色，渲染时叠加低透明度做底色。
export interface GroupColorPreset {
  key: string;
  /** Nome exibido em controles e tecnologias assistivas. */
  label: string;
  /** 基础色 hex。 */
  value: string;
}

export const GROUP_COLOR_PRESETS: ReadonlyArray<GroupColorPreset> = [
  { key: 'red', label: 'Vermelho', value: '#ef4444' },
  { key: 'orange', label: 'Laranja', value: '#f97316' },
  { key: 'yellow', label: 'Amarelo', value: '#eab308' },
  { key: 'green', label: 'Verde', value: '#22c55e' },
  { key: 'cyan', label: 'Ciano', value: '#06b6d4' },
  { key: 'blue', label: 'Azul', value: '#3b82f6' },
  { key: 'purple', label: 'Roxo', value: '#8b5cf6' },
  { key: 'pink', label: 'Rosa', value: '#ec4899' },
  { key: 'gray', label: 'Cinza', value: '#6b7280' },
];

/** 把组背景色基础 hex 叠加固定透明度，得到组卡片底色 / 边框色（8 位 hex）。 */
export function groupColorBackground(color: string | null | undefined): string | undefined {
  if (!color) return undefined;
  return `${color}1f`; // ≈ 12% 透明度的底色
}

export function groupColorBorder(color: string | null | undefined): string | undefined {
  if (!color) return undefined;
  return `${color}66`; // ≈ 40% 透明度的边框
}
