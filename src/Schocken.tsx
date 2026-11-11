import { useEffect, useState } from 'react';
import { RegelnKnopf } from './RegelnKnopf';
import { REGELN_SCHOCKEN } from './regeln';
import { DECKEL, laden, neuesSchocken, rueckgaengig, speichern, verlieren, type Schocken as Spiel, type Seite } from './schocken';
import { SPIELERFARBEN } from './Wuerfel';

const WERTE: { n: number; text: string }[] = [
  { n: 1, text: 'Zahl' },
  { n: 2, text: 'Straße · Doof' },
  { n: 3, text: 'Pasch · Schock 3' },
  { n: 4, text: 'Schock 4' },
  { n: 5, text: 'Schock 5' },
  { n: 6, text: 'Schock 6' },
];

const PHASE_NAME = { haelfte1: '1. Hälfte', haelfte2: '2. Hälfte', finale: 'Finale', ende: 'Spiel zu Ende' } as const;

export function SchockenSeite({ zurueck }: { zurueck: () => void }) {
  const [spiel, setSpiel] = useState<Spiel | null>(() => laden());
  useEffect(() => speichern(spiel), [spiel]);
  const [namen, setNamen] = useState(['', '']);
  const [wahl, setWahl] = useState<Seite | null>(null);

  const kopf = (extra?: React.ReactNode) => (
    <div className="leiste">
      <button className="icon" onClick={zurueck} aria-label="Zur Spieleübersicht">←</button>
      <strong>Schocken</strong>
      <span className="platz" />
      <RegelnKnopf titel="Schocken" abschnitte={REGELN_SCHOCKEN} symbol />
      {extra}
    </div>
  );

  if (!spiel) {
    return (
      <main className="seite">
        {kopf()}
        <section className="karte">
          <h2>Wer spielt?</h2>
          {[0, 1].map(i => (
            <label key={i} className="feld">Spieler {i + 1}
              <input value={namen[i]} placeholder={`Spieler ${i + 1}`} maxLength={16}
                onChange={e => setNamen(namen.map((x, k) => (k === i ? e.target.value : x)))} />
            </label>
          ))}
          <p className="neben">Schocken ist hier für zwei Personen gedacht. Gewürfelt wird am Tisch, die App zählt die Deckel.</p>
          <button className="knopf haupt" onClick={() => setSpiel(neuesSchocken(namen[0], namen[1]))}>Spiel starten →</button>
          <div className="zeile"><RegelnKnopf titel="Schocken" abschnitte={REGELN_SCHOCKEN} /></div>
        </section>
      </main>
    );
  }

  const { z, namen: n } = spiel;
  const ende = z.phase === 'ende';
  const setze = (wer: Seite, anzahl: number, schockOut = false) => { setSpiel(verlieren(spiel, wer, anzahl, schockOut)); setWahl(null); };

  return (
    <main className="seite">
      {kopf(
        <>
          <button className="icon" disabled={!spiel.verlauf.length} onClick={() => setSpiel(rueckgaengig(spiel))} aria-label="Rückgängig">↶</button>
          <button className="icon" aria-label="Neues Spiel" onClick={() => { if (ende || confirm('Spiel beenden und neu beginnen?')) setSpiel(null); }}>⟲</button>
        </>,
      )}

      <section className="karte dran schock-phase">
        <span className="wer"><small>Gerade</small><strong>{PHASE_NAME[z.phase]}</strong></span>
        <span className="runde"><small>Hälften verloren</small>
          <b>{n[0]} {z.verloren[0]} : {z.verloren[1]} {n[1]}</b></span>
      </section>

      {!ende && z.phase !== 'finale' && (
        <section className="karte mitte-vorrat">
          <small className="neben">In der Mitte</small>
          <div className="vorrat">{z.vorrat}</div>
          <Deckel anzahl={z.vorrat} />
        </section>
      )}

      <div className="spieler2">
        {([0, 1] as Seite[]).map(i => (
          <section key={i} className={'karte sp' + (ende && z.verlierer === i ? ' verlierer' : '')} style={{ ['--farbe' as string]: SPIELERFARBEN[i] }}>
            <span className="avatar">{n[i].slice(0, 1).toUpperCase()}</span>
            <strong>{n[i]}</strong>
            <div className="vorrat klein">{z.phase === 'finale' ? '–' : z.deckel[i]}</div>
            <small className="neben">Deckel</small>
            {!ende && (
              <button className="knopf haupt klein" onClick={() => (z.phase === 'finale' ? setze(i, 0) : setWahl(i))}>
                {z.phase === 'finale' ? 'Finale verloren' : 'Hat verloren'}
              </button>
            )}
          </section>
        ))}
      </div>

      {z.meldung && <p className="joker">{z.meldung}</p>}
      {ende && z.verlierer !== null && (
        <section className="karte">
          <div className="pokal" aria-hidden>🍺</div>
          <h2 className="mitte">{n[z.verlierer]} hat verloren</h2>
          <p className="neben mitte">{n[z.verlierer === 0 ? 1 : 0]} gewinnt – und {n[z.verlierer]} zahlt die nächste Runde.</p>
          <button className="knopf haupt" onClick={() => setSpiel(null)}>Neues Spiel →</button>
        </section>
      )}

      {wahl !== null && (
        <div className="schleier" onClick={() => setWahl(null)}>
          <div className="blatt" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <h2>{n[wahl]} hat verloren – wie viele Deckel?</h2>
            <div className="werte">
              {WERTE.map(w => (
                <button key={w.n} className="knopf zweit wert-knopf" onClick={() => setze(wahl, w.n)}>
                  <strong>{w.n}</strong><small>{w.text}</small>
                </button>
              ))}
            </div>
            <button className="knopf zweit" onClick={() => setze(wahl, DECKEL, true)}>Schock Out (1-1-1) · Hälfte verloren</button>
            <button className="knopf zweit" onClick={() => setWahl(null)}>Abbrechen</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Deckel({ anzahl }: { anzahl: number }) {
  return (
    <div className="deckelreihe" aria-hidden>
      {Array.from({ length: DECKEL }, (_, i) => <i key={i} className={i < anzahl ? 'da' : ''} />)}
    </div>
  );
}
