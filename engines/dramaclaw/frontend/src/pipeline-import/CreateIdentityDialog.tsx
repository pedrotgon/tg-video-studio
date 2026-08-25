// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 ClaymoreLab
import { useEffect, useMemo, useState } from "react";
import { createIdentityAsset } from "@/api/assets";
import { listCharacters, type SupertaleCharacter } from "@/api/projects";

interface CreateIdentityDialogProps {
  project: string;
  sourceUrl: string;
  previewUrl?: string;
  defaultCharacter?: string | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const AGE_OPTIONS = [
  { value: "", label: "Não há idade especificada" },
  { value: "child", label: "child" },
  { value: "youth", label: "youth" },
  { value: "middle", label: "middle" },
  { value: "elder", label: "elder" },
];

export function CreateIdentityDialog({
  project,
  sourceUrl,
  previewUrl,
  defaultCharacter,
  onClose,
  onSuccess,
}: CreateIdentityDialogProps) {
  const [characters, setCharacters] = useState<SupertaleCharacter[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [character, setCharacter] = useState(defaultCharacter ?? "");
  const [identityName, setIdentityName] = useState("");
  const [appearanceDetails, setAppearanceDetails] = useState("");
  const [facePrompt, setFacePrompt] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingCharacters(true);
    listCharacters(project)
      .then((items) => {
        if (cancelled) return;
        setCharacters(items);
        if (!character && items.length > 0) {
          setCharacter(items[0].name);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingCharacters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project]);

  const canSubmit = useMemo(
    () => !!character.trim() && !!identityName.trim() && !submitting,
    [character, identityName, submitting],
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createIdentityAsset(project, {
        source_url: sourceUrl,
        character: character.trim(),
        identity_name: identityName.trim(),
        appearance_details: appearanceDetails.trim(),
        face_prompt: facePrompt.trim(),
        age_group: ageGroup,
      });
      onSuccess(`已创建身份 ${result.character} / ${result.identity_name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-xl border border-border-default bg-surface shadow-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text">Crie um novo Identity</h2>
            <p className="text-xs text-text-muted mt-0.5">
              Crie um novo Identity global a partir do imagem selecionado atual, sem sobrescrever o Identity canônico.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-text text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-4 grid grid-cols-[180px_1fr] gap-4">
          <div className="rounded-lg border border-border-default bg-bg-dark p-2">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="identity source"
                className="w-full rounded object-contain max-h-56"
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-xs text-text-muted">
                Sem pré-visualização
              </div>
            )}
            <div className="text-[11px] text-text-muted mt-2 break-all">
              source: {sourceUrl}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-text-muted">Função</span>
              <select
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                disabled={loadingCharacters}
                className="mt-1 w-full rounded-md border border-border-default bg-bg-dark px-3 py-2 text-sm text-text"
              >
                {characters.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.display_name || item.name}
                  </option>
                ))}
                {character && !characters.some((item) => item.name === character) && (
                  <option value={character}>{character}</option>
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-text-muted">Nome do Identity</span>
              <input
                value={identityName}
                onChange={(e) => setIdentityName(e.target.value)}
                placeholder="Por exemplo: Idade avançada, vestimenta de trabalho, vestimenta danificada."
                className="mt-1 w-full rounded-md border border-border-default bg-bg-dark px-3 py-2 text-sm text-text"
              />
            </label>

            <label className="block">
              <span className="text-xs text-text-muted">Faixa Etária</span>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-default bg-bg-dark px-3 py-2 text-sm text-text"
              >
                {AGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-text-muted">Descrição da vestimenta/apresentação</span>
              <textarea
                value={appearanceDetails}
                onChange={(e) => setAppearanceDetails(e.target.value)}
                rows={3}
                placeholder="A vestimenta, a aparência e o estilo do Identity, não incluindo movimentos."
                className="mt-1 w-full rounded-md border border-border-default bg-bg-dark px-3 py-2 text-sm text-text"
              />
            </label>

            <label className="block">
              <span className="text-xs text-text-muted">Palavra-chave de graça facial (opcional)</span>
              <textarea
                value={facePrompt}
                onChange={(e) => setFacePrompt(e.target.value)}
                rows={2}
                placeholder="Só preencha quando há mudanças significativas na idade; padrão é reutilizar a identidade do personagem."
                className="mt-1 w-full rounded-md border border-border-default bg-bg-dark px-3 py-2 text-sm text-text"
              />
            </label>

            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-border-default flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-border-default text-xs text-text-muted hover:text-text"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-3 py-1.5 rounded-md bg-accent text-bg-dark text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Criando..." : "Crie Identity"}
          </button>
        </div>
      </div>
    </div>
  );
}
