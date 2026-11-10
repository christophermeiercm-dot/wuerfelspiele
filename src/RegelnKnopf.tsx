import { useState } from 'react';
import { VARIANTEN, type Variante } from './kniffel';
import { REGELN } from './regeln';

/** Knopf, der die Spielregeln als Blatt öffnet. `symbol`: nur „?“ (Kopfzeile) statt Text. */
export function RegelnKnopf({ variante, symbol = false }: { variante: Variante; symbol?: boolean }) {
  const [offen, setOffen] = useState(false);
  return (
    <>
      {symbol ? (
        <button className="icon" onClick={() => setOffen(true)} aria-label={`Spielregeln ${VARIANTEN[variante].titel}`}>?</button>
      ) : (
        <button className="knopf zweit" onClick={() => setOffen(true)}>📖 Spielregeln lesen</button>
      )}
      {offen && (
        <div className="schleier" onClick={() => setOffen(false)}>
          <div className="blatt lang" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <div className="blattkopf">
              <h2>Spielregeln · {VARIANTEN[variante].titel}</h2>
              <button className="icon" onClick={() => setOffen(false)} aria-label="Schließen">✕</button>
            </div>
            <div className="regeltext">
              {REGELN[variante].map(a => (
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
