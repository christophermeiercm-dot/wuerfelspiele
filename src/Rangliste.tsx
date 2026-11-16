import { useMemo, useState } from 'react';
import { ART_NAME, bekannteNamen, ladePartien, loescheAlle, entferneErgebnis, tabelle, type SpielArt } from './rangliste';

/** Vorschläge für Namensfelder (`list="bekannte-namen"`), damit dieselbe Person immer gleich geschrieben wird. */
export function NamenListe() {
  const namen = useMemo(() => bekannteNamen(ladePartien()), []);
  return <datalist id="bekannte-namen">{namen.map(n => <option key={n} value={n} />)}</datalist>;
}

type Filter = 'alle' | SpielArt;
const FILTER: { id: Filter; titel: string }[] = [
  { id: 'alle', titel: 'Gesamt' },
  { id: 'kniffel', titel: ART_NAME.kniffel },
  { id: 'yahtzee', titel: ART_NAME.yahtzee },
  { id: 'schocken', titel: ART_NAME.schocken },
  { id: 'schach', titel: ART_NAME.schach },
];
const MEDAILLE = ['🥇', '🥈', '🥉'];

export function RanglisteSeite({ zurueck }: { zurueck: () => void }) {
  const [partien, setPartien] = useState(() => ladePartien());
  const [filter, setFilter] = useState<Filter>('alle');
  const zeilen = useMemo(() => tabelle(partien, filter === 'alle' ? undefined : filter), [partien, filter]);
  const letzte = useMemo(
    () => [...partien].filter(p => filter === 'alle' || p.spiel === filter).sort((a, b) => b.datum - a.datum).slice(0, 10),
    [partien, filter],
  );
  const neuLaden = () => setPartien(ladePartien());

  return (
    <main className="seite">
      <div className="leiste">
        <button className="icon" onClick={zurueck} aria-label="Zur Spieleübersicht">←</button>
        <strong>Rangliste</strong>
      </div>

      <div className="reiter" role="tablist">
        {FILTER.map(f => (
          <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'an' : ''} onClick={() => setFilter(f.id)}>{f.titel}</button>
        ))}
      </div>

      <section className="karte">
        {zeilen.length === 0 ? (
          <p className="neben">Noch keine Partie gezählt. Sobald eine Partie zu Ende ist, trägt die App den Sieg automatisch unter dem Namen ein.</p>
        ) : (
          <table className="tabelle">
            <thead><tr><th>#</th><th>Name</th><th>Siege</th><th>Spiele</th><th>Quote</th></tr></thead>
            <tbody>
              {zeilen.map((z, i) => (
                <tr key={z.name} className={i === 0 && z.siege > 0 ? 'erster' : ''}>
                  <td>{MEDAILLE[i] && z.siege > 0 ? MEDAILLE[i] : i + 1}</td>
                  <th scope="row">{z.name}</th>
                  <td><b>{z.siege}</b></td>
                  <td>{z.spiele}</td>
                  <td>{Math.round(z.quote * 100)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {letzte.length > 0 && (
        <section className="karte">
          <h2>Letzte Partien</h2>
          <ul className="letzte">
            {letzte.map(p => (
              <li key={p.id}>
                <span><b>{ART_NAME[p.spiel]}</b> · {new Date(p.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
                <span>{p.sieger.length ? `🏆 ${p.sieger.join(' & ')}` : 'Remis'} <small>({p.spieler.join(', ')})</small></span>
                <button className="icon klein" aria-label={`Partie ${ART_NAME[p.spiel]} entfernen`}
                  onClick={() => { if (confirm('Diese Partie aus der Rangliste entfernen?')) { entferneErgebnis(p.id); neuLaden(); } }}>✕</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {partien.length > 0 && (
        <button className="knopf zweit" onClick={() => { if (confirm('Die ganze Rangliste löschen? Das lässt sich nicht rückgängig machen.')) { loescheAlle(); neuLaden(); } }}>
          Rangliste zurücksetzen
        </button>
      )}
    </main>
  );
}
