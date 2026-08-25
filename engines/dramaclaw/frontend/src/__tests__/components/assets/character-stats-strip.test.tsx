// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "characters.stats.strip.total": "Total de personagens",
        "characters.stats.strip.mainCharacter": "Apresentador principal",
        "characters.stats.strip.portrait": "Retrato",
        "characters.stats.strip.identity": "Identidade",
        "characters.stats.strip.voice": "Voz",
        "characters.stats.strip.ariaLabel": "Estatísticas dos personagens",
      })[key] ?? key,
  }),
}));

import {
  CharacterStatsStrip,
  deriveCharacterStats,
} from "@/components/assets/character-stats-strip";
import type { Character } from "@/types/character";

const characters: Character[] = [
  {
    name: "Mira",
    role: "Apresentadora",
    is_main: true,
    portrait_url: "/static/demo/mira/portrait.png",
    reference_audio_path: "assets/characters/Mira/voice.wav",
  },
  {
    name: "Jun",
    role: "Co-apresentador",
    portrait_path: "assets/characters/Jun/portrait.png",
    reference_audio_path: "",
  },
  {
    name: "Lio",
    role: "Especialista",
    portrait_url: "",
    reference_audio_url: "/static/demo/lio/voice.wav",
  },
];

describe("deriveCharacterStats", () => {
  it("counts portraits, main characters, identities, and ready voice paths", () => {
    expect(deriveCharacterStats(characters, { Mira: 2, Jun: 1 })).toEqual({
      total: 3,
      withPortraits: 2,
      mainCharacters: 1,
      identityReady: 2,
      voiceReady: 1,
    });
  });

  it("defaults identity ready to zero when identityCounts is omitted", () => {
    expect(deriveCharacterStats(characters).identityReady).toBe(0);
  });
});

describe("CharacterStatsStrip", () => {
  it("renders a compact responsive stats strip with accessible stat labels", () => {
    render(
      <CharacterStatsStrip
        characters={characters}
        identityCounts={{ Mira: 2, Jun: 1 }}
        className="custom-strip"
      />,
    );

    const strip = screen.getByRole("list", { name: "Estatísticas dos personagens" });
    expect(strip).toHaveClass("custom-strip");
    expect(strip).toHaveTextContent("Total de personagens3");
    expect(strip).toHaveTextContent("Apresentador principal1");
    expect(strip).toHaveTextContent("Retrato2/3");
    expect(strip).toHaveTextContent("Identidade2/3");
    expect(strip).toHaveTextContent("Voz1/3");

    expect(screen.getByLabelText("Total de personagens: 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Retrato: 2/3")).toBeInTheDocument();
    expect(screen.getByLabelText("Voz: 1/3")).toBeInTheDocument();
  });

  it("uses the supplied main character label for drama projects", () => {
    render(
      <CharacterStatsStrip
        characters={characters}
        mainCharacterLabel="Personagem principal"
      />,
    );

    expect(screen.getByLabelText("Personagem principal: 1")).toBeInTheDocument();
    expect(screen.queryByLabelText("Apresentador principal: 1")).not.toBeInTheDocument();
  });
});
