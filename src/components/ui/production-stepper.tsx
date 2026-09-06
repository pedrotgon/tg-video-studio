// SPDX-License-Identifier: MIT
// Adapted from Ruixen UI WizardStepper, copyright (c) 2025 Ruixen UI.
// Source and full license: docs/ui-sources.md.
import { Check } from 'lucide-react';

export function ProductionStepper({ steps, current, disabled, canVisit, onChange }: {
  steps: string[]; current: number; disabled: boolean;
  canVisit: (step: number) => boolean; onChange: (step: number) => void;
}) {
  return <ol aria-label="Etapas da produção" className="flex items-start border-b border-[#e3e1da] pb-6 pt-3">
    {steps.map((title, index) => {
      const number = index + 1;
      const done = number < current;
      const active = number === current;
      return <li key={title} className="relative flex flex-1 justify-center">
        {index < steps.length - 1 && <span aria-hidden="true" className={`absolute left-1/2 top-4 h-px w-full ${done ? 'bg-[#c5a880]' : 'bg-[#e3e1da]'}`} />}
        <button type="button" disabled={disabled || !canVisit(number)} onClick={() => onChange(number)} aria-current={active ? 'step' : undefined} className="relative z-10 flex flex-col items-center gap-2 rounded-lg px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c5a880] disabled:cursor-not-allowed disabled:opacity-50">
          <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${active ? 'border-[#19382b] bg-[#19382b] text-white' : done ? 'border-[#c5a880] bg-[#f7f5f0] text-[#19382b]' : 'border-[#e3e1da] bg-white text-[#66736b]'}`}>{done ? <Check size={14} /> : number}</span>
          <span className={`text-xs ${active ? 'font-semibold text-[#19382b]' : 'text-[#66736b]'}`}>{title}</span>
        </button>
      </li>;
    })}
  </ol>;
}
