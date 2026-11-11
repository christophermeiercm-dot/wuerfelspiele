import { useEffect, useState } from 'react';
import { VARIANTEN, type Variante } from './kniffel';
import { REGELN, REGELN_SCHOCKEN } from './regeln';
import { RegelnKnopf } from './RegelnKnopf';
import { SchockenSeite } from './Schocken';
import { laden as ladeSchocken } from './schocken';
import { Spielblock } from './Spielblock';
import { laden } from './spiel';
import { Wuerfel } from './Wuerfel';

type SpielId = Variante | 'schocken';

const SPIELE: { id: SpielId; titel: string; untertitel: string; augen: number; gold: boolean }[] = [
  { id: 'kniffel', titel: VARIANTEN.kniffel.titel, untertitel: 'Der Klassiker mit 13 Feldern', augen: 5, gold: true },
  { id: 'yahtzee', titel: VARIANTEN.yahtzee.titel, untertitel: 'Mit Prämie für weitere Yahtzee und Joker-Regel', augen: 6, gold: false },
  { id: 'schocken', titel: 'Schocken', untertitel: 'Zu zweit: Deckel zählen, zwei Hälften', augen: 1, gold: false },
];

export function App() {
  const [ansicht, setAnsicht] = useState<SpielId | 'start'>('start');
  const [laeuft, setLaeuft] = useState<Record<SpielId, boolean>>({ kniffel: false, yahtzee: false, schocken: false });
  useEffect(() => {
    if (ansicht === 'start') {
      setLaeuft({ kniffel: laden('kniffel') !== null, yahtzee: laden('yahtzee') !== null, schocken: ladeSchocken() !== null });
    }
  }, [ansicht]);

  if (ansicht === 'schocken') return <SchockenSeite zurueck={() => setAnsicht('start')} />;
  if (ansicht !== 'start') return <Spielblock key={ansicht} variante={ansicht} zurueck={() => setAnsicht('start')} />;
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
      <h2 className="wahl">Spiel auswählen</h2>
      {SPIELE.map((sp, i) => (
        <div key={sp.id} className={'karte spielkarte' + (i === 0 ? ' erste' : '')}>
          <button className="spielwahl" onClick={() => setAnsicht(sp.id)}>
            <span className="spielicon" aria-hidden><Wuerfel n={sp.augen} klein gold={sp.gold} /></span>
            <span>
              <strong>{sp.titel}</strong>
              <small>{laeuft[sp.id] ? 'Spiel läuft – weitermachen' : sp.untertitel}</small>
            </span>
            <span className="pfeil" aria-hidden>→</span>
          </button>
          <RegelnKnopf titel={sp.titel} abschnitte={sp.id === 'schocken' ? REGELN_SCHOCKEN : REGELN[sp.id]} />
        </div>
      ))}
      <div className="karte hinweis">Würfel bringst du selbst mit – hier trägst du nur ein, was gefallen ist.</div>
    </main>
  );
}
