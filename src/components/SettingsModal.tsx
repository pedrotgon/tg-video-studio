import React, { useState } from 'react';
import { X, Key, Check, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [openaiKey, setOpenaiKey] = useState(() => localStorage.getItem('tg_openai_key') || '');
  const [pexelsKey, setPexelsKey] = useState(() => localStorage.getItem('tg_pexels_key') || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('tg_openai_key', openaiKey);
    localStorage.setItem('tg_pexels_key', pexelsKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-forest/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full border border-brand-forest/20 shadow-2xl p-6 relative space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-brand-forest/40 hover:text-brand-forest p-1 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-gold/15 flex items-center justify-center text-brand-forest border border-brand-gold/30">
            <Key className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-brand-forest">Configurações de APIs</h3>
            <p className="text-xs text-brand-forest/60">Chaves de integração para os motores de vídeo</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-forest mb-1.5">
              OpenAI API Key (LLM / Roteiro)
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-forest/20 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 outline-none text-sm font-mono bg-brand-cloud/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-forest mb-1.5">
              Pexels API Key (Vídeos de Fundo Gratuitos)
            </label>
            <input
              type="password"
              value={pexelsKey}
              onChange={(e) => setPexelsKey(e.target.value)}
              placeholder="Chave da API do Pexels..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-forest/20 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30 outline-none text-sm font-mono bg-brand-cloud/20"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>As chaves ficam salvas no seu navegador e não são compartilhadas externamente.</span>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand-forest hover:bg-brand-dark text-brand-cloud font-heading font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Salvo com Sucesso!
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
