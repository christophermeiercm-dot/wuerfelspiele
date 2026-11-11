import { useState } from 'react';
import type { RegelAbschnitt } from './regeln';

/** Knopf, der die Spielregeln als Blatt öffnet. `symbol`: nur „?“ (Kopfzeile) statt Text. */
export function RegelnKnopf({ titel, abschnitte, symbol = false }: { titel: string; abschnitte: RegelAbschnitt[]; symbol?: boolean }) {
  const [offen, setOffen] = useState(false);
  return (
    <>
      {symbol ? (
        <button className="icon" onClick={() => setOffen(true)} aria-label={`Spielregeln ${titel}`}>?</button>
      ) : (
        <button className="knopf zweit" onClick={() => setOffen(true)}>📖 Spielregeln lesen</button>
      )}
      {offen && (
        <div className="schleier" onClick={() => setOffen(false)}>
          <div className="blatt lang" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <div className="blattkopf">
              <h2>Spielregeln · {titel}</h2>
              <button className="icon" onClick={() => setOffen(false)} aria-label="Schließen">✕</button>
            </div>
            <div className="regeltext">
              {abschnitte.map(a => (
                <section key={a.titel}>
                  <h3>{a.titel}</h3>
                  {a.absaetze?.map((t, i) => <p key={i}>{t}</p>)}
                  {a.liste && <ul>{a.liste.map((t, i) => <li key={i}>{t}</li>)}</ul>}
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
