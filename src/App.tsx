import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SimpleVideoTab } from './components/SimpleVideoTab';
import { VideoPlayerPreview } from './components/VideoPlayerPreview';
import { generateSimpleVideo } from './services/api';
import { GenerationJob, SimpleVideoConfig, TabType } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('simple');
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);

  const changeTab = (tab: TabType) => {
    if (tab === 'complex') {
      window.location.assign('/criativo/');
      return;
    }
    setActiveTab('simple');
    setActiveJob(null);
  };
  const generateSimple = (config: SimpleVideoConfig) => generateSimpleVideo(config, setActiveJob);

  return (
    <div className="studio-shell">
      <Sidebar activeTab={activeTab} onSelectTab={changeTab} />
      <div className="studio-main">
        <header className="studio-header">
          <div className="brand-lockup">
            <span className="brand-monogram">TG</span>
            <span className="brand-copy">
              <span className="brand-name">Video Studio</span>
            <span className="brand-context">{activeTab === 'simple' ? 'Produção rápida' : 'Estúdio de criatividade'}</span>
            </span>
          </div>
          <div className="header-actions">
            <span className="engine-indicator">Motor rápido online</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-5 lg:px-7">
          <div className="mx-auto grid min-h-full max-w-[1400px] grid-cols-1 gap-5 lg:grid-cols-12">
            <section className="space-y-6 lg:col-span-7">
              <SimpleVideoTab onGenerate={generateSimple} activeJob={activeJob} />
            </section>
            <section className="min-h-[500px] lg:col-span-5"><div className="sticky top-0 h-[calc(100vh-105px)]"><VideoPlayerPreview job={activeJob} onReset={() => setActiveJob(null)} /></div></section>
          </div>
        </main>

      </div>
    </div>
  );
};
