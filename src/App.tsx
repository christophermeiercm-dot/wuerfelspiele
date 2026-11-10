import { useEffect, useState } from 'react';
import { Kniffel } from './Kniffel';
import { laden } from './spiel';

type Ansicht = 'start' | 'kniffel';

export function App() {
  const [ansicht, setAnsicht] = useState<Ansicht>('start');
  const [laeuft, setLaeuft] = useState(() => laden() !== null);
  useEffect(() => { if (ansicht === 'start') setLaeuft(laden() !== null); }, [ansicht]);

  if (ansicht === 'kniffel') return <Kniffel zurueck={() => setAnsicht('start')} />;
  return (
    <main className="seite">
      <header className="kopf">
        <div className="logo" aria-hidden>⚄</div>
        <h1>Würfelspiele</h1>
        <p className="neben">Dein Punkteblock für unterwegs – funktioniert auch ohne Netz.</p>
      </header>
      <button className="karte spielkarte" onClick={() => setAnsicht('kniffel')}>
        <span className="spielicon" aria-hidden>🎲</span>
        <span>
          <strong>Kniffel</strong>
          <small>{laeuft ? 'Spiel läuft – weitermachen' : 'Neues Spiel starten'}</small>
        </span>
        <span className="pfeil" aria-hidden>→</span>
      </button>
      <div className="karte hinweis">Weitere Spiele folgen. Würfel bringst du selbst mit – hier trägst du nur ein, was gefallen ist.</div>
    </main>
  );
}
