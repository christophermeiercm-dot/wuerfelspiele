import { useEffect, useMemo, useState } from 'react';
import {
  FELD_HINWEIS, FELD_NAME, OBERER_BLOCK, UNTERER_BLOCK, freieFelder, moeglicheWerte, punkteFuer, summen,
  type Feld,
} from './kniffel';
import { Wuerfel, SPIELERFARBEN } from './Wuerfel';
import { eintragen, laden, neuesSpiel, rangliste, rueckgaengig, speichern, spielZuEnde, type Spiel } from './spiel';


export function Kniffel({ zurueck }: { zurueck: () => void }) {
  const [spiel, setSpiel] = useState<Spiel | null>(() => laden());
  useEffect(() => speichern(spiel), [spiel]);

  if (!spiel) return <Einrichtung zurueck={zurueck} start={namen => setSpiel(neuesSpiel(namen))} />;
  return <Partie spiel={spiel} setSpiel={setSpiel} zurueck={zurueck} neu={() => setSpiel(null)} />;
}

function Einrichtung({ zurueck, start }: { zurueck: () => void; start: (namen: string[]) => void }) {
  const [namen, setNamen] = useState(['', '']);
  return (
    <main className="seite">
      <Leiste titel="Kniffel" zurueck={zurueck} />
      <section className="karte">
        <h2>Wer spielt mit?</h2>
        {namen.map((n, i) => (
          <label key={i} className="feld">
            Spieler {i + 1}
            <input value={n} placeholder={`Spieler ${i + 1}`} maxLength={16}
              onChange={e => setNamen(namen.map((x, k) => (k === i ? e.target.value : x)))} />
          </label>
        ))}
        <div className="zeile">
          {namen.length < 6 && <button className="knopf zweit" onClick={() => setNamen([...namen, ''])}>+ Spieler</button>}
          {namen.length > 1 && <button className="knopf zweit" onClick={() => setNamen(namen.slice(0, -1))}>− Letzter</button>}
        </div>
        <button className="knopf haupt" onClick={() => start(namen)}>Spiel starten →</button>
      </section>
    </main>
  );
}

function Partie({ spiel, setSpiel, zurueck, neu }: {
  spiel: Spiel; setSpiel: (s: Spiel) => void; zurueck: () => void; neu: () => void;
}) {
  const [wurf, setWurf] = useState<number[]>([]);
  const [dialog, setDialog] = useState<{ spieler: number; feld: Feld } | null>(null);
  const aktuell = spiel.spieler[spiel.dran];
  const fertig = spielZuEnde(spiel);
  const wurfKomplett = wurf.length === 5;

  const setze = (spieler: number, feld: Feld, wert: number | undefined) => {
    setSpiel(eintragen(spiel, spieler, feld, wert));
    setWurf([]);
    setDialog(null);
  };

  if (fertig) return <Ende spiel={spiel} zurueck={zurueck} neu={neu} zuruecknehmen={() => setSpiel(rueckgaengig(spiel))} />;

  return (
    <main className="seite">
      <Leiste titel="Kniffel" zurueck={zurueck}>
        <button className="icon" disabled={!spiel.verlauf.length} onClick={() => { setWurf([]); setSpiel(rueckgaengig(spiel)); }}
          aria-label="Letzten Eintrag rückgängig">↶</button>
        <button className="icon" aria-label="Neues Spiel"
          onClick={() => { if (confirm('Spiel beenden und neu beginnen? Der Stand geht verloren.')) neu(); }}>⟲</button>
      </Leiste>

      <section className="karte dran" style={{ ['--farbe' as string]: SPIELERFARBEN[spiel.dran % 6] }}>
        <span className="avatar">{aktuell.name.slice(0, 1).toUpperCase()}</span>
        <span className="wer"><small>Dran ist</small><strong>{aktuell.name}</strong></span>
        <span className="runde"><small>Runde {Math.min(13, Object.keys(aktuell.blatt).length + 1)}/13</small><b>{summen(aktuell.blatt).gesamt} Punkte</b></span>
      </section>

      <section className="karte">
        <h2>Was hast du gewürfelt?</h2>
        <div className="wurf" aria-live="polite">
          {[0, 1, 2, 3, 4].map(i => (
            <button key={i} className={'wuerfel' + (wurf[i] ? ' voll' : '')} disabled={!wurf[i]}
              onClick={() => setWurf(wurf.filter((_, k) => k !== i))} aria-label={wurf[i] ? `Würfel ${wurf[i]} entfernen` : 'leer'}>
              {wurf[i] ? <Wuerfel n={wurf[i]} /> : ''}
            </button>
          ))}
        </div>
        <div className="tasten">
          {[1, 2, 3, 4, 5, 6].map(z => (
            <button key={z} className="taste" disabled={wurfKomplett} onClick={() => setWurf([...wurf, z])}>
              <Wuerfel n={z} klein /><small>{z}</small>
            </button>
          ))}
        </div>
        <div className="zeile">
          <button className="knopf zweit" disabled={!wurf.length} onClick={() => setWurf(wurf.slice(0, -1))}>⌫ Zurück</button>
          <button className="knopf zweit" disabled={!wurf.length} onClick={() => setWurf([])}>Leeren</button>
        </div>
      </section>

      <section className="karte">
        <h2>{wurfKomplett ? 'Wohin damit?' : 'Feld wählen'}</h2>
        {!wurfKomplett && <p className="neben">Tippe die fünf Würfel oben ein – dann siehst du, was jedes Feld bringt. Oder tippe ein Feld und gib die Punkte direkt ein.</p>}
        <ul className="felder">
          {freieFelder(aktuell.blatt).map(f => {
            const p = wurfKomplett ? punkteFuer(f, wurf) : null;
            return (
              <li key={f}>
                <button className={'fe' + (p === 0 ? ' null' : p ? ' gut' : '')}
                  onClick={() => (p === null ? setDialog({ spieler: spiel.dran, feld: f }) : setze(spiel.dran, f, p))}>
                  <span><strong>{FELD_NAME[f]}</strong><small>{FELD_HINWEIS[f]}</small></span>
                  <span className="wert">{p === null ? '' : p === 0 ? '0 · streichen' : `+${p}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Block spiel={spiel} waehle={(spieler, feld) => setDialog({ spieler, feld })} />
      {dialog && <Eingabe spiel={spiel} {...dialog} zu={() => setDialog(null)} setze={setze} />}
    </main>
  );
}

function Block({ spiel, waehle }: { spiel: Spiel; waehle: (spieler: number, feld: Feld) => void }) {
  const alle = useMemo(() => spiel.spieler.map(s => summen(s.blatt)), [spiel]);
  const zeile = (f: Feld) => (
    <tr key={f}>
      <th scope="row">{FELD_NAME[f]}</th>
      {spiel.spieler.map((s, i) => (
        <td key={i} className={i === spiel.dran ? 'aktiv' : ''}>
          <button onClick={() => waehle(i, f)} aria-label={`${FELD_NAME[f]} ${s.name}`}>{s.blatt[f] ?? ''}</button>
        </td>
      ))}
    </tr>
  );
  const summe = (titel: string, wert: (i: number) => number | string, stark = false) => (
    <tr className={'summe' + (stark ? ' gesamt' : '')}>
      <th scope="row">{titel}</th>
      {alle.map((_, i) => <td key={i}>{wert(i)}</td>)}
    </tr>
  );
  return (
    <section className="karte block">
      <h2>Punkteblock</h2>
      <div className="scroll">
        <table>
          <thead><tr><th />{spiel.spieler.map((s, i) => <th key={i} className={i === spiel.dran ? 'aktiv' : ''} style={{ borderBottom: `3px solid ${SPIELERFARBEN[i % 6]}` }}>{s.name}</th>)}</tr></thead>
          <tbody>
            {OBERER_BLOCK.map(zeile)}
            {summe('Oben', i => alle[i].oben)}
            {summe('Bonus (ab 63)', i => alle[i].bonus || (alle[i].bisBonus ? `noch ${alle[i].bisBonus}` : 0))}
            {UNTERER_BLOCK.map(zeile)}
            {summe('Gesamt', i => alle[i].gesamt, true)}
          </tbody>
        </table>
      </div>
      <p className="neben">Zelle antippen, um einen Eintrag zu ändern oder zu löschen.</p>
    </section>
  );
}

function Eingabe({ spiel, spieler, feld, zu, setze }: {
  spiel: Spiel; spieler: number; feld: Feld; zu: () => void;
  setze: (spieler: number, feld: Feld, wert: number | undefined) => void;
}) {
  const aktuell = spiel.spieler[spieler].blatt[feld];
  const werte = moeglicheWerte(feld);
  const [text, setText] = useState(aktuell === undefined ? '' : String(aktuell));
  const zahl = text.trim() === '' ? NaN : Number(text);
  return (
    <div className="schleier" onClick={zu}>
      <div className="blatt" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
        <h2>{FELD_NAME[feld]} · {spiel.spieler[spieler].name}</h2>
        <p className="neben">{FELD_HINWEIS[feld]}</p>
        {werte === 'frei' ? (
          <div className="zeile">
            <input inputMode="numeric" autoFocus value={text} placeholder="Summe der Augen"
              onChange={e => setText(e.target.value.replace(/\D/g, '').slice(0, 2))} />
            <button className="knopf haupt" disabled={!(zahl >= 5 && zahl <= 30) && zahl !== 0}
              onClick={() => setze(spieler, feld, zahl)}>Eintragen</button>
          </div>
        ) : (
          <div className="werte">
            {werte.map(w => (
              <button key={w} className={'knopf zweit' + (w === aktuell ? ' gewaehlt' : '')} onClick={() => setze(spieler, feld, w)}>
                {w === 0 ? '0 · streichen' : w}
              </button>
            ))}
          </div>
        )}
        {werte === 'frei' && <button className="knopf zweit" onClick={() => setze(spieler, feld, 0)}>0 · streichen</button>}
        <div className="zeile">
          {aktuell !== undefined && <button className="knopf zweit" onClick={() => setze(spieler, feld, undefined)}>Eintrag löschen</button>}
          <button className="knopf zweit" onClick={zu}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}

function Ende({ spiel, zurueck, neu, zuruecknehmen }: { spiel: Spiel; zurueck: () => void; neu: () => void; zuruecknehmen: () => void }) {
  const liste = rangliste(spiel);
  return (
    <main className="seite">
      <Leiste titel="Kniffel" zurueck={zurueck} />
      <section className="karte">
        <div className="pokal" aria-hidden>🏆</div>
        <h2 className="mitte">Spiel zu Ende</h2>
        <p className="neben mitte">{liste[0] && `${liste.filter(e => e.platz === 1).map(e => e.name).join(' & ')} gewinn${liste.filter(e => e.platz === 1).length > 1 ? 'en' : 't'} mit ${liste[0].punkte} Punkten`}</p>
        <ol className="rang">
          {liste.map((e, i) => (
            <li key={i} className={e.platz === 1 ? 'sieger' : ''}>
              <span className="medaille">{['🥇', '🥈', '🥉'][e.platz - 1] ?? `${e.platz}.`}</span><strong>{e.name}</strong><span>{e.punkte}</span>
            </li>
          ))}
        </ol>
        <div className="zeile">
          <button className="knopf zweit" onClick={zuruecknehmen}>↶ Letzten Eintrag ändern</button>
          <button className="knopf haupt" onClick={neu}>Neues Spiel →</button>
        </div>
      </section>
    </main>
  );
}

function Leiste({ titel, zurueck, children }: { titel: string; zurueck: () => void; children?: React.ReactNode }) {
  return (
    <div className="leiste">
      <button className="icon" onClick={zurueck} aria-label="Zur Spieleübersicht">←</button>
      <strong>{titel}</strong>
      <span className="platz" />
      {children}
    </div>
  );
}

