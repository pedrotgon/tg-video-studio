// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NodeSelectionMenu } from "@/features/canvas/NodeSelectionMenu";

const translations: Record<string, string> = {
  "node.menu.sectionAddNode": "Adicionar nó",
  "node.menu.sectionAddResource": "添加资源",
  "node.menu.sectionSkillNode": "技能节点",
  "node.menu.uploadImage": "Carregar recursos",
  "node.menu.image": "Imagem",
  "node.menu.aiImageGeneration": "AI 图片",
  "node.menu.storyboard": "分格抽取结果",
  "node.menu.storyboardGen": "多版本宫格",
  "node.menu.beatContext": "Contexto da lente",
  "node.menu.textAnnotation": "Texto",
  "node.menu.video": "Vídeo",
  "node.menu.audio": "Áudio",
  "node.menu.videoStory": "视频故事",
  "node.menu.videoCompose": "视频合成",
  "node.menu.script": "Roteiro",
  "node.menu.pano360Viewer": "Panorama 360°",
  "node.menu.threeDWorld": "Mundo 3D",
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

describe("NodeSelectionMenu", () => {
  it("shows standalone shot context in the add-node menu", () => {
    render(
      <NodeSelectionMenu
        position={{ x: 12, y: 16 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Contexto da lente")).toBeInTheDocument();
  });
});
