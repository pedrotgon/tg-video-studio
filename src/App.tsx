import React, { lazy, Suspense, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SimpleVideoTab } from './components/SimpleVideoTab';
import { VideoPlayerPreview } from './components/VideoPlayerPreview';
import { generateSimpleVideo } from './services/api';
import { GenerationJob, SimpleVideoConfig, TabType } from './types';

const StopMotionStudio = lazy(() => import('./components/stop-motion/StopMotionStudio'));

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(() => window.location.hash === '#animation' ? 'animation' : 'simple');
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [simpleStep, setSimpleStep] = useState(1);

  const changeTab = (tab: TabType) => {
    if (tab === 'profile') {
      window.location.assign('/criativo/perfil?project=Thaix_Santiago_Perfil_e_Copies');
      return;
    }
    if (tab === 'complex') {
      window.location.assign('/criativo/');
      return;
    }
    setActiveTab(tab);
    window.history.replaceState(null, '', tab === 'animation' ? '#animation' : window.location.pathname + window.location.search);
    setActiveJob(null);
  };
  const generateSimple = (config: SimpleVideoConfig) => generateSimpleVideo(config, setActiveJob);

  return (
    <div className="studio-shell">
      <Sidebar activeTab={activeTab} onSelectTab={changeTab} />
      <div className="studio-main">
        {activeTab === 'animation' ? <Suspense fallback={<p role="status" className="p-6">Preparando o palco…</p>}><StopMotionStudio /></Suspense> : <>
        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
          <div className={`mx-auto grid min-h-full max-w-[1400px] grid-cols-1 gap-5 ${simpleStep === 5 ? 'lg:grid-cols-12' : ''}`}>
            <section className={`space-y-6 ${simpleStep === 5 ? 'lg:col-span-7' : ''}`}>
              <SimpleVideoTab onGenerate={generateSimple} activeJob={activeJob} onStepChange={setSimpleStep} />
            </section>
            {simpleStep === 5 && <section className="min-h-[500px] lg:col-span-5"><div className="sticky top-0 h-[calc(100vh-105px)]"><VideoPlayerPreview job={activeJob} onReset={() => { setActiveJob(null); setSimpleStep(1); }} /></div></section>}
          </div>
        </main>
        </>}

      </div>
    </div>
  );
};
