// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
// Camera-movement presets. Fallback list used when
// `/freezone/video/camera-templates` is loading or unavailable. The runtime
// source of truth is the backend endpoint, fetched via
// `useFreezoneVideoCameraTemplates`. Mirrors libtv's 23-entry 运镜 catalog;
// each entry ships with a short .mp4 preview at `public/video/camera-presets/`.

import type { FreezoneVideoCameraTemplate } from "@/api/ops";

export type CameraMovementPreset = FreezoneVideoCameraTemplate;

export const CAMERA_MOVEMENT_PRESETS: ReadonlyArray<CameraMovementPreset> = [
  { id: 'fixed', label: 'Câmera fixa', videoUrl: '/video/camera-presets/fixed.mp4', promptFragment: 'câmera fixa' },
  { id: 'follow', label: 'Acompanhamento', videoUrl: '/video/camera-presets/follow.mp4', promptFragment: 'câmera acompanha o sujeito' },
  { id: 'spiral-up', label: 'Espiral ascendente', videoUrl: '/video/camera-presets/spiral-up.mp4', promptFragment: 'câmera sobe em espiral' },
  { id: 'spiral-down', label: 'Espiral descendente', videoUrl: '/video/camera-presets/spiral-down.mp4', promptFragment: 'câmera desce em espiral' },
  { id: 'tilt-up', label: 'Inclinar para cima', videoUrl: '/video/camera-presets/tilt-up.mp4', promptFragment: 'inclinação de câmera para cima' },
  { id: 'tilt-down', label: 'Inclinar para baixo', videoUrl: '/video/camera-presets/tilt-down.mp4', promptFragment: 'inclinação de câmera para baixo' },
  { id: 'pan-left', label: 'Panorâmica à esquerda', videoUrl: '/video/camera-presets/pan-left.mp4', promptFragment: 'panorâmica de câmera à esquerda' },
  { id: 'pan-right', label: 'Panorâmica à direita', videoUrl: '/video/camera-presets/pan-right.mp4', promptFragment: 'panorâmica de câmera à direita' },
  { id: 'crane-up', label: 'Grua para cima', videoUrl: '/video/camera-presets/crane-up.mp4', promptFragment: 'câmera sobe em grua' },
  { id: 'crane-down', label: 'Grua para baixo', videoUrl: '/video/camera-presets/crane-down.mp4', promptFragment: 'câmera desce em grua' },
  { id: 'truck-left', label: 'Deslizar à esquerda', videoUrl: '/video/camera-presets/truck-left.mp4', promptFragment: 'câmera desliza à esquerda' },
  { id: 'truck-right', label: 'Deslizar à direita', videoUrl: '/video/camera-presets/truck-right.mp4', promptFragment: 'câmera desliza à direita' },
  { id: 'dolly-in', label: 'Aproximar', videoUrl: '/video/camera-presets/dolly-in.mp4', promptFragment: 'câmera se aproxima' },
  { id: 'dolly-out', label: 'Afastar', videoUrl: '/video/camera-presets/dolly-out.mp4', promptFragment: 'câmera se afasta' },
  { id: 'zoom-in', label: 'Zoom in', videoUrl: '/video/camera-presets/zoom-in.mp4', promptFragment: 'zoom aproximando' },
  { id: 'zoom-out', label: 'Zoom out', videoUrl: '/video/camera-presets/zoom-out.mp4', promptFragment: 'zoom afastando' },
  { id: 'dolly-zoom', label: 'Dolly zoom', videoUrl: '/video/camera-presets/dolly-zoom.mp4', promptFragment: 'efeito dolly zoom' },
  { id: 'orbit', label: 'Orbitar', videoUrl: '/video/camera-presets/orbit.mp4', promptFragment: 'câmera orbita o sujeito' },
  { id: 'roll', label: 'Rotação', videoUrl: '/video/camera-presets/roll.mp4', promptFragment: 'câmera gira sobre o eixo' },
  { id: 'fpv', label: 'Primeira pessoa', videoUrl: '/video/camera-presets/fpv.mp4', promptFragment: 'filmagem em primeira pessoa' },
  { id: 'drone', label: 'Drone', videoUrl: '/video/camera-presets/drone.mp4', promptFragment: 'filmagem aérea por drone' },
  { id: 'aerial', label: 'Aérea', videoUrl: '/video/camera-presets/aerial.mp4', promptFragment: 'tomada aérea ampla' },
  { id: 'handheld', label: 'Câmera na mão', videoUrl: '/video/camera-presets/handheld.mp4', promptFragment: 'câmera na mão' },
];

export function findCameraMovementPreset(
  templates: ReadonlyArray<CameraMovementPreset>,
  id: string | null | undefined,
): CameraMovementPreset | null {
  if (!id) return null;
  return templates.find((preset) => preset.id === id) ?? null;
}

// Reverse lookups built from the bundled 23-entry catalog so backend templates
// without a `videoUrl` can borrow the matching local mp4 (`public/video/
// camera-presets/<id>.mp4`). The backend likely returns Chinese labels /
// promptFragments verbatim — match those first; id fallback covers the case
// where backend ids happen to align with our kebab-case ones.
const LOCAL_VIDEO_URL_BY_ID = new Map<string, string>();
const LOCAL_VIDEO_URL_BY_LABEL = new Map<string, string>();
const LOCAL_VIDEO_URL_BY_FRAGMENT = new Map<string, string>();
for (const preset of CAMERA_MOVEMENT_PRESETS) {
  if (!preset.videoUrl) continue;
  LOCAL_VIDEO_URL_BY_ID.set(preset.id, preset.videoUrl);
  LOCAL_VIDEO_URL_BY_LABEL.set(preset.label.trim(), preset.videoUrl);
  LOCAL_VIDEO_URL_BY_FRAGMENT.set(preset.promptFragment.trim(), preset.videoUrl);
}

/**
 * Resolve a preview video URL for a camera preset. Priority:
 *   1. The template's own `videoUrl` (backend-supplied).
 *   2. Local mp4 matched by exact Chinese label.
 *   3. Local mp4 matched by exact promptFragment.
 *   4. Local mp4 matched by id.
 * Returns null if nothing matches (caller should skip rendering <video>).
 */
export function resolveCameraPresetVideoUrl(
  preset: CameraMovementPreset,
): string | null {
  if (preset.videoUrl) return preset.videoUrl;
  const label = preset.label.trim();
  const fragment = preset.promptFragment.trim();
  return (
    LOCAL_VIDEO_URL_BY_LABEL.get(label) ??
    LOCAL_VIDEO_URL_BY_FRAGMENT.get(fragment) ??
    LOCAL_VIDEO_URL_BY_ID.get(preset.id) ??
    null
  );
}
