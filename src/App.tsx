import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { ComplexVideoTab } from './components/ComplexVideoTab';
import { EngineWorkspace } from './components/EngineWorkspace';
import { Sidebar } from './components/Sidebar';
import { SimpleVideoTab } from './components/SimpleVideoTab';
import { VideoPlayerPreview } from './components/VideoPlayerPreview';
import { generateComplexVideo, generateSimpleVideo } from './services/api';
import { ComplexVideoConfig, GenerationJob, SimpleVideoConfig, TabType } from './types';

const engineUrl = (tab: TabType) => tab === 'simple' ? 'http://127.0.0.1:8501/?embed=true' : 'http://127.0.0.1:5174/?lng=pt&embedded=true';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('simple');
  const [advanced, setAdvanced] = useState(false);
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(() => {
    if (new URLSearchParams(window.location.search).get('demo') !== 'video') return null;
    return {
      id: 'demonstracao-roma-antiga',
      type: 'simple',
      title: '5 Mistérios da Roma Antiga',
      status: 'completed',
      progress: 100,
      currentStepMessage: 'Vídeo pronto.',
      videoUrl: 'http://localhost:8000/api/demo/roma-antiga.mp4',
      videoSource: 'backend',
      createdAt: new Date().toISOString(),
    };
  });

  const changeTab = (tab: TabType) => { setActiveTab(tab); setActiveJob(null); setAdvanced(false); };
  const generateSimple = (config: SimpleVideoConfig) => generateSimpleVideo(config, setActiveJob);
  const generateComplex = (config: ComplexVideoConfig) => generateComplexVideo(config, setActiveJob);

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
            <span className="engine-indicator">{activeTab === 'simple' ? 'Motor rápido online' : 'Estúdio avançado online'}</span>
            <button className="advanced-toggle" type="button" onClick={() => setAdvanced((value) => !value)}>
              {advanced ? 'Voltar' : 'Abrir estúdio completo'} <ExternalLink size={14} />
            </button>
          </div>
        </header>

        {advanced ? (
          <main className="studio-content"><EngineWorkspace name={activeTab === 'simple' ? 'Produção rápida' : 'TG Criatividade'} url={engineUrl(activeTab)} /></main>
        ) : (
          <main className="flex-1 overflow-y-auto px-5 py-5 lg:px-7">
            <div className="mx-auto grid min-h-full max-w-[1400px] grid-cols-1 gap-5 lg:grid-cols-12">
              <section className="space-y-6 lg:col-span-7">
                {activeTab === 'simple'
                  ? <SimpleVideoTab onGenerate={generateSimple} activeJob={activeJob} />
                  : <ComplexVideoTab onGenerate={generateComplex} activeJob={activeJob} />}
              </section>
              <section className="min-h-[500px] lg:col-span-5"><div className="sticky top-0 h-[calc(100vh-105px)]"><VideoPlayerPreview job={activeJob} onReset={() => setActiveJob(null)} /></div></section>
            </div>
          </main>
        )}

      </div>
    </div>
  );
};
