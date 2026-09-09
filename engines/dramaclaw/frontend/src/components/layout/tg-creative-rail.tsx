// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 TG
import { Clapperboard, Star, UserRound, Zap } from "lucide-react";

export function TgCreativeRail() {
  const profileActive = window.location.pathname.startsWith("/criativo/perfil");
  return (
    <aside className="tg-creative-rail" aria-label="Modos do TG Video Studio">
      <a
        className="tg-creative-rail__mark"
        href="/"
        aria-label="TG Video Studio"
        title="TG Video Studio"
      >
        <Clapperboard size={22} />
      </a>
      <nav className="tg-creative-rail__nav" aria-label="Modos de produção">
        <a
          className={`tg-creative-rail__item${profileActive ? " tg-creative-rail__item--active" : ""}`}
          href="/criativo/perfil?project=01M1SAXW27GVCP7QF6EYY7PSQN"
          aria-current={profileActive ? "page" : undefined}
          title="Perfil — Cliente"
        >
          <UserRound size={21} aria-hidden="true" />
          <span className="text-[10px] font-medium">Perfil</span>
        </a>
        <a
          className="tg-creative-rail__item"
          href="/"
          title="Simples — 1 clique"
        >
          <Zap size={21} aria-hidden="true" />
          <span className="text-[10px] font-medium">Simples</span>
        </a>
        <a
          className={`tg-creative-rail__item${profileActive ? "" : " tg-creative-rail__item--active"}`}
          href="/criativo/"
          aria-current={profileActive ? undefined : "page"}
          title="Criativo — Estúdio"
        >
          <Star size={21} aria-hidden="true" />
          <span className="text-[10px] font-medium">Criativo</span>
        </a>
      </nav>
      <div className="tg-creative-rail__signature" title="Teixeira Gonçalves">
        TG
      </div>
    </aside>
  );
}
