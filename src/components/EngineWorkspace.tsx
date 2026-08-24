import React, { useState } from 'react';
import { AlertTriangle, LoaderCircle, RefreshCw } from 'lucide-react';

interface EngineWorkspaceProps { name: string; url: string; }

export const EngineWorkspace: React.FC<EngineWorkspaceProps> = ({ name, url }) => {
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  React.useEffect(() => {
    setLoaded(false);
    setTimedOut(false);
    const timer = window.setTimeout(() => setTimedOut(true), 12000);
    return () => window.clearTimeout(timer);
  }, [url, reloadKey]);

  return (
    <section className="engine-frame-card" aria-label={`Área do motor ${name}`}>
      <div className="engine-frame-toolbar">
        <span className={`status-dot ${loaded ? 'is-online' : ''}`} />
        <span>{loaded ? `${name} conectado` : `Conectando ao ${name}…`}</span>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCw size={14} /> Recarregar
        </button>
      </div>
      {!loaded && (
        <div className="engine-loading">
          {timedOut ? <AlertTriangle size={28} /> : <LoaderCircle className="spin" size={28} />}
          <strong>{timedOut ? 'O motor ainda não respondeu' : 'Preparando o estúdio completo'}</strong>
          <span>{timedOut ? 'Inicie os serviços locais e clique em Recarregar.' : 'A primeira abertura pode levar alguns segundos.'}</span>
        </div>
      )}
      <iframe
        key={reloadKey}
        className={loaded ? 'is-loaded' : ''}
        src={url}
        title={name}
        allow="autoplay; camera; microphone; clipboard-read; clipboard-write"
        onLoad={() => setLoaded(true)}
      />
    </section>
  );
};
