// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { Star, Zap } from "lucide-react";

export function TgCreativeRail() {
  return (
    <aside className="tg-creative-rail" aria-label="Modos do TG Video Studio">
      <a className="tg-creative-rail__mark" href="/" aria-label="TG Video Studio">
        TG
      </a>
      <nav className="tg-creative-rail__nav" aria-label="Modos de produção">
        <a className="tg-creative-rail__item" href="/" aria-label="Simples — 1 clique">
          <Zap aria-hidden="true" />
          <span>Simples</span>
        </a>
        <a className="tg-creative-rail__item tg-creative-rail__item--active" href="/criativo/" aria-current="page" aria-label="Criativo — Estúdio">
          <Star aria-hidden="true" fill="currentColor" />
          <span>Criativo</span>
        </a>
      </nav>
      <div className="tg-creative-rail__signature" aria-label="Teixeira Gonçalves">TG</div>
    </aside>
  );
}
