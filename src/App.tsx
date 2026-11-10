import { useEffect, useState } from 'react';
import { Kniffel } from './Kniffel';
import { laden } from './spiel';
import { Wuerfel } from './Wuerfel';

type Ansicht = 'start' | 'kniffel';

export function App() {
  const [ansicht, setAnsicht] = useState<Ansicht>('start');
  const [laeuft, setLaeuft] = useState(() => laden() !== null);
  useEffect(() => { if (ansicht === 'start') setLaeuft(laden() !== null); }, [ansicht]);

  if (ansicht === 'kniffel') return <Kniffel zurueck={() => setAnsicht('start')} />;
  return (
    <main className="seite">
      <header className="held">
        <div className="schwebend" aria-hidden>
          <span className="w1"><Wuerfel n={5} gold /></span>
          <span className="w2"><Wuerfel n={3} /></span>
          <span className="w3"><Wuerfel n={6} /></span>
        </div>
        <h1>Würfelspiele</h1>
        <p>Dein Punkteblock für unterwegs – auch ohne Netz.</p>
      </header>
      <button className="karte spielkarte" onClick={() => setAnsicht('kniffel')}>
        <span className="spielicon" aria-hidden><Wuerfel n={5} klein gold /></span>
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
