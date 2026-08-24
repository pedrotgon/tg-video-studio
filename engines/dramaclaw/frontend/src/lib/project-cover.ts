// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
// Deterministic cover art for projects — gradient + initial derived from the
// project name. Used until the backend API returns real thumbnail/genre data.

export interface CoverPaletteStop {
  gradient: string;
  name: string;
  primary: string;
}

// 8-stop curated palette tuned for the dark theme. Each entry is a 135° two-
// stop linear gradient. Selected so that no two adjacent stops collide when
// projects are sorted alphabetically.
export const PROJECT_COVER_PALETTE: CoverPaletteStop[] = [
  { name: "navy",      primary: "#031a26", gradient: "linear-gradient(135deg, #031a26 0%, #17495f 100%)" },
  { name: "gold",      primary: "#b9915b", gradient: "linear-gradient(135deg, #7d5f39 0%, #b9915b 100%)" },
  { name: "ocean",     primary: "#12435a", gradient: "linear-gradient(135deg, #082633 0%, #28708d 100%)" },
  { name: "bronze",    primary: "#876c4d", gradient: "linear-gradient(135deg, #60492e 0%, #a9824e 100%)" },
  { name: "ink",       primary: "#0b3345", gradient: "linear-gradient(135deg, #02131c 0%, #315c6e 100%)" },
  { name: "sand",      primary: "#a9875a", gradient: "linear-gradient(135deg, #82613b 0%, #c5a878 100%)" },
  { name: "slate",     primary: "#45616d", gradient: "linear-gradient(135deg, #2c4855 0%, #78909a 100%)" },
  { name: "lightGold", primary: "#b9915b", gradient: "linear-gradient(135deg, #8a683d 0%, #d4b98d 100%)" },
];

// Inline SVG fractal-noise filter rendered as a data URI. Applied as an
// overlay via `background-image` with `mix-blend-overlay` + low opacity to
// kill banding on the gradients. Low baseFrequency = large grain.
export const NOISE_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>` +
      `<filter id='n'>` +
      `<feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>` +
      `<feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/>` +
      `</filter>` +
      `<rect width='100%' height='100%' filter='url(#n)' opacity='1'/>` +
    `</svg>`,
  );

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getProjectCover(name: string): {
  gradient: string;
  initial: string;
  paletteIndex: number;
  primary: string;
} {
  const trimmed = name.trim();
  const paletteIndex = hashString(trimmed) % PROJECT_COVER_PALETTE.length;
  const palette = PROJECT_COVER_PALETTE[paletteIndex];
  // Use the first rendered character (handles multi-byte chars like 中文).
  const initial = Array.from(trimmed)[0]?.toUpperCase() ?? "?";
  return { gradient: palette.gradient, initial, paletteIndex, primary: palette.primary };
}
