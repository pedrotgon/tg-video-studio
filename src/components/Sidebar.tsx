import React from 'react';
import { Clapperboard, Star, UserRound, Zap } from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps { activeTab: TabType; onSelectTab: (tab: TabType) => void; }

const items: Array<{ id: TabType; label: string; detail: string; icon: typeof Zap }> = [
  { id: 'profile', label: 'Perfil', detail: 'Cliente', icon: UserRound },
  { id: 'simple', label: 'Simples', detail: '1 clique', icon: Zap },
  { id: 'complex', label: 'Criativo', detail: 'Estúdio', icon: Star },
  { id: 'animation', label: 'Animação', detail: 'Stop motion', icon: Clapperboard },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => (
  <aside className="studio-sidebar">
    <div className="sidebar-product-mark" aria-label="TG Video Studio"><Clapperboard size={22} /></div>
    <nav aria-label="Modos de produção">
      {items.map(({ id, label, detail, icon: Icon }) => (
        <button key={id} type="button" title={`${label} — ${detail}`} aria-label={`${label} — ${detail}`} className={activeTab === id ? 'active' : ''} aria-current={activeTab === id ? 'page' : undefined} onClick={() => onSelectTab(id)}>
          <Icon size={21} /><strong>{label}</strong><small>{detail}</small>
        </button>
      ))}
    </nav>
    <div className="sidebar-tg" title="Teixeira Gonçalves">TG</div>
  </aside>
);
