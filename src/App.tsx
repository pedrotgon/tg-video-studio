import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { SimpleVideoTab } from './components/SimpleVideoTab';
import { ProfileTab } from './components/ProfileTab';
import { VideoPlayerPreview } from './components/VideoPlayerPreview';
import { generateSimpleVideo } from './services/api';
import { GenerationJob, SimpleVideoConfig, TabType } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('simple');
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [simpleStep, setSimpleStep] = useState(1);

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    setActiveJob(null);
  };
  const generateSimple = (config: SimpleVideoConfig) => generateSimpleVideo(config, setActiveJob);
  useEffect(() => {
    const openProfile = () => changeTab('profile');
    window.addEventListener('tg:open-profile', openProfile);
    return () => window.removeEventListener('tg:open-profile', openProfile);
  }, []);

  return (
    <div className="studio-shell">
      <Sidebar activeTab={activeTab} onSelectTab={changeTab} />
      <div className="studio-main">
        <main className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
          {activeTab === 'profile' ? <ProfileTab onUseReference={() => changeTab('simple')} /> : <div className={`mx-auto grid min-h-full max-w-[1400px] grid-cols-1 gap-5 ${simpleStep === 5 ? 'lg:grid-cols-12' : ''}`}>
            <section className={`space-y-6 ${simpleStep === 5 ? 'lg:col-span-7' : ''}`}>
              <SimpleVideoTab onGenerate={generateSimple} activeJob={activeJob} onStepChange={setSimpleStep} />
            </section>
            {simpleStep === 5 && <section className="min-h-[500px] lg:col-span-5"><div className="sticky top-0 h-[calc(100vh-105px)]"><VideoPlayerPreview job={activeJob} onReset={() => { setActiveJob(null); setSimpleStep(1); }} /></div></section>}
          </div>}
        </main>

      </div>
    </div>
  );
};
