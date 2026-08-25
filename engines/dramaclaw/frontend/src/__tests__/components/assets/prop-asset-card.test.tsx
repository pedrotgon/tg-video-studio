// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import i18next from "i18next";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { PropAssetCard } from "@/components/assets/prop-asset-card";
import type { PropAsset } from "@/types/prop";

const i18n = i18next.createInstance();

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: "pt",
    fallbackLng: "pt",
    resources: {
      pt: {
        translation: {
          assets: {
            common: {
              edit: "Editar",
              delete: "Excluir",
              generated: "Gerado",
              missing: "Ausente",
            },
            props: {
              reference: "Imagem de referência",
              noReference: "Sem imagem de referência",
              noDescription: "Sem descrição",
              generateReference: "Gerar referência",
              generatingReference: "Gerando...",
              regenerateReference: "Regerar referência",
              uploadReference: "Enviar referência",
              uploadingReference: "Enviando...",
              owner: "Personagem",
              types: {
                weapon: "Arma",
                accessory: "Acessório",
                artifact: "Artefato",
                document: "Documento",
                furniture: "Mobília",
                object: "Outro objeto",
              },
            },
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });
});

function renderCard(prop: PropAsset, overrides = {}) {
  const handlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onGenerateReference: vi.fn(),
    onUploadReference: vi.fn(),
    onOpenFreezone: vi.fn(),
    ...overrides,
  };
  render(
    <I18nextProvider i18n={i18n}>
      <PropAssetCard prop={prop} {...handlers} />
    </I18nextProvider>,
  );
  return handlers;
}

describe("PropAssetCard", () => {
  it("renders reference image and generate action", () => {
    const handlers = renderCard({
      name: "Espada Sete Estrelas",
      aliases: [],
      prop_type: "weapon",
      visual_prompt: "Cabo de bronze com detalhes",
      description: "",
      owner: "Li Qing",
      notes: "",
      reference_url: "/static/u/p/assets/props/seven-star-sword/reference.png",
    });

    expect(screen.getByText("Espada Sete Estrelas")).toBeInTheDocument();
    expect(screen.getByText("Arma")).toBeInTheDocument();
    expect(screen.getByText("Personagem：Li Qing")).toBeInTheDocument();
    expect(screen.getByText("Imagem de referência Gerado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Regerar referência" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar referência" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Regerar referência" }));
    expect(handlers.onGenerateReference).toHaveBeenCalledTimes(1);
  });

  it("renders empty reference state", () => {
    renderCard({
      name: "Carta Secreta",
      aliases: [],
      prop_type: "document",
      visual_prompt: "",
      description: "Carta dobrada em papel kraft",
      owner: "",
      notes: "",
    });

    expect(screen.getByText("Sem imagem de referência")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar referência" })).toBeInTheDocument();
  });

  it("renders prop type labels instead of raw prop type codes", () => {
    renderCard({
      name: "TOKEN",
      aliases: [],
      prop_type: "artifact",
      visual_prompt: "Brilho digital e partículas",
      description: "",
      owner: "",
      notes: "",
    });

    expect(screen.getByText("Artefato")).toBeInTheDocument();
    expect(screen.queryByText("artifact")).not.toBeInTheDocument();
  });

  it("renders the visible action row", () => {
    renderCard({
      name: "TOKEN",
      aliases: [],
      prop_type: "artifact",
      visual_prompt: "Brilho digital e partículas",
      description: "",
      owner: "",
      notes: "",
    });

    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Gerar referência" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("opens a reference image preview from the card image", () => {
    renderCard({
      name: "Espada Sete Estrelas",
      aliases: [],
      prop_type: "weapon",
      visual_prompt: "Cabo de bronze com detalhes",
      description: "",
      owner: "",
      notes: "",
      reference_url: "/static/u/p/assets/props/seven-star-sword/reference.png",
    });

    fireEvent.click(screen.getByRole("button", { name: "Espada Sete Estrelas Imagem de referência" }));

    expect(
      screen.getByRole("link", { name: "Download image" }),
    ).toBeInTheDocument();
    expect(screen.getAllByAltText("Espada Sete Estrelas Imagem de referência")).toHaveLength(2);
  });

  it("shows the generating label for single prop reference generation", () => {
    renderCard(
      {
        name: "Espada Sete Estrelas",
        aliases: [],
        prop_type: "weapon",
        visual_prompt: "Cabo de bronze com detalhes",
        description: "",
        owner: "",
        notes: "",
        reference_url: "/static/u/p/assets/props/seven-star-sword/reference.png",
      },
      { generating: true },
    );

    expect(screen.getByRole("button", { name: "Gerando..." })).toBeDisabled();
  });

  it("renders the empty description fallback", () => {
    renderCard({
      name: "TOKEN",
      aliases: [],
      prop_type: "artifact",
      visual_prompt: "",
      description: "",
      owner: "",
      notes: "",
    });

    expect(screen.getByText("Sem descrição")).toBeInTheDocument();
  });
});
