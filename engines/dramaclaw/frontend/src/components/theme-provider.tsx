// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // TG Criativo is light-only; keep the persisted field for upstream compatibility.
  useAppStore((s) => s.theme);

  useEffect(() => {
    applyTheme("light");
  }, []);

  return children;
}

export function useResolvedTheme(): "light" | "dark" {
  useAppStore((s) => s.theme);
  return "light";
}
