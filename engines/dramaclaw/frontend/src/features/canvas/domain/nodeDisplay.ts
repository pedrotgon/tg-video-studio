// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import {
  CANVAS_NODE_TYPES,
  type CanvasNodeData,
  type CanvasNodeType,
  type ExportImageNodeResultKind,
} from './canvasNodes';

export const DEFAULT_NODE_DISPLAY_NAME: Record<CanvasNodeType, string> = {
  [CANVAS_NODE_TYPES.upload]: 'Enviar arquivo',
  [CANVAS_NODE_TYPES.imageEdit]: 'Editar imagem com IA',
  [CANVAS_NODE_TYPES.imageGen]: 'Gerar imagem',
  [CANVAS_NODE_TYPES.exportImage]: 'Imagem de resultado',
  [CANVAS_NODE_TYPES.beatContext]: 'Contexto do quadro',
  [CANVAS_NODE_TYPES.textAnnotation]: 'Texto',
  [CANVAS_NODE_TYPES.group]: 'Grupo',
  [CANVAS_NODE_TYPES.storyboardSplit]: 'Quadros extraídos',
  [CANVAS_NODE_TYPES.storyboardGen]: 'Variações de storyboard',
  [CANVAS_NODE_TYPES.video]: 'Vídeo',
  [CANVAS_NODE_TYPES.audio]: 'Áudio',
  [CANVAS_NODE_TYPES.videoStory]: 'História em vídeo',
  [CANVAS_NODE_TYPES.videoCompose]: 'Composição de vídeo',
  [CANVAS_NODE_TYPES.script]: 'Gerar roteiro',
  [CANVAS_NODE_TYPES.pano360Viewer]: 'Visualizador panorâmico 360°',
  [CANVAS_NODE_TYPES.threeDWorld]: 'Mundo 3D',
  [CANVAS_NODE_TYPES.skill]: 'Habilidade',
  [CANVAS_NODE_TYPES.style]: 'Estilo',
};

export const EXPORT_RESULT_DISPLAY_NAME: Record<ExportImageNodeResultKind, string> = {
  generic: 'Imagem de resultado',
  storyboardGenOutput: 'Storyboard gerado',
  storyboardSplitExport: 'Quadro exportado',
  storyboardFrameEdit: 'Resultado do quadro',
  matte: 'Recorte de imagem',
  upscale: 'Imagem ampliada',
};

function resolveExportResultDefault(data: Partial<CanvasNodeData>): string {
  const resultKind = (data as { resultKind?: ExportImageNodeResultKind }).resultKind ?? 'generic';
  return EXPORT_RESULT_DISPLAY_NAME[resultKind];
}

export function getDefaultNodeDisplayName(type: CanvasNodeType, data: Partial<CanvasNodeData>): string {
  if (type === CANVAS_NODE_TYPES.exportImage) {
    return resolveExportResultDefault(data);
  }
  return DEFAULT_NODE_DISPLAY_NAME[type];
}

export function resolveNodeDisplayName(type: CanvasNodeType, data: Partial<CanvasNodeData>): string {
  const customTitle = typeof data.displayName === 'string' ? data.displayName.trim() : '';
  if (customTitle) {
    return customTitle;
  }

  if (type === CANVAS_NODE_TYPES.group) {
    const legacyLabel = typeof (data as { label?: string }).label === 'string'
      ? (data as { label?: string }).label?.trim()
      : '';
    if (legacyLabel) {
      return legacyLabel;
    }
  }

  return getDefaultNodeDisplayName(type, data);
}

export function isNodeUsingDefaultDisplayName(type: CanvasNodeType, data: Partial<CanvasNodeData>): boolean {
  const customTitle = typeof data.displayName === 'string' ? data.displayName.trim() : '';
  if (!customTitle) {
    return true;
  }
  return customTitle === getDefaultNodeDisplayName(type, data);
}
