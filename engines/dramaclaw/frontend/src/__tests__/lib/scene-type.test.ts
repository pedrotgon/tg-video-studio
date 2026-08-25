// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { describe, expect, it } from "vitest";

import { SCENE_TYPE_OPTIONS, sceneTypeLabel } from "@/lib/scene-type";

describe("scene type labels", () => {
  it("uses pt-BR labels for canonical scene type values", () => {
    expect(SCENE_TYPE_OPTIONS).toEqual([
      { value: "interior", label: "Interno" },
      { value: "exterior", label: "Externo" },
      { value: "mixed", label: "Interno e externo" },
      { value: "other", label: "Outro" },
    ]);
    expect(sceneTypeLabel("interior")).toBe("Interno");
    expect(sceneTypeLabel("exterior")).toBe("Externo");
  });

  it("keeps unknown legacy values readable", () => {
    expect(sceneTypeLabel("underground")).toBe("underground");
    expect(sceneTypeLabel("")).toBe("");
  });
});
