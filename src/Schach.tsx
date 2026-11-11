import type { Square } from 'chess.js';
import { useEffect, useMemo, useState } from 'react';
import { RegelnKnopf } from './RegelnKnopf';
import { REGELN_SCHACH } from './regeln';
import { FIGUR_NAME, SYMBOL, geschlagen, laden, lage, leerer, speichern, spielAus, type Stand } from './schach';

const SPALTEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const UMWANDLUNG = ['q', 'r', 'b', 'n'];

export function SchachSeite({ zurueck }: { zurueck: () => void }) {
  const [stand, setStand] = useState<Stand>(() => laden() ?? leerer());
  useEffect(() => speichern(stand), [stand]);
  const [gewaehlt, setGewaehlt] = useState<Square | null>(null);
  const [umwandlung, setUmwandlung] = useState<{ von: Square; nach: Square } | null>(null);
  const [menue, setMenue] = useState(false);

  const c = useMemo(() => spielAus(stand), [stand]);
  const l = lage(c, stand.beendet);
  const brett = c.board();
  const letzter = c.history({ verbose: true }).at(-1);
  const ziele = useMemo(
    () => (gewaehlt && !l.vorbei ? c.moves({ square: gewaehlt, verbose: true }) : []),
    [c, gewaehlt, l.vorbei],
  );
  const kg = geschlagen(c);

  const ziehe = (von: Square, nach: Square, promotion?: string) => {
    const kopie = spielAus(stand);
    const m = kopie.move({ from: von, to: nach, promotion });
    setStand({ ...stand, zuege: [...stand.zuege, m.san] });
    setGewaehlt(null);
    setUmwandlung(null);
  };

  const tippe = (feld: Square) => {
    if (l.vorbei) return;
    const ziel = ziele.find(m => m.to === feld);
    if (gewaehlt && ziel) {
      if (ziel.promotion) setUmwandlung({ von: gewaehlt, nach: feld });
      else ziehe(gewaehlt, feld);
      return;
    }
    const figur = c.get(feld);
    setGewaehlt(figur && figur.color === c.turn() && feld !== gewaehlt ? feld : null);
  };

  const beenden = (ausgang: 'weiss' | 'schwarz' | 'remis', grund: string) => {
    setStand({ ...stand, beendet: { ausgang, grund } });
    setMenue(false);
  };
  const neu = () => { if (l.vorbei || confirm('Partie beenden und neu beginnen?')) { setStand({ ...leerer(), gedreht: stand.gedreht }); setGewaehlt(null); setMenue(false); } };

  const reihen = stand.gedreht ? [...brett].reverse().map(r => [...r].reverse()) : brett;
  const feldName = (zeile: number, spalte: number): Square => {
    const sp = stand.gedreht ? 7 - spalte : spalte;
    const re = stand.gedreht ? zeile + 1 : 8 - zeile;
    return `${SPALTEN[sp]}${re}` as Square;
  };
  const koenigImSchach = l.schach ? c.board().flat().find(p => p?.type === 'k' && p.color === c.turn())?.square : undefined;

  return (
    <main className="seite">
      <div className="leiste">
        <button className="icon" onClick={zurueck} aria-label="Zur Spieleübersicht">←</button>
        <strong>Schach</strong>
        <span className="platz" />
        <RegelnKnopf titel="Schach" abschnitte={REGELN_SCHACH} symbol />
        <button className="icon" disabled={!stand.zuege.length} aria-label="Zug zurück"
          onClick={() => { setStand({ ...stand, zuege: stand.zuege.slice(0, -1), beendet: null }); setGewaehlt(null); }}>↶</button>
        <button className="icon" aria-label="Brett drehen" onClick={() => setStand({ ...stand, gedreht: !stand.gedreht })}>⇅</button>
        <button className="icon" aria-label="Menü" onClick={() => setMenue(true)}>⋯</button>
      </div>

      <section className={'karte dran schach-status' + (l.vorbei ? ' vorbei' : '')}>
        <span className={'seitenpunkt ' + (c.turn() === 'w' ? 'weiss' : 'schwarz')} aria-hidden />
        <strong>{l.text}</strong>
      </section>

      <Geschlagen von={stand.gedreht ? 'w' : 'b'} liste={stand.gedreht ? kg.w : kg.b} />
      <div className="brett" role="grid" aria-label="Schachbrett">
        {reihen.map((reihe, z) => reihe.map((figur, s) => {
          const name = feldName(z, s);
          const dunkel = (SPALTEN.indexOf(name[0]) + Number(name[1])) % 2 === 0;
          const ziel = ziele.find(m => m.to === name);
          const klass = ['feld-s', dunkel ? 'dunkel' : 'hell'];
          if (name === gewaehlt) klass.push('gewaehlt');
          if (letzter && (letzter.from === name || letzter.to === name)) klass.push('letzter');
          if (name === koenigImSchach) klass.push('schach');
          return (
            <button key={name} className={klass.join(' ')} onClick={() => tippe(name)}
              aria-label={`${name}${figur ? ' ' + (figur.color === 'w' ? 'weißer ' : 'schwarzer ') + FIGUR_NAME[figur.type] : ''}`}>
              {figur && <span className={'figur ' + (figur.color === 'w' ? 'w' : 's')}>{SYMBOL[figur.type]}</span>}
              {ziel && <i className={'ziel' + (c.get(name) || ziel.flags.includes('e') ? ' schlag' : '')} />}
              {s === 0 && <small className="reihe">{name[1]}</small>}
              {z === 7 && <small className="spalte">{name[0]}</small>}
            </button>
          );
        }))}
      </div>
      <Geschlagen von={stand.gedreht ? 'b' : 'w'} liste={stand.gedreht ? kg.b : kg.w} />

      <section className="karte">
        <h2>Züge</h2>
        {stand.zuege.length === 0 ? <p className="neben">Noch kein Zug. Weiß beginnt.</p> : (
          <ol className="zugliste">
            {Array.from({ length: Math.ceil(stand.zuege.length / 2) }, (_, i) => (
              <li key={i}><span>{i + 1}.</span><b>{stand.zuege[2 * i]}</b><b>{stand.zuege[2 * i + 1] ?? ''}</b></li>
            ))}
          </ol>
        )}
      </section>

      {l.vorbei && <button className="knopf haupt" onClick={neu}>Neue Partie →</button>}

      {umwandlung && (
        <div className="schleier" onClick={() => setUmwandlung(null)}>
          <div className="blatt" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <h2>In welche Figur umwandeln?</h2>
            <div className="werte umw">
              {UMWANDLUNG.map(p => (
                <button key={p} className="knopf zweit" onClick={() => ziehe(umwandlung.von, umwandlung.nach, p)}>
                  <span className={'figur ' + (c.turn() === 'w' ? 'w' : 's') + ' gross'}>{SYMBOL[p]}</span><small>{FIGUR_NAME[p]}</small>
                </button>
              ))}
            </div>
            <button className="knopf zweit" onClick={() => setUmwandlung(null)}>Abbrechen</button>
          </div>
        </div>
      )}

      {menue && (
        <div className="schleier" onClick={() => setMenue(false)}>
          <div className="blatt" role="dialog" aria-modal onClick={e => e.stopPropagation()}>
            <h2>Partie</h2>
            {!l.vorbei && (
              <>
                <button className="knopf zweit" onClick={() => beenden('remis', 'Remis vereinbart')}>🤝 Remis vereinbaren</button>
                <button className="knopf zweit" onClick={() => beenden('schwarz', 'Weiß gibt auf – Schwarz gewinnt')}>🏳️ Weiß gibt auf</button>
                <button className="knopf zweit" onClick={() => beenden('weiss', 'Schwarz gibt auf – Weiß gewinnt')}>🏳️ Schwarz gibt auf</button>
              </>
            )}
            <button className="knopf zweit" onClick={neu}>⟲ Neue Partie</button>
            <button className="knopf zweit" onClick={() => setMenue(false)}>Schließen</button>
          </div>
        </div>
      )}
    </main>
  );
}

function Geschlagen({ von, liste }: { von: 'w' | 'b'; liste: string[] }) {
  // `von` ist die Farbe, deren Brettseite hier steht; gezeigt werden die Figuren, die diese Seite geschlagen hat.
  return (
    <div className="geschlagen" aria-label={`Geschlagen von ${von === 'w' ? 'Weiß' : 'Schwarz'}`}>
      <span className={'seitenpunkt ' + (von === 'w' ? 'weiss' : 'schwarz')} aria-hidden />
      {liste.map((p, i) => <span key={i} className={'figur klein ' + (von === 'w' ? 's' : 'w')}>{SYMBOL[p]}</span>)}
    </div>
  );
}
